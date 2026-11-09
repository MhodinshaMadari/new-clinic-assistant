import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { FestivalProvider } from './context/FestivalContext';
import { FestivalGraphicOverlay } from './components/FestivalGraphicOverlay';
import { FestivalPageFrame } from './components/FestivalHeaderDecor';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { UserProfilePage } from './components/UserProfilePage';
import { DeveloperPortal } from './components/DeveloperPortal';
import { ClinicSetupPage } from './components/ClinicSetupPage';
import { ClinicPortfolioFallback } from './components/ClinicPortfolioFallback';
import { Chatbot } from './components/Chatbot';
import { RevonLogo } from './components/RevonLogo';
import { APP_NAME } from './config/appConfig';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, addDoc } from 'firebase/firestore';
import { Sparkles, RefreshCw, ShieldAlert, Ban, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Database seeder helper to pre-populate dentists and reviews if Firestore is clean
async function seedDatabaseIfNeeded() {
  try {
    const seededFlag = localStorage.getItem('revon_dental_db_seeded_v3');
    if (seededFlag) return;

    console.log("Starting Revon Advance Dental Care Firestore seeding...");

    // 1. Seed Dentists
    const dentistsToSeed = [
      {
        uid: 'dentist-dr-tohid',
        displayName: 'Dr. Mohammad Tohid Kaginalli',
        email: 'tohid.kaginalli@revondental.in',
        role: 'dentist',
        phone: '+91 98765 43210',
        createdAt: new Date().toISOString()
      },
      {
        uid: 'dentist-dr-ananya',
        displayName: 'Dr. Ananya Rao',
        email: 'ananya.rao@revondental.in',
        role: 'dentist',
        phone: '+91 98765 43211',
        createdAt: new Date().toISOString()
      },
      {
        uid: 'dentist-dr-rajesh',
        displayName: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@revondental.in',
        role: 'dentist',
        phone: '+91 98765 43212',
        createdAt: new Date().toISOString()
      }
    ];

    for (const d of dentistsToSeed) {
      await setDoc(doc(db, 'users', d.uid), d);
    }

    // 2. Seed Reviews
    const reviewsToSeed = [
      {
        patientName: 'Aarav Sharma',
        rating: 5,
        comment: 'Absolutely amazing! Dr. Mohammad Tohid Kaginalli made me feel so comfortable during my wisdom tooth removal. The pain-free technology is real!',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        patientName: 'Priya Patel',
        rating: 5,
        comment: 'The whitening service is stellar! My teeth look beautiful and natural. The staff are polite, and the clinic is incredibly clean.',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        patientName: 'Vikram Singh',
        rating: 5,
        comment: 'Highly recommend this clinic. The scheduling system was smooth, real-time tracking showed my spot, and I received automated email reminders!',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      }
    ];

    for (const r of reviewsToSeed) {
      await addDoc(collection(db, 'reviews'), r);
    }

    // 3. Seed some dummy appointments to show in the Dentist panel
    const sampleAppointments = [
      {
        patientId: 'patient-dummy-rahul',
        patientName: 'Rahul Verma',
        patientEmail: 'rahul.verma@gmail.com',
        patientPhone: '+91 91234 56789',
        dentistId: 'dentist-dr-tohid',
        dentistName: 'Dr. Mohammad Tohid Kaginalli',
        dateTime: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0] + 'T10:00:00',
        status: 'pending',
        treatment: 'General Consultation & Clean',
        notes: 'Has mild bleeding in the upper gums. Prefers morning appointments.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        patientId: 'patient-dummy-anika',
        patientName: 'Anika Sen',
        patientEmail: 'anika.sen@gmail.com',
        patientPhone: '+91 98765 12345',
        dentistId: 'dentist-dr-ananya',
        dentistName: 'Dr. Ananya Rao',
        dateTime: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0] + 'T14:00:00',
        status: 'confirmed',
        treatment: 'Teeth Whitening',
        notes: 'Needs bright white shade alignment for media press event.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const app of sampleAppointments) {
      await addDoc(collection(db, 'appointments'), app);
    }

    localStorage.setItem('revon_dental_db_seeded_v3', 'true');
    console.log("Revon Advance Dental Care database seeding complete.");
  } catch (err) {
    console.warn("Seeding bypassed or failed (expected if permissions are tight):", err);
  }
}

