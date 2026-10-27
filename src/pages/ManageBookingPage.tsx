import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Phone, 
  FileText,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import type { Appointment, ServiceItem, DayAvailabilityResponse } from '../types';
import { api } from '../lib/api';

export const ManageBookingPage: React.FC = () => {
  const [referenceInput, setReferenceInput] = useState('');
  const [contactInput, setContactInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  
  // Appointment state
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceItem | undefined>(undefined);
  const [canModify, setCanModify] = useState(false);
  const [cancellationNoticeHours, setCancellationNoticeHours] = useState(4);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);
  const [availabilityData, setAvailabilityData] = useState<DayAvailabilityResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Cancel state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Perform Lookup
  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referenceInput.trim()) {
      setLookupError('Please enter your appointment booking reference (e.g. RSH-2026-XXXX).');
      return;
    }

    try {
      setLoading(true);
      setLookupError(null);
      setIsRescheduling(false);
      setIsCancelling(false);
      setRescheduleSuccess(null);
      setCancelSuccess(null);

      const res = await api.lookupBooking(referenceInput, contactInput);
      setAppointment(res.appointment);
      setServiceDetails(res.serviceDetails);
      setCanModify(res.canModify);
      setCancellationNoticeHours(res.cancellationNoticeHours);

      // Pre-fill tomorrow for reschedule
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setNewDate(tmrw.toISOString().split('T')[0]);
    } catch (err: any) {
      setAppointment(null);
      setLookupError(err.message || 'No appointment found with the provided details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots when rescheduling
  useEffect(() => {
    if (!isRescheduling || !appointment || !newDate) return;
    let isMounted = true;

    async function loadNewSlots() {
      try {
        setSlotsLoading(true);
        setRescheduleError(null);
        const res = await api.getAvailability(appointment!.serviceId, newDate, appointment!.staffId);
        if (isMounted) {
          setAvailabilityData(res);
          setNewSlot('');
        }
      } catch (err: any) {
        if (isMounted) setRescheduleError(err.message);
      } finally {
        if (isMounted) setSlotsLoading(false);
      }
    }
    loadNewSlots();
    return () => { isMounted = false; };
  }, [isRescheduling, appointment, newDate]);

  // Execute Reschedule
  const handleExecuteReschedule = async () => {
    if (!appointment || !newDate || !newSlot) return;

    try {
      setRescheduleLoading(true);
      setRescheduleError(null);

      const res = await api.rescheduleBooking(appointment.id, newDate, newSlot);
      setAppointment(res.appointment);
      setIsRescheduling(false);
      setRescheduleSuccess(`Your appointment has been successfully rescheduled to ${newDate} at ${newSlot}.`);
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule. The selected slot may be booked.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Execute Cancel
  const handleExecuteCancel = async () => {
    if (!appointment) return;

    try {
      setCancelLoading(true);
      setCancelError(null);

      const res = await api.cancelBooking(appointment.id, cancelReason);
      setAppointment(res.appointment);
      setIsCancelling(false);
      setCanModify(false);
      setCancelSuccess('Your appointment has been cancelled and the slot has been re-released to other patients.');
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-semibold">Confirmed</span>;
      case 'pending':
        return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-xs font-semibold">Pending Approval</span>;
      case 'completed':
        return <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded text-xs font-semibold">Completed</span>;
      case 'cancelled':
        return <span className="text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
          Patient Self-Service
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
          Manage Your Appointment
        </h1>
        <p className="text-stone-600 text-sm mt-2 leading-relaxed">
          View appointment details, reschedule to an alternate available date, or cancel your booking in accordance with clinic policies.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Booking Reference <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RSH-2026-7B9X"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Phone Number or Email (Verification)
              </label>
              <input
                type="text"
                placeholder="Phone (10 digits) or Email used for booking"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone-500">
              Reference was provided upon booking completion.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Looking up...</span>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Appointment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {lookupError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>{lookupError}</span>
        </div>
      )}

      {rescheduleSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-md flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{rescheduleSuccess}</span>
        </div>
      )}

      {cancelSuccess && (
        <div className="p-4 bg-stone-100 border border-stone-300 text-stone-800 text-xs rounded-md flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
          <span>{cancelSuccess}</span>
        </div>
      )}

      {/* Appointment Details Display */}
      {appointment && (
        <div className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-stone-900">
                  {appointment.reference}
                </span>
                {getStatusBadge(appointment.status)}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Booked on {new Date(appointment.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="font-mono text-lg font-bold text-teal-900 block">
                ₹{appointment.priceINR.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-stone-500">
                {appointment.durationMinutes} minutes
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-stone-500 uppercase tracking-wider block mb-1">
                Clinical Procedure
              </span>
              <span className="text-sm font-semibold text-stone-900 block">
                {appointment.serviceName}
              </span>
              {serviceDetails && (
                <span className="text-stone-500 mt-0.5 block">{serviceDetails.categoryName}</span>
              )}
            </div>

            <div>
              <span className="text-stone-500 uppercase tracking-wider block mb-1">
                Specialist Doctor
              </span>
              <span className="text-sm font-semibold text-stone-900 block">
                {appointment.staffName}
              </span>
              <span className="text-stone-500 mt-0.5 block">Rainbow Skin & Hair Clinic</span>
            </div>

            <div>
              <span className="text-stone-500 uppercase tracking-wider block mb-1">
                Scheduled Slot (IST)
              </span>
              <span className="text-sm font-mono font-semibold text-stone-900 block">
                {appointment.date}
              </span>
              <span className="font-mono text-teal-800 font-medium">
                {appointment.startTime} – {appointment.endTime}
              </span>
            </div>

            <div>
              <span className="text-stone-500 uppercase tracking-wider block mb-1">
                Patient Name
              </span>
              <span className="text-sm font-semibold text-stone-900 block">
                {appointment.customerName}
              </span>
            </div>

            <div>
              <span className="text-stone-500 uppercase tracking-wider block mb-1">
                Contact Phone
              </span>
              <span className="text-sm font-mono text-stone-900 block">
                {appointment.customerPhone}
              </span>
            </div>

            <div>
              <span className="text-stone-500 uppercase tracking-wider block mb-1">
                Email
              </span>
              <span className="text-sm text-stone-900 block truncate">
                {appointment.customerEmail}
              </span>
            </div>
          </div>

          {appointment.customerNotes && (
            <div className="p-3 bg-stone-50 rounded border border-stone-200 text-xs">
              <span className="font-semibold text-stone-700 block mb-0.5">Patient Notes:</span>
              <span className="text-stone-600">{appointment.customerNotes}</span>
            </div>
          )}

          {appointment.cancellationReason && (
            <div className="p-3 bg-stone-100 rounded border border-stone-300 text-xs">
              <span className="font-semibold text-stone-800 block mb-0.5">Cancellation Details:</span>
              <span className="text-stone-600">{appointment.cancellationReason}</span>
            </div>
          )}

          {/* Action Area for Active Appointments */}
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <div className="pt-4 border-t border-stone-100 space-y-4">
              {!isRescheduling && !isCancelling && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-stone-500">
                    {canModify ? (
                      <span>Free rescheduling and cancellation allowed up to 4 hours before the appointment.</span>
                    ) : (
                      <span className="text-amber-800">
                        Appointment is within the {cancellationNoticeHours}-hour notice window. Contact reception at +91 89519 85418 for emergency changes.
                      </span>
                    )}
                  </div>

                  {canModify && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setIsRescheduling(true); setIsCancelling(false); }}
                        className="py-2 px-4 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors"
                      >
                        Reschedule Slot
                      </button>
                      <button
                        onClick={() => { setIsCancelling(true); setIsRescheduling(false); }}
                        className="py-2 px-4 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Reschedule Drawer */}
              {isRescheduling && (
                <div className="p-5 bg-teal-50/50 border border-teal-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-teal-950 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-teal-800" />
                      <span>Select New Date & Time Slot</span>
                    </h4>
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="text-xs text-stone-500 hover:text-stone-900"
                    >
                      Dismiss
                    </button>
                  </div>

                  {rescheduleError && (
                    <div className="p-3 bg-amber-100 text-amber-950 text-xs rounded">
                      {rescheduleError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Select New Date:
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="px-3 py-1.5 border border-stone-300 rounded text-xs bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Available Slots for {newDate}:
                      </label>

                      {slotsLoading ? (
                        <div className="text-xs text-stone-500 py-2">Loading slots...</div>
                      ) : !availabilityData?.isOpen ? (
                        <div className="text-xs text-amber-800 py-1">Clinic is closed on this date.</div>
                      ) : availabilityData?.slots.length === 0 ? (
                        <div className="text-xs text-stone-500 py-1">No free slots on this date.</div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                          {availabilityData.slots.map((s) => (
                            <button
                              key={s.time}
                              type="button"
                              disabled={!s.available}
                              onClick={() => setNewSlot(s.time)}
                              className={`py-1.5 px-2 text-xs font-mono rounded border transition-all ${
                                !s.available
                                  ? 'bg-stone-100 text-stone-400 border-stone-200 line-through cursor-not-allowed'
                                  : newSlot === s.time
                                  ? 'bg-teal-800 text-white border-teal-800 font-semibold'
                                  : 'bg-white text-stone-800 border-stone-300 hover:border-teal-700'
                              }`}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="py-1.5 px-3 text-xs text-stone-600 hover:text-stone-900"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!newSlot || rescheduleLoading}
                      onClick={handleExecuteReschedule}
                      className="py-2 px-5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded disabled:opacity-50"
                    >
                      {rescheduleLoading ? 'Updating Slot...' : 'Confirm Rescheduled Slot'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel Confirmation Drawer */}
              {isCancelling && (
                <div className="p-5 bg-rose-50/50 border border-rose-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-rose-950 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-700" />
                      <span>Confirm Appointment Cancellation</span>
                    </h4>
                    <button
                      onClick={() => setIsCancelling(false)}
                      className="text-xs text-stone-500 hover:text-stone-900"
                    >
                      Dismiss
                    </button>
                  </div>

                  {cancelError && (
                    <div className="p-3 bg-amber-100 text-amber-950 text-xs rounded">
                      {cancelError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Reason for cancellation (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule clash, feeling better, traveling..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded text-xs bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsCancelling(false)}
                      className="py-1.5 px-3 text-xs text-stone-600 hover:text-stone-900"
                    >
                      Keep Appointment
                    </button>
                    <button
                      disabled={cancelLoading}
                      onClick={handleExecuteCancel}
                      className="py-2 px-5 text-xs font-semibold text-white bg-rose-800 hover:bg-rose-900 rounded disabled:opacity-50"
                    >
                      {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
