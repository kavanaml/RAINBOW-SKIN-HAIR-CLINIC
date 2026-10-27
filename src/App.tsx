import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ManageBookingPage } from './pages/ManageBookingPage';
import { AdminPage } from './pages/AdminPage';
import { BookingFlow } from './components/BookingFlow';
import { X, CalendarCheck, Clock, MapPin } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(
    () => !!localStorage.getItem('clinic_admin_token')
  );

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleOpenBooking = (serviceId?: string) => {
    if (serviceId) {
      setPreselectedServiceId(serviceId);
    }
    setBookingModalOpen(true);
  };

  const handleCloseBooking = () => {
    setBookingModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-teal-800 selection:text-white">
      
      {/* Top Banner (Quiet clinic trust indicator) */}
      <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Rainbow Skin & Hair Clinic</span>
            <span aria-hidden="true">·</span>
            <span>Kuvempu Road, Sharavathi Nagar, Shivamogga</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span className="font-mono">Mon–Sat: 10am–8pm · Sun: 10am–2pm</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <a href="tel:+918951985418" className="hover:text-white font-mono transition-colors">
              +91 89519 85418
            </a>
          </div>
        </div>
      </div>

      {/* Main Top Navigation conforming to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => {
          if (tab === 'book') {
            handleOpenBooking();
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenBooking={() => handleOpenBooking()}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectServiceAndBook={(serviceId) => handleOpenBooking(serviceId)}
          />
        )}

        {activeTab === 'services' && (
          <ServicesPage
            onSelectServiceAndBook={(serviceId) => handleOpenBooking(serviceId)}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {activeTab === 'contact' && (
          <ContactPage />
        )}

        {activeTab === 'manage' && (
          <ManageBookingPage />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            onLoginStateChange={(loggedIn) => setIsAdminLoggedIn(loggedIn)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Full-Screen Booking Flow Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-stone-50 rounded-xl border border-stone-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
            
            {/* Modal Header Bar */}
            <div className="sticky top-0 z-20 bg-stone-50/95 backdrop-blur-md px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-serif font-bold text-lg text-stone-900 block">
                  Book an Appointment
                </span>
                <span className="text-xs text-stone-500">
                  Rainbow Skin & Hair Clinic · Shivamogga
                </span>
              </div>

              <button
                onClick={handleCloseBooking}
                className="p-2 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-200 transition-colors"
                aria-label="Close booking modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Flow Core */}
            <div className="p-2 sm:p-6">
              <BookingFlow
                initialServiceId={preselectedServiceId}
                onClose={handleCloseBooking}
                onNavigateToManage={() => {
                  handleCloseBooking();
                  setActiveTab('manage');
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
