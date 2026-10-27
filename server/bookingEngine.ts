import { db } from './db.js';
import type { Appointment, ServiceItem, StaffMember } from '../src/types.js';
import { syncAppointmentToSupabase } from './supabase.js';

// Mutex lock for atomic booking reservations
class AsyncLock {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        });
      };

      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

export const bookingLock = new AsyncLock();

// Helper to convert "HH:mm" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + mins;
}

// Helper to convert minutes from midnight to "HH:mm"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Generate unique booking reference: e.g. RSH-8492
export function generateReference(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `RSH-${year}-${code}`;
}

export interface SlotAvailability {
  time: string; // "10:00"
  endTime: string; // "11:00"
  available: boolean;
  assignedStaffId?: string;
  assignedStaffName?: string;
  reason?: string;
}

export interface DayAvailabilityResponse {
  date: string;
  isOpen: boolean;
  dayName: string;
  slots: SlotAvailability[];
  message?: string;
}

export function getAvailableSlots(
  serviceId: string,
  dateStr: string, // YYYY-MM-DD
  staffId = 'any'
): DayAvailabilityResponse {
  const settings = db.getSettings();
  const service = db.getServiceById(serviceId);

  if (!service || !service.active) {
    return {
      date: dateStr,
      isOpen: false,
      dayName: '',
      slots: [],
      message: 'Selected service is currently inactive or not found.'
    };
  }

  // Parse date and day of week
  const dateObj = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 1 is Monday ...
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayOfWeek];

  // Check if date is blocked
  if (settings.blockedDates?.includes(dateStr)) {
    return {
      date: dateStr,
      isOpen: false,
      dayName,
      slots: [],
      message: `The clinic is closed on this date (${dayName}, ${dateStr}) for a holiday or scheduled maintenance.`
    };
  }

  // Check schedule for day
  const daySchedule = settings.weeklySchedule[String(dayOfWeek)];
  if (!daySchedule || !daySchedule.isOpen) {
    return {
      date: dateStr,
      isOpen: false,
      dayName,
      slots: [],
      message: `The clinic is closed on ${dayName}s.`
    };
  }

  // Check advance window
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + settings.maxAdvanceDays);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (dateStr < todayStr) {
    return {
      date: dateStr,
      isOpen: false,
      dayName,
      slots: [],
      message: 'Cannot book appointments for past dates.'
    };
  }

  if (dateStr > maxDateStr) {
    return {
      date: dateStr,
      isOpen: false,
      dayName,
      slots: [],
      message: `Bookings are open up to ${settings.maxAdvanceDays} days in advance.`
    };
  }

  // Determine eligible staff
  const allStaff = db.getStaff();
  let candidateStaff: StaffMember[] = [];

  if (staffId && staffId !== 'any') {
    const specificStaff = db.getStaffById(staffId);
    if (specificStaff && specificStaff.supportedServiceIds.includes(serviceId) && specificStaff.activeDays.includes(dayOfWeek)) {
      candidateStaff = [specificStaff];
    } else {
      return {
        date: dateStr,
        isOpen: true,
        dayName,
        slots: [],
        message: 'The selected specialist is not scheduled or does not perform this treatment on this day.'
      };
    }
  } else {
    // Any staff who can do this service and works today
    candidateStaff = allStaff.filter(
      s => s.supportedServiceIds.includes(serviceId) && s.activeDays.includes(dayOfWeek)
    );
  }

  if (candidateStaff.length === 0) {
    return {
      date: dateStr,
      isOpen: true,
      dayName,
      slots: [],
      message: 'No medical specialists available for this procedure on this date.'
    };
  }

  // Load existing active appointments on this date
  const dayAppointments = db.getAppointments({ date: dateStr })
    .filter(a => a.status === 'confirmed' || a.status === 'pending');

  const openMinutes = timeToMinutes(daySchedule.openTime);
  const closeMinutes = timeToMinutes(daySchedule.closeTime);
  const interval = settings.slotIntervalMinutes || 15;
  const duration = service.durationMinutes;
  const buffer = settings.bufferMinutes || 10;

  const breakStartMin = daySchedule.hasBreak && daySchedule.breakStart ? timeToMinutes(daySchedule.breakStart) : null;
  const breakEndMin = daySchedule.hasBreak && daySchedule.breakEnd ? timeToMinutes(daySchedule.breakEnd) : null;

  // Current time check for minimum notice if date is today
  const isToday = dateStr === todayStr;
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const noticeMinutes = (settings.minimumNoticeHours || 1) * 60;
  const earliestAllowedMinutes = currentTotalMinutes + noticeMinutes;

  const slots: SlotAvailability[] = [];

  for (let slotStart = openMinutes; slotStart + duration <= closeMinutes; slotStart += interval) {
    const slotEnd = slotStart + duration;
    const timeStr = minutesToTime(slotStart);
    const endTimeStr = minutesToTime(slotEnd);

    // Rule 1: Check if slot is too soon (minimum notice)
    if (isToday && slotStart < earliestAllowedMinutes) {
      continue; // Don't even display slots that are in the past or within notice window
    }

    // Rule 2: Check lunch break overlap
    if (breakStartMin !== null && breakEndMin !== null) {
      // Overlap if slotStart < breakEnd and slotEnd > breakStart
      if (slotStart < breakEndMin && slotEnd > breakStartMin) {
        continue; // Clinic is closed for lunch break
      }
    }

    // Rule 3: Find if at least one candidate doctor is free
    let assignedDoctor: StaffMember | undefined = undefined;

    for (const doc of candidateStaff) {
      // Check if doc has any appointment that conflicts with [slotStart, slotEnd + buffer)
      const hasConflict = dayAppointments.some(apt => {
        if (apt.staffId !== doc.id && apt.staffId !== 'any') {
          return false;
        }
        const aptStart = timeToMinutes(apt.startTime);
        const aptEnd = timeToMinutes(apt.endTime) + buffer; // add buffer after appointment

        // Conflict check
        const proposedEndWithBuffer = slotEnd + buffer;
        return slotStart < aptEnd && proposedEndWithBuffer > aptStart;
      });

      if (!hasConflict) {
        assignedDoctor = doc;
        break;
      }
    }

    if (assignedDoctor) {
      slots.push({
        time: timeStr,
        endTime: endTimeStr,
        available: true,
        assignedStaffId: assignedDoctor.id,
        assignedStaffName: assignedDoctor.name
      });
    } else {
      // Slot is occupied
      slots.push({
        time: timeStr,
        endTime: endTimeStr,
        available: false,
        reason: 'Booked'
      });
    }
  }

  return {
    date: dateStr,
    isOpen: true,
    dayName,
    slots
  };
}