function MainApp() {
  const { user, userProfile, loading } = useAuth();
  const { activeClinic, selectClinicBySlug, toggleClinicStatus } = useClinic();
  const [currentView, setCurrentView] = useState('portfolio');

  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin || userProfile?.role === 'super-admin');
  const isClinicDisabled = activeClinic && (activeClinic.status === 'disabled' || activeClinic.isDisabled === true);

  useEffect(() => {
    // Seed initial data asynchronously on load
    seedDatabaseIfNeeded();
  }, []);

  // Parse URL on load to pick clinic and view (e.g. /revon-dental/portfolio, /smilecare/dashboard, /dev-portal)
  useEffect(() => {
    const parseUrlRoute = () => {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);

      if (parts.length === 0) {
        setCurrentView('clinic-search');
        return;
      }

      const first = parts[0];
      if (first === 'dev-portal') {
        setCurrentView('dev-portal');
        return;
      }

      if (first === 'clinic-search') {
        setCurrentView('clinic-search');
        return;
      }

      if (first === 'login' || first === 'register' || first === 'forgot-password' || first === 'profile') {
        setCurrentView(first);
        return;
      }

      // First part is clinic slug
      const clinicSlug = first;
      selectClinicBySlug(clinicSlug);

      if (parts.length > 1) {
        const subView = parts[1];
        if (subView === 'setup') setCurrentView('setup');
        else if (subView === 'dashboard') setCurrentView('dashboard');
        else if (subView === 'admin') setCurrentView('admin');
        else if (subView === 'reviews' || subView === 'patient-reviews') setCurrentView('reviews');
        else if (subView === 'finances' || subView === 'expenses' || subView === 'finances-expenses') setCurrentView('finances');
        else if (subView === 'billing' || subView === 'patients' || subView === 'reminders' || subView === 'support') setCurrentView(subView);
        else setCurrentView('portfolio');
      } else {
        setCurrentView('portfolio');
      }
    };

    parseUrlRoute();
    window.addEventListener('popstate', parseUrlRoute);
    return () => window.removeEventListener('popstate', parseUrlRoute);
  }, []);

  // Whenever userProfile changes (e.g., after logging in) or currentView changes
  useEffect(() => {
    if (userProfile) {
      // Security check: patients cannot access finances, reviews, or admin views
      if (userProfile.role === 'patient' && (currentView === 'finances' || currentView === 'reviews' || currentView === 'admin')) {
        const targetSlug = userProfile.clinicSlug || activeClinic?.slug || 'revon-dental';
        setCurrentView('dashboard');
        const newPath = `/${targetSlug}/dashboard`;
        if (window.location.pathname !== newPath) {
          window.history.replaceState({}, '', newPath);
        }
        return;
      }

      const isSuper = Boolean(userProfile.isSuperAdmin || userProfile.role === 'super-admin');

      if (!isSuper && userProfile.clinicSlug) {
        // Non-super-admin: Always enforce registered clinic selection upon login
        selectClinicBySlug(userProfile.clinicSlug);

        if (currentView === 'login' || currentView === 'register' || currentView === 'forgot-password') {
          setCurrentView('dashboard');
          const newPath = `/${userProfile.clinicSlug}/dashboard`;
          if (window.location.pathname !== newPath) {
            window.history.replaceState({}, '', newPath);
          }
        }
      } else if (isSuper) {
        // Super admin: Redirect auth screens to dashboard
        if (currentView === 'login' || currentView === 'register' || currentView === 'forgot-password') {
          setCurrentView('dashboard');
          const targetSlug = activeClinic?.slug || userProfile?.clinicSlug || 'revon-dental';
          const newPath = `/${targetSlug}/dashboard`;
          if (window.location.pathname !== newPath) {
            window.history.replaceState({}, '', newPath);
          }
        }
      }
    }
  }, [userProfile?.uid, userProfile?.clinicSlug, userProfile?.role, currentView, activeClinic?.slug]);

  const handleNavigate = (view: string, clinicSlug?: string) => {
    const targetSlug = clinicSlug || activeClinic?.slug || userProfile?.clinicSlug || 'revon-dental';
    selectClinicBySlug(targetSlug);

    // Security check: patients cannot navigate to finances, reviews, or admin
    let resolvedView = view;
    if (userProfile?.role === 'patient' && (view === 'finances' || view === 'reviews' || view === 'admin')) {
      resolvedView = 'dashboard';
    }
    setCurrentView(resolvedView);

    let newPath = `/${targetSlug}`;
    if (resolvedView === 'clinic-search') {
      newPath = '/';
    } else if (resolvedView === 'dev-portal') {
      newPath = '/dev-portal';
    } else if (resolvedView === 'login' || resolvedView === 'register' || resolvedView === 'forgot-password' || resolvedView === 'profile') {
      newPath = `/${resolvedView}`;
    } else if (resolvedView !== 'portfolio') {
      newPath = `/${targetSlug}/${resolvedView}`;
    }

    window.history.pushState({}, '', newPath);
  };

  if (loading) {
    const displayTitle = activeClinic?.name || APP_NAME;
    return (
      <div id="app-loading-screen" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 space-y-5">
        <div className="relative flex items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500 to-revon-blue opacity-30 blur-sm animate-pulse" />
          <RevonLogo size={64} customSrc={activeClinic?.logoUrl} />
        </div>
        
        <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200/80 dark:border-teal-800/40">
          <RefreshCw className="h-4 w-4 animate-spin text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">Loading Workspace</span>
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-xl font-display tracking-tight">{displayTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Initializing clinic records & patient portal credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      <FestivalPageFrame />
      <Navbar onNavigate={handleNavigate} currentView={currentView} />
      
      {/* Super Admin Top Notice Banner when viewing a disabled clinic */}
      {isClinicDisabled && isSuperAdmin && currentView !== 'dev-portal' && currentView !== 'clinic-search' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 font-bold text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md z-40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-950 shrink-0 animate-bounce" />
            <span>SUPER ADMIN NOTICE: Clinic "{activeClinic.name}" (/{activeClinic.slug}) is currently DISABLED for non-super-admin users.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                await toggleClinicStatus(activeClinic.id, false);
              }}
              className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-900 font-extrabold text-[11px] rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              Enable Clinic Now
            </button>
            <button
              onClick={() => handleNavigate('dev-portal')}
              className="px-3 py-1 bg-slate-900/20 hover:bg-slate-900/30 text-slate-950 font-extrabold text-[11px] rounded-lg cursor-pointer transition-colors"
            >
              Dev Portal
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeClinic?.slug}-${currentView}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            {/* If clinic is disabled and user is NOT a super admin, block access */}
            {isClinicDisabled && !isSuperAdmin && currentView !== 'dev-portal' && currentView !== 'clinic-search' ? (
              <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-300 dark:border-rose-900/60 text-center space-y-6">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Ban className="h-8 w-8" />
                </div>
                
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-xs rounded-full uppercase tracking-wider border border-rose-200 dark:border-rose-800 inline-block">
                    Clinic Access Suspended
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeClinic.name}
                  </h2>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-mono font-bold">
                    URI: /{activeClinic.slug}
                  </p>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                  Access to this clinic is currently inactive or suspended by the Super Administrator. Online bookings, patient portals, and clinic operational services are temporarily disabled for this clinic.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleNavigate('clinic-search')}
                    className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Browse Active Clinics Directory
                  </button>
                </div>
              </div>
            ) : (
              <>
                {currentView === 'clinic-search' && <ClinicPortfolioFallback onNavigate={handleNavigate} />}
                {currentView === 'portfolio' && <LandingPage onNavigate={handleNavigate} />}
                {(['dashboard', 'admin', 'finances', 'reviews', 'billing', 'patients', 'reminders', 'support'].includes(currentView)) && (
                  user ? (
                    <Dashboard
                      key="persistent-clinic-dashboard"
                      initialTab={
                        currentView === 'dashboard' || (userProfile?.role === 'patient' && ['finances', 'reviews', 'admin'].includes(currentView))
                          ? undefined
                          : currentView
                      }
                      onNavigate={handleNavigate}
                    />
                  ) : (
                    currentView === 'reviews' ? (
                      <LandingPage onNavigate={handleNavigate} initialSection="testimonials" />
                    ) : (
                      <Login onNavigate={handleNavigate} />
                    )
                  )
                )}
                {currentView === 'login' && <Login onNavigate={handleNavigate} />}
                {currentView === 'register' && <Register onNavigate={handleNavigate} />}
                {currentView === 'forgot-password' && <ForgotPassword onNavigate={handleNavigate} />}
                {currentView === 'profile' && (user ? <UserProfilePage /> : <Login onNavigate={handleNavigate} />)}
                {currentView === 'dev-portal' && (
                  isSuperAdmin ? (
                    <DeveloperPortal onNavigateToClinic={(slug, sub) => handleNavigate(sub || 'portfolio', slug)} />
                  ) : (
                    <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl text-center space-y-4 border border-slate-200 dark:border-slate-700">
                      <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert className="h-7 w-7" />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Super Admin Access Only</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Developer Portal is restricted to the Application Development Team super admins.
                      </p>
                      <button 
                        onClick={() => handleNavigate(user ? 'dashboard' : 'portfolio')}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                      >
                        Return to Main View
                      </button>
                    </div>
                  )
                )}
                {currentView === 'setup' && (
                  isSuperAdmin ? (
                    <ClinicSetupPage
                      clinicSlug={activeClinic?.slug || 'revon-dental'}
                      onNavigateBack={() => handleNavigate('dev-portal')}
                      onNavigateToClinicView={(slug, v) => handleNavigate(v, slug)}
                    />
                  ) : (
                    <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl text-center space-y-4 border border-slate-200 dark:border-slate-700">
                      <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert className="h-7 w-7" />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Super Admin Access Only</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Clinic Setup is restricted to the Application Development Team super admins.
                      </p>
                      <button 
                        onClick={() => handleNavigate(user ? 'dashboard' : 'portfolio')}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                      >
                        Return to Main View
                      </button>
                    </div>
                  )
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Chatbot />
      <FestivalGraphicOverlay />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ClinicProvider>
          <FestivalProvider>
            <MainApp />
          </FestivalProvider>
        </ClinicProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
