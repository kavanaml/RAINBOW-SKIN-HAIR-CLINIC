import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CalendarCheck, 
  Phone, 
  Mail, 
  MapPin 
} from 'lucide-react';
import type { Appointment, ServiceItem, StaffMember, DayAvailabilityResponse } from '../types';
import { api } from '../lib/api';

interface BookingFlowProps {
  initialServiceId?: string;
  onClose?: () => void;
  onSuccess?: (apt: Appointment) => void;
  onNavigateToManage?: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  initialServiceId,
  onClose,
  onSuccess,
  onNavigateToManage
}) => {
  const [step, setStep] = useState<number>(1);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || '');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  // Patient Details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);

  // Availability State
  const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);
  const [availabilityData, setAvailabilityData] = useState<DayAvailabilityResponse | null>(null);
  
  // Submission
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [serviceCategory, setServiceCategory] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [servicesRes, staffRes] = await Promise.all([
          api.getServices(),
          api.getStaff()
        ]);
        setServices(servicesRes);
        setStaffList(staffRes);
        
        if (initialServiceId && servicesRes.some(s => s.id === initialServiceId)) {
          setSelectedServiceId(initialServiceId);
        } else if (servicesRes.length > 0 && !selectedServiceId) {
          setSelectedServiceId(servicesRes[0].id);
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize clinic booking');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialServiceId]);

  useEffect(() => {
    if (!selectedServiceId || !selectedDate) return;
    let isMounted = true;
    async function fetchSlots() {
      try {
        setAvailabilityLoading(true);
        setError(null);
        const res = await api.getAvailability(selectedServiceId, selectedDate, selectedStaffId);
        if (isMounted) {
          setAvailabilityData(res);
          if (selectedSlot) {
            const stillFree = res.slots.some(s => s.time === selectedSlot && s.available);
            if (!stillFree) setSelectedSlot('');
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Could not load slots');
      } finally {
        if (isMounted) setAvailabilityLoading(false);
      }
    }
    fetchSlots();
    return () => { isMounted = false; };
  }, [selectedServiceId, selectedDate, selectedStaffId]);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedStaff = staffList.find(s => s.id === selectedStaffId);

  const availableDates: { dateStr: string; dayName: string; dayNum: number; monthName: string; isSunday: boolean }[] = [];
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    availableDates.push({
      dateStr,
      dayName: dayNames[dayOfWeek],
      dayNum: d.getDate(),
      monthName: monthNames[d.getMonth()],
      isSunday: dayOfWeek === 0
    });
  }

  const handleSubmitBooking = async () => {
    if (!policyAccepted) {
      setError('Please accept the clinic cancellation and arrival policy to proceed.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await api.createBooking({
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        date: selectedDate,
        startTime: selectedSlot,
        customerName,
        customerPhone,
        customerEmail,
        customerNotes
      });

      setConfirmedAppointment(result.appointment);
      setStep(7);
      if (onSuccess) onSuccess(result.appointment);
    } catch (err: any) {
      setError(err.message || 'Booking conflict: Selected slot is no longer available. Please select another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-stone-600">Loading clinic schedule and treatments...</p>
      </div>
    );
  }

  if (step === 7 && confirmedAppointment) {
    const googleCalStartTime = confirmedAppointment.date.replace(/-/g, '') + 'T' + confirmedAppointment.startTime.replace(':', '') + '00';
    const googleCalEndTime = confirmedAppointment.date.replace(/-/g, '') + 'T' + confirmedAppointment.endTime.replace(':', '') + '00';
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Rainbow Skin & Hair Clinic: ${confirmedAppointment.serviceName}`
    )}&dates=${googleCalStartTime}/${googleCalEndTime}&details=${encodeURIComponent(
      `Appointment Ref: ${confirmedAppointment.reference}\nDoctor: ${confirmedAppointment.staffName}\nPatient: ${confirmedAppointment.customerName}\nPhone: +91 89519 85418`
    )}&location=${encodeURIComponent('Rainbow Skin & Hair Clinic, Kuvempu Road, Shivamogga, Karnataka 577202')}`;

    const whatsappMessage = `Hello Rainbow Skin & Hair Clinic, I have confirmed appointment *${confirmedAppointment.reference}* for *${confirmedAppointment.serviceName}* on *${confirmedAppointment.date}* at *${confirmedAppointment.startTime}*. Patient name: ${confirmedAppointment.customerName}.`;
    const whatsappUrl = `https://wa.me/918951985418?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-teal-50 text-teal-800 rounded-full flex items-center justify-center mx-auto ring-8 ring-teal-50/50">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Appointment Confirmed
            </h2>
            <p className="text-sm text-stone-600">
              Your appointment is recorded in the clinic calendar.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-md p-5 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">Booking Reference</span>
              <span className="font-mono text-base font-bold text-teal-900 bg-teal-100/70 px-2.5 py-1 rounded">
                {confirmedAppointment.reference}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
              <div>
                <span className="text-xs text-stone-500 block">Procedure</span>
                <span className="font-medium text-stone-900">{confirmedAppointment.serviceName}</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">Specialist</span>
                <span className="font-medium text-stone-900">{confirmedAppointment.staffName}</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">Date & Time</span>
                <span className="font-medium text-stone-900 font-mono">
                  {confirmedAppointment.date} at {confirmedAppointment.startTime}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-500 block">Duration & Consultation Fee</span>
                <span className="font-medium text-stone-900">
                  {confirmedAppointment.durationMinutes} mins · ₹{confirmedAppointment.priceINR.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 text-xs text-stone-500 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
              <span>
                Rainbow Skin & Hair Clinic, Rushyashrunga Arcade, Kuvempu Road, Beside Cliff Embassy Hotel, Sharavathi Nagar, Shivamogga
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors inline-flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-4 h-4 text-stone-700" />
              <span>Add to Google Calendar</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp Clinic Reception</span>
            </a>
          </div>

          <div className="border-t border-stone-200 pt-5 flex items-center justify-between text-xs text-stone-500">
            <span>Use this reference to manage or reschedule anytime.</span>
            {onNavigateToManage && (
              <button
                onClick={onNavigateToManage}
                className="text-teal-800 font-semibold hover:underline"
              >
                Manage My Booking →
              </button>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-white bg-stone-900 rounded hover:bg-stone-800 transition-colors"
            >
              Return to Website
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <span>Step {step} of 6</span>
          <span className="text-teal-800">
            {step === 1 && 'Select Procedure'}
            {step === 2 && 'Select Doctor'}
            {step === 3 && 'Select Date'}
            {step === 4 && 'Pick Available Slot'}
            {step === 5 && 'Patient Details'}
            {step === 6 && 'Review & Policy Agreement'}
          </span>
        </div>
        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-teal-700 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* STEP 1: Select Service */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Select a Treatment or Consultation
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Choose from our verified clinical dermatology, hair restoration, and medi-facial procedures.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-lg overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Treatments' },
              { id: 'hair', label: 'Hair & Scalp' },
              { id: 'medi-facials', label: 'Medi-Facials & Glow' },
              { id: 'dermatology', label: 'Clinical Dermatology' },
              { id: 'lasers-anti-aging', label: 'Lasers & Scar Revision' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setServiceCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  serviceCategory === cat.id
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services
              .filter(s => serviceCategory === 'all' || s.category === serviceCategory)
              .map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`p-5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/40 shadow-xs ring-1 ring-teal-700'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-stone-500 font-medium">
                          {service.categoryName}
                        </div>
                        <h3 className="text-base font-semibold text-stone-900 mt-0.5">
                          {service.name}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-base font-bold text-stone-900 block">
                          ₹{service.priceINR.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-stone-500 font-mono">
                          {service.durationMinutes} mins
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <span>Ideal for:</span>
                        <span className="text-stone-700 font-medium truncate max-w-[200px]">
                          {service.idealFor.join(' · ')}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected ? 'border-teal-700 bg-teal-700 text-white' : 'border-stone-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              disabled={!selectedServiceId}
              onClick={() => setStep(2)}
              className="py-2.5 px-6 text-sm font-semibold text-white bg-teal-800 rounded hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Continue to Doctor Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Choose Specialist */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Select Your Specialist
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Select your preferred consulting physician or choose any available specialist for maximum slot flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSelectedStaffId('any')}
              className={`p-5 rounded-lg border text-left cursor-pointer transition-all ${
                selectedStaffId === 'any'
                  ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 mb-3">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-stone-900">Any Available Specialist</h3>
              <p className="text-xs text-stone-500 mt-1">
                Highest slot availability. You will be scheduled with either Dr. Bharat Bangera or Dr. Trupti based on procedure type.
              </p>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-teal-800 font-medium">
                <span>Fastest availability</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                  selectedStaffId === 'any' ? 'border-teal-700 bg-teal-700 text-white' : 'border-stone-300'
                }`}>
                  {selectedStaffId === 'any' && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>

            {staffList.map((doc) => {
              const isSelected = selectedStaffId === doc.id;
              const supportsSelected = selectedServiceId ? doc.supportedServiceIds.includes(selectedServiceId) : true;

              return (
                <div
                  key={doc.id}
                  onClick={() => supportsSelected && setSelectedStaffId(doc.id)}
                  className={`p-5 rounded-lg border text-left transition-all ${
                    !supportsSelected 
                      ? 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-teal-700 bg-teal-50/40 ring-1 ring-teal-700 cursor-pointer'
                      : 'border-stone-200 bg-white hover:border-stone-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-sm font-serif">
                      {doc.name.split(' ')[1]?.[0] || 'D'}
                    </div>
                    {supportsSelected ? (
                      <span className="text-[11px] font-medium text-stone-500 font-mono">
                        {doc.experienceYears}+ Yrs Exp
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Not for this service
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-stone-900">{doc.name}</h3>
                  <div className="text-xs text-stone-500 font-medium mt-0.5">{doc.qualifications}</div>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2">
                    {doc.bio}
                  </p>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                    <span>{doc.role}</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      isSelected ? 'border-teal-700 bg-teal-700 text-white' : 'border-stone-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="py-2.5 px-4 text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="py-2.5 px-6 text-sm font-semibold text-white bg-teal-800 rounded hover:bg-teal-900 transition-colors flex items-center gap-2"
            >
              <span>Continue to Date Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Date & Time */}
      {(step === 3 || step === 4) && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Select Appointment Date & Time
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Live clinic schedule. Times are displayed in Indian Standard Time (IST, UTC+5:30).
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Select Date (Next 3 Weeks)
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    onClick={() => {
                      setSelectedDate(item.dateStr);
                      setSelectedSlot('');
                    }}
                    className={`flex flex-col items-center justify-center min-w-[72px] py-3 px-2 rounded-lg border transition-all shrink-0 ${
                      isSelected
                        ? 'border-teal-700 bg-teal-800 text-white shadow-xs font-semibold'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <span className={`text-[11px] uppercase tracking-wider ${isSelected ? 'text-teal-100' : 'text-stone-400'}`}>
                      {item.dayName}
                    </span>
                    <span className="text-xl font-bold font-mono my-0.5">
                      {item.dayNum}
                    </span>
                    <span className={`text-[11px] ${isSelected ? 'text-teal-100' : 'text-stone-500'}`}>
                      {item.monthName}
                    </span>
                    {item.isSunday && (
                      <span className={`text-[9px] mt-1 px-1 rounded ${isSelected ? 'bg-teal-900 text-teal-200' : 'bg-amber-50 text-amber-800'}`}>
                        Half-day
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Available Slots for {selectedDate}</span>
              </div>
              {availabilityData?.isOpen && (
                <span className="text-xs text-stone-500">
                  {selectedDate.endsWith('0') ? 'Sunday hours: 10:00 AM – 2:00 PM' : 'Clinic Hours: 10:00 AM – 8:00 PM'}
                </span>
              )}
            </div>

            {availabilityLoading ? (
              <div className="p-8 text-center bg-white border border-stone-200 rounded-lg">
                <div className="w-6 h-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-stone-500">Checking room and doctor availability...</span>
              </div>
            ) : !availabilityData?.isOpen ? (
              <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600">
                <AlertCircle className="w-6 h-6 text-amber-700 mx-auto mb-2" />
                <p className="font-semibold text-stone-800">Clinic is Closed on this Day</p>
                <p className="text-xs text-stone-500 mt-1">{availabilityData?.message || 'Please select another date on the calendar.'}</p>
              </div>
            ) : availabilityData?.slots.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600">
                <p className="font-semibold text-stone-800">No Slots Available</p>
                <p className="text-xs text-stone-500 mt-1">
                  All appointment slots for this treatment are currently reserved or outside business hours on this date.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-lg p-5">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availabilityData.slots.map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2 px-1 text-center rounded-md border text-xs font-mono transition-all ${
                          !slot.available
                            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-teal-800 text-white border-teal-800 font-semibold shadow-xs'
                            : 'bg-white text-stone-800 border-stone-300 hover:border-teal-700 hover:text-teal-900 cursor-pointer'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-white border border-stone-300" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-stone-100 border border-stone-200" />
                      <span>Reserved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-teal-800" />
                      <span>Selected</span>
                    </div>
                  </div>
                  <span>10-min buffer included for sterile preparation</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-4 text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              disabled={!selectedSlot}
              onClick={() => setStep(5)}
              className="py-2.5 px-6 text-sm font-semibold text-white bg-teal-800 rounded hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Continue to Patient Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Patient Details */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Patient Contact Information
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Your contact details are used strictly for appointment confirmation, SMS reminders, and clinical records.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ananya Rao"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  Mobile Number (India) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-stone-500 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-12 pr-3.5 py-2.5 border border-stone-300 rounded text-sm text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">Used for appointment confirmation SMS</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ananya@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">Receives booking receipt & reminder</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Primary Concern or Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Mention any existing skin allergies, previous treatments, or specific areas of concern..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(4)}
              className="py-2.5 px-4 text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Time</span>
            </button>
            <button
              disabled={!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()}
              onClick={() => setStep(6)}
              className="py-2.5 px-6 text-sm font-semibold text-white bg-teal-800 rounded hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Review Booking Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Finalize */}
      {step === 6 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Review & Finalize Appointment
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Please verify your appointment schedule before confirming.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-200">
              <div>
                <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block">
                  Procedure
                </span>
                <span className="text-base font-semibold text-stone-900 mt-0.5 block">
                  {selectedService?.name}
                </span>
                <span className="text-xs text-stone-600">
                  {selectedService?.categoryName} · {selectedService?.durationMinutes} minutes
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block">
                  Consulting Specialist
                </span>
                <span className="text-base font-semibold text-stone-900 mt-0.5 block">
                  {selectedStaff ? selectedStaff.name : 'Assigned Clinic Specialist'}
                </span>
                <span className="text-xs text-stone-600">
                  {selectedStaff ? selectedStaff.role : 'Dermatology & Aesthetic Medical Team'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-200">
              <div>
                <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block">
                  Date & Slot Time
                </span>
                <span className="text-base font-mono font-semibold text-stone-900 mt-0.5 block">
                  {selectedDate} at {selectedSlot}
                </span>
                <span className="text-xs text-stone-600">
                  Indian Standard Time (IST)
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block">
                  Total Procedure Fee
                </span>
                <span className="text-xl font-mono font-bold text-teal-900 mt-0.5 block">
                  ₹{selectedService?.priceINR.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-500">
                  Payable at clinic reception (Cash / UPI / Card)
                </span>
              </div>
            </div>

            <div className="text-xs text-stone-600 space-y-1">
              <p><strong className="text-stone-900">Patient:</strong> {customerName} ({customerPhone} · {customerEmail})</p>
              {customerNotes && (
                <p><strong className="text-stone-900">Notes:</strong> {customerNotes}</p>
              )}
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-teal-700 focus:ring-teal-700"
                />
                <div className="text-xs text-stone-700 leading-relaxed">
                  <span className="font-semibold text-stone-900 block mb-0.5">Clinic Cancellation Policy</span>
                  I understand that cancellations or rescheduling must be notified at least <strong>4 hours prior</strong> to the scheduled time. I will arrive 10 minutes before my appointment at Rushyashrunga Arcade, Kuvempu Road, Shivamogga.
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(5)}
              className="py-2.5 px-4 text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Patient Info</span>
            </button>
            <button
              disabled={submitting || !policyAccepted}
              onClick={handleSubmitBooking}
              className="py-3 px-8 text-sm font-semibold text-white bg-teal-800 rounded hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying & Reserving Slot...</span>
                </>
              ) : (
                <>
                  <span>Confirm Appointment</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
