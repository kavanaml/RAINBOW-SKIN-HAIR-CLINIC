import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  Phone,
  HeartPulse,
  Activity,
  Award
} from 'lucide-react';
import type { ServiceItem } from '../types';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onSelectServiceAndBook: (serviceId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectServiceAndBook,
}) => {
  const heroImage = '/src/assets/images/hero_clinic_interior_1793112064277.jpg';
  const hydraImage = '/src/assets/images/hydrafacial_treatment_1793112038436.jpg';
  const prpImage = '/src/assets/images/prp_hair_therapy_1793112041250.jpg';
  const doctorImage = '/src/assets/images/doctor_consultation_1793112041236.jpg';

  const featuredServices = [
    {
      id: 'hydrafacial-md',
      title: 'Signature HydraFacial MD Deep Rejuvenation',
      category: 'Medi-Facials & Glow',
      duration: '60 mins',
      price: '₹3,800',
      description: 'Medical 4-step hydradermabrasion extracting deep comedones and congested pores while infusing intensive hyaluronic hydration.',
      image: hydraImage,
      idealFor: 'Enlarged pores · Dull skin · Deep blackheads'
    },
    {
      id: 'hair-prp',
      title: 'Platelet-Rich Plasma (PRP) Hair Regrowth Therapy',
      category: 'Hair & Scalp Treatments',
      duration: '60 mins',
      price: '₹3,500',
      description: 'FDA-standard centrifugation delivering autologous growth factor platelets to reactivate dormant hair roots and arrest thinning.',
      image: prpImage,
      idealFor: 'Alopecia · Receding hairline · Weak follicles'
    },
    {
      id: 'clinical-consult',
      title: 'Dermatologist & Trichology In-Depth Consultation',
      category: 'Clinical Dermatology',
      duration: '30 mins',
      price: '₹500',
      description: 'Comprehensive evaluation by Dr. Bharat Bangera (MD) or Dr. Trupti with digital dermatoscope examination and targeted prescriptions.',
      image: doctorImage,
      idealFor: 'Acne · Pigmentation · Eczema · Scalp analysis'
    }
  ];

  const whyChooseUs = [
    {
      title: 'Board-Certified Medical Specialists',
      desc: 'Treatments overseen directly by Dr. Bharat Bangera (MD, DNB Dermatology) and Dr. Trupti (Aesthetic Medicine), not unsupervised technicians.'
    },
    {
      title: 'US-FDA Compliant Laser & RF Technology',
      desc: 'Equipped with medical-grade Q-switched lasers, fractional MNRF micro-needling, and certified HydraFacial systems.'
    },
    {
      title: 'Hospital-Grade Autoclave Sterilization',
      desc: 'Zero-compromise clinical hygiene protocols with single-use micro-needles, sterile disposables, and sanitization between every patient.'
    },
    {
      title: 'Transparent Diagnoses & Evidence-Based Care',
      desc: 'Straightforward clinical diagnosis with realistic timelines. We prescribe only what is medically indicated for your skin or hair condition.'
    }
  ];

  const patientReviews = [
    {
      name: 'Naveen Kumar',
      treatment: 'PRP Hair Therapy (4 Sessions)',
      date: 'Visited September 2026',
      quote: 'I had noticeable hair thinning along my crown. Dr. Bharat Bangera conducted a detailed dermatoscope exam and started me on PRP. After three sessions, hair fall dropped significantly and new baby hairs are clearly visible.'
    },
    {
      name: 'Sahana M. Hegde',
      treatment: 'Signature HydraFacial MD & Melasma Care',
      date: 'Visited August 2026',
      quote: 'Dr. Trupti understood my stubborn post-inflammatory hyperpigmentation. The HydraFacial combined with targeted chemical peels cleared my pores without any irritation. Very clean and professional clinic in Shivamogga.'
    },
    {
      name: 'Prathap S.',
      treatment: 'Acne Scar Revision (MNRF)',
      date: 'Visited July 2026',
      quote: 'Outstanding treatment for my old boxcar acne scars. The staff explained the entire process beforehand and the clinic hygiene is exceptional. Highly recommend Rainbow Skin Clinic.'
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Quiet unboxed metadata */}
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium tracking-wide">
                <span>Kuvempu Road, Shivamogga</span>
                <span aria-hidden="true">·</span>
                <span>MD & FAM Certified Specialists</span>
                <span aria-hidden="true">·</span>
                <span>Open Mon–Sat 10am–8pm</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-[1.15] text-balance">
                Precision Dermatology & Evidence-Based Aesthetics
              </h1>

              {/* Body */}
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                Led by <strong>Dr. Bharat Bangera (MD)</strong> and <strong>Dr. Trupti</strong>. We deliver clinical dermatology, advanced trichology hair restoration, and medical-grade aesthetic procedures with transparent care in Shivamogga.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => onSelectServiceAndBook('clinical-consult')}
                  className="py-3 px-6 text-sm font-semibold text-white bg-teal-800 rounded-md hover:bg-teal-900 shadow-xs transition-all text-center cursor-pointer active:scale-[0.98]"
                >
                  Book an Appointment
                </button>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-3 px-6 text-sm font-semibold text-stone-800 bg-white border border-stone-300 rounded-md hover:bg-stone-100 hover:border-stone-400 transition-colors text-center cursor-pointer"
                >
                  Explore Services & Pricing
                </button>
              </div>

              {/* Trust highlights */}
              <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-4 text-xs text-stone-600">
                <div>
                  <div className="font-mono font-bold text-stone-900 text-base">12+ Yrs</div>
                  <div className="text-stone-500 mt-0.5">Clinical Dermatology</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-stone-900 text-base">100%</div>
                  <div className="text-stone-500 mt-0.5">Sterile Autoclaved Protocols</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-stone-900 text-base">₹500</div>
                  <div className="text-stone-500 mt-0.5">Starting Consultation</div>
                </div>
              </div>

            </div>

            {/* Right Media Hero Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shadow-sm aspect-[4/3] lg:aspect-[5/4]">
                <img
                  src={heroImage}
                  alt="Rainbow Skin & Hair Clinic modern clinical interior in Shivamogga"
                  className="w-full h-full object-cover"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Styled CSS fallback container if asset loading fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                  <span className="text-xs font-mono uppercase tracking-wider text-teal-300">
                    Rushyashrunga Arcade · Kuvempu Road
                  </span>
                  <p className="text-sm font-medium mt-1">
                    State-of-the-art clinic suites designed for patient comfort, privacy, and clinical efficacy.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED SERVICES STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              Verified Treatments
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Featured Clinical Services
            </h2>
          </div>
          <button
            onClick={() => onNavigate('services')}
            className="text-sm font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View All 10 Services</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-stone-200 rounded-lg overflow-hidden flex flex-col hover:border-stone-300 hover:shadow-xs transition-all"
            >
              <div className="aspect-[16/10] bg-stone-100 relative overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-stone-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded text-xs font-mono font-semibold">
                  {service.price}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs text-stone-500 font-medium">
                    {service.category} · {service.duration}
                  </div>
                  <h3 className="text-base font-semibold text-stone-900 mt-1">
                    {service.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="text-[11px] text-stone-500">
                    <span className="font-medium text-stone-700">Target Concerns:</span> {service.idealFor}
                  </div>
                  <button
                    onClick={() => onSelectServiceAndBook(service.id)}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors text-center"
                  >
                    Book This Service
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* THREE-STEP APPOINTMENT JOURNEY */}
      <section className="bg-stone-100/70 border-y border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              Simple Digital Booking
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              How Your Appointment Works
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Book real-time available doctor slots without waiting on phone queues or arriving at crowded waiting rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border border-stone-200 relative">
              <span className="text-3xl font-serif font-bold text-stone-300 block mb-2">01</span>
              <h3 className="text-base font-semibold text-stone-900 mb-1.5">
                Select Procedure & Doctor
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Choose the consultation or aesthetic procedure you need and select Dr. Bharat Bangera, Dr. Trupti, or any available physician.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-stone-200 relative">
              <span className="text-3xl font-serif font-bold text-stone-300 block mb-2">02</span>
              <h3 className="text-base font-semibold text-stone-900 mb-1.5">
                Pick a Live Available Time Slot
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Our booking engine validates live doctor availability, lunch breaks, and room sanitization buffers to ensure you get dedicated attention.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-stone-200 relative">
              <span className="text-3xl font-serif font-bold text-stone-300 block mb-2">03</span>
              <h3 className="text-base font-semibold text-stone-900 mb-1.5">
                Receive Instant Confirmation
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Get your unique reference code, calendar invite, and optional WhatsApp confirmation. Reschedule or cancel with 4-hour notice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              Clinical Standard
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Why Patients Choose Rainbow Skin & Hair Clinic
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Dermatology requires medical precision, not salon guesswork. Every consultation at Rainbow Skin & Hair Clinic begins with a clinical diagnostic assessment to address the root cause of your skin and hair concerns.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('about')}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900 underline"
              >
                Learn more about Dr. Bharat Bangera & Dr. Trupti →
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {whyChooseUs.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-lg border border-stone-200">
                <div className="w-8 h-8 rounded bg-teal-50 text-teal-800 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PATIENT REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
            Real Patient Outcomes
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Authentic Patient Experiences
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Verified patient feedback from clinical visits at our Sharavathi Nagar clinic in Shivamogga.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {patientReviews.map((review, idx) => (
            <div key={idx} className="bg-white border border-stone-200 rounded-lg p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "{review.quote}"
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-xs">
                <div className="font-semibold text-stone-900">{review.name}</div>
                <div className="text-stone-500">{review.treatment}</div>
                <div className="text-[11px] text-stone-400 mt-0.5">{review.date}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCATION & HOURS QUICK BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-lg p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold">
              Visit The Clinic
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold">
              Rushyashrunga Arcade, Kuvempu Road, Shivamogga
            </h3>
            <p className="text-xs sm:text-sm text-stone-300">
              Conveniently located beside Cliff Embassy Hotel in Sharavathi Nagar. Open Monday to Saturday 10:00 AM – 8:00 PM, and Sunday 10:00 AM – 2:00 PM.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-stone-400">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <a href="tel:+918951985418" className="hover:text-white transition-colors">+91 89519 85418</a>
              </div>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>Shivamogga, Karnataka 577202</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-3 justify-center">
            <button
              onClick={() => onSelectServiceAndBook('clinical-consult')}
              className="w-full py-3 px-5 text-sm font-semibold text-stone-900 bg-white hover:bg-stone-100 rounded text-center transition-colors shadow-xs"
            >
              Book an Appointment Today
            </button>
            <a
              href="https://maps.app.goo.gl/w5URJyeN6FMXoJLw6"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-5 text-xs font-semibold text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded text-center transition-colors"
            >
              Get Directions on Google Maps →
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
