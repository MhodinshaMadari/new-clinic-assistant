import React, { useState, useEffect, useMemo } from 'react';
import { APP_NAME } from '../config/appConfig';
import { useAuth } from '../context/AuthContext';
import { useClinicData } from '../hooks/useClinicData';
import { useClinic } from '../context/ClinicContext';
import { RevonLogo } from './RevonLogo';
import { ZFCreationsBrand } from './ZFCreationsBrand';
import { SocialHandle } from '../types';
import { ClinicFacilitiesPortfolioSection } from './ClinicFacilitiesPortfolioSection';
import { PortfolioSlideshow } from './PortfolioSlideshow';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import clinicReceptionImg from '../assets/images/clinic_reception_1784288696289.jpg';
// @ts-ignore
import clinicTreatmentRoomImg from '../assets/images/clinic_treatment_room_1784288709431.jpg';
import { 
  Sparkles, 
  Smile, 
  Shield, 
  ShieldCheck,
  Activity, 
  Layers, 
  Flame, 
  Star, 
  Phone, 
  Clock, 
  MapPin, 
  Calendar, 
  User, 
  Quote, 
  CheckCircle,
  MessageSquarePlus,
  Lock,
  Heart,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Link,
  ChevronLeft,
  ChevronRight,
  Building2,
  Globe,
  Sliders,
  Radio,
  Coffee,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  initialSection?: string;
}

// Icon mapper helper styled for Bento Revon theme
const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'Sparkles': return <Sparkles className="h-6 w-6 text-revon-blue dark:text-teal-400" />;
    case 'Smile': return <Smile className="h-6 w-6 text-revon-blue dark:text-teal-400" />;
    case 'Shield': return <Shield className="h-6 w-6 text-revon-teal dark:text-teal-400" />;
    case 'Activity': return <Activity className="h-6 w-6 text-revon-blue dark:text-teal-400" />;
    case 'Layers': return <Layers className="h-6 w-6 text-revon-teal dark:text-teal-400" />;
    case 'Flame': return <Flame className="h-6 w-6 text-revon-blue dark:text-teal-400" />;
    default: return <Sparkles className="h-6 w-6 text-revon-blue dark:text-teal-400" />;
  }
};

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return <Facebook className="h-4 w-4" />;
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    case 'linkedin':
      return <Linkedin className="h-4 w-4" />;
    case 'youtube':
      return <Youtube className="h-4 w-4" />;
    case 'twitter':
      return <Twitter className="h-4 w-4" />;
    case 'whatsapp':
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.59 1.978 14.122 1.95 11.487 1.95 6.05 1.95 1.623 6.316 1.621 11.745c-.001 1.751.467 3.461 1.353 5.004L1.997 22l5.41-1.411c.01-.005.021-.013.03-.021-.009.008-.019.016-.03.021zM17.13 14.19c-.282-.14-1.664-.813-1.921-.906-.257-.094-.444-.14-.63.14-.187.281-.724.906-.887 1.093-.163.188-.327.21-.609.07-.282-.14-1.19-.434-2.267-1.385-.838-.742-1.403-1.658-1.567-1.939-.163-.281-.017-.433.123-.573.127-.126.282-.327.422-.491.14-.164.188-.281.282-.468.094-.187.047-.351-.023-.491-.07-.14-.63-1.503-.864-2.065-.228-.548-.48-.474-.658-.482-.17-.008-.364-.01-.561-.01-.196 0-.518.073-.79.364-.271.291-1.033.999-1.033 2.435s1.056 2.824 1.205 3.012c.149.188 2.078 3.136 5.028 4.398.702.301 1.25.482 1.678.616.705.221 1.347.19 1.854.115.566-.084 1.664-.672 1.898-1.32.233-.647.233-1.203.163-1.32-.07-.115-.257-.188-.538-.327z" />
        </svg>
      );
    default:
      return <Link className="h-4 w-4" />;
  }
};