// Atomically book an appointment
export async function createBooking(data: {
  serviceId: string;
  staffId?: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes?: string;
}): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  const release = await bookingLock.acquire();

  try {
    const service = db.getServiceById(data.serviceId);
    if (!service || !service.active) {
      return { success: false, error: 'The selected treatment is not available.' };
    }

    const settings = db.getSettings();
    const startMinutes = timeToMinutes(data.startTime);
    const duration = service.durationMinutes;
    const endMinutes = startMinutes + duration;
    const endTime = minutesToTime(endMinutes);

    // Recheck availability atomically
    const requestedStaffId = data.staffId || 'any';
    const dayAvailability = getAvailableSlots(data.serviceId, data.date, requestedStaffId);

    const slotMatch = dayAvailability.slots.find(
      s => s.time === data.startTime && s.available
    );

    if (!slotMatch) {
      return {
        success: false,
        error: 'The requested appointment time is no longer available. Please select another slot.'
      };
    }

    // Determine final assigned staff
    const assignedStaffId = slotMatch.assignedStaffId || 'doc-bharat';
    const staff = db.getStaffById(assignedStaffId);

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reference: generateReference(),
      serviceId: service.id,
      serviceName: service.name,
      staffId: assignedStaffId,
      staffName: staff ? staff.name : 'Rainbow Skin & Hair Specialist',
      date: data.date,
      startTime: data.startTime,
      endTime,
      durationMinutes: duration,
      priceINR: service.priceINR,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerEmail: data.customerEmail.trim(),
      customerNotes: data.customerNotes?.trim(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveAppointment(newAppointment);

    // Asynchronously sync to Supabase (does not block local confirmation)
    syncAppointmentToSupabase(newAppointment).catch(err => {
      console.warn('[Supabase Sync Background Warning]:', err);
    });

    return {
      success: true,
      appointment: newAppointment
    };
  } finally {
    release();
  }
}

