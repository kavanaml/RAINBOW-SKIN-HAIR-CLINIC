import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { db } from './server/db.js';
import { 
  getAvailableSlots, 
  createBooking, 
  rescheduleBooking, 
  cancelBooking 
} from './server/bookingEngine.js';
import { runBookingValidationTests } from './server/tests.js';
import { 
  checkSupabaseStatus, 
  syncAllAppointments, 
  syncContactMessageToSupabase 
} from './server/supabase.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

const ADMIN_TOKEN = 'rainbow_clinic_admin_sec_2026';
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Invalid administrative credentials' });
  }
  next();
}

// Public API
app.get('/api/clinic/info', (_req: Request, res: Response) => {
  res.json({
    settings: db.getSettings(),
    doctors: db.getStaff().map(s => ({
      id: s.id,
      name: s.name,
      role: s.role,
      qualifications: s.qualifications,
      experienceYears: s.experienceYears,
      bio: s.bio,
      specialties: s.specialties
    }))
  });
});

app.get('/api/services', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  let services = db.getServices(true);
  if (category && category !== 'all') {
    services = services.filter(s => s.category === category);
  }
  res.json(services);
});

app.get('/api/staff', (_req: Request, res: Response) => {
  res.json(db.getStaff());
});

app.get('/api/availability', (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string;
  const date = req.query.date as string;
  const staffId = (req.query.staffId as string) || 'any';

  if (!serviceId || !date) {
    return res.status(400).json({ error: 'serviceId and date (YYYY-MM-DD) parameters are required.' });
  }

  const result = getAvailableSlots(serviceId, date, staffId);
  res.json(result);
});

app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const { 
      serviceId, 
      staffId, 
      date, 
      startTime, 
      customerName, 
      customerPhone, 
      customerEmail, 
      customerNotes 
    } = req.body;

    if (!serviceId || !date || !startTime || !customerName || !customerPhone || !customerEmail) {
      return res.status(400).json({
        error: 'Missing required fields: serviceId, date, startTime, customerName, customerPhone, customerEmail.'
      });
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit phone number.' });
    }

    const bookingResult = await createBooking({
      serviceId,
      staffId,
      date,
      startTime,
      customerName,
      customerPhone,
      customerEmail,
      customerNotes
    });

    if (!bookingResult.success) {
      return res.status(409).json({ error: bookingResult.error });
    }

    res.status(201).json({
      message: 'Appointment confirmed successfully',
      appointment: bookingResult.appointment
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error while processing booking.' });
  }
});

app.get('/api/bookings/lookup', (req: Request, res: Response) => {
  const reference = req.query.reference as string;
  const identifier = req.query.identifier as string;

  if (!reference) {
    return res.status(400).json({ error: 'Booking reference is required.' });
  }

  const apt = db.getAppointmentByReference(reference, identifier);
  if (!apt) {
    return res.status(404).json({ error: 'No matching appointment found with the provided reference and contact information.' });
  }

  const service = db.getServiceById(apt.serviceId);
  const settings = db.getSettings();

  const aptTime = new Date(`${apt.date}T${apt.startTime}:00`);
  const now = new Date();
  const diffHours = (aptTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canModify = apt.status !== 'cancelled' && apt.status !== 'completed' && diffHours >= settings.cancellationNoticeHours;

  res.json({
    appointment: apt,
    serviceDetails: service,
    canModify,
    cancellationNoticeHours: settings.cancellationNoticeHours
  });
});

app.post('/api/bookings/:id/reschedule', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newDate, newStartTime } = req.body;

  if (!newDate || !newStartTime) {
    return res.status(400).json({ error: 'newDate and newStartTime are required.' });
  }

  const result = await rescheduleBooking(id, newDate, newStartTime);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: 'Appointment rescheduled successfully', appointment: result.appointment });
});

app.post('/api/bookings/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const result = await cancelBooking(id, reason, false);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ message: 'Appointment cancelled successfully', appointment: result.appointment });
});

app.post('/api/contact', (req: Request, res: Response) => {
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone || !email || !message) {
    return res.status(400).json({ error: 'Name, phone, email, and message are required.' });
  }

  const saved = db.saveMessage({
    name,
    phone,
    email,
    subject: subject || 'General Consultation Inquiry',
    message
  });

  // Sync inquiry to Supabase
  syncContactMessageToSupabase(saved).catch(err => {
    console.warn('[Supabase Contact Sync Warning]:', err);
  });

  res.status(201).json({ message: 'Message sent successfully. Our clinic coordinator will contact you shortly.', id: saved.id });
});

