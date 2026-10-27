import React, { useState } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenBooking: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onOpenBooking,
  isAdminLoggedIn
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About Doctors' },
    { id: 'contact', label: 'Contact' },
    { id: 'manage', label: 'Manage Booking' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Brand Wordmark (Single text element wordmark in display face) */}
          <button
            onClick={() => handleLinkClick('home')}
            className="text-xl md:text-2xl font-serif font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 hover:text-teal-800 transition-colors text-left"
          >
            Rainbow Skin & Hair Clinic
          </button>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-stone-900 font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Quiet Admin portal link */}
            <button
              onClick={() => handleLinkClick('admin')}
              className={`flex items-center gap-1.5 py-1 text-xs uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'admin' 
                  ? 'text-teal-800 font-semibold' 
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Admin Panel' : 'Staff Login'}</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenBooking}
              className="py-2.5 px-5 text-sm font-semibold text-white bg-teal-800 rounded-md hover:bg-teal-900 shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-[0.98] cursor-pointer"
            >
              Book an Appointment
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-950 rounded-md hover:bg-stone-200/60"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-stone-50 px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`text-left px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  activeTab === link.id
                    ? 'bg-stone-200/80 text-stone-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleLinkClick('admin')}
              className="text-left px-3 py-2 text-sm text-stone-500 hover:text-stone-900 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAdminLoggedIn ? 'Admin Dashboard' : 'Staff Login'}</span>
            </button>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 px-4 text-center text-sm font-semibold text-white bg-teal-800 rounded-md hover:bg-teal-900 shadow-sm active:scale-[0.98]"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