// Reschedule booking
export async function rescheduleBooking(
  appointmentId: string,
  newDate: string,
  newStartTime: string
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  const release = await bookingLock.acquire();

  try {
    const existing = db.getAppointmentById(appointmentId);
    if (!existing) {
      return { success: false, error: 'Appointment not found.' };
    }

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Cannot reschedule a cancelled appointment.' };
    }

    const settings = db.getSettings();
    // Check notice policy
    const now = new Date();
    const aptDateTime = new Date(`${existing.date}T${existing.startTime}:00`);
    const diffHours = (aptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < settings.cancellationNoticeHours) {
      return {
        success: false,
        error: `Rescheduling requires at least ${settings.cancellationNoticeHours} hours notice prior to appointment.`
      };
    }

    // Temporarily set existing appointment to cancelled so it doesn't conflict if same day
    const origStatus = existing.status;
    existing.status = 'cancelled';
    db.saveAppointment(existing);

    // Check availability of new slot
    const availability = getAvailableSlots(existing.serviceId, newDate, existing.staffId);
    const freeSlot = availability.slots.find(s => s.time === newStartTime && s.available);

    if (!freeSlot) {
      // Revert status
      existing.status = origStatus;
      db.saveAppointment(existing);
      return {
        success: false,
        error: 'The requested new slot is not available. Please choose a different time.'
      };
    }

    const startMin = timeToMinutes(newStartTime);
    const endMin = startMin + existing.durationMinutes;

    existing.date = newDate;
    existing.startTime = newStartTime;
    existing.endTime = minutesToTime(endMin);
    existing.status = 'confirmed';
    if (freeSlot.assignedStaffId) {
      existing.staffId = freeSlot.assignedStaffId;
      existing.staffName = freeSlot.assignedStaffName || existing.staffName;
    }
    existing.updatedAt = new Date().toISOString();

    db.saveAppointment(existing);

    syncAppointmentToSupabase(existing).catch(err => {
      console.warn('[Supabase Sync Warning]:', err);
    });

    return {
      success: true,
      appointment: existing
    };
  } finally {
    release();
  }
}

// Cancel booking
export async function cancelBooking(
  appointmentId: string,
  reason?: string,
  isAdmin = false
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  const release = await bookingLock.acquire();

  try {
    const existing = db.getAppointmentById(appointmentId);
    if (!existing) {
      return { success: false, error: 'Appointment not found.' };
    }

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Appointment is already cancelled.' };
    }

    const settings = db.getSettings();
    const now = new Date();
    const aptDateTime = new Date(`${existing.date}T${existing.startTime}:00`);
    const diffHours = (aptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!isAdmin && diffHours < settings.cancellationNoticeHours) {
      return {
        success: false,
        error: `Cancellations require at least ${settings.cancellationNoticeHours} hours advance notice as per clinic policy.`
      };
    }

    existing.status = 'cancelled';
    existing.cancellationReason = reason || 'Cancelled by patient';
    existing.updatedAt = new Date().toISOString();

    db.saveAppointment(existing);

    syncAppointmentToSupabase(existing).catch(err => {
      console.warn('[Supabase Sync Warning]:', err);
    });

    return {
      success: true,
      appointment: existing
    };
  } finally {
    release();
  }
}
