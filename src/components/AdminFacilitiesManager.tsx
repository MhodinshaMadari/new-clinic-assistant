import React, { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicFacility } from '../types';
import { 
  FacilityIcon, 
  FACILITY_CATEGORIES, 
  AVAILABLE_FACILITY_ICONS, 
  DEFAULT_FACILITIES 
} from '../data/defaultFacilities';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  RefreshCw,
  Info,
  SlidersHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminFacilitiesManager: React.FC = () => {
  const { activeClinic, updateClinic } = useClinic();

  // Active clinic facilities list with fallback
  const facilities: ClinicFacility[] = useMemo(() => {
    if (activeClinic?.facilities && activeClinic.facilities.length > 0) {
      return activeClinic.facilities;
    }
    return DEFAULT_FACILITIES;
  }, [activeClinic?.facilities]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<ClinicFacility | null>(null);
  const [deleteTargetFacility, setDeleteTargetFacility] = useState<ClinicFacility | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Accessibility');
  const [formIcon, setFormIcon] = useState<string>('Accessibility');
  const [formBadge, setFormBadge] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    let list = facilities;

    if (categoryFilter !== 'All') {
      list = list.filter(f => f.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.badge && f.badge.toLowerCase().includes(q))
      );
    }

    return list;
  }, [facilities, categoryFilter, searchQuery]);

  const enabledCount = useMemo(() => facilities.filter(f => f.isEnabled !== false).length, [facilities]);
  const disabledCount = facilities.length - enabledCount;

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingFacility(null);
    setFormName('');
    setFormCategory('Accessibility');
    setFormIcon('Accessibility');
    setFormBadge('');
    setFormDescription('');
    setFormIsEnabled(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (facility: ClinicFacility) => {
    setEditingFacility(facility);
    setFormName(facility.name);
    setFormCategory(facility.category || 'Accessibility');
    setFormIcon(facility.icon || 'Accessibility');
    setFormBadge(facility.badge || '');
    setFormDescription(facility.description || '');
    setFormIsEnabled(facility.isEnabled !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic) return;

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Please provide a valid facility name.');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Please enter a brief description for this facility.');
      return;
    }

    // UNIQUE NAME VALIDATION (Case-insensitive)
    const isDuplicate = facilities.some(f => {
      if (editingFacility && f.id === editingFacility.id) return false;
      return f.name.trim().toLowerCase() === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      setFormError(`A facility named "${trimmedName}" already exists for ${activeClinic.name}. Facility names must be unique.`);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      let updatedFacilities: ClinicFacility[] = [];

      const trimmedBadge = formBadge.trim();

      if (editingFacility) {
        // Edit existing
        updatedFacilities = facilities.map(f => {
          if (f.id === editingFacility.id) {
            const updated: ClinicFacility = {
              ...f,
              name: trimmedName,
              category: formCategory as any,
              icon: formIcon,
              description: formDescription.trim(),
              isEnabled: formIsEnabled,
              updatedAt: new Date().toISOString()
            };
            if (trimmedBadge) {
              updated.badge = trimmedBadge;
            } else {
              delete updated.badge;
            }
            return updated;
          }
          return f;
        });
      } else {
        // Add new
        const newFacility: ClinicFacility = {
          id: `fac-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: trimmedName,
          category: formCategory as any,
          icon: formIcon,
          description: formDescription.trim(),
          isEnabled: formIsEnabled,
          createdAt: new Date().toISOString(),
          ...(trimmedBadge ? { badge: trimmedBadge } : {})
        };
        updatedFacilities = [newFacility, ...facilities];
      }

      await updateClinic(activeClinic.id, { facilities: updatedFacilities });

      setIsSaving(false);
      setIsModalOpen(false);
      showTemporaryToast(editingFacility ? `Updated "${trimmedName}"` : `Added "${trimmedName}"`);
    } catch (err: any) {
      console.error('Failed to save facility:', err);
      setFormError(err.message || 'Failed to save facility. Please try again.');
      setIsSaving(false);
    }
  };

  // Toggle Facility Status
  const handleToggleStatus = async (facility: ClinicFacility) => {
    if (!activeClinic) return;
    const newStatus = !(facility.isEnabled !== false);

    const updatedFacilities = facilities.map(f => {
      if (f.id === facility.id) {
        return { ...f, isEnabled: newStatus, updatedAt: new Date().toISOString() };
      }
      return f;
    });

    try {
      await updateClinic(activeClinic.id, { facilities: updatedFacilities });
      showTemporaryToast(`Facility "${facility.name}" is now ${newStatus ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      console.error('Failed to toggle facility:', err);
      alert('Failed to update facility status.');
    }
  };

  // Delete Facility
  const handleConfirmDelete = async () => {
    if (!activeClinic || !deleteTargetFacility) return;

    const updatedFacilities = facilities.filter(f => f.id !== deleteTargetFacility.id);

    try {
      await updateClinic(activeClinic.id, { facilities: updatedFacilities });
      showTemporaryToast(`Removed facility "${deleteTargetFacility.name}"`);
      setDeleteTargetFacility(null);
    } catch (err) {
      console.error('Failed to delete facility:', err);
      alert('Failed to delete facility.');
    }
  };

  // Restore Default Facilities
  const handleRestoreDefaults = async () => {
    if (!activeClinic) return;

    try {
      await updateClinic(activeClinic.id, { facilities: DEFAULT_FACILITIES });
      showTemporaryToast('Reset to standard medical facilities pack');
      setShowRestoreModal(false);
    } catch (err) {
      console.error('Failed to restore defaults:', err);
      alert('Failed to reset facilities.');
    }
  };

  const showTemporaryToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  return (
    <div id="admin-facilities-manager" className="space-y-6">
      {/* Toast notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-teal-500/40 flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Banner & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base font-display">
              Clinic Infrastructure & Patient Facilities
            </span>
            <span className="px-2.5 py-0.5 bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold rounded-full font-mono">
              Unique Names Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage on-site amenities (Wheelchair, Toilets, Diagnostic Lab, Dispensary, Valet, HEPA, etc.) shown on your public clinic portfolio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowRestoreModal(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Reset to default facilities"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Standards</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Facility</span>
          </button>
        </div>
      </div>

      {/* Metrics Row & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Facilities</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{facilities.length}</span>
          </div>
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-mono">Enabled on Portfolio</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{enabledCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Disabled / Hidden</span>
            <span className="text-lg font-black text-slate-500 dark:text-slate-400 font-mono">{disabledCount}</span>
          </div>
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl">
            <EyeOff className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search facility name, description, badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === 'All'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {FACILITY_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities Cards Grid */}
      {filteredFacilities.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center space-y-3">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No facilities match your search query or filter.</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }}
            className="text-xs text-teal-600 font-bold hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacilities.map((facility) => {
            const isEnabled = facility.isEnabled !== false;

            return (
              <div
                key={facility.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isEnabled
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-75'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isEnabled
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800/80'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        <FacilityIcon iconName={facility.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {facility.name}
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 font-mono block">
                          {facility.category || 'General'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(facility)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors border ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                      title={isEnabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {facility.description}
                  </p>

                  {facility.badge && (
                    <div className="pt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200/70 dark:border-slate-700">
                        Tag: {facility.badge}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {facility.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(facility)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="Edit facility details"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Modify</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetFacility(facility)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      title="Remove facility"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADD / EDIT FACILITY MODAL */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <FacilityIcon iconName={formIcon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base font-display">
                    {editingFacility ? 'Modify Clinic Facility' : 'Add New Clinic Facility'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeClinic?.name || 'Clinic'} Amenities Registry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-fadeIn font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitFacility} className="space-y-4 text-xs">
              {/* Facility Name (Unique) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold">
                    Must be unique
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Wheelchair Accessible Ramp, Diagnostic Lab, Pharmacy"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Category & Badge */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Facility Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {FACILITY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Highlight Tag / Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Accessible, Same-Day Reports"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Visual Icon Picker */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Select Facility Icon
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                  {AVAILABLE_FACILITY_ICONS.map((item) => {
                    const isSelected = formIcon === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs scale-105 ring-2 ring-teal-500/40'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Description & Patient Benefit <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the availability, features, and patient instructions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Enable / Disable switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    Enable on Clinic Portfolio
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Display this facility card publicly to patients browsing your clinic page.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsEnabled(!formIsEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    formIsEnabled ? 'bg-teal-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Saving...' : editingFacility ? 'Update Facility' : 'Add Facility'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ===================================================================== */}
      {deleteTargetFacility && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Delete Facility?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-slate-900 dark:text-white">"{deleteTargetFacility.name}"</strong> from {activeClinic?.name}? This will remove it from the clinic amenities showcase.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetFacility(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Yes, Delete Facility
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* RESTORE DEFAULTS CONFIRMATION MODAL */}
      {/* ===================================================================== */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-teal-600">
              <div className="p-2.5 bg-teal-50 dark:bg-teal-950 rounded-xl">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Reset Standard Medical Facilities?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will reset the facilities registry of <strong className="text-slate-900 dark:text-white">{activeClinic?.name}</strong> to the standard 10 medical amenities (Wheelchairs, Sanitized Restrooms, Diagnostic Lab, Dispensary, Valet Parking, Executive Lounge, HEPA Clean Rooms, etc.).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Reset to Standards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
