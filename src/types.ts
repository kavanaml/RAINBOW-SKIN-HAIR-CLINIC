export type ServiceCategory = 
  | 'hair'
  | 'dermatology'
  | 'medi-facials'
  | 'lasers-anti-aging';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  categoryName: string;
  tagline: string;
  description: string;
  durationMinutes: number;
  priceINR: number;
  featured: boolean;
  active: boolean;
  idealFor: string[];
  imageKey?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  qualifications: string;
  experienceYears: number;
  bio: string;
  avatarUrl?: string;
  specialties: string[];
  supportedServiceIds: string[];
  activeDays: number[]; // 0 for Sun, 1 for Mon, ..., 6 for Sat
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: string;
  reference: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  durationMinutes: number;
  priceINR: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes?: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlotAvailability {
  time: string;
  endTime: string;
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

export interface DayWorkingHours {
  isOpen: boolean;
  openTime: string; // "10:00"
  closeTime: string; // "20:00"
  hasBreak: boolean;
  breakStart?: string; // "13:30"
  breakEnd?: string; // "14:30"
}

export interface ClinicSettings {
  name: string;
  tagline: string;
  category: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  googleMapsUrl: string;
  embedMapsUrl: string;
  timezone: string;
  currency: string;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  minimumNoticeHours: number;
  maxAdvanceDays: number;
  cancellationNoticeHours: number;
  weeklySchedule: Record<string, DayWorkingHours>; // "0" to "6"
  blockedDates: string[]; // YYYY-MM-DD
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}
