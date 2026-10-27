import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Download, 
  Plus, 
  Play, 
  AlertCircle 
} from 'lucide-react';
import type { Appointment, ClinicSettings, ContactMessage, ServiceItem, TestResult } from '../types';
import { api } from '../lib/api';

interface AdminPageProps {
  onLoginStateChange?: (loggedIn: boolean) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onLoginStateChange }) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('clinic_admin_token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [adminTab, setAdminTab] = useState<'overview' | 'appointments' | 'services' | 'settings' | 'messages' | 'tests' | 'supabase'>('overview');

  const [overviewData, setOverviewData] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [testResults, setTestResults] = useState<{ timestamp: string; allPassed: boolean; results: TestResult[] } | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [walkInDate, setWalkInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [walkInTime, setWalkInTime] = useState('11:00');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const isLoggedIn = !!token;

  useEffect(() => {
    if (onLoginStateChange) onLoginStateChange(isLoggedIn);
  }, [isLoggedIn, onLoginStateChange]);

  const loadDashboardData = async (authToken: string) => {
    try {
      const [overview, apts, srvs, clinicInfo, msgs, sbStatus] = await Promise.all([
        api.getAdminOverview(authToken),
        api.getAdminAppointments(authToken),
        api.getServices(),
        api.getClinicInfo(),
        api.getAdminMessages(authToken),
        api.getSupabaseStatus().catch(() => null)
      ]);
      setOverviewData(overview);
      setAppointments(apts);
      setServices(srvs);
      setSettings(clinicInfo.settings);
      setMessages(msgs);
      if (sbStatus) setSupabaseStatus(sbStatus);
      if (srvs.length > 0 && !walkInServiceId) {
        setWalkInServiceId(srvs[0].id);
      }
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('Forbidden')) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    if (token) loadDashboardData(token);
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError(null);
      const res = await api.adminLogin(password, username);
      localStorage.setItem('clinic_admin_token', res.token);
      setToken(res.token);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clinic_admin_token');
    setToken('');
    setOverviewData(null);
  };

  const handleStatusUpdate = async (id: string, status: string, reason?: string) => {
    try {
      await api.updateAppointmentStatus(token, id, status, reason);
      await loadDashboardData(token);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setWalkInError(null);
      await api.createWalkInAppointment(token, {
        serviceId: walkInServiceId,
        date: walkInDate,
        startTime: walkInTime,
        customerName: walkInName,
        customerPhone: walkInPhone,
        customerEmail: 'walkin@rainbowskinhair.in',
        customerNotes: 'Walk-in registration at reception'
      });
      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      await loadDashboardData(token);
    } catch (err: any) {
      setWalkInError(err.message || 'Failed to book slot. Room or doctor conflict.');
    }
  };

  const handleSaveServiceEdit = async () => {
    if (!editingService) return;
    try {
      await api.updateService(token, editingService.id, {
        priceINR: Number(editingService.priceINR),
        durationMinutes: Number(editingService.durationMinutes),
        active: editingService.active
      });
      setEditingService(null);
      await loadDashboardData(token);
    } catch (err: any) {
      alert(`Error saving service: ${err.message}`);
    }
  };

  const handleRunTests = async () => {
    try {
      setTestRunning(true);
      const res = await api.runTests();
      setTestResults(res);
    } catch (err: any) {
      alert(`Test run error: ${err.message}`);
    } finally {
      setTestRunning(false);
    }
  };

  const exportCSV = () => {
    if (appointments.length === 0) return;
    const headers = ['Reference', 'Date', 'Time', 'Service', 'Specialist', 'Patient', 'Phone', 'Price_INR', 'Status'];
    const rows = appointments.map(a => [
      a.reference,
      a.date,
      a.startTime,
      `"${a.serviceName.replace(/"/g, '""')}"`,
      `"${a.staffName.replace(/"/g, '""')}"`,
      `"${a.customerName.replace(/"/g, '""')}"`,
      a.customerPhone,
      a.priceINR,
      a.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rainbow_Clinic_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-teal-50 text-teal-800 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Clinic Staff Portal
            </h1>
            <p className="text-xs text-stone-500">
              Authorized access for Rainbow Skin & Hair Clinic physicians and reception.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 bg-white"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Default: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">Rainbow@Admin2026</code> or <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">admin123</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesDate = !dateFilter || a.date === dateFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      a.reference.toLowerCase().includes(q) ||
      a.customerName.toLowerCase().includes(q) ||
      a.customerPhone.includes(q) ||
      a.serviceName.toLowerCase().includes(q);
    return matchesStatus && matchesDate && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-800">
              Clinic Administration
            </span>
            <span className="text-xs font-mono text-stone-400">· Dr. Bharat & Reception</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            Rainbow Skin & Hair Clinic Operations
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWalkInModal(true)}
            className="py-2 px-3 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Walk-in Booking</span>
          </button>
          <button
            onClick={handleLogout}
            className="py-2 px-3 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview & KPIs' },
          { id: 'appointments', label: `Appointments (${appointments.length})` },
          { id: 'services', label: `Services & Pricing (${services.length})` },
          { id: 'settings', label: 'Hours & Policies' },
          { id: 'messages', label: `Inquiries (${messages.length})` },
          { id: 'tests', label: 'Automated Tests' },
          { id: 'supabase', label: 'Supabase Cloud DB' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`py-2 px-4 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              adminTab === tab.id
                ? 'border-teal-800 text-teal-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === 'overview' && overviewData && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-stone-200">
              <span className="text-xs text-stone-500 font-medium block">Today's Appointments</span>
              <span className="font-mono text-3xl font-bold text-stone-900 mt-1 block">
                {overviewData.stats.todayCount}
              </span>
              <span className="text-[11px] text-stone-400 mt-1 block">Scheduled for today</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-stone-200">
              <span className="text-xs text-stone-500 font-medium block">Active Bookings</span>
              <span className="font-mono text-3xl font-bold text-teal-800 mt-1 block">
                {overviewData.stats.activeCount}
              </span>
              <span className="text-[11px] text-stone-400 mt-1 block">Confirmed / pending</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-stone-200">
              <span className="text-xs text-stone-500 font-medium block">Est. Revenue</span>
              <span className="font-mono text-3xl font-bold text-stone-900 mt-1 block">
                ₹{overviewData.stats.estimatedRevenueINR.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-stone-400 mt-1 block">Confirmed & completed</span>
            </div>

            <div className="bg-white p-5 rounded-lg border border-stone-200">
              <span className="text-xs text-stone-500 font-medium block">Cancellation Rate</span>
              <span className="font-mono text-3xl font-bold text-stone-900 mt-1 block">
                {overviewData.stats.cancellationRatePercent}%
              </span>
              <span className="text-[11px] text-stone-400 mt-1 block">
                {overviewData.stats.cancelledCount} total cancelled
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Today's Patient Schedule
              </h3>
              <span className="text-xs text-stone-500 font-mono">
                {new Date().toISOString().split('T')[0]}
              </span>
            </div>

            {overviewData.todayAppointments.length === 0 ? (
              <p className="text-xs text-stone-500 py-4">No appointments booked for today yet.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {overviewData.todayAppointments.map((apt: Appointment) => (
                  <div key={apt.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-stone-900 flex items-center gap-2">
                        <span className="font-mono text-teal-800">{apt.startTime}</span>
                        <span>·</span>
                        <span>{apt.customerName}</span>
                        <span className="text-stone-400 font-normal">({apt.customerPhone})</span>
                      </div>
                      <div className="text-stone-500">
                        {apt.serviceName} · {apt.staffName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">₹{apt.priceINR}</span>
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(apt.id, 'completed')}
                          className="py-1 px-2.5 bg-teal-50 text-teal-800 rounded font-semibold text-[11px] hover:bg-teal-100"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-stone-200">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search patient, phone, ref, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-stone-300 rounded text-xs text-stone-900 min-w-[240px]"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-stone-300 rounded text-xs text-stone-900 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No-Show</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 border border-stone-300 rounded text-xs text-stone-900 font-mono bg-white"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs text-stone-500 hover:text-stone-900 underline"
                >
                  Clear Date
                </button>
              )}
            </div>

            <button
              onClick={exportCSV}
              className="py-1.5 px-3 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase font-semibold text-stone-500 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Procedure</th>
                  <th className="py-3 px-4">Specialist</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-normal">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-500">
                      No appointments matching the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                        {apt.reference}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div>{apt.date}</div>
                        <div className="text-stone-500">{apt.startTime} ({apt.durationMinutes}m)</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{apt.customerName}</div>
                        <div className="text-stone-500 font-mono">{apt.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[180px] truncate" title={apt.serviceName}>
                        {apt.serviceName}
                      </td>
                      <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                        {apt.staffName.replace('Dr. ', '')}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-stone-900 whitespace-nowrap">
                        ₹{apt.priceINR.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          apt.status === 'confirmed' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          apt.status === 'completed' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          apt.status === 'cancelled' ? 'bg-stone-100 text-stone-600' :
                          'bg-amber-50 text-amber-800'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(apt.id, 'completed')}
                                className="py-1 px-2 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded"
                                title="Mark Completed"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(apt.id, 'cancelled', 'Cancelled by Clinic Admin')}
                                className="py-1 px-2 text-[11px] text-rose-800 bg-rose-50 hover:bg-rose-100 rounded"
                                title="Cancel"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                              className="py-1 px-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-stone-100">
              {services.map((srv) => (
                <div key={srv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 text-sm">{srv.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${srv.active ? 'bg-teal-50 text-teal-800' : 'bg-stone-100 text-stone-400'}`}>
                        {srv.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-stone-500 line-clamp-1">{srv.description}</p>
                    <div className="text-[11px] text-stone-400 font-mono">
                      Category: {srv.categoryName} · Ideal For: {srv.idealFor.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right font-mono">
                      <div className="font-bold text-stone-900 text-sm">₹{srv.priceINR}</div>
                      <div className="text-stone-500 text-[11px]">{srv.durationMinutes} mins</div>
                    </div>
                    <button
                      onClick={() => setEditingService({ ...srv })}
                      className="py-1.5 px-3 border border-stone-300 hover:bg-stone-100 rounded text-stone-700 font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminTab === 'settings' && settings && (
        <div className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-6 max-w-2xl">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Clinic Operating Policies & Working Hours
          </h3>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Clinic Name</label>
                <input
                  type="text"
                  disabled
                  value={settings.name}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-stone-50 text-stone-700"
                />
              </div>
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Timezone</label>
                <input
                  type="text"
                  disabled
                  value={settings.timezone}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-stone-50 text-stone-700 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Buffer Between Slots (Mins)</label>
                <input
                  type="number"
                  value={settings.bufferMinutes}
                  onChange={(e) => setSettings({ ...settings, bufferMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 font-mono"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">Time for sanitizing rooms</span>
              </div>
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Cancellation Notice Required (Hours)</label>
                <input
                  type="number"
                  value={settings.cancellationNoticeHours}
                  onChange={(e) => setSettings({ ...settings, cancellationNoticeHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 font-mono"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">Notice window before fee applies</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="font-semibold text-stone-800 block mb-2">Weekly Schedule:</span>
              <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Mon – Sat:</span>
                  <span className="font-mono font-semibold">10:00 AM – 8:00 PM (Lunch: 1:30 PM – 2:30 PM)</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-mono font-semibold">10:00 AM – 2:00 PM (Half-Day)</span>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await api.updateSettings(token, settings);
                alert('Clinic settings updated.');
              }}
              className="py-2 px-5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded"
            >
              Save Clinic Policies
            </button>
          </div>
        </div>
      )}

      {adminTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100">
            {messages.length === 0 ? (
              <p className="text-xs text-stone-500 p-6 text-center">No inquiry messages received yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900 text-sm">{m.name}</span>
                    <span className="text-stone-400 font-mono">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-stone-500 font-mono">
                    Phone: {m.phone} · Email: {m.email}
                  </div>
                  <div className="font-medium text-stone-800">Subject: {m.subject}</div>
                  <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded border border-stone-100">
                    {m.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {adminTab === 'tests' && (
        <div className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Automated Booking Engine & Concurrency Verification
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Executes live verification tests: Slot generation, atomic conflict prevention (double booking), sanitization buffer time, and cancellation policy.
              </p>
            </div>

            <button
              disabled={testRunning}
              onClick={handleRunTests}
              className="py-2.5 px-5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{testRunning ? 'Executing Test Suite...' : 'Run Automated Tests'}</span>
            </button>
          </div>

          {testResults ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-md border text-xs flex items-center justify-between ${
                testResults.allPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-2">
                  {testResults.allPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span className="font-semibold text-sm">
                    {testResults.allPassed ? 'All 4 Automated Tests Passed Successfully' : 'Some Tests Failed'}
                  </span>
                </div>
                <span className="font-mono text-stone-500">
                  {new Date(testResults.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="space-y-3">
                {testResults.results.map((r, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded border border-stone-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {r.passed ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                        )}
                        <span className="font-semibold text-stone-900">{r.name}</span>
                      </div>
                      <span className="font-mono text-stone-400">{r.durationMs}ms</span>
                    </div>
                    <p className="text-stone-600 pl-4">{r.details}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-stone-500 text-xs">
              Click "Run Automated Tests" to execute the test suite against the live booking engine.
            </div>
          )}
        </div>
      )}

      {adminTab === 'supabase' && (
        <div className="bg-white border border-stone-200 rounded-lg p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Supabase Cloud Database Connection
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Connected
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Every newly created, rescheduled, or cancelled appointment automatically syncs to your Supabase PostgreSQL database.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={syncingSupabase}
                onClick={async () => {
                  try {
                    setSyncingSupabase(true);
                    setSyncMessage(null);
                    const res = await api.syncAllToSupabase(token);
                    if (res.errors.length > 0) {
                      setSyncMessage(`Synced ${res.synced} items, failed: ${res.errors.join(', ')}`);
                    } else {
                      setSyncMessage(`Successfully synced all ${res.synced} appointments to Supabase!`);
                    }
                  } catch (e: any) {
                    setSyncMessage(`Sync error: ${e.message}`);
                  } finally {
                    setSyncingSupabase(false);
                  }
                }}
                className="py-2 px-4 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors disabled:opacity-50"
              >
                {syncingSupabase ? 'Syncing...' : 'Sync All Local Bookings to Supabase'}
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded">
              {syncMessage}
            </div>
          )}

          {/* Connection Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-500 block mb-1">Supabase Project ID</span>
              <span className="font-mono font-bold text-stone-900 text-sm">ygugxkvtftqhymrxgtgo</span>
            </div>
            <div className="p-4 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-500 block mb-1">REST API Endpoint</span>
              <span className="font-mono font-medium text-stone-900 truncate block" title="https://ygugxkvtftqhymrxgtgo.supabase.co">
                https://ygugxkvtftqhymrxgtgo.supabase.co
              </span>
            </div>
            <div className="p-4 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-500 block mb-1">Appointments Table Status</span>
              {supabaseStatus?.tableExists ? (
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Table 'appointments' Active
                </span>
              ) : (
                <span className="font-semibold text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Table Setup Needed in Supabase
                </span>
              )}
            </div>
          </div>

          {/* Table Setup Guide & SQL Box */}
          <div className="border border-stone-200 rounded-lg p-5 space-y-4 bg-stone-50/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Supabase SQL Schema
                </h4>
                <p className="text-[11px] text-stone-500">
                  Run this in your Supabase SQL Editor to create the <code>appointments</code> and <code>contact_messages</code> tables with Row Level Security:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://supabase.com/dashboard/project/ygugxkvtftqhymrxgtgo/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 px-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200"
                >
                  Open Supabase SQL Editor ↗
                </a>
                <button
                  onClick={() => {
                    const sql = `CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_inr NUMERIC NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert appointments" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public select appointments" ON public.appointments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public update appointments" ON public.appointments FOR UPDATE TO anon, authenticated USING (true);`;
                    navigator.clipboard.writeText(sql);
                    setCopiedSQL(true);
                    setTimeout(() => setCopiedSQL(false), 3000);
                  }}
                  className="py-1 px-3 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 rounded border border-stone-300"
                >
                  {copiedSQL ? 'Copied to Clipboard!' : 'Copy SQL Schema'}
                </button>
              </div>
            </div>

            <pre className="p-3 bg-stone-900 text-stone-200 font-mono text-[11px] rounded overflow-x-auto max-h-56">
{`CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_inr NUMERIC NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert appointments" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public select appointments" ON public.appointments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public update appointments" ON public.appointments FOR UPDATE TO anon, authenticated USING (true);`}
            </pre>
          </div>
        </div>
      )}

      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-stone-200 max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">Record Walk-in Patient</h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-stone-400 hover:text-stone-700">×</button>
            </div>

            {walkInError && (
              <div className="p-3 bg-rose-50 text-rose-900 text-xs rounded border border-rose-200">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleCreateWalkIn} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Select Procedure</label>
                <select
                  value={walkInServiceId}
                  onChange={(e) => setWalkInServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.priceINR} · {s.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={walkInDate}
                    onChange={(e) => setWalkInDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Time (24h)</label>
                  <input
                    type="text"
                    required
                    placeholder="11:00"
                    value={walkInTime}
                    onChange={(e) => setWalkInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="py-1.5 px-3 text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 text-white bg-teal-800 hover:bg-teal-900 rounded font-semibold"
                >
                  Confirm Walk-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingService && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-stone-200 max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">Edit Procedure</h3>
              <button onClick={() => setEditingService(null)} className="text-stone-400 hover:text-stone-700">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Procedure Name</label>
                <input
                  type="text"
                  disabled
                  value={editingService.name}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-stone-50 text-stone-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editingService.priceINR}
                    onChange={(e) => setEditingService({ ...editingService, priceINR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={editingService.active}
                    onChange={(e) => setEditingService({ ...editingService, active: e.target.checked })}
                    className="rounded text-teal-700"
                  />
                  <span className="font-semibold text-stone-800">Active & available for public booking</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="py-1.5 px-3 text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveServiceEdit}
                  className="py-2 px-5 text-white bg-teal-800 hover:bg-teal-900 rounded font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
