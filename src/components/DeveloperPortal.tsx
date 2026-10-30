import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAppointments } from '../hooks/useAppointments';
import { Clinic, ClinicFeatures, ClinicLocation } from '../types';
import { 
  Building2, 
  Settings, 
  Plus, 
  Activity, 
  Users, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  Trash2, 
  Search, 
  SlidersHorizontal,
  DollarSign,
  AlertCircle,
  PartyPopper,
  Power,
  Ban,
  ShieldAlert,
  Globe
} from 'lucide-react';
import { FestivalDecorModal } from './FestivalDecorModal';
import { UpdateClinicUriModal } from './UpdateClinicUriModal';

interface DeveloperPortalProps {
  onNavigateToClinic: (slug: string, subview?: string) => void;
}

export function DeveloperPortal({ onNavigateToClinic }: DeveloperPortalProps) {
  const { clinics, createClinic, updateClinic, toggleClinicStatus, deleteClinic } = useClinic();
  const { appointments } = useAppointments();

  const handleToggleClinicFeature = async (clinicId: string, currentFeatures: ClinicFeatures | undefined, featureKey: keyof ClinicFeatures) => {
    try {
      const defaultFeats: ClinicFeatures = {
        appointments: true,
        billing: true,
        chatbot: true,
        supportSystem: true,
        dentistBreakdown: true,
        reminders: true,
        reviews: true,
        multiLocation: true,
        facilities: true,
        finances: true,
      };
      const base = currentFeatures ? { ...defaultFeats, ...currentFeatures } : defaultFeats;
      const updated = {
        ...base,
        [featureKey]: !base[featureKey]
      };
      await updateClinic(clinicId, { features: updated });
    } catch (err) {
      console.error("Failed to toggle clinic feature:", err);
    }
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [uriModalClinic, setUriModalClinic] = useState<Clinic | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State for creating a new clinic
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicSlug, setNewClinicSlug] = useState('');
  const [newClinicTagline, setNewClinicTagline] = useState('');
  const [newClinicDescription, setNewClinicDescription] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('');
  const [newClinicEmail, setNewClinicEmail] = useState('');
  const [newClinicWebsite, setNewClinicWebsite] = useState('');
  const [newLocName, setNewLocName] = useState('Main Branch');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocCity, setNewLocCity] = useState('Bengaluru');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocHours, setNewLocHours] = useState('Mon - Sat: 09:00 AM - 07:00 PM');

  const [newFeatures, setNewFeatures] = useState<ClinicFeatures>({
    appointments: true,
    billing: true,
    chatbot: true,
    supportSystem: true,
    dentistBreakdown: true,
    reminders: true,
    reviews: true,
    multiLocation: true,
    facilities: true,
    finances: true,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate slug automatically when name changes
  const handleNameChange = (val: string) => {
    setNewClinicName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setNewClinicSlug(slug);
  };

  const handleCreateClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim() || !newClinicSlug.trim()) {
      setErrorMsg('Clinic Name and Slug are required.');
      return;
    }

    if (clinics.some(c => c.slug === newClinicSlug)) {
      setErrorMsg(`A clinic with slug "${newClinicSlug}" already exists. Please choose another slug.`);
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const initialLocation: ClinicLocation = {
        id: `loc-${Date.now()}`,
        name: newLocName || 'Main Branch',
        address: newLocAddress || '123 Health Street',
        city: newLocCity || 'Bengaluru',
        phone: newLocPhone || newClinicPhone || '+91 80 1234 5678',
        workingHours: newLocHours,
        isPrimary: true
      };

      await createClinic({
        slug: newClinicSlug,
        name: newClinicName,
        tagline: newClinicTagline || 'Painless Dental Care Specialist',
        description: newClinicDescription || 'Modern digital clinic providing comprehensive dental treatments.',
        phone: newClinicPhone || '+91 98765 43210',
        email: newClinicEmail || `contact@${newClinicSlug}.in`,
        website: newClinicWebsite || `https://${newClinicSlug}.in`,
        features: newFeatures,
        locations: [initialLocation]
      });

      setShowCreateModal(false);
      // Reset form
      setNewClinicName('');
      setNewClinicSlug('');
      setNewClinicTagline('');
      setNewClinicDescription('');
      setNewClinicPhone('');
      setNewClinicEmail('');
      setNewClinicWebsite('');
      setSaving(false);
    } catch (err: any) {
      console.error("Failed to create clinic:", err);
      setErrorMsg(err.message || 'Failed to create clinic.');
      setSaving(false);
    }
  };

  const handleDeleteClinic = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete clinic "${name}"? This action cannot be undone.`)) {
      try {
        setDeletingId(id);
        await deleteClinic(id);
        setDeletingId(null);
      } catch (err) {
        alert('Failed to delete clinic.');
        setDeletingId(null);
      }
    }
  };

  // System statistics
  const totalAppointments = appointments.length;
  const totalLocations = clinics.reduce((acc, c) => acc + (c.locations?.length || 0), 0);
  const totalBillingEnabledCount = clinics.filter(c => c.features?.billing).length;
  const activeClinicsCount = clinics.filter(c => c.status !== 'disabled' && !c.isDisabled).length;
  const disabledClinicsCount = clinics.filter(c => c.status === 'disabled' || c.isDisabled === true).length;

  const handleToggleClinicStatus = async (clinicId: string, isCurrentlyDisabled: boolean) => {
    try {
      await toggleClinicStatus(clinicId, !isCurrentlyDisabled);
    } catch (err) {
      alert("Failed to update clinic status.");
    }
  };

  const filteredClinics = clinics.filter((c) => {
    const query = searchTerm.toLowerCase().trim();
    const matchName = c.name.toLowerCase().includes(query);
    const matchSlug = c.slug.toLowerCase().includes(query);
    const matchEmail = c.email?.toLowerCase().includes(query) || false;
    const matchesSearch = !query || matchName || matchSlug || matchEmail;

    const isDisabled = c.status === 'disabled' || c.isDisabled === true;

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return !isDisabled;
    if (statusFilter === 'disabled') return isDisabled;
    return true;
  });

  return (
    <div id="developer-monitoring-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" />
              <span>Developer Team Control Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Multi-Clinic Network Overview & Monitoring
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Monitor live clinic metrics, configure modular feature toggles for each app instance, manage branch locations, and provision new clinic URIs in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dev-portal-festival-decor-btn"
              onClick={() => setShowFestivalModal(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-4 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20 hover:scale-105 cursor-pointer whitespace-nowrap"
            >
              <PartyPopper className="h-5 w-5" />
              <span>Festival Decorator</span>
            </button>

            <button
              id="dev-portal-create-clinic-btn"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-teal-500/20 hover:scale-105 cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              <span>Register New Clinic</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registered Clinics</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{clinics.length}</span>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1 inline-block">
              {activeClinicsCount} Active • {disabledClinicsCount} Disabled
            </span>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Branch Locations</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalLocations}</span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 inline-block">Multi-Location Support</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <MapPin className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Network Appointments</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalAppointments}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">Real-time Synced</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Billing Enabled</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalBillingEnabledCount} / {clinics.length}</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 inline-block">Invoicing Active</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clinics by name, slug or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({clinics.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'active'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Active ({activeClinicsCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'disabled'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
              }`}
            >
              <Ban className="h-3 w-3" />
              <span>Disabled ({disabledClinicsCount})</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredClinics.length}</span> of {clinics.length} clinics
        </div>
      </div>

      {/* Clinic Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClinics.map((clinic) => {
          const clinicAppointments = appointments.filter(a => a.clinicSlug === clinic.slug || a.clinicId === clinic.id);
          const enabledCount = Object.values(clinic.features || {}).filter(Boolean).length;
          const isDisabled = clinic.status === 'disabled' || clinic.isDisabled === true;

          return (
            <div
              key={clinic.id}
              className={`rounded-3xl transition-all p-6 space-y-5 flex flex-col justify-between ${
                isDisabled 
                  ? 'bg-slate-50/90 dark:bg-slate-900/60 border-2 border-rose-300 dark:border-rose-900/80 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {clinic.name}
                      </h3>
                      {isDisabled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                          <Ban className="h-3 w-3 text-rose-600 dark:text-rose-400" /> Disabled
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-mono font-bold">
                        URI Slug: /{clinic.slug}
                      </p>
                      <button
                        type="button"
                        onClick={() => setUriModalClinic(clinic)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                        title="Update Clinic URI Slug & validate database uniqueness"
                      >
                        <Globe className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                        <span>Update URI</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      "{clinic.tagline}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    <Building2 className="h-3.5 w-3.5 text-teal-500" />
                    <span>{clinic.locations?.length || 1} Branches</span>
                  </div>
                </div>

                {/* Locations preview */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-150 dark:border-slate-700/50 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Active Locations & Branches:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {clinic.locations?.map((loc) => (
                      <span
                        key={loc.id}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${
                          loc.isPrimary
                            ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {loc.name} {loc.isPrimary && '(Primary)'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feature Toggles Overview */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Enabled Features ({enabledCount}/10):</span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold">Click badge to toggle</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    <FeatureBadge
                      label="Appointments"
                      enabled={clinic.features?.appointments}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'appointments')}
                    />
                    <FeatureBadge
                      label="Billing"
                      enabled={clinic.features?.billing}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'billing')}
                    />
                    <FeatureBadge
                      label="AI Chatbot"
                      enabled={clinic.features?.chatbot}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'chatbot')}
                    />
                    <FeatureBadge
                      label="Support System"
                      enabled={clinic.features?.supportSystem}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'supportSystem')}
                    />
                    <FeatureBadge
                      label="Doctor Slots"
                      enabled={clinic.features?.dentistBreakdown}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'dentistBreakdown')}
                    />
                    <FeatureBadge
                      label="Reminders"
                      enabled={clinic.features?.reminders}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'reminders')}
                    />
                    <FeatureBadge
                      label="Reviews"
                      enabled={clinic.features?.reviews !== false}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'reviews')}
                    />
                    <FeatureBadge
                      label="Finances"
                      enabled={clinic.features?.finances !== false}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'finances')}
                    />
                    <FeatureBadge
                      label="Multi-Location"
                      enabled={clinic.features?.multiLocation}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'multiLocation')}
                    />
                    <FeatureBadge
                      label="Clinic Facilities"
                      enabled={clinic.features?.facilities !== false}
                      onClick={() => handleToggleClinicFeature(clinic.id, clinic.features, 'facilities')}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{clinicAppointments.length}</span> Appointments Booked
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isDisabled ? (
                    <button
                      onClick={() => handleToggleClinicStatus(clinic.id, true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md hover:scale-105"
                      title="Enable clinic access for all users"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Enable Clinic</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleClinicStatus(clinic.id, false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                      title="Disable this clinic (restricts patient & staff access)"
                    >
                      <Power className="h-3.5 w-3.5" />
                      <span>Disable Clinic</span>
                    </button>
                  )}

                  <button
                    onClick={() => setUriModalClinic(clinic)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-teal-200 dark:border-teal-800"
                    title="Update Clinic URI & Cascade Database Changes"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Update URI</span>
                  </button>

                  <button
                    onClick={() => onNavigateToClinic(clinic.slug, 'setup')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    title="Configure Features & Clinic Setup"
                  >
                    <Settings className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Clinic Setup</span>
                  </button>

                  <button
                    onClick={() => onNavigateToClinic(clinic.slug, 'dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800"
                    title="View Appointments & Operations Dashboard"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => onNavigateToClinic(clinic.slug, 'portfolio')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Visit /{clinic.slug}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                    disabled={deletingId === clinic.id}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Clinic"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register New Clinic */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-teal-500" />
                  <span>Register New Clinic Instance</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Provision a new clinic with custom URL slug, initial location, and feature set.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateClinicSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">1. Basic Clinic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Clinic Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Dental Studio"
                      value={newClinicName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL Slug (baseurl/slug) *</label>
                    <div className="flex items-center">
                      <span className="bg-slate-200 dark:bg-slate-700 px-2.5 py-2 rounded-l-xl text-xs text-slate-600 dark:text-slate-300 font-mono">/</span>
                      <input
                        type="text"
                        required
                        placeholder="apex-dental"
                        value={newClinicSlug}
                        onChange={(e) => setNewClinicSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. Painless Care with Surgical Precision"
                      value={newClinicTagline}
                      onChange={(e) => setNewClinicTagline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Clinic Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={newClinicPhone}
                      onChange={(e) => setNewClinicPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Clinic Email</label>
                    <input
                      type="email"
                      placeholder="contact@clinic.in"
                      value={newClinicEmail}
                      onChange={(e) => setNewClinicEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Primary Location */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">2. Primary Branch Location</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
                    <input
                      type="text"
                      placeholder="Indiranagar Flagship"
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Bengaluru"
                      value={newLocCity}
                      onChange={(e) => setNewLocCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Address</label>
                    <input
                      type="text"
                      placeholder="100 Feet Road, Indiranagar"
                      value={newLocAddress}
                      onChange={(e) => setNewLocAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Selection */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">3. Select Features Enabled for this Clinic</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                  <FeatureToggleCheckbox
                    label="Appointment Booking"
                    checked={newFeatures.appointments}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, appointments: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Billing & Invoicing"
                    checked={newFeatures.billing}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, billing: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="AI Assistant / Chatbot"
                    checked={newFeatures.chatbot}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, chatbot: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Patient Support System"
                    checked={newFeatures.supportSystem}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, supportSystem: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Doctor & Specialist Slot Breakdown"
                    checked={newFeatures.dentistBreakdown}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, dentistBreakdown: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Automated Email Reminders"
                    checked={newFeatures.reminders}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, reminders: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Patient Reviews & Ratings"
                    checked={newFeatures.reviews !== false}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, reviews: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Finances & Clinic Expenses"
                    checked={newFeatures.finances !== false}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, finances: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Multi-Branch Locations"
                    checked={newFeatures.multiLocation}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, multiLocation: val }))}
                  />
                  <FeatureToggleCheckbox
                    label="Clinic Facilities & Patient Amenities"
                    checked={newFeatures.facilities !== false}
                    onChange={(val) => setNewFeatures(prev => ({ ...prev, facilities: val }))}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Registering...' : 'Provision Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Festival Decorator Modal */}
      <FestivalDecorModal 
        isOpen={showFestivalModal} 
        onClose={() => setShowFestivalModal(false)} 
      />

      {/* Super User Clinic URI Update Modal */}
      <UpdateClinicUriModal
        isOpen={Boolean(uriModalClinic)}
        onClose={() => setUriModalClinic(null)}
        clinic={uriModalClinic}
      />
    </div>
  );
}

function FeatureBadge({ label, enabled, onClick }: { label: string; enabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
        enabled 
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
      title={`Click to ${enabled ? 'disable' : 'enable'} ${label}`}
    >
      {enabled ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" /> : <XCircle className="h-3 w-3 text-slate-400 flex-shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

function FeatureToggleCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
      />
      <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
    </label>
  );
}