// Supabase Status & Sync Endpoints
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  const status = await checkSupabaseStatus();
  res.json(status);
});

app.post('/api/supabase/sync', requireAdmin, async (_req: Request, res: Response) => {
  const appointments = db.getAppointments();
  const result = await syncAllAppointments(appointments);
  res.json(result);
});

// Admin API
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'admin' && (password === 'Rainbow@Admin2026' || password === 'admin123')) {
    return res.json({
      token: ADMIN_TOKEN,
      user: { username: 'admin', name: 'Dr. Bharat & Clinic Admin', role: 'owner' }
    });
  }
  return res.status(401).json({ error: 'Invalid administrator username or password.' });
});

app.get('/api/admin/overview', requireAdmin, (_req: Request, res: Response) => {
  const appointments = db.getAppointments();
  const services = db.getServices(false);
  const messages = db.getMessages();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === todayStr);
  const activeBookings = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const cancelledApts = appointments.filter(a => a.status === 'cancelled');
  const completedApts = appointments.filter(a => a.status === 'completed');

  const totalRevenue = appointments
    .filter(a => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + (a.priceINR || 0), 0);

  const cancellationRate = appointments.length > 0 
    ? Math.round((cancelledApts.length / appointments.length) * 100) 
    : 0;

  res.json({
    stats: {
      totalBookings: appointments.length,
      todayCount: todayApts.length,
      activeCount: activeBookings.length,
      completedCount: completedApts.length,
      cancelledCount: cancelledApts.length,
      cancellationRatePercent: cancellationRate,
      estimatedRevenueINR: totalRevenue,
      unreadMessagesCount: messages.filter(m => !m.read).length
    },
    todayAppointments: todayApts,
    recentAppointments: appointments.slice(0, 10),
    activeServicesCount: services.filter(s => s.active).length
  });
});

app.get('/api/admin/appointments', requireAdmin, (req: Request, res: Response) => {
  const { date, status, staffId, search } = req.query as Record<string, string | undefined>;
  let list = db.getAppointments({ date, status, staffId });

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a => 
      a.reference.toLowerCase().includes(q) ||
      a.customerName.toLowerCase().includes(q) ||
      a.customerPhone.includes(q) ||
      a.customerEmail.toLowerCase().includes(q) ||
      a.serviceName.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`));
  res.json(list);
});

app.patch('/api/admin/appointments/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, cancellationReason } = req.body;

  const apt = db.getAppointmentById(id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  apt.status = status;
  if (cancellationReason) {
    apt.cancellationReason = cancellationReason;
  }
  db.saveAppointment(apt);

  res.json({ message: 'Status updated', appointment: apt });
});

app.post('/api/admin/appointments', requireAdmin, async (req: Request, res: Response) => {
  const { serviceId, staffId, date, startTime, customerName, customerPhone, customerEmail, customerNotes } = req.body;

  const result = await createBooking({
    serviceId,
    staffId,
    date,
    startTime,
    customerName: customerName || 'Walk-in Patient',
    customerPhone: customerPhone || '9999999999',
    customerEmail: customerEmail || 'walkin@rainbowskinhair.in',
    customerNotes: customerNotes ? `[Walk-in] ${customerNotes}` : '[Walk-in appointment recorded by clinic staff]'
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json(result.appointment);
});

app.put('/api/admin/services/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.getServiceById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const updated = db.saveService({
    ...existing,
    ...req.body,
    id
  });

  res.json(updated);
});

app.post('/api/admin/services', requireAdmin, (req: Request, res: Response) => {
  const { name, category, categoryName, tagline, description, durationMinutes, priceINR, idealFor } = req.body;
  if (!name || !category || !durationMinutes || !priceINR) {
    return res.status(400).json({ error: 'Name, category, duration, and price are required.' });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newService = db.saveService({
    id,
    name,
    category,
    categoryName: categoryName || 'Clinical Treatment',
    tagline: tagline || '',
    description: description || '',
    durationMinutes: Number(durationMinutes),
    priceINR: Number(priceINR),
    featured: false,
    active: true,
    idealFor: idealFor || []
  });

  res.status(201).json(newService);
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

app.get('/api/admin/messages', requireAdmin, (_req: Request, res: Response) => {
  res.json(db.getMessages());
});

app.post('/api/tests/run', async (_req: Request, res: Response) => {
  try {
    const testResults = await runBookingValidationTests();
    res.json({
      timestamp: new Date().toISOString(),
      allPassed: testResults.every(r => r.passed),
      results: testResults
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rainbow Clinic Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
