import React, { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { Clinic } from '../types';
import { 
  Search, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Clock, 
  X, 
  Calendar, 
  Bot, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Stethoscope,
  HeartPulse,
  Ban,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClinicPortfolioFallbackProps {
  onNavigate: (view: string, clinicSlug?: string) => void;
}

export const ClinicPortfolioFallback: React.FC<ClinicPortfolioFallbackProps> = ({ onNavigate }) => {
  const { clinics, selectClinicBySlug } = useClinic();
  const { userProfile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinicForConfirm, setSelectedClinicForConfirm] = useState<Clinic | null>(null);

  // Find user's registered clinic if logged in
  const userRegisteredClinic = useMemo(() => {
    if (!userProfile?.clinicSlug) return null;
    return clinics.find((c) => c.slug === userProfile.clinicSlug) || null;
  }, [userProfile?.clinicSlug, clinics]);

  // Filter clinics dynamically by search query
  const filteredClinics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clinics;

    return clinics.filter((c) => {
      const matchName = c.name.toLowerCase().includes(query);
      const matchSlug = c.slug.toLowerCase().includes(query);
      const matchTagline = c.tagline.toLowerCase().includes(query);
      const matchDesc = c.description.toLowerCase().includes(query);
      const matchLocation = c.locations?.some(
        (l) => l.city.toLowerCase().includes(query) || l.name.toLowerCase().includes(query) || l.address.toLowerCase().includes(query)
      );
      return matchName || matchSlug || matchTagline || matchDesc || matchLocation;
    });
  }, [clinics, searchQuery]);

  const handleConfirmClinic = () => {
    if (!selectedClinicForConfirm) return;
    selectClinicBySlug(selectedClinicForConfirm.slug);
    onNavigate('portfolio', selectedClinicForConfirm.slug);
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-700 dark:text-teal-300 text-xs font-bold font-mono tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-teal-500 animate-pulse" />
            <span>Multi-Clinic Health Network Directory</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
            Find & Access Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600 dark:from-teal-400 dark:to-indigo-400">Clinic</span>
          </h1>
          
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Welcome to the central clinic portal. Type your clinic name, branch city, or clinic ID below to locate and enter your clinic.
          </p>
        </div>

        {/* Registered User Banner Shortcut */}
        {userRegisteredClinic && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-teal-500/30"
          >
            <div className="flex items-center space-x-3.5 text-left">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                    Your Registered Clinic
                  </span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg font-display mt-0.5">{userRegisteredClinic.name}</h3>
                <p className="text-xs text-teal-100 font-mono">/{userRegisteredClinic.slug}</p>
              </div>
            </div>

            <button
              onClick={() => {
                selectClinicBySlug(userRegisteredClinic.slug);
                onNavigate('portfolio', userRegisteredClinic.slug);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-teal-800 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center space-x-2 shrink-0 group"
            >
              <span>Go to My Clinic</span>
              <ArrowRight className="h-4 w-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Search Input Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by clinic name, slug (e.g. revon-dental), city, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base font-medium rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 gap-2">
            <span className="font-mono">
              Showing <strong className="text-slate-900 dark:text-white">{filteredClinics.length}</strong> of {clinics.length} registered clinics
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Popular searches:</span>
              <button
                onClick={() => setSearchQuery('Revon')}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-600 dark:hover:text-teal-400 rounded-md font-mono text-[11px] transition-colors"
              >
                Revon
              </button>
              <button
                onClick={() => setSearchQuery('SmileCare')}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-600 dark:hover:text-teal-400 rounded-md font-mono text-[11px] transition-colors"
              >
                SmileCare
              </button>
              <button
                onClick={() => setSearchQuery('Bengaluru')}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-600 dark:hover:text-teal-400 rounded-md font-mono text-[11px] transition-colors"
              >
                Bengaluru
              </button>
            </div>
          </div>
        </div>

        {/* Clinics Grid */}
        {filteredClinics.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg font-display">No Clinics Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn't find any clinic matching "<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>". Try clearing your search or checking spelling.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Show All Clinics
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClinics.map((clinic) => {
              const primaryLoc = clinic.locations?.find((l) => l.isPrimary) || clinic.locations?.[0];
              const isSelected = selectedClinicForConfirm?.id === clinic.id;
              const isDisabled = clinic.status === 'disabled' || clinic.isDisabled === true;

              return (
                <div
                  key={clinic.id}
                  onClick={() => setSelectedClinicForConfirm(clinic)}
                  className={`group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isDisabled
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                      : isSelected 
                      ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xl' 
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-teal-400/80 hover:shadow-lg dark:hover:border-teal-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Clinic Name & Action */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg font-display shadow-xs shrink-0 ${
                          isDisabled
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900/60 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400'
                        }`}>
                          {clinic.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base font-display group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                              {clinic.name}
                            </h3>
                            {isDisabled && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 inline-flex items-center gap-1">
                                <Ban className="h-3 w-3" /> Disabled
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-900 inline-block mt-0.5">
                            /{clinic.slug}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClinicForConfirm(clinic);
                        }}
                        className={`p-2 rounded-xl transition-all shrink-0 ${
                          isDisabled
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-teal-600 group-hover:text-white'
                        }`}
                        title="Select Clinic"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Tagline Only */}
                    {clinic.tagline && (
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 italic line-clamp-2 pt-1">
                        "{clinic.tagline}"
                      </p>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClinicForConfirm(clinic);
                      }}
                      className={`w-full sm:w-auto px-4 py-2 font-bold text-xs rounded-xl border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        isDisabled
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          : 'bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-600 hover:text-white text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800'
                      }`}
                    >
                      <span>{isDisabled ? 'View Status' : 'Select Clinic'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedClinicForConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative overflow-hidden"
            >
              {/* Modal Top Decorative Accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-indigo-600" />

              <button
                onClick={() => setSelectedClinicForConfirm(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl font-display shadow-inner shrink-0 ${
                    selectedClinicForConfirm.status === 'disabled' || selectedClinicForConfirm.isDisabled
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                  }`}>
                    {selectedClinicForConfirm.name.charAt(0)}
                  </div>
                  <div>
                    {selectedClinicForConfirm.status === 'disabled' || selectedClinicForConfirm.isDisabled ? (
                      <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800 flex items-center gap-1 w-fit">
                        <Ban className="h-3 w-3" /> Clinic Access Suspended
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase font-mono tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded">
                        Confirm Selected Clinic
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 dark:text-white text-xl font-display leading-snug mt-0.5">
                      {selectedClinicForConfirm.name}
                    </h3>
                  </div>
                </div>

                {(selectedClinicForConfirm.status === 'disabled' || selectedClinicForConfirm.isDisabled) && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs space-y-2 text-rose-800 dark:text-rose-200">
                    <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Notice: Clinic Temporarily Inactive</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-rose-700/90 dark:text-rose-300/90">
                      This clinic has been marked as <strong>Disabled</strong> by the Super Admin. Patient portal features, appointments, and billing operations are restricted for regular users.
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-teal-500 pl-3">
                  "{selectedClinicForConfirm.tagline}"
                </p>

                {/* Details Breakdown Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-slate-400">Clinic URI Slug:</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400">/{selectedClinicForConfirm.slug}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-slate-400">Primary Contact:</span>
                    <span className="font-mono font-semibold">{selectedClinicForConfirm.phone}</span>
                  </div>

                  <div className="flex items-start justify-between text-slate-700 dark:text-slate-300 gap-2">
                    <span className="font-medium text-slate-400 shrink-0">Main Location:</span>
                    <span className="font-semibold text-right">
                      {selectedClinicForConfirm.locations?.[0]?.name} ({selectedClinicForConfirm.locations?.[0]?.city})
                    </span>
                  </div>
                </div>

                {!(selectedClinicForConfirm.status === 'disabled' || selectedClinicForConfirm.isDisabled) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    By clicking confirm below, you will enter <strong className="text-slate-900 dark:text-white">{selectedClinicForConfirm.name}</strong>'s portfolio. You can view services, surgeon directories, and schedule appointments directly.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {selectedClinicForConfirm.status === 'disabled' || selectedClinicForConfirm.isDisabled ? (
                  Boolean(userProfile?.isSuperAdmin || userProfile?.role === 'super-admin') ? (
                    <button
                      type="button"
                      onClick={handleConfirmClinic}
                      className="w-full sm:flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center space-x-2"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Access Clinic (Super Admin Override)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full sm:flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center space-x-2 border border-slate-300 dark:border-slate-700"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Clinic Currently Disabled</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmClinic}
                    className="w-full sm:flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-teal-600/25 cursor-pointer transition-all flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Access Clinic</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedClinicForConfirm(null)}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
