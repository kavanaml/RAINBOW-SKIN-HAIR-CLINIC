import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  HeartPulse, 
  Clock, 
  MapPin, 
  Phone 
} from 'lucide-react';

interface AboutPageProps {
  onOpenBooking: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenBooking }) => {
  const doctorConsultImage = '/src/assets/images/doctor_consultation_1793112041236.jpg';

  const specialists = [
    {
      name: 'Dr. Bharat Bangera',
      title: 'Consultant Dermatologist & Hair Specialist',
      degrees: 'MD, DNB (Dermatology, Venereology & Leprosy)',
      experience: '12+ Years Clinical Practice',
      focus: 'Trichology, Autologous PRP Regrowth, Dermatosurgery & Chronic Skin Conditions',
      bio: 'Dr. Bharat Bangera is one of Shivamogga’s leading dermatologists with extensive hospital and private clinical experience. He combines rigorous medical diagnostics with precision interventions for hair loss, eczema, psoriasis, and pigmentary disorders.'
    },
    {
      name: 'Dr. Trupti',
      title: 'Consultant Cosmetologist & Aesthetic Physician',
      degrees: 'MBBS, FAM (Fellowship in Aesthetic Medicine)',
      experience: '9+ Years Aesthetic Medicine',
      focus: 'HydraFacial MD, Medical Chemical Peels, MNRF Collagen Remodeling & Facial Aesthetics',
      bio: 'Dr. Trupti specializes in non-invasive cosmetic dermatology and restorative medi-facials. Her approach emphasizes skin barrier preservation, individualized pigment correction, and natural texture improvement without unnecessary or aggressive procedures.'
    }
  ];

  const standards = [
    {
      title: 'Evidence-Based Prescriptions Only',
      desc: 'We do not sell over-hyped salon packages. Every patient receives a clinical examination with a dermatoscope followed by a diagnosis and medical prescription.'
    },
    {
      title: 'Class-B Autoclave Sterilization',
      desc: 'All surgical tools undergo medical-grade steam vacuum autoclaving. All extraction lancets, micro-needles, and gloves are single-use disposables.'
    },
    {
      title: 'Calibrated Energy-Based Lasers',
      desc: 'Our Q-switched laser and fractional radiofrequency systems are regularly serviced, calibrated, and operated under direct medical oversight.'
    },
    {
      title: 'Patient Privacy & Dedicated Suites',
      desc: 'Located at Kuvempu Road with private consultation rooms ensuring confidentiality for sensitive dermatological or hair restoration discussions.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Intro & Philosophy */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
            About Our Practice
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
            Bridging Medical Dermatology with Advanced Aesthetic Science
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Rainbow Skin & Hair Clinic was established in Sharavathi Nagar, Shivamogga, to provide patients across the Malnad region with genuine, board-certified dermatological care.
          </p>
          <p className="text-stone-600 text-sm leading-relaxed">
            Whether managing chronic skin conditions like dermatitis, psoriasis, and cystic acne, or reversing hair thinning through autologous platelet-rich plasma (PRP), we believe patient outcomes rely on accurate medical diagnostics, sterile clinical protocols, and transparent patient communication.
          </p>

          <div className="pt-2">
            <button
              onClick={onOpenBooking}
              className="py-2.5 px-6 text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors"
            >
              Consult with Our Doctors
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-lg overflow-hidden border border-stone-200 aspect-[4/3] bg-stone-100 shadow-xs">
            <img
              src={doctorConsultImage}
              alt="Dr. Bharat Bangera and Dr. Trupti clinical consultation in Shivamogga"
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Meet the Doctors */}
      <section className="space-y-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
            Clinical Leadership
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Meet Our Specialist Physicians
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Direct doctor consultations with verified medical qualifications and specialist credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {specialists.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-4 hover:border-stone-300 transition-all"
            >
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">{doc.name}</h3>
                  <div className="text-xs text-teal-800 font-semibold mt-0.5">{doc.title}</div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">{doc.degrees}</div>
                </div>
                <span className="text-xs font-mono font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded">
                  {doc.experience}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {doc.bio}
              </p>

              <div className="pt-2 text-xs">
                <span className="text-stone-500 block mb-1 font-medium">Core Clinical Focus:</span>
                <span className="text-stone-800 font-medium">{doc.focus}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sterile Clinic Standards */}
      <section className="bg-stone-100/70 rounded-lg p-8 sm:p-10 border border-stone-200 space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
            Clinical Governance
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Hygiene & Ethical Standards
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {standards.map((s, idx) => (
            <div key={idx} className="bg-white p-5 rounded border border-stone-200 space-y-2">
              <h4 className="text-sm font-semibold text-stone-900">{s.title}</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Location card */}
      <section className="border border-stone-200 rounded-lg p-6 sm:p-8 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Visit Us in Sharavathi Nagar, Shivamogga
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
            Rushyashrunga Arcade, Kuvempu Road, Beside Cliff Embassy Hotel. Walk-ins welcome, though prior appointment is strongly advised to prevent waiting.
          </p>
        </div>
        <button
          onClick={onOpenBooking}
          className="py-3 px-6 text-xs sm:text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded shrink-0"
        >
          Schedule an Appointment
        </button>
      </section>

    </div>
  );
};
