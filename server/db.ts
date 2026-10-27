import fs from 'node:fs';
import path from 'node:path';
import type { 
  Appointment, 
  ClinicSettings, 
  ContactMessage, 
  ServiceItem, 
  StaffMember 
} from '../src/types.js';

interface DatabaseSchema {
  settings: ClinicSettings;
  services: ServiceItem[];
  staff: StaffMember[];
  appointments: Appointment[];
  messages: ContactMessage[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'clinic_data.json');

const defaultSettings: ClinicSettings = {
  name: 'Rainbow Skin & Hair Clinic',
  tagline: 'Advanced Dermatology, Hair Restoration & Aesthetic Excellence',
  category: 'Dermatology, Trichology & Medical Aesthetics',
  address: 'Rushyashrunga Arcade, Kuvempu Road, Beside Cliff Embassy Hotel, Sharavathi Nagar',
  landmark: 'Beside Cliff Embassy Hotel',
  city: 'Shivamogga',
  state: 'Karnataka',
  pincode: '577202',
  phone: '+91 89519 85418',
  whatsapp: '918951985418',
  email: 'rainbowshimoga@gmail.com',
  website: 'https://rainbowskinhair.in',
  googleMapsUrl: 'https://maps.app.goo.gl/w5URJyeN6FMXoJLw6',
  embedMapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15474.33230198565!2d75.553009!3d13.936614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbba9097b7b4291%3A0x72b05a163c4319c9!2sRAINBOW%20SKIN%20%26%20HAIR%20CLINIC!5e0!3m2!1sen!2sin!4v1740645000000!5m2!1sen!2sin',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  slotIntervalMinutes: 15,
  bufferMinutes: 10,
  minimumNoticeHours: 1, // At least 1 hr advance notice
  maxAdvanceDays: 30, // Book up to 30 days ahead
  cancellationNoticeHours: 4, // 4 hours notice required
  weeklySchedule: {
    // 0: Sunday (10:00 - 14:00, no lunch break)
    '0': { isOpen: true, openTime: '10:00', closeTime: '14:00', hasBreak: false },
    // 1-6: Monday to Saturday (10:00 - 20:00, lunch 13:30 - 14:30)
    '1': { isOpen: true, openTime: '10:00', closeTime: '20:00', hasBreak: true, breakStart: '13:30', breakEnd: '14:30' },
    '2': { isOpen: true, openTime: '10:00', closeTime: '20:00', hasBreak: true, breakStart: '13:30', breakEnd: '14:30' },
    '3': { isOpen: true, openTime: '10:00', closeTime: '20:00', hasBreak: true, breakStart: '13:30', breakEnd: '14:30' },
    '4': { isOpen: true, openTime: '10:00', closeTime: '20:00', hasBreak: true, breakStart: '13:30', breakEnd: '14:30' },
    '5': { isOpen: true, openTime: '10:00', closeTime: '20:00', hasBreak: true, breakStart: '13:30', breakEnd: '14:30' },
    '6': { isOpen: true, openTime: '10:00', closeTime: '20:00', hasBreak: true, breakStart: '13:30', breakEnd: '14:30' },
  },
  blockedDates: []
};

const defaultStaff: StaffMember[] = [
  {
    id: 'doc-bharat',
    name: 'Dr. Bharat Bangera',
    role: 'Consultant Dermatologist & Hair Specialist',
    qualifications: 'MD, DNB (Dermatology, Venereology & Leprosy)',
    experienceYears: 12,
    bio: 'Renowned dermatologist in Shivamogga with extensive clinical experience in trichology, hair restoration therapies, clinical dermatology, and dermatosurgical procedures.',
    specialties: ['PRP Hair Therapy', 'Dermatosurgery', 'Psoriasis & Eczema', 'Acne Scar Protocols'],
    supportedServiceIds: [
      'hair-prp', 
      'hair-microneedle', 
      'scalp-detox', 
      'clinical-consult', 
      'acne-peel', 
      'pigmentation-melasma', 
      'mole-removal',
      'mnrf-tightening'
    ],
    activeDays: [1, 2, 3, 4, 5, 6] // Mon-Sat
  },
  {
    id: 'doc-trupti',
    name: 'Dr. Trupti',
    role: 'Consultant Cosmetologist & Aesthetic Physician',
    qualifications: 'MBBS, FAM (Fellowship in Aesthetic Medicine)',
    experienceYears: 9,
    bio: 'Specialist in advanced medical aesthetics, high-grade medi-facials, HydraFacial MD protocols, non-invasive skin rejuvenation, and anti-pigmentation therapies.',
    specialties: ['HydraFacial MD', 'Oxygeneo 3-in-1', 'Carbon Laser Peel', 'Chemical Exfoliation', 'Skin Brightening'],
    supportedServiceIds: [
      'hydrafacial-md', 
      'oxygeneo-3in1', 
      'carbon-laser', 
      'mnrf-tightening', 
      'acne-peel', 
      'pigmentation-melasma', 
      'clinical-consult'
    ],
    activeDays: [0, 1, 2, 3, 4, 5, 6] // Mon-Sun
  }
];

const defaultServices: ServiceItem[] = [
  {
    id: 'hydrafacial-md',
    name: 'Signature HydraFacial MD Deep Rejuvenation',
    category: 'medi-facials',
    categoryName: 'Medi-Facials & Skin Glow',
    tagline: 'Vortex cleansing, gentle glycolic peel & deep antioxidant infusion',
    description: 'Medical-grade 4-step hydradermabrasion that extracts deep blackheads, clears congested pores, exfoliates dead skin, and infuses intensive hyaluronic acid serums with zero downtime.',
    durationMinutes: 60,
    priceINR: 3800,
    featured: true,
    active: true,
    idealFor: ['Dull skin', 'Enlarged pores', 'Dehydrated skin', 'Pre-event glow'],
    imageKey: 'hydrafacial'
  },
  {
    id: 'hair-prp',
    name: 'Platelet-Rich Plasma (PRP) Hair Regrowth Therapy',
    category: 'hair',
    categoryName: 'Hair & Scalp Treatments',
    tagline: 'Autologous platelet growth factors for natural hair restoration',
    description: 'FDA-standard centrifugation yields high-concentration blood platelets rich in vascular growth factors, injected into thinning scalp zones to awaken dormant follicles and arrest shedding.',
    durationMinutes: 60,
    priceINR: 3500,
    featured: true,
    active: true,
    idealFor: ['Androgenetic alopecia', 'Post-stress thinning', 'Receding hairline', 'Weak follicles'],
    imageKey: 'hair_prp'
  },
  {
    id: 'carbon-laser',
    name: 'Carbon Laser Peel (Hollywood Clarifying Peel)',
    category: 'lasers-anti-aging',
    categoryName: 'Lasers & Advanced Aesthetics',
    tagline: 'Q-switched Nd:YAG laser activated carbon mask for porcelain skin',
    description: 'A medical liquid carbon solution is applied to absorb sebum and impurities, then targeted with precision laser pulses to vaporize bacteria, instantly shrink pores, and lighten pigmentation.',
    durationMinutes: 45,
    priceINR: 4000,
    featured: true,
    active: true,
    idealFor: ['Oily skin', 'Open pores', 'Persistent acne marks', 'Uneven texture'],
    imageKey: 'clinic_interior'
  },
  {
    id: 'oxygeneo-3in1',
    name: 'Oxygeneo 3-in-1 Super Facial',
    category: 'medi-facials',
    categoryName: 'Medi-Facials & Skin Glow',
    tagline: 'Natural oxygenation from within, gentle micro-exfoliation & nourishment',
    description: 'Patented Geneo technology triggers the natural Bohr effect, releasing oxygen bubbles inside the tissue to boost cellular metabolism and infuse active botanical and peptide serums.',
    durationMinutes: 60,
    priceINR: 3500,
    featured: false,
    active: true,
    idealFor: ['Uneven skin tone', 'Tired skin', 'Fine texture flaws', 'Pigmented spots']
  },
  {
    id: 'mnrf-tightening',
    name: 'Microneedling Radiofrequency (MNRF) Collagen Boost',
    category: 'lasers-anti-aging',
    categoryName: 'Lasers & Advanced Aesthetics',
    tagline: 'Fractional RF energy penetrating deep dermal layers for scar revision',
    description: 'Gold-plated insulated micro-needles deliver controlled thermal RF pulses directly to deep reticular dermis, smoothing stubborn icepick and boxcar acne scars while lifting sagging contours.',
    durationMinutes: 75,
    priceINR: 6500,
    featured: true,
    active: true,
    idealFor: ['Acne scars', 'Skin laxity', 'Deep wrinkles', 'Textured pores']
  },
  {
    id: 'pigmentation-melasma',
    name: 'Targeted Melasma & Hyperpigmentation Protocol',
    category: 'dermatology',
    categoryName: 'Clinical Dermatology',
    tagline: 'Dermatologist-formulated depigmentation & enzyme peel',
    description: 'Multi-tiered clinical approach addressing deep epidermal and dermal melanin clusters, sunspots, and hormonal melasma through medical-grade formulations and barrier repair.',
    durationMinutes: 60,
    priceINR: 3000,
    featured: false,
    active: true,
    idealFor: ['Melasma', 'Dark spots', 'Sun damage / tan', 'Post-inflammatory marks']
  },
  {
    id: 'acne-peel',
    name: 'Clinical Acne Therapy & Clarifying Salicylic Peel',
    category: 'dermatology',
    categoryName: 'Clinical Dermatology',
    tagline: 'Comedone extraction, anti-bacterial therapy & medical peeling',
    description: 'Comprehensive medical acne treatment including sterile micro-comedone extraction, anti-bacterial high frequency sterilization, and beta-hydroxy salicylic peel for active breakouts.',
    durationMinutes: 45,
    priceINR: 2200,
    featured: false,
    active: true,
    idealFor: ['Active breakouts', 'Cystic acne', 'Blackheads / Whiteheads', 'Excess sebum']
  },
  {
    id: 'hair-microneedle',
    name: 'Scalp Microneedling & Hair Peptide Infusion',
    category: 'hair',
    categoryName: 'Hair & Scalp Treatments',
    tagline: 'Automated micro-channeling with trichological copper peptides',
    description: 'Creates micro-channels in the dermis to enhance absorption of hair regrowth peptides and stimulate natural cellular angiogenesis in scalp tissue.',
    durationMinutes: 45,
    priceINR: 2800,
    featured: false,
    active: true,
    idealFor: ['Early stage thinning', 'Patchy shedding', 'Follicle revitalization']
  },
  {
    id: 'mole-removal',
    name: 'Radiofrequency (RF) Mole & Skin Tag Removal',
    category: 'dermatology',
    categoryName: 'Clinical Dermatology',
    tagline: 'Minimal-scar precision cautery under topical local anesthesia',
    description: 'High-frequency radio wave surgical ablation that gently vaporizes benign skin tags, moles, and warts with minimal blood loss and clean healing.',
    durationMinutes: 45,
    priceINR: 2500,
    featured: false,
    active: true,
    idealFor: ['Skin tags', 'Benign moles', 'Seborrheic keratosis', 'Facial warts']
  },
  {
    id: 'scalp-detox',
    name: 'Advanced Scalp Detox & Anti-Dandruff Treatment',
    category: 'hair',
    categoryName: 'Hair & Scalp Treatments',
    tagline: 'Clinical scalp peeling, deep antifungal cleansing & pH balancing',
    description: 'Medical solution designed for chronic flaking, seborrheic dermatitis, and itchy scalp to eliminate Malassezia yeast and restore moisture balance.',
    durationMinutes: 45,
    priceINR: 1800,
    featured: false,
    active: true,
    idealFor: ['Persistent dandruff', 'Flaking scalp', 'Itchy scalp', 'Scalp odor']
  },
  {
    id: 'clinical-consult',
    name: 'Dermatologist & Trichology In-Depth Consultation',
    category: 'dermatology',
    categoryName: 'Clinical Dermatology',
    tagline: 'Digital dermatoscope evaluation, diagnosis & clinical prescription',
    description: 'One-on-one medical evaluation with Dr. Bharat Bangera or Dr. Trupti including dermatoscope analysis of skin lesions or hair density, followed by a personalized medical plan.',
    durationMinutes: 30,
    priceINR: 500,
    featured: true,
    active: true,
    idealFor: ['New patients', 'Chronic skin conditions', 'Rashes / allergies', 'Second opinions'],
    imageKey: 'doctor_consult'
  }
];

class Database {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          services: parsed.services?.length ? parsed.services : defaultServices,
          staff: parsed.staff?.length ? parsed.staff : defaultStaff,
          appointments: parsed.appointments || [],
          messages: parsed.messages || []
        };
      }
    } catch (err) {
      console.error('Error reading database file, using defaults:', err);
    }

    const initialData: DatabaseSchema = {
      settings: defaultSettings,
      services: defaultServices,
      staff: defaultStaff,
      appointments: [],
      messages: []
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public flush() {
    this.saveData(this.data);
  }

  // Settings
  public getSettings(): ClinicSettings {
    return { ...this.data.settings };
  }

  public updateSettings(updates: Partial<ClinicSettings>): ClinicSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.flush();
    return this.getSettings();
  }

  // Services
  public getServices(onlyActive = true): ServiceItem[] {
    if (onlyActive) {
      return this.data.services.filter(s => s.active);
    }
    return [...this.data.services];
  }

  public getServiceById(id: string): ServiceItem | undefined {
    return this.data.services.find(s => s.id === id);
  }

  public saveService(service: ServiceItem): ServiceItem {
    const idx = this.data.services.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      this.data.services[idx] = service;
    } else {
      this.data.services.push(service);
    }
    this.flush();
    return service;
  }

  // Staff
  public getStaff(): StaffMember[] {
    return [...this.data.staff];
  }

  public getStaffById(id: string): StaffMember | undefined {
    return this.data.staff.find(s => s.id === id);
  }

  // Appointments
  public getAppointments(filters?: {
    date?: string;
    staffId?: string;
    status?: string;
  }): Appointment[] {
    let list = [...this.data.appointments];
    if (filters?.date) {
      list = list.filter(a => a.date === filters.date);
    }
    if (filters?.staffId && filters.staffId !== 'any') {
      list = list.filter(a => a.staffId === filters.staffId);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(a => a.status === filters.status);
    }
    return list;
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.data.appointments.find(a => a.id === id);
  }

  public getAppointmentByReference(ref: string, phoneOrEmail?: string): Appointment | undefined {
    const cleanRef = ref.trim().toUpperCase();
    const match = this.data.appointments.find(a => a.reference.toUpperCase() === cleanRef);
    if (!match) return undefined;

    if (phoneOrEmail) {
      const q = phoneOrEmail.trim().toLowerCase().replace(/\s+/g, '');
      const aptPhone = match.customerPhone.trim().toLowerCase().replace(/\s+/g, '');
      const aptEmail = match.customerEmail.trim().toLowerCase();
      
      const phoneMatched = aptPhone.endsWith(q) || q.endsWith(aptPhone) || aptPhone.includes(q);
      const emailMatched = aptEmail === q;

      if (!phoneMatched && !emailMatched) {
        return undefined;
      }
    }

    return match;
  }

  public saveAppointment(apt: Appointment): Appointment {
    const idx = this.data.appointments.findIndex(a => a.id === apt.id);
    if (idx >= 0) {
      this.data.appointments[idx] = { ...apt, updatedAt: new Date().toISOString() };
    } else {
      this.data.appointments.push(apt);
    }
    this.flush();
    return apt;
  }

  // Messages
  public getMessages(): ContactMessage[] {
    return [...this.data.messages];
  }

  public saveMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'read'>): ContactMessage {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    this.data.messages.unshift(newMsg);
    this.flush();
    return newMsg;
  }

  // Reset demo bookings helper (for test runs)
  public clearTestAppointments(prefix = 'TEST-') {
    this.data.appointments = this.data.appointments.filter(a => !a.reference.startsWith(prefix));
    this.flush();
  }
}

export const db = new Database();
