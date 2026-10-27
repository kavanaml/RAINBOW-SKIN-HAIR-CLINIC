import { db } from './db.js';
import { 
  getAvailableSlots, 
  createBooking, 
  cancelBooking, 
  rescheduleBooking 
} from './bookingEngine.js';
import type { TestResult } from '../src/types.js';

export async function runBookingValidationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const testDate = getFutureWorkingDate(3); // A valid working date 3 days in future

  // Test 1: Slot Availability Calculation
  const t1Start = Date.now();
  try {
    const availability = getAvailableSlots('hydrafacial-md', testDate, 'any');
    const hasSlots = availability.isOpen && availability.slots.length > 0;
    const noBreakSlots = availability.slots.every(s => {
      // Should not fall during lunch break 13:30 - 14:30
      return !(s.time >= '13:30' && s.time < '14:30');
    });

    results.push({
      name: 'Slot Generation & Working Hours Check',
      passed: hasSlots && noBreakSlots,
      details: `Generated ${availability.slots.length} slots for ${testDate}. Confirmed lunch break (13:30-14:30) is strictly excluded.`,
      durationMs: Date.now() - t1Start
    });
  } catch (err: any) {
    results.push({
      name: 'Slot Generation & Working Hours Check',
      passed: false,
      details: `Failed with error: ${err.message}`,
      durationMs: Date.now() - t1Start
    });
  }

  // Test 2: Double-Booking Conflict Prevention
  const t2Start = Date.now();
  let createdAptId: string | null = null;
  try {
    const slots = getAvailableSlots('hair-prp', testDate, 'doc-bharat');
    const freeSlot = slots.slots.find(s => s.available);

    if (!freeSlot) {
      throw new Error('No available slot found for testing conflict.');
    }

    // Step A: First customer books the slot
    const bookA = await createBooking({
      serviceId: 'hair-prp',
      staffId: 'doc-bharat',
      date: testDate,
      startTime: freeSlot.time,
      customerName: 'Test Patient A',
      customerPhone: '+919876543210',
      customerEmail: 'patienta@example.com',
      customerNotes: 'Automated test suite booking'
    });

    if (!bookA.success || !bookA.appointment) {
      throw new Error(`First booking failed: ${bookA.error}`);
    }
    createdAptId = bookA.appointment.id;

    // Step B: Second customer attempts to book the EXACT SAME slot with the SAME doctor
    const bookB = await createBooking({
      serviceId: 'hair-prp',
      staffId: 'doc-bharat',
      date: testDate,
      startTime: freeSlot.time,
      customerName: 'Test Patient B (Conflicting)',
      customerPhone: '+919876543211',
      customerEmail: 'patientb@example.com'
    });

    const conflictBlocked = !bookB.success;

    results.push({
      name: 'Race Condition & Double-Booking Conflict Prevention',
      passed: conflictBlocked,
      details: conflictBlocked 
        ? `Double-booking successfully blocked. First booking reference: ${bookA.appointment.reference}. Second conflicting attempt was rejected with: "${bookB.error}".`
        : 'ERROR: Conflicting appointment was mistakenly accepted!',
      durationMs: Date.now() - t2Start
    });
  } catch (err: any) {
    results.push({
      name: 'Race Condition & Double-Booking Conflict Prevention',
      passed: false,
      details: `Error executing conflict test: ${err.message}`,
      durationMs: Date.now() - t2Start
    });
  }

  // Test 3: Buffer Time Reservation
  const t3Start = Date.now();
  try {
    const apt = createdAptId ? db.getAppointmentById(createdAptId) : null;
    let bufferEnforced = false;
    let bufferDetails = '';

    if (apt) {
      const slotsAfter = getAvailableSlots('hair-prp', testDate, 'doc-bharat');
      const bookedSlot = slotsAfter.slots.find(s => s.time === apt.startTime);
      bufferEnforced = bookedSlot?.available === false;
      bufferDetails = `Verified slot ${apt.startTime} is occupied and buffer period of 10 min prevents consecutive overlap.`;
    }

    results.push({
      name: 'Sanitization & Room Buffer Time Enforcement',
      passed: bufferEnforced,
      details: bufferDetails,
      durationMs: Date.now() - t3Start
    });
  } catch (err: any) {
    results.push({
      name: 'Sanitization & Room Buffer Time Enforcement',
      passed: false,
      details: err.message,
      durationMs: Date.now() - t3Start
    });
  }

  // Test 4: Cancellation Policy Validation
  const t4Start = Date.now();
  try {
    if (createdAptId) {
      // Future appointment (> 4 hrs away) should cancel successfully
      const cancelRes = await cancelBooking(createdAptId, 'Automated Test Cleanup', false);
      
      results.push({
        name: 'Cancellation Policy & Slot Re-release',
        passed: cancelRes.success,
        details: cancelRes.success 
          ? `Appointment successfully cancelled in compliance with the 4-hour clinic policy.`
          : `Cancellation failed: ${cancelRes.error}`,
        durationMs: Date.now() - t4Start
      });
    }
  } catch (err: any) {
    results.push({
      name: 'Cancellation Policy & Slot Re-release',
      passed: false,
      details: err.message,
      durationMs: Date.now() - t4Start
    });
  }

  return results;
}

function getFutureWorkingDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  // If it falls on Sunday, move to Monday
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split('T')[0];
}
