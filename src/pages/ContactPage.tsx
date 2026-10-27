import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  Check, 
  AlertCircle, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { api } from '../lib/api';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Consultation Inquiry');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !message) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await api.submitContact({
        name,
        phone,
        email,
        subject,
        message
      });
      setSuccessMessage(res.message || 'Your inquiry has been submitted. Our clinic coordinator will contact you shortly.');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit inquiry. Please call the clinic directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const clinicPhone = '+91 89519 85418';
  const whatsappUrl = 'https://wa.me/918951985418?text=Hello%20Rainbow%20Skin%20%26%20Hair%20Clinic%2C%20I%20have%20an%20inquiry%20regarding%20treatments.';
  const mapsListingUrl = 'https://maps.app.goo.gl/w5URJyeN6FMXoJLw6';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
          Clinic Location & Enquiries
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
          Contact & Location Details
        </h1>
        <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
          Reach our clinic desk in Shivamogga directly via phone, WhatsApp, or through our secure consultation inquiry form.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
              Direct Contact
            </h3>

            <div className="space-y-3 text-sm">
              <a
                href="tel:+918951985418"
                className="flex items-center gap-3 p-3 bg-stone-50 hover:bg-stone-100 rounded border border-stone-200/80 transition-colors text-stone-800"
              >
                <div className="w-8 h-8 rounded bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Call Reception</span>
                  <span className="font-mono font-semibold">{clinicPhone}</span>
                </div>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors text-emerald-950"
              >
                <div className="w-8 h-8 rounded bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-emerald-700 block">WhatsApp Chat</span>
                  <span className="font-semibold">+91 89519 85418</span>
                </div>
              </a>

              <a
                href="mailto:rainbowshimoga@gmail.com"
                className="flex items-center gap-3 p-3 bg-stone-50 hover:bg-stone-100 rounded border border-stone-200/80 transition-colors text-stone-800"
              >
                <div className="w-8 h-8 rounded bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Email Inquiries</span>
                  <span className="font-medium text-xs">rainbowshimoga@gmail.com</span>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Address & Timing</span>
            </h3>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              <strong>Rushyashrunga Arcade</strong>, Kuvempu Road, Beside Cliff Embassy Hotel, Sharavathi Nagar, Shivamogga, Karnataka 577202.
            </p>

            <div className="pt-2 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-50">
                <span className="text-stone-600">Monday – Saturday:</span>
                <span className="font-mono font-semibold text-stone-900">10:00 AM – 8:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-50 text-stone-500">
                <span>Lunch Break:</span>
                <span className="font-mono">1:30 PM – 2:30 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-600">Sunday:</span>
                <span className="font-mono font-semibold text-teal-800">10:00 AM – 2:00 PM</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={mapsListingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal-800 hover:text-teal-900 font-semibold underline"
              >
                <span>Open in Google Maps App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-5">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Send a Message or Query
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                For general questions, treatment queries, or appointment advice.
              </p>
            </div>

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Your Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh K."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Inquiry Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 bg-white"
                  >
                    <option value="General Consultation Inquiry">General Consultation Inquiry</option>
                    <option value="Hair Loss & PRP Therapy">Hair Loss & PRP Therapy</option>
                    <option value="HydraFacial or Medi-Facial">HydraFacial or Medi-Facial</option>
                    <option value="Acne Scar or Laser Treatment">Acne Scar or Laser Treatment</option>
                    <option value="Appointment Reschedule Request">Appointment Reschedule Request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Message Details <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your condition, question, or preferred visit timing..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-6 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Clinic Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <span className="font-semibold text-stone-800">Clinic Map & Directions</span>
              <a
                href={mapsListingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-800 hover:underline flex items-center gap-1"
              >
                <span>Navigate</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="w-full h-64 sm:h-80 bg-stone-100">
              <iframe
                title="Rainbow Skin & Hair Clinic Google Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15474.33230198565!2d75.553009!3d13.936614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbba9097b7b4291%3A0x72b05a163c4319c9!2sRAINBOW%20SKIN%20%26%20HAIR%20CLINIC!5e0!3m2!1sen!2sin!4v1740645000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
