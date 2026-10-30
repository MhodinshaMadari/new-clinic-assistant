import React from 'react';
import { APP_NAME } from '../config/appConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useClinic } from '../context/ClinicContext';
import { LogIn, LogOut, User, Calendar, Menu, X, LayoutDashboard, Bell, Check, CheckCheck, Sun, Moon, Building2, ChevronDown, Sliders, ShieldCheck, Search, PartyPopper, Activity, TrendingUp, Star, Youtube } from 'lucide-react';
import { RevonLogo } from './RevonLogo';
import { FestivalDecorModal } from './FestivalDecorModal';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ClinicNotification } from '../types';

interface NavbarProps {
  onNavigate: (view: string, clinicSlug?: string) => void;
  currentView: string;
}

export function Navbar({ onNavigate, currentView }: NavbarProps) {
  const { user, userProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { clinics, activeClinic, selectClinicBySlug } = useClinic();
  
  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin || userProfile?.role === 'super-admin');
  const isAdmin = Boolean(userProfile?.role === 'admin' || isSuperAdmin);
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [showClinicDropdown, setShowClinicDropdown] = React.useState(false);
  const [showFestivalModal, setShowFestivalModal] = React.useState(false);

  // Notifications state
  const [notifications, setNotifications] = React.useState<ClinicNotification[]>([]);
  const [readIds, setReadIds] = React.useState<string[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [latestToast, setLatestToast] = React.useState<ClinicNotification | null>(null);
  const isInitialMount = React.useRef(true);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const clinicDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (clinicDropdownRef.current && !clinicDropdownRef.current.contains(event.target as Node)) {
        setShowClinicDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch read list from local storage
  React.useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`read_notifications_${user.uid}`);
      if (stored) {
        try {
          setReadIds(JSON.parse(stored));
        } catch (e) {
          setReadIds([]);
        }
      } else {
        setReadIds([]);
      }
    } else {
      setReadIds([]);
    }
  }, [user]);

  // Real-time subscription to clinic announcements/notifications scoped strictly to active clinic
  React.useEffect(() => {
    if (!user) return;

    const currentSlug = activeClinic?.slug || 'revon-dental';

    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ClinicNotification[] = [];
      let newlyAdded: ClinicNotification | null = null;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = { id: change.doc.id, ...change.doc.data() } as ClinicNotification;
          const itemSlug = data.clinicSlug || 'revon-dental';
          if (itemSlug === currentSlug) {
            newlyAdded = data;
          }
        }
      });

      snapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as ClinicNotification;
        const itemSlug = item.clinicSlug || 'revon-dental';
        if (itemSlug === currentSlug) {
          list.push(item);
        }
      });

      setNotifications(list);

      // Trigger popup toast only if not initial mount and a new notification arrived for THIS clinic
      if (!isInitialMount.current && newlyAdded) {
        setLatestToast(newlyAdded);
      }
      isInitialMount.current = false;
    }, (err) => {
      console.error("Error fetching navbar notifications:", err);
    });

    return unsub;
  }, [user, activeClinic?.slug]);

  // Derived: top 10 unread notifications
  const unreadNotifications = notifications
    .filter(n => !readIds.includes(n.id))
    .slice(0, 10);

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!user) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(updated));
  };

  const markAllAsRead = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!user) return;
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(updated));
  };

  const handleNav = (view: string) => {
    onNavigate(view);
    setIsOpen(false);
    setShowDropdown(false);
  };

  return (
    <nav id="app-navbar" className="bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <button 
              id="brand-logo-btn"
              onClick={() => handleNav(user ? 'dashboard' : (currentView === 'clinic-search' ? 'clinic-search' : 'portfolio'))}
              className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
            >
              <RevonLogo size={38} customSrc={currentView === 'clinic-search' ? undefined : activeClinic?.logoUrl} />
              <div className="text-left">
                <span className="font-black text-sm sm:text-base text-slate-800 dark:text-slate-100 tracking-tight block hover:text-revon-blue dark:hover:text-revon-teal transition-colors">
                  {currentView === 'clinic-search' ? APP_NAME : (activeClinic?.name || APP_NAME)}
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest block -mt-0.5">
                  {currentView === 'clinic-search' ? 'Clinic Directory' : `/${activeClinic?.slug || 'revon-dental'}`}
                </span>
              </div>
            </button>

            <div className="hidden md:flex items-center space-x-6 ml-4">
              {currentView !== 'clinic-search' && (
                <button
                  id="nav-portfolio-btn"
                  onClick={() => handleNav('portfolio')}
                  className={`text-xs font-bold transition-colors cursor-pointer ${
                    currentView === 'portfolio' 
                      ? 'text-revon-blue dark:text-revon-teal border-b-2 border-revon-teal pb-1' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-revon-blue dark:hover:text-revon-teal'
                  }`}
                >
                  Clinic Portfolio
                </button>
              )}
              {currentView === 'portfolio' && (
                <>
                  <button
                    onClick={() => {
                      const el = document.getElementById('clinic-videos-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <Youtube className="h-3.5 w-3.5 text-red-500" />
                    <span>Videos</span>
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('clinic-reviews-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span>Google Reviews</span>
                  </button>
                </>
              )}
              {user && (
                <button
                  id="nav-dashboard-btn"
                  onClick={() => handleNav('dashboard')}
                  className={`text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    currentView === 'dashboard' 
                      ? 'text-revon-blue dark:text-revon-teal border-b-2 border-revon-teal pb-1' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-revon-blue dark:hover:text-revon-teal'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>Appointments Panel</span>
                </button>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {/* Festival Effects Button for Admin & Super-Admin */}
            {isAdmin && (
              <button
                id="nav-festival-decor-btn"
                onClick={() => setShowFestivalModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold cursor-pointer transition-all"
                title="Configure Festival Decorative Graphic Effects"
              >
                <PartyPopper className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>Festival Decor</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              id="nav-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-400 dark:text-slate-300 hover:text-revon-blue dark:hover:text-revon-teal hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userProfile?.displayName || user.displayName}</div>
                  <div className="text-[10px] text-revon-teal dark:text-teal-400 font-bold uppercase tracking-wider bg-revon-teal/10 dark:bg-revon-teal/20 px-2.5 py-0.5 rounded-full inline-block">
                    {userProfile?.role || 'Patient'}
                  </div>
                </div>
                {/* Notification Badge & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="nav-notifications-bell-btn"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 rounded-full text-slate-400 dark:text-slate-300 hover:text-revon-blue dark:hover:text-revon-teal hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>

                  {showDropdown && (
                    <div id="notifications-dropdown-menu" className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-slideUp">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                          <span>Clinic Notices</span>
                          <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            {unreadNotifications.length} New
                          </span>
                        </span>
                        {unreadNotifications.length > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-bold text-revon-blue dark:text-revon-teal hover:text-opacity-80 flex items-center space-x-1 cursor-pointer"
                          >
                            <CheckCheck className="h-3 w-3" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                        {unreadNotifications.length === 0 ? (
                          <div className="text-center py-8 px-4 space-y-2">
                            <CheckCheck className="h-8 w-8 text-emerald-500 mx-auto" />
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">No unread announcements or clinic notifications.</p>
                            </div>
                          </div>
                        ) : (
                          unreadNotifications.map((n) => (
                            <div
                              key={n.id}
                              className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-2.5 text-left group"
                            >
                              <div className="flex-grow space-y-1">
                                <h5 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">{n.title}</h5>
                                <p className="text-[11px] text-slate-505 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.content}</p>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <button
                                onClick={(e) => markAsRead(n.id, e)}
                                className="p-1 text-slate-300 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors cursor-pointer"
                                title="Mark read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="nav-profile-btn"
                  onClick={() => handleNav('profile')}
                  className="p-2 rounded-full text-slate-400 dark:text-slate-300 hover:text-revon-blue dark:hover:text-revon-teal hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  title="Profile Settings"
                >
                  <User className="h-5 w-5" />
                </button>
                <button
                  id="nav-signout-btn"
                  onClick={signOut}
                  className="flex items-center space-x-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-revon-blue dark:hover:text-revon-teal hover:border-revon-blue dark:hover:border-revon-teal transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  id="nav-login-btn"
                  onClick={() => handleNav('login')}
                  className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-revon-blue dark:hover:text-revon-teal transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => handleNav('register')}
                  className="flex items-center space-x-1 bg-revon-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-revon-blue-hover shadow-md shadow-revon-blue/10 transition-all cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Appointment</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-revon-blue dark:hover:text-revon-teal hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Sub-Header Navigation Bar */}
      {isSuperAdmin && (
        <div id="floating-subheader-navigation" className="bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 py-1 px-2 sm:px-4 lg:px-6 w-full relative z-40">
          <div className="w-full">
            <div className="flex w-full items-center justify-between gap-1 sm:gap-2 p-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/90 rounded-xl shadow-sm">
              
              {/* 1. Switch Clinic Dropdown */}
              <div className="relative flex-1" ref={clinicDropdownRef}>
                <button
                  id="floating-clinic-selector-btn"
                  onClick={() => setShowClinicDropdown(!showClinicDropdown)}
                  className={`w-full flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                    showClinicDropdown 
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 shadow-sm' 
                      : 'bg-slate-100/90 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                  }`}
                  title="Switch Clinic Instance"
                >
                  <Building2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span className="font-bold whitespace-nowrap">Switch Clinic</span>
                  <span className="text-[9px] sm:text-[10px] bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 px-1 py-0.2 rounded font-mono shrink-0 hidden xs:inline-block">
                    {currentView === 'clinic-search' ? 'Directory' : `/${activeClinic?.slug || 'revon-dental'}`}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform shrink-0 ${showClinicDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showClinicDropdown && (
                  <div className="absolute left-0 mt-1 w-72 max-w-[90vw] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden py-1 animate-slideUp">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Select Clinic ({clinics.length})
                      </span>
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                        Active Network
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                      {clinics.map((c) => (
                        <div
                          key={c.id}
                          className={`w-full p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/40 ${
                            c.slug === activeClinic?.slug ? 'bg-teal-50/60 dark:bg-teal-950/40' : ''
                          }`}
                        >
                          <div 
                            className="space-y-0.5 min-w-0 flex-1 cursor-pointer"
                            onClick={() => {
                              selectClinicBySlug(c.slug);
                              setShowClinicDropdown(false);
                              onNavigate(user ? 'dashboard' : 'portfolio', c.slug);
                            }}
                          >
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{c.name}</p>
                            <p className="text-[10px] font-mono text-teal-600 dark:text-teal-400">/{c.slug}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{c.locations?.length || 1} branches</p>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectClinicBySlug(c.slug);
                                setShowClinicDropdown(false);
                                onNavigate('setup', c.slug);
                              }}
                              className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-colors"
                              title="Configure Clinic Setup"
                            >
                              Setup
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectClinicBySlug(c.slug);
                                setShowClinicDropdown(false);
                                onNavigate('portfolio', c.slug);
                              }}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                              title="Visit Clinic"
                            >
                              Visit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-1.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 space-y-1">
                      <button
                        onClick={() => {
                          setShowClinicDropdown(false);
                          onNavigate('clinic-search');
                        }}
                        className="w-full text-center py-1.5 px-2.5 bg-slate-200/80 dark:bg-slate-700 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950 dark:hover:text-teal-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Search className="h-3.5 w-3.5 text-teal-500" />
                        <span>Search Clinics Directory</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowClinicDropdown(false);
                          onNavigate('dev-portal');
                        }}
                        className="w-full text-center py-1.5 px-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Developer Portal (All Clinics)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical Divider */}
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0 hidden sm:block" />

              {/* 2. Developer Portal */}
              <button
                id="floating-nav-dev-portal-btn"
                onClick={() => handleNav('dev-portal')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currentView === 'dev-portal'
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Developer Portal</span>
              </button>

              {/* 3. Clinic Setup */}
              <button
                id="floating-nav-setup-btn"
                onClick={() => handleNav('setup')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currentView === 'setup'
                    ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Sliders className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>Clinic Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isOpen && (
        <div id="mobile-menu" className="md:hidden border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile Theme Toggle */}
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Appearance Theme</span>
              <button
                id="mob-theme-toggle-btn"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-sm transition-colors"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-3.5 w-3.5 text-slate-500" />
                    <span>Night Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Day Mode</span>
                  </>
                )}
              </button>
            </div>

            {!user && currentView !== 'clinic-search' && (
              <button
                id="mob-portfolio-btn"
                onClick={() => handleNav('portfolio')}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-revon-blue dark:hover:text-revon-teal"
              >
                Clinic Portfolio
              </button>
            )}
            {user && (
              <button
                id="mob-dashboard-btn"
                onClick={() => handleNav('dashboard')}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-revon-blue dark:hover:text-revon-teal"
              >
                <Activity className="h-4 w-4 text-revon-blue dark:text-revon-teal" />
                <span>Appointments Panel</span>
              </button>
            )}
            {isSuperAdmin && (
              <div className="px-3 py-2 border-y border-slate-100 dark:border-slate-800 my-2 space-y-1.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 block px-1">
                  Super Admin Navigation
                </span>
                <button
                  id="mob-dev-portal-btn"
                  onClick={() => handleNav('dev-portal')}
                  className="block w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  🛡️ Developer Portal
                </button>
                <button
                  id="mob-clinic-setup-btn"
                  onClick={() => handleNav('setup')}
                  className="block w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                >
                  🎛️ Clinic Setup (/{activeClinic?.slug})
                </button>
              </div>
            )}
            {user && unreadNotifications.length > 0 && (
              <div className="px-3 py-2 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 my-2 space-y-2">
                <div className="flex justify-between items-center pb-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Bell className="h-3.5 w-3.5 text-revon-blue dark:text-revon-teal animate-bounce" />
                    <span>Unread Notices ({unreadNotifications.length})</span>
                  </span>
                  <button onClick={markAllAsRead} className="text-[10px] font-bold text-revon-blue dark:text-revon-teal cursor-pointer">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {unreadNotifications.map(n => (
                    <div key={n.id} className="text-left bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-2">
                      <div className="flex-grow min-w-0">
                        <h6 className="text-xs font-bold text-slate-800 dark:text-white truncate">{n.title}</h6>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">{n.content}</p>
                      </div>
                      <button onClick={(e) => markAsRead(n.id, e)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {user ? (
              <>
                <button
                  id="mob-profile-btn"
                  onClick={() => handleNav('profile')}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-revon-blue dark:hover:text-revon-teal"
                >
                  My Profile ({userProfile?.role})
                </button>
                <button
                  id="mob-logout-btn"
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-4 pb-2 border-t border-slate-100 dark:border-slate-800 px-3 space-y-2">
                <button
                  id="mob-login-btn"
                  onClick={() => handleNav('login')}
                  className="block w-full text-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-revon-blue dark:hover:text-revon-teal"
                >
                  Sign In
                </button>
                <button
                  id="mob-register-btn"
                  onClick={() => handleNav('register')}
                  className="block w-full text-center px-4 py-2 bg-revon-blue text-white rounded-md text-base font-medium hover:bg-revon-blue-hover"
                >
                  Book Appointment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Real-Time Notification Toast for Active Clinic Users */}
      {latestToast && (
        <div id="clinic-notification-toast" className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white dark:bg-slate-800 border-2 border-revon-blue dark:border-revon-teal rounded-2xl shadow-2xl p-4 animate-slideUp transition-all flex items-start gap-3">
          <div className="p-2.5 bg-revon-blue/10 dark:bg-revon-teal/20 text-revon-blue dark:text-revon-teal rounded-xl flex-shrink-0">
            <Bell className="h-5 w-5 animate-bounce" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-revon-blue dark:text-revon-teal">
                {activeClinic?.name || 'Clinic Announcement'}
              </span>
              <button
                onClick={() => setLatestToast(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <h5 className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 truncate">{latestToast.title}</h5>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-snug">{latestToast.content}</p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-mono">
                {new Date(latestToast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={(e) => {
                  markAsRead(latestToast.id, e);
                  setLatestToast(null);
                  setShowDropdown(true);
                }}
                className="text-[10px] font-bold text-revon-blue dark:text-revon-teal hover:underline cursor-pointer"
              >
                View Notice
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Festival Decorator Modal for Admin & Super-Admin */}
      <FestivalDecorModal 
        isOpen={showFestivalModal} 
        onClose={() => setShowFestivalModal(false)} 
      />
    </nav>
  );
}
