import React, { useState, useEffect } from 'react';
import { Search, Clock, Check, ArrowRight, Info, ShieldCheck, Sparkles } from 'lucide-react';
import type { ServiceItem, StaffMember } from '../types';
import { api } from '../lib/api';

interface ServicesPageProps {
  onSelectServiceAndBook: (serviceId: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onSelectServiceAndBook }) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalService, setActiveModalService] = useState<ServiceItem | null>(null);

  useEffect(() => {
    async function fetchServicesData() {
      try {
        setLoading(true);
        const [servicesRes, staffRes] = await Promise.all([
          api.getServices(),
          api.getStaff()
        ]);
        setServices(servicesRes);
        setStaff(staffRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load services catalog');
      } finally {
        setLoading(false);
      }
    }
    fetchServicesData();
  }, []);

  const categories = [
    { id: 'all', label: 'All Treatments' },
    { id: 'hair', label: 'Hair & Scalp Care' },
    { id: 'medi-facials', label: 'Medi-Facials & Glow' },
    { id: 'dermatology', label: 'Clinical Dermatology' },
    { id: 'lasers-anti-aging', label: 'Lasers & Scar Revision' }
  ];

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      service.name.toLowerCase().includes(q) || 
      service.description.toLowerCase().includes(q) ||
      service.idealFor.some(tag => tag.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const getDoctorForService = (serviceId: string) => {
    const qualified = staff.filter(doc => doc.supportedServiceIds.includes(serviceId));
    if (qualified.length === staff.length) {
      return 'Dr. Bharat Bangera & Dr. Trupti';
    }
    return qualified.map(d => d.name).join(', ') || 'Assigned Specialist';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal-800">
          Medical Catalog & Pricing
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
          Clinical Treatments & Diagnostic Care
        </h1>
        <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
          Explore all dermatology, trichology, and aesthetic procedures offered at Rainbow Skin & Hair Clinic. All prices are verified in Indian Rupees (₹) with transparent durations and no hidden consultation charges.
        </p>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search treatments or concerns (e.g. acne, PRP, pores)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 bg-white"
          />
        </div>
      </div>

      {/* Services List Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500">Loading verified clinic procedures...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900 text-center">
          {error}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-16 text-center bg-white border border-stone-200 rounded-lg p-8">
          <p className="font-semibold text-stone-800">No matching treatments found</p>
          <p className="text-xs text-stone-500 mt-1">
            Try adjusting your search query or selecting "All Treatments".
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50 rounded hover:bg-teal-100"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const doctorName = getDoctorForService(service.id);
            return (
              <div
                key={service.id}
                className="bg-white border border-stone-200 rounded-lg p-6 flex flex-col justify-between hover:border-stone-300 hover:shadow-xs transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-teal-800">
                      {service.categoryName}
                    </span>
                    <span className="font-mono text-base font-bold text-stone-900 shrink-0">
                      ₹{service.priceINR.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-stone-900 mt-1">
                    {service.name}
                  </h3>

                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{service.durationMinutes} minutes</span>
                    </span>
                    <span className="text-[11px] text-stone-600 truncate max-w-[150px]">
                      {doctorName}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500">
                    <span className="font-medium text-stone-700">Target Concerns: </span>
                    <span>{service.idealFor.join(' · ')}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectServiceAndBook(service.id)}
                      className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded transition-colors text-center cursor-pointer"
                    >
                      Book This Service
                    </button>
                    <button
                      onClick={() => setActiveModalService(service)}
                      className="p-2 text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                      title="View Clinical Protocols"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clinical Protocol Detail Modal */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-stone-200 max-w-lg w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-800 font-medium">
                  {activeModalService.categoryName}
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                  {activeModalService.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalService(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>
                <strong className="text-stone-900 block mb-1">Clinical Overview:</strong>
                {activeModalService.description}
              </p>

              <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1">
                <span className="font-semibold text-stone-800 block">Procedure Parameters:</span>
                <div>Duration: <strong className="text-stone-900">{activeModalService.durationMinutes} minutes</strong></div>
                <div>Cost: <strong className="text-teal-900">₹{activeModalService.priceINR.toLocaleString('en-IN')}</strong> (Payable at clinic reception)</div>
                <div>Physician Oversight: <strong>{getDoctorForService(activeModalService.id)}</strong></div>
              </div>

              <div>
                <strong className="text-stone-900 block mb-1">Recommended Candidates:</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-stone-700">
                  {activeModalService.idealFor.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong className="text-stone-900 block mb-1">Patient Pre-Procedure Protocol:</strong>
                <p>
                  Avoid active retinoid/glycolic acid creams 48 hours prior. For scalp procedures (PRP/microneedling), wash scalp with a mild shampoo on the morning of your visit.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                onClick={() => setActiveModalService(null)}
                className="py-2 px-4 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const sId = activeModalService.id;
                  setActiveModalService(null);
                  onSelectServiceAndBook(sId);
                }}
                className="py-2 px-5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded"
              >
                Proceed to Book
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
