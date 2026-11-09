import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAppointments } from '../hooks/useAppointments';
import { ClinicLocation, ClinicFeatures } from '../types';
import { useAuth } from '../context/AuthContext';
import { UpdateClinicUriModal } from './UpdateClinicUriModal';
import { 
  Settings, 
  Building2, 
  Sliders, 
  MapPin, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Clock,
  Activity,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Copy,
  RefreshCw,
  RotateCcw,
  Code,
  X
} from 'lucide-react';

interface ClinicSetupPageProps {
  clinicSlug: string;
  onNavigateBack: () => void;
  onNavigateToClinicView: (slug: string, view: string) => void;
}

export function ClinicSetupPage({ clinicSlug, onNavigateBack, onNavigateToClinicView }: ClinicSetupPageProps) {
  const { clinics, updateClinic } = useClinic();
  const { appointments } = useAppointments();
  const { userProfile, user } = useAuth();
  const isSuperAdmin = Boolean(
    userProfile?.isSuperAdmin ||
    userProfile?.role === 'super-admin' ||
    user?.email?.toLowerCase() === 'mhodinshamadari@gmail.com'
  );

  const [showUriModal, setShowUriModal] = useState(false);

  const clinic = clinics.find(c => c.slug === clinicSlug) || clinics[0];

  // Editable states initialized from clinic object
  const [name, setName] = useState(clinic?.name || '');
  const [tagline, setTagline] = useState(clinic?.tagline || '');
  const [description, setDescription] = useState(clinic?.description || '');
  const [phone, setPhone] = useState(clinic?.phone || '');
  const [email, setEmail] = useState(clinic?.email || '');
  const [website, setWebsite] = useState(clinic?.website || '');
  const [logoUrl, setLogoUrl] = useState(clinic?.logoUrl || '');
  const [lobbyImageUrl, setLobbyImageUrl] = useState(clinic?.lobbyImageUrl || '');
  const [treatmentRoomImageUrl, setTreatmentRoomImageUrl] = useState(clinic?.treatmentRoomImageUrl || '');

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Logo image size should be less than 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLobbyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Lobby image size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLobbyImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTreatmentRoomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Treatment room image size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setTreatmentRoomImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Features state
  const [features, setFeatures] = useState<ClinicFeatures>(clinic?.features || {
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

  // Locations state
  const [locations, setLocations] = useState<ClinicLocation[]>(clinic?.locations || []);
  
  // New Location Form Modal state
  const [showAddLocModal, setShowAddLocModal] = useState(false);
  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locCity, setLocCity] = useState('Bengaluru');
  const [locPhone, setLocPhone] = useState('');
  const [locHours, setLocHours] = useState('Mon - Sat: 09:00 AM - 07:00 PM');
  const [locIsPrimary, setLocIsPrimary] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if clinic prop updates
  React.useEffect(() => {
    if (clinic) {
      setName(clinic.name);
      setTagline(clinic.tagline);
      setDescription(clinic.description);
      setPhone(clinic.phone);
      setEmail(clinic.email);
      setWebsite(clinic.website || '');
      setLogoUrl(clinic.logoUrl || '');
      setLobbyImageUrl(clinic.lobbyImageUrl || '');
      setTreatmentRoomImageUrl(clinic.treatmentRoomImageUrl || '');
      setFeatures(clinic.features ? {
        appointments: clinic.features.appointments ?? true,
        billing: clinic.features.billing ?? true,
        chatbot: clinic.features.chatbot ?? true,
        supportSystem: clinic.features.supportSystem ?? true,
        dentistBreakdown: clinic.features.dentistBreakdown ?? true,
        reminders: clinic.features.reminders ?? true,
        reviews: clinic.features.reviews ?? true,
        multiLocation: clinic.features.multiLocation ?? true,
        facilities: clinic.features.facilities ?? true,
        finances: clinic.features.finances ?? true,
      } : {
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
      setLocations(clinic.locations || []);
    }
  }, [clinic]);

  if (!clinic) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">Clinic not found for slug "{clinicSlug}".</p>
        <button onClick={onNavigateBack} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">
          Return to Developer Portal
        </button>
      </div>
    );
  }

  const handleToggleFeature = (key: keyof ClinicFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;

    const newLoc: ClinicLocation = {
      id: `loc-${Date.now()}`,
      name: locName,
      address: locAddress || 'Address details',
      city: locCity || 'Bengaluru',
      phone: locPhone || phone || '+91 80 1234 5678',
      workingHours: locHours || 'Mon - Sat: 09:00 AM - 07:00 PM',
      isPrimary: locIsPrimary || locations.length === 0
    };

    let updatedLocations = [...locations];
    if (newLoc.isPrimary) {
      updatedLocations = updatedLocations.map(l => ({ ...l, isPrimary: false }));
    }
    updatedLocations.push(newLoc);

    setLocations(updatedLocations);
    setShowAddLocModal(false);

    // Reset Form
    setLocName('');
    setLocAddress('');
    setLocCity('Bengaluru');
    setLocPhone('');
    setLocHours('Mon - Sat: 09:00 AM - 07:00 PM');
    setLocIsPrimary(false);
  };

  const handleDeleteLocation = (locId: string) => {
    if (locations.length <= 1) {
      alert("Clinic must have at least one branch location.");
      return;
    }
    const updated = locations.filter(l => l.id !== locId);
    if (!updated.some(l => l.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setLocations(updated);
  };

  const handleSetPrimaryLocation = (locId: string) => {
    setLocations(locations.map(l => ({
      ...l,
      isPrimary: l.id === locId
    })));
  };

  const handleSaveSetup = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg('');

    try {
      await updateClinic(clinic.id, {
        name,
        tagline,
        description,
        phone,
        email,
        website,
        logoUrl,
        lobbyImageUrl,
        treatmentRoomImageUrl,
        features,
        locations
      });

      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to save setup:", err);
      setErrorMsg("Failed to save clinic setup.");
      setSaving(false);
    }
  };

  const clinicAppointments = appointments.filter(a => a.clinicSlug === clinic.slug || a.clinicId === clinic.id);

  return (
    <div id="clinic-setup-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateBack}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl transition-colors cursor-pointer"
            title="Back to Developer Portal"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Clinic Feature & Location Config
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Setup & Monitoring: {clinic.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                URI Path: /{clinic.slug}
              </p>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setShowUriModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                  title="Super Admin: Update Clinic URI and cascade across database"
                >
                  <Globe className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                  <span>Update Clinic URI</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToClinicView(clinic.slug, 'dashboard')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800"
            title="View Clinic Appointments & Operations Dashboard"
          >
            <Activity className="h-4 w-4 text-indigo-500" />
            <span>Clinic Dashboard</span>
          </button>

          <button
            onClick={() => onNavigateToClinicView(clinic.slug, 'portfolio')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 text-teal-500" />
            <span>Visit App Page</span>
          </button>

          <button
            onClick={handleSaveSetup}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Changes Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Feature Flags & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1 & 2: Feature Toggles & Location Management */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Feature Matrix / Setup Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-teal-500" />
                <span>Enabled Modular Features & App Pages</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle features on or off. Disabled features will be hidden from the clinic menu and dashboard for patients & staff.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                title="Appointments & Slot Engine"
                description="Real-time appointment booking, queue status tracking, and specialist slot allocation."
                enabled={features.appointments}
                onToggle={() => handleToggleFeature('appointments')}
              />

              <FeatureCard
                title="Billing & Invoicing"
                description="Treatment & consultation bill generation, printable PDF invoices, and payment mode collection."
                enabled={features.billing}
                onToggle={() => handleToggleFeature('billing')}
              />

              <FeatureCard
                title="AI Medical Assistant / Chatbot"
                description="Interactive conversational AI chatbot for specialty healthcare FAQs and smart triage."
                enabled={features.chatbot}
                onToggle={() => handleToggleFeature('chatbot')}
              />

              <FeatureCard
                title="Patient Support System"
                description="Help desk ticketing, patient query submission, and staff reply threads."
                enabled={features.supportSystem}
                onToggle={() => handleToggleFeature('supportSystem')}
              />

              <FeatureCard
                title="Doctor & Specialist Schedule Breakdown"
                description="Individual doctor/specialist schedule breakdown view & board-certified physician roster."
                enabled={features.dentistBreakdown}
                onToggle={() => handleToggleFeature('dentistBreakdown')}
              />

              <FeatureCard
                title="Automated Email Reminders"
                description="Real-time SMTP email notifications with QR code links sent upon booking & status updates."
                enabled={features.reminders}
                onToggle={() => handleToggleFeature('reminders')}
              />

              <FeatureCard
                title="Patient Testimonials & Reviews"
                description="Public review collection and star rating wall on the clinic portfolio page."
                enabled={features.reviews}
                onToggle={() => handleToggleFeature('reviews')}
              />

              <FeatureCard
                title="Multi-Branch Locations"
                description="Branch location selector for patient booking and location-scoped appointments."
                enabled={features.multiLocation}
                onToggle={() => handleToggleFeature('multiLocation')}
              />

              <FeatureCard
                title="Clinic Facilities & Patient Amenities"
                description="Infrastructure, medical amenities & accessibility showcase (Wheelchairs, Restrooms, Diagnostic Lab, Dispensary, etc.)."
                enabled={features.facilities !== false}
                onToggle={() => handleToggleFeature('facilities')}
              />

              <FeatureCard
                title="Finances & Clinic Expenses"
                description="Monthly earnings tracking, budget targets, clinic rent, staff salaries, consumables, and itemized clinic operational expense management."
                enabled={features.finances !== false}
                onToggle={() => handleToggleFeature('finances')}
              />
            </div>
          </div>

          {/* Location Management Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  <span>Clinic Branch Locations ({locations.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage physical clinic branches where patients can book appointments.
                </p>
              </div>

              <button
                onClick={() => setShowAddLocModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Branch Location</span>
              </button>
            </div>

            <div className="space-y-3">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    loc.isPrimary
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{loc.name}</h4>
                      {loc.isPrimary && (
                        <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Primary Flagship
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{loc.address}, {loc.city}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {loc.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {loc.workingHours}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!loc.isPrimary && (
                      <button
                        onClick={() => handleSetPrimaryLocation(loc.id)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Set as Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: General Info & Developer Monitoring */}
        <div className="space-y-8">
          {/* General Profile Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-500" />
              <span>General Profile Info</span>
            </h2>

            <div className="space-y-3 text-xs">
              {/* Clinic URI Slug & Routing */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Clinic Web URI Slug
                  </label>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowUriModal(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-lg text-[11px] font-bold border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                    >
                      <Globe className="h-3 w-3 text-teal-600" />
                      <span>Update URI</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-100/60 dark:bg-teal-900/60 px-2 py-0.5 rounded-lg">
                    /{clinic.slug}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Primary route for patient portal & dashboard
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Clinic Branding & Logo Upload Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-teal-500" />
              <span>Clinic Logo & Bill Branding</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload a custom clinic logo to be displayed across the header and on all printed/downloaded billing invoices for {name || 'this clinic'}.
            </p>

            <div className="space-y-4 text-xs">
              {/* Logo Preview */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Clinic Logo Preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 text-center">Default Logo</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Current Logo Status</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {logoUrl ? 'Custom uploaded logo active' : 'Using default app logo'}
                  </span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to default logo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Upload File Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Logo File (PNG, JPG, SVG)
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 dark:bg-teal-950/40 border border-dashed border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 rounded-xl font-bold cursor-pointer hover:bg-teal-100/60 dark:hover:bg-teal-900/50 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Choose Image File...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Recommended square or landscape format, max size 3MB.</p>
              </div>

              {/* Or Paste Logo URL */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Or Direct Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/clinic-logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Premium Lobby Showcase Image Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-500" />
              <span>Premium Lobby Showcase Image</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hero card image on the clinic portfolio homepage tagged with "PREMIUM LOBBY".
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-24 h-16 rounded-xl bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs shrink-0 relative">
                  {lobbyImageUrl ? (
                    <img src={lobbyImageUrl} alt="Lobby Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center h-full">Default Lobby</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Lobby Photo Status</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {lobbyImageUrl ? 'Custom lobby photo active' : 'Using default showcase photo'}
                  </span>
                  {lobbyImageUrl && (
                    <button
                      type="button"
                      onClick={() => setLobbyImageUrl('')}
                      className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to default photo</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Lobby Photo (PNG, JPG, WEBP)
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 border border-dashed border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-xl font-bold cursor-pointer hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Choose Lobby Photo...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLobbyFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Or Direct Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={lobbyImageUrl}
                  onChange={(e) => setLobbyImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* HYGIENIC & ULTRA-MODERN Showcase Image Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-500" />
              <span>Hygienic & Ultra-Modern Showcase Image</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clinical hygiene and operation theatre photo tagged with "HYGIENIC & ULTRA-MODERN".
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-24 h-16 rounded-xl bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs shrink-0 relative">
                  {treatmentRoomImageUrl ? (
                    <img src={treatmentRoomImageUrl} alt="Treatment Room Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center h-full">Default Room</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Hygiene Photo Status</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {treatmentRoomImageUrl ? 'Custom facility photo active' : 'Using default showcase photo'}
                  </span>
                  {treatmentRoomImageUrl && (
                    <button
                      type="button"
                      onClick={() => setTreatmentRoomImageUrl('')}
                      className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to default photo</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Treatment Room Photo (PNG, JPG, WEBP)
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Choose Treatment Room Photo...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTreatmentRoomFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Or Direct Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={treatmentRoomImageUrl}
                  onChange={(e) => setTreatmentRoomImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Developer Monitoring Summary for this clinic */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest">
              <Activity className="h-4 w-4" />
              <span>Developer Clinic Telemetry</span>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Total Clinic Bookings:</span>
                <span className="font-bold text-white">{clinicAppointments.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Active Branches:</span>
                <span className="font-bold text-white">{locations.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Active Feature Flags:</span>
                <span className="font-bold text-teal-400">{Object.values(features).filter(Boolean).length} / 10</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Database Status:</span>
                <span className="font-bold text-emerald-400">Firestore Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Location */}
      {showAddLocModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-500" />
                <span>Add Branch Location</span>
              </h3>
              <button onClick={() => setShowAddLocModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddLocationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Koramangala Dental Hub"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Bengaluru"
                  value={locCity}
                  onChange={(e) => setLocCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Address Details</label>
                <input
                  type="text"
                  placeholder="80 Feet Road, Koramangala"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Phone</label>
                <input
                  type="text"
                  placeholder="+91 80 4112 2200"
                  value={locPhone}
                  onChange={(e) => setLocPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Working Hours</label>
                <input
                  type="text"
                  placeholder="Mon - Sat: 09:00 AM - 07:00 PM"
                  value={locHours}
                  onChange={(e) => setLocHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-primary-loc"
                  checked={locIsPrimary}
                  onChange={(e) => setLocIsPrimary(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="chk-primary-loc" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as Primary Flagship Location
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLocModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super User Clinic URI Update Modal */}
      <UpdateClinicUriModal
        isOpen={showUriModal}
        onClose={() => setShowUriModal(false)}
        clinic={clinic}
        onSuccess={(newSlug) => {
          onNavigateToClinicView(newSlug, 'setup');
        }}
      />
    </div>
  );
}

function FeatureCard({ title, description, enabled, onToggle }: { title: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all space-y-2 flex flex-col justify-between ${
      enabled 
        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{title}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{description}</p>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {enabled ? 'Active Feature' : 'Disabled'}
        </span>

        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
