import type { 
  Appointment, 
  ClinicSettings, 
  ContactMessage, 
  DayAvailabilityResponse, 
  ServiceItem, 
  StaffMember, 
  TestResult 
} from '../types';

export const api = {
  // Public
  async getClinicInfo(): Promise<{ settings: ClinicSettings; doctors: StaffMember[] }> {
    const res = await fetch('/api/clinic/info');
    if (!res.ok) throw new Error('Failed to load clinic information');
    return res.json();
  },

  async getServices(category?: string): Promise<ServiceItem[]> {
    const url = category && category !== 'all' 
      ? `/api/services?category=${category}` 
      : '/api/services';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load services');
    return res.json();
  },

  async getStaff(): Promise<StaffMember[]> {
    const res = await fetch('/api/staff');
    if (!res.ok) throw new Error('Failed to load staff');
    return res.json();
  },

  async getAvailability(serviceId: string, date: string, staffId = 'any'): Promise<DayAvailabilityResponse> {
    const res = await fetch(`/api/availability?serviceId=${serviceId}&date=${date}&staffId=${staffId}`);
    if (!res.ok) throw new Error('Failed to fetch time slot availability');
    return res.json();
  },

  async createBooking(bookingData: {
    serviceId: string;
    staffId?: string;
    date: string;
    startTime: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerNotes?: string;
  }): Promise<{ message: string; appointment: Appointment }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to confirm booking');
    return data;
  },

  async lookupBooking(reference: string, identifier?: string): Promise<{
    appointment: Appointment;
    serviceDetails?: ServiceItem;
    canModify: boolean;
    cancellationNoticeHours: number;
  }> {
    const url = identifier 
      ? `/api/bookings/lookup?reference=${encodeURIComponent(reference)}&identifier=${encodeURIComponent(identifier)}`
      : `/api/bookings/lookup?reference=${encodeURIComponent(reference)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Appointment not found');
    return data;
  },

  async rescheduleBooking(id: string, newDate: string, newStartTime: string): Promise<{ message: string; appointment: Appointment }> {
    const res = await fetch(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate, newStartTime }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reschedule appointment');
    return data;
  },

  async cancelBooking(id: string, reason?: string): Promise<{ message: string; appointment: Appointment }> {
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment');
    return data;
  },

  async submitContact(formData: {
    name: string;
    phone: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<{ message: string; id: string }> {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },

  // Admin
  async adminLogin(password: string, username = 'admin'): Promise<{ token: string; user: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    return data;
  },

  async getAdminOverview(token: string) {
    const res = await fetch('/api/admin/overview', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load admin overview');
    return res.json();
  },

  async getAdminAppointments(token: string, filters?: { date?: string; status?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`/api/admin/appointments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load appointments');
    return res.json();
  },

  async updateAppointmentStatus(token: string, id: string, status: string, reason?: string) {
    const res = await fetch(`/api/admin/appointments/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, cancellationReason: reason })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async createWalkInAppointment(token: string, data: any) {
    const res = await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to create walk-in appointment');
    return resData;
  },

  async updateService(token: string, id: string, data: Partial<ServiceItem>) {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async createService(token: string, data: any) {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json();
  },

  async updateSettings(token: string, settings: Partial<ClinicSettings>) {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getAdminMessages(token: string): Promise<ContactMessage[]> {
    const res = await fetch('/api/admin/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load messages');
    return res.json();
  },

  async runTests(): Promise<{ timestamp: string; allPassed: boolean; results: TestResult[] }> {
    const res = await fetch('/api/tests/run', { method: 'POST' });
    if (!res.ok) throw new Error('Test suite execution failed');
    return res.json();
  },

  async getSupabaseStatus(): Promise<{
    connected: boolean;
    projectId: string;
    url: string;
    tableExists: boolean;
    error?: string;
    tableCheckMessage?: string;
  }> {
    const res = await fetch('/api/supabase/status');
    if (!res.ok) throw new Error('Failed to retrieve Supabase status');
    return res.json();
  },

  async syncAllToSupabase(token: string): Promise<{
    total: number;
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to sync with Supabase');
    return res.json();
  }
};