const getSocialPlatformClass = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return 'hover:bg-blue-600';
    case 'whatsapp':
      return 'hover:bg-emerald-600';
    case 'instagram':
      return 'hover:bg-pink-600';
    case 'linkedin':
      return 'hover:bg-blue-700';
    case 'youtube':
      return 'hover:bg-red-600';
    case 'twitter':
      return 'hover:bg-sky-500';
    default:
      return 'hover:bg-teal-600';
  }
};

export function LandingPage({ onNavigate, initialSection }: LandingPageProps) {
  const { user, userProfile } = useAuth();
  const { treatments, reviews, surgeons, createReview, socialHandles } = useClinicData();
  const { activeClinic, activeLocationId, setActiveLocationId } = useClinic();

  const activeSocialHandles = useMemo(() => {
    let handles: SocialHandle[] = [];
    if (activeClinic?.socialHandles && activeClinic.socialHandles.length > 0) {
      handles = [...activeClinic.socialHandles];
    } else {
      handles = (socialHandles || []).filter((handle) => handle && (handle.isActive === true || (handle.isActive as any) === 'true'));
    }

    // Sync YouTube channel URL if configured on active clinic
    if (activeClinic?.youtubeChannelUrl) {
      const ytIndex = handles.findIndex(h => h.platform === 'youtube');
      if (ytIndex >= 0) {
        handles[ytIndex] = {
          ...handles[ytIndex],
          url: activeClinic.youtubeChannelUrl,
          isActive: true
        };
      } else {
        handles.push({
          id: `yt-${activeClinic.slug || 'clinic'}`,
          name: `${activeClinic.name || 'Clinic'} YouTube Channel`,
          url: activeClinic.youtubeChannelUrl,
          isActive: true,
          platform: 'youtube'
        });
      }
    }
    return handles;
  }, [activeClinic?.socialHandles, activeClinic?.youtubeChannelUrl, activeClinic?.name, activeClinic?.slug, socialHandles]);
  
  // Testimonial submission state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewName, setNewReviewName] = useState(userProfile?.displayName || '');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Reviews Auto-sliding Carousel States
  const publishedReviews = useMemo(() => {
    return (reviews || []).filter(r => r.isPublished !== false);
  }, [reviews]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerSlide = isMobile ? 1 : 3;
  const totalSlides = Math.ceil(publishedReviews.length / itemsPerSlide) || 1;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  // Reset current slide if it becomes out of bounds
  useEffect(() => {
    setCurrentSlide(0);
  }, [isMobile, (reviews || []).length]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    if (userProfile?.role && userProfile.role !== 'patient') {
      alert("Reviews can only be submitted by registered patients.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createReview(newReviewName || 'Anonymous Patient', newReviewRating, newReviewComment, {
        patientEmail: userProfile?.email || user?.email || '',
        patientId: user?.uid,
        isVerifiedPatient: true
      });
      setReviewSuccess(true);
      setNewReviewComment('');
      setTimeout(() => {
        setReviewSuccess(false);
        setShowReviewForm(false);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const selectedLocation = activeClinic?.locations?.find(l => l.id === activeLocationId) || activeClinic?.locations?.[0];

  return (
    <div id="landing-page" className="bg-[#F8FAFC] dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-revon-blue/5 via-white to-slate-50 dark:from-revon-blue/15 dark:via-slate-900 dark:to-slate-950 py-20 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-revon-blue/10 dark:bg-teal-950/60 text-revon-blue dark:text-teal-300 ring-1 ring-revon-blue/20 dark:ring-teal-800/60 font-mono">
                <Sparkles className="h-3.5 w-3.5 text-revon-teal dark:text-teal-400 animate-pulse" />
                <span>{activeClinic?.name?.toUpperCase() || 'REVON DENTAL CARE'} • /{activeClinic?.slug}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none font-display">
                {activeClinic?.name || 'Smiles that shine.'}<br />
                <span className="text-revon-blue dark:text-teal-400">{activeClinic?.tagline || 'Care Beyond Smiles.'}</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl font-sans">
                {activeClinic?.description || 'Experience world-class dental care with instant booking, live position tracking, and automated email reminders for your complete peace of mind.'}
              </p>
              
              {/* Four Brand Core Pillars matching the image */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl py-2">
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="p-1.5 bg-[#1E88E5]/10 dark:bg-[#1E88E5]/20 rounded-lg text-[#1E88E5] dark:text-sky-400">
                    <Smile className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Trust</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Reliable</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="p-1.5 bg-[#26A69A]/10 dark:bg-[#26A69A]/20 rounded-lg text-[#26A69A] dark:text-teal-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Care</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Dedicated</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="p-1.5 bg-[#607D8B]/10 dark:bg-[#607D8B]/20 rounded-lg text-[#607D8B] dark:text-slate-300">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Comfort</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Painless</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="p-1.5 bg-[#1E88E5]/10 dark:bg-[#1E88E5]/20 rounded-lg text-[#1E88E5] dark:text-sky-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Excellence</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Elite Tech</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {user ? (
                  <button
                    id="hero-go-dash-btn"
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center justify-center space-x-2 bg-revon-blue text-white px-8 py-4 rounded-2xl font-bold hover:bg-revon-blue-hover hover:shadow-lg hover:shadow-revon-blue/10 transition-all cursor-pointer text-center"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Go to Scheduling Panel</span>
                  </button>
                ) : (
                  <>
                    {activeClinic?.features?.appointments !== false && (
                      <button
                        id="hero-register-btn"
                        onClick={() => onNavigate('register')}
                        className="flex items-center justify-center space-x-2 bg-revon-blue text-white px-8 py-4 rounded-2xl font-bold hover:bg-revon-blue-hover hover:shadow-lg hover:shadow-revon-blue/10 transition-all cursor-pointer text-center"
                      >
                        <Calendar className="h-5 w-5" />
                        <span>Book an Appointment</span>
                      </button>
                    )}
                    <button
                      id="hero-login-btn"
                      onClick={() => onNavigate('login')}
                      className="flex items-center justify-center space-x-2 bg-white dark:bg-slate-900 text-revon-blue dark:text-teal-300 border-2 border-revon-blue/20 dark:border-teal-500/30 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-center shadow-sm"
                    >
                      <span>Sign In / Register</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Elegant Right Frame - Bento Card style & Visual Clinic Image */}
            <div className="relative flex flex-col items-center space-y-6 lg:col-span-5">
              <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 group">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={activeClinic?.lobbyImageUrl || clinicReceptionImg} 
                    alt={`${activeClinic?.name || 'Clinic'} Reception & Premium Lobby`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 dark:bg-slate-900/95 text-revon-blue dark:text-teal-300 backdrop-blur-sm shadow-sm font-mono border border-transparent dark:border-slate-700">
                    <Sparkles className="h-3 w-3 mr-1 text-revon-teal animate-spin-slow" />
                    PREMIUM LOBBY
                  </span>
                </div>
              </div>

              <div className="bento-card p-8 w-full max-w-md space-y-6 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">{activeClinic?.name}</h3>
                    <p className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">/{activeClinic?.slug}</p>
                  </div>
                  {/* Real-time Clinic Live Operational Status */}
                  {(() => {
                    const status = activeClinic?.liveStatus?.statusMode || (activeClinic?.liveStatus as any)?.status || 'open';
                    const scheduledUntil = activeClinic?.liveStatus?.scheduledUntil;

                    if (status === 'lunch_break') {
                      return (
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full flex items-center shadow-xs">
                          <span className="h-2 w-2 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                          <span>Lunch Break</span>
                          {scheduledUntil && <span className="ml-1 text-[10px] font-mono font-bold">(Until {scheduledUntil})</span>}
                        </span>
                      );
                    }
                    if (status === 'emergency_only') {
                      return (
                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 rounded-full flex items-center shadow-xs">
                          <span className="h-2 w-2 bg-rose-500 rounded-full mr-1.5 animate-ping"></span>
                          <span>Emergency Only</span>
                          {scheduledUntil && <span className="ml-1 text-[10px] font-mono font-bold">(Until {scheduledUntil})</span>}
                        </span>
                      );
                    }
                    if (status === 'closed') {
                      return (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full flex items-center shadow-xs">
                          <span className="h-2 w-2 bg-slate-400 rounded-full mr-1.5"></span>
                          <span>Closed Today</span>
                          {scheduledUntil && <span className="ml-1 text-[10px] font-mono font-bold">(Until {scheduledUntil})</span>}
                        </span>
                      );
                    }
                    return (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-full flex items-center shadow-xs">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full mr-1.5 animate-ping"></span>
                        <span>Open Now</span>
                        {scheduledUntil && <span className="ml-1 text-[10px] font-mono font-bold">(Until {scheduledUntil})</span>}
                      </span>
                    );
                  })()}
                </div>

                {/* Multi-Branch Selector if enabled */}
                {activeClinic?.features?.multiLocation && activeClinic?.locations && activeClinic.locations.length > 0 && (
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-teal-500" />
                      <span>Select Branch Location ({activeClinic.locations.length})</span>
                    </label>
                    <select
                      value={activeLocationId || ''}
                      onChange={(e) => setActiveLocationId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {activeClinic.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} {loc.isPrimary ? '★ Primary' : ''} - {loc.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="space-y-4 text-xs">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-revon-blue dark:text-teal-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Opening Hours</h4>
                        {(activeClinic?.liveStatus?.statusMode === 'lunch_break' || (activeClinic?.liveStatus as any)?.status === 'lunch_break') && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Resumes {activeClinic?.liveStatus?.expectedResumeTime || '2:00 PM'}
                          </span>
                        )}
                        {(activeClinic?.liveStatus?.statusMode === 'emergency_only' || (activeClinic?.liveStatus as any)?.status === 'emergency_only') && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Emergency Patients Only
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{selectedLocation?.workingHours || 'Mon - Sat: 09:00 AM - 08:00 PM'}</p>
                      {(activeClinic?.liveStatus?.customNote || (activeClinic?.liveStatus as any)?.statusNote) && (
                        <p className="text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-1 bg-teal-50/80 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 px-2 py-0.5 rounded-md inline-block">
                          Note: {activeClinic?.liveStatus?.customNote || (activeClinic?.liveStatus as any)?.statusNote}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-revon-blue dark:text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Branch Address</h4>
                      <p className="text-slate-500 dark:text-slate-400">{selectedLocation?.address || '100 Feet Road'}, {selectedLocation?.city || 'Bengaluru'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-revon-blue dark:text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Contact Number</h4>
                      <p className="text-slate-500 dark:text-slate-400">{selectedLocation?.phone || activeClinic?.phone || '+91 98765 43210'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-center">
                  <div>
                    <div className="text-2xl font-black text-revon-blue dark:text-teal-400">{activeClinic?.locations?.length || 1}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Branches</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-revon-blue dark:text-teal-400">15k+</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Smiles Saved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-revon-blue dark:text-teal-400">100%</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-4xl font-display">
            Our Offered Healthcare Services
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            We provide comprehensive specialist healthcare treatments utilizing advanced medical technologies for comfortable, restorative care.
          </p>
        </div>

        <PortfolioSlideshow
          items={treatments.filter((t) => t.isActive !== false)}
          keyExtractor={(treatment) => treatment.id}
          autoSlideIntervalMs={3000}
          themeColor="blue"
          itemLabelSingular="service"
          itemLabelPlural="services"
          renderItem={(treatment) => (
            <div 
              className="bento-card p-6 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900 h-full border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-revon-blue/40 transition-all rounded-3xl"
            >
              <div className="space-y-4">
                <div className="p-3 bg-revon-blue/10 dark:bg-teal-950/70 border border-transparent dark:border-teal-800/40 rounded-2xl inline-block">
                  {renderIcon(treatment.icon)}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">{treatment.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{treatment.description}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium font-mono">Est: {treatment.durationMinutes} mins</div>
                {treatment.showPrice !== false ? (
                  <div className="text-lg font-black text-revon-blue dark:text-teal-400">₹{treatment.price?.toLocaleString()}</div>
                ) : (
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-mono">Price on Consultation</div>
                )}
              </div>
            </div>
          )}
        />
      </section>

      {/* Specialists Section */}
      {activeClinic?.features?.dentistBreakdown !== false && (
        <section className="py-20 bg-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-4 sm:px-8 shadow-xl dark:bg-slate-900/90 dark:border dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Meet Our Board-Certified Medical Specialists
              </h2>
              <p className="text-slate-300 text-sm">
                Highly specialized physicians and doctors dedicated to making your medical care precise, compassionate, and stress-free.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {surgeons.filter(s => s.isActive && s.isBoardCertified).map((doc, idx) => {
                const nameParts = doc.displayName.split(' ');
                const initials = nameParts.length > 1 
                  ? (nameParts[1]?.[0] || 'D') + (nameParts[2]?.[0] || '')
                  : doc.displayName.substring(0, 2).toUpperCase();
                return (
                  <div key={doc.id} className="bg-slate-800/60 rounded-2xl p-8 border border-slate-700 text-center space-y-4 hover:border-revon-teal hover:transform hover:-translate-y-1 transition-all flex flex-col justify-between">
                    <div className="space-y-4">
                      {doc.avatarUrl ? (
                        <div className="h-24 w-24 rounded-full overflow-hidden mx-auto shadow-lg border-2 border-revon-blue/30 hover:border-revon-teal/80 transition-colors">
                          <img 
                            src={doc.avatarUrl} 
                            alt={doc.displayName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 bg-revon-blue/10 dark:bg-teal-950 text-revon-blue dark:text-teal-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-md">
                          {initials}
                        </div>
                      )}
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold font-display text-white">{doc.displayName}</h3>
                        <p className="text-xs text-revon-teal capitalize font-semibold">{doc.specialty}</p>

                        {/* Real-time Doctor Availability Badge */}
                        {(() => {
                          const docAvailMap = activeClinic?.liveStatus?.doctorAvailability || {};
                          const liveDoc = docAvailMap[doc.id] || 
                            Object.values(docAvailMap).find((d: any) => (d.dentistId === doc.id || d.doctorId === doc.id || d.dentistName?.toLowerCase() === doc.displayName?.toLowerCase() || d.doctorName?.toLowerCase() === doc.displayName?.toLowerCase()));
                          const status = liveDoc?.status || 'available';

                          return (
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
                              {status === 'available' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Available in Clinic
                                </span>
                              )}
                              {status === 'in_surgery' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                                  In Chairside Surgery
                                </span>
                              )}
                              {status === 'on_break' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Coffee className="w-3 h-3 text-amber-400" />
                                  On Short Break
                                </span>
                              )}
                              {(status === 'out_of_clinic' || (status as string) === 'off_duty') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-600/40 text-slate-300 border border-slate-600/50">
                                  Off Duty Today
                                </span>
                              )}
                              {liveDoc?.scheduledUntil && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                                  <Clock className="w-3 h-3 text-indigo-400" />
                                  <span>Until {liveDoc.scheduledUntil}</span>
                                </span>
                              )}
                              {liveDoc?.chairRoom && (
                                <span className="text-[10px] font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                                  {liveDoc.chairRoom}
                                </span>
                              )}
                              {liveDoc?.statusNote && (
                                <span className="text-[10px] font-medium text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/40">
                                  {liveDoc.statusNote}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {doc.bio}
                      </p>
                      
                      {/* Consultation Timing */}
                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Consultation Hours</div>
                        <div className="text-xs font-medium text-emerald-400 mt-0.5">{doc.consultationTiming || 'Mon - Fri: 09:00 AM - 05:00 PM'}</div>
                      </div>
                    </div>
                    <div className="pt-2 text-xs text-emerald-400 font-mono bg-slate-800/40 py-1.5 rounded-xl border border-slate-700/50">
                      Verified Practitioner Profile
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Clinic Facilities & Infrastructure Showcase */}
      {activeClinic?.features?.facilities !== false && (
        <ClinicFacilitiesPortfolioSection clinic={activeClinic} />
      )}

      {/* Patient Testimonials & Reviews Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-4xl font-display">
              Patient Testimonials & Reviews
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Read real patient experiences and verified feedback from patients treated at {activeClinic?.name}.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {activeClinic?.features?.reviews !== false && (
              user ? (
                (!userProfile || userProfile.role === 'patient') ? (
                  <button
                    id="toggle-review-btn"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center space-x-2 bg-revon-blue text-white px-5 py-3 rounded-xl font-bold hover:bg-revon-blue-hover transition-all cursor-pointer shadow-md shadow-revon-blue/10"
                  >
                    <MessageSquarePlus className="h-5 w-5" />
                    <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <span>Reviews can only be added by registered patients</span>
                  </div>
                )
              ) : (
                <button
                  id="review-prompt-login-btn"
                  onClick={() => onNavigate('login')}
                  className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer text-sm border border-transparent dark:border-slate-700"
                >
                  <Lock className="h-4 w-4 text-slate-400 dark:text-slate-400" />
                  <span>Login as Patient to Leave Review</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Review Form Component */}
        {showReviewForm && (
          <form id="review-submission-form" onSubmit={handleReviewSubmit} className="mb-12 bg-white dark:bg-slate-900 border border-revon-blue/20 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto shadow-md space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">We Value Your Feedback</h3>
            
            {reviewSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-center space-x-2 text-sm font-semibold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Review posted successfully! Thank you for sharing your experience.</span>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Your Name</label>
                    <input
                      id="review-name-input"
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-revon-blue dark:focus:ring-teal-500 focus:outline-none text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Clinic Rating (1-5)</label>
                    <div className="flex items-center space-x-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className="focus:outline-none cursor-pointer"
                        >
                          <Star className={`h-6 w-6 ${star <= newReviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Your Comment</label>
                  <textarea
                    id="review-comment-input"
                    rows={3}
                    placeholder="Tell other patients about your treatment, scheduling, or doctor..."
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-revon-blue dark:focus:ring-teal-500 focus:outline-none text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="text-right">
                  <button
                    id="submit-review-btn"
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-revon-blue hover:bg-revon-blue-hover text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 cursor-pointer text-sm shadow-md"
                  >
                    {isSubmittingReview ? 'Posting...' : 'Post Review'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Patient Reviews Card Grid */}
        <div className="mt-8">
          {(() => {
            const published = (reviews || []).filter(r => r.isPublished !== false);
            if (published.length === 0) {
              return (
                <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                    <Star className="h-6 w-6 fill-amber-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">No Patient Reviews Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Be the first to share your dental experience at {activeClinic?.name}! Click "Write a Review" above to submit feedback.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {published.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                            {rev.patientName ? rev.patientName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white font-display">
                              {rev.patientName || 'Verified Patient'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent visit'}
                            </div>
                          </div>
                        </div>

                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.treatmentName && (
                        <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800/60">
                          {rev.treatmentName}
                        </span>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{rev.comment}"
                      </p>

                      {rev.adminReply && (
                        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 border-l-3 border-teal-500 text-xs space-y-1">
                          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase font-mono block">
                            Response from {rev.adminReplyBy || 'Clinical Team'}
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                            "{rev.adminReply}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* Trust & Email Reminders feature highlights */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/60 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl mb-20 border border-slate-200/60 dark:border-slate-800">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight font-display">
              Real-Time Tracking & Automated Reminders
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Never miss a dental checkup again! Our integrated smart scheduling engine triggers real-time status notifications and automated email logs instantly on booking and status transitions.
            </p>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-revon-blue dark:text-teal-400 flex-shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Instant automated verification emails logged upon online bookings.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-revon-blue dark:text-teal-400 flex-shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Real-time dashboard timeline tracking for patients and medical staff.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-revon-blue dark:text-teal-400 flex-shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Custom patient profiles allowing flexible scheduling revisions.</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-6">
            <div className="w-full overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 group">
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={activeClinic?.treatmentRoomImageUrl || clinicTreatmentRoomImg} 
                  alt={`${activeClinic?.name || 'Clinic'} Treatment Room`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 dark:bg-slate-900/95 text-revon-blue dark:text-teal-300 backdrop-blur-sm shadow-sm font-mono border border-transparent dark:border-slate-700">
                  <Shield className="h-3.5 w-3.5 mr-1 text-revon-teal animate-pulse" />
                  HYGIENIC & ULTRA-MODERN
                </span>
              </div>
            </div>

            <div className="bento-card p-6 bg-white dark:bg-slate-900 space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 font-display">Active Scheduling Updates Log</h4>
            <div className="space-y-4">
              <div className="flex space-x-3 text-xs">
                <div className="w-2.5 h-2.5 bg-revon-blue dark:bg-teal-400 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Booking Auto-Email Sent successfully</div>
                  <p className="text-slate-500 dark:text-slate-400 font-mono">Patient: M. Shamadari</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full inline-block mt-1 font-mono">Just now</span>
                </div>
              </div>
              <div className="flex space-x-3 text-xs">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1 flex-shrink-0 animate-pulse"></div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Appointment [CONFIRMED] by Staff</div>
                  <p className="text-slate-500 dark:text-slate-400">Patient: Clara Oswald, Treatment: Whitening</p>
                  <span className="text-[10px] text-revon-teal dark:text-teal-400 bg-revon-teal/10 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full inline-block mt-1 font-bold">2 mins ago</span>
                </div>
              </div>
              <div className="flex space-x-3 text-xs">
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Review Seeding Completed</div>
                  <p className="text-slate-500 dark:text-slate-400">John Miller: "Absolutely amazing!"</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full inline-block mt-1 font-mono">10 mins ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 dark:text-slate-400 py-12 border-t border-slate-800 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/40 dark:bg-slate-900/60 px-5 py-2.5 rounded-2xl border border-slate-800/60 dark:border-slate-800 shadow-inner">
            <RevonLogo size={36} taglineClassName="text-slate-400" lightMode={false} />
            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex space-x-2.5">
              {activeSocialHandles.map((handle) => (
                <a
                  key={handle.id}
                  href={handle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 bg-slate-800/80 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-sm hover:scale-105 inline-flex items-center justify-center ${getSocialPlatformClass(handle.platform)}`}
                  aria-label={handle.name}
                  title={handle.name}
                >
                  {getSocialIcon(handle.platform)}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start space-y-3">
            <p className="text-xs text-center text-slate-500 max-w-sm md:text-left leading-relaxed">
              &copy; {new Date().getFullYear()} {APP_NAME}. Real-time patient scheduling software with Firebase Cloud Integration.
            </p>
            <ZFCreationsBrand className="scale-95" />
          </div>
          <div className="flex space-x-4 text-xs font-semibold">
            <button onClick={() => onNavigate('portfolio')} className="hover:text-white cursor-pointer text-slate-400 transition-colors">Portfolio</button>
            <button onClick={() => onNavigate('dashboard')} className="hover:text-white cursor-pointer text-slate-400 transition-colors">Booking</button>
            <button onClick={() => onNavigate('profile')} className="hover:text-white cursor-pointer text-slate-400 transition-colors">Profile</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

