import React from 'react';
import { MapPin, Phone, Mail, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenBooking }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
          
          {/* Brand & Introduction */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
              Rainbow Skin & Hair Clinic
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Shivamogga’s dedicated centre for clinical dermatology, trichology, hair restoration therapies, and medical-grade aesthetics. Under the clinical leadership of Dr. Bharat Bangera and Dr. Trupti.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="py-2 px-4 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded transition-colors"
              >
                Schedule Consultation
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-100">
              Clinical Services
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Platelet-Rich Plasma (PRP) Hair Therapy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Signature HydraFacial MD
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Oxygeneo 3-in-1 Facial
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Carbon Laser Clarifying Peel
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  MNRF Acne Scar Collagen Therapy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Clinical Dermatologist Consultation
                </button>
              </li>
            </ul>
          </div>

          {/* Clinic Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>Working Hours</span>
            </h4>
            <div className="space-y-2 text-sm text-stone-400">
              <div className="flex justify-between border-b border-stone-800 pb-1.5">
                <span className="text-stone-300">Mon – Sat:</span>
                <span className="text-stone-200 font-mono">10:00 AM – 8:00 PM</span>
              </div>
              <div className="text-xs text-stone-500">
                Lunch break: 1:30 PM – 2:30 PM
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-1.5 pt-1">
                <span className="text-stone-300">Sunday:</span>
                <span className="text-stone-200 font-mono">10:00 AM – 2:00 PM</span>
              </div>
              <div className="text-xs text-stone-500 pt-1">
                Timezone: Asia/Kolkata (IST)
              </div>
              <div className="pt-2 text-xs text-stone-400">
                Appointments must be booked at least 1 hour in advance.
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-100">
              Clinic Location
            </h4>
            <div className="space-y-3 text-sm text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span>
                  Rushyashrunga Arcade, Kuvempu Road, Beside Cliff Embassy Hotel, Sharavathi Nagar, Shivamogga, Karnataka 577202
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                <a href="tel:+918951985418" className="hover:text-white transition-colors">
                  +91 89519 85418
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                <a href="mailto:rainbowshimoga@gmail.com" className="hover:text-white transition-colors">
                  rainbowshimoga@gmail.com
                </a>
              </div>
              <div className="pt-2">
                <a
                  href="https://maps.app.goo.gl/w5URJyeN6FMXoJLw6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 underline font-medium"
                >
                  <span>Open in Google Maps</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} Rainbow Skin & Hair Clinic. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('manage')} className="hover:text-stone-300 transition-colors">
              Manage Existing Booking
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => onNavigate('about')} className="hover:text-stone-300 transition-colors">
              Clinical Policies & Hygiene
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => onNavigate('contact')} className="hover:text-stone-300 transition-colors">
              Directions & Queries
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
