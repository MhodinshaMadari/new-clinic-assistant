import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  X
} from 'lucide-react';
import { Clinic } from '../types';
import { useClinic } from '../context/ClinicContext';
import {
  validateClinicUri,
  normalizeClinicUri,
  updateClinicUriCascading,
  ClinicUriValidationResult,
  ClinicUriUpdateStats
} from '../services/clinicUriService';

interface UpdateClinicUriModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  onSuccess?: (newSlug: string, stats: ClinicUriUpdateStats) => void;
}

export function UpdateClinicUriModal({
  isOpen,
  onClose,
  clinic,
  onSuccess
}: UpdateClinicUriModalProps) {
  const { clinics, updateClinicUri } = useClinic();

  const [inputSlug, setInputSlug] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<ClinicUriValidationResult | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [completedStats, setCompletedStats] = useState<ClinicUriUpdateStats | null>(null);

  // Initialize input when modal opens with clinic
  useEffect(() => {
    if (clinic && isOpen) {
      setInputSlug(clinic.slug);
      setValidation(null);
      setCompletedStats(null);
      setUpdateError(null);
      setProgressPercent(0);
      setProgressStep('');
    }
  }, [clinic, isOpen]);

  // Debounced real-time validation
  useEffect(() => {
    if (!isOpen || !clinic) return;

    const trimmed = inputSlug.trim();
    if (!trimmed) {
      setValidation(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(async () => {
      try {
        const result = await validateClinicUri(trimmed, clinic.id, clinic.slug, clinics);
        setValidation(result);
      } catch (err: any) {
        setValidation({
          isValid: false,
          error: err?.message || 'Failed to validate URI uniqueness.',
          normalizedSlug: normalizeClinicUri(trimmed)
        });
      } finally {
        setIsValidating(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [inputSlug, clinic, clinics, isOpen]);

  if (!isOpen || !clinic) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-normalize space to hyphen as they type
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setInputSlug(val);
  };

  const handleExecuteUpdate = async () => {
    if (!validation?.isValid || !validation.normalizedSlug) return;
    const newSlug = validation.normalizedSlug;

    setIsUpdating(true);
    setUpdateError(null);
    setProgressPercent(5);
    setProgressStep('Initiating super-user cascading URI migration...');

    try {
      // Use clinic context update helper to keep state in sync
      const stats = await updateClinicUri(clinic.id, clinic.slug, newSlug, (step, percent) => {
        setProgressStep(step);
        setProgressPercent(percent);
      });

      setCompletedStats(stats);
      if (onSuccess) {
        onSuccess(newSlug, stats);
      }
    } catch (err: any) {
      console.error('Failed to update clinic URI across database:', err);
      setUpdateError(err?.message || 'An unexpected error occurred during database migration.');
    } finally {
      setIsUpdating(false);
    }
  };

  const isFormValid = Boolean(validation?.isValid && !isValidating && !isUpdating);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500 text-white rounded-2xl shadow-md shadow-teal-500/20">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                  Super Admin Exclusive
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {clinic.id}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Update Clinic URI & Database References
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clinic: <strong className="text-slate-700 dark:text-slate-200">{clinic.name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Success State */}
          {completedStats ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                  Clinic URI Successfully Updated!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                  The clinic URI has been changed from <code className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900/70 px-1.5 py-0.5 rounded">/{clinic.slug}</code> to{' '}
                  <code className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900/70 px-1.5 py-0.5 rounded">/{validation?.normalizedSlug}</code> and synchronized across all Firestore collections.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-500" />
                    <span>Cascading Update Summary:</span>
                  </span>
                  <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full font-mono text-[11px]">
                    {completedStats.totalUpdated} total records updated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Clinics</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{completedStats.clinicsUpdated} docs</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">User Profiles</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{completedStats.usersUpdated} docs</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Appointments</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{completedStats.appointmentsUpdated} docs</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-sky-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Invoices & Bills</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{completedStats.invoicesUpdated + completedStats.billsUpdated} docs</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Finances & Expenses</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{completedStats.monthlyFinancesUpdated + completedStats.expensesUpdated} docs</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-purple-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Services & Settings</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{completedStats.servicesUpdated + completedStats.settingsUpdated + completedStats.reviewsUpdated} docs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetSlug = validation?.normalizedSlug || clinic.slug;
                    window.location.href = `/${targetSlug}/dashboard`;
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Go to /{validation?.normalizedSlug || clinic.slug} Dashboard</span>
                </button>
              </div>
            </div>
          ) : (
            /* Editing & Updating State */
            <div className="space-y-6">
              {/* Informational Warning */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Database Cascading Warning</p>
                  <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                    Changing this URI will validate that it is completely unique across the system. Upon confirmation, it will automatically update all existing records that reference the older URI (Appointments, Patient Profiles, Invoices, Expenses, Services, Reviews, and Settings).
                  </p>
                </div>
              </div>

              {/* Comparison Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Clinic URI</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">
                      /{clinic.slug}
                    </span>
                  </div>

                  <ArrowRight className="hidden sm:block h-4 w-4 text-slate-400" />

                  <div>
                    <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">New Candidate URI</span>
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-300 text-sm">
                      /{validation?.normalizedSlug || normalizeClinicUri(inputSlug) || '...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Field with Live Feedback */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enter New Clinic URI Slug *
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs font-bold">
                    /
                  </div>
                  <input
                    type="text"
                    disabled={isUpdating}
                    value={inputSlug}
                    onChange={handleInputChange}
                    placeholder="e.g. apex-dental-care"
                    className={`w-full pl-7 pr-10 py-3 bg-white dark:bg-slate-900 border rounded-2xl text-sm font-mono font-semibold transition-all focus:outline-none focus:ring-2 ${
                      isValidating
                        ? 'border-indigo-300 dark:border-indigo-700 focus:ring-indigo-500/20'
                        : validation?.isValid
                        ? 'border-emerald-500 focus:ring-emerald-500/20 text-emerald-900 dark:text-emerald-100'
                        : validation?.error
                        ? 'border-rose-400 focus:ring-rose-500/20 text-rose-900 dark:text-rose-100'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500/20'
                    }`}
                  />

                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                    {isValidating ? (
                      <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" />
                    ) : validation?.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : validation?.error ? (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>

                {/* Validation Status Message */}
                <div className="min-h-[22px]">
                  {isValidating ? (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Checking Firestore uniqueness...</span>
                    </p>
                  ) : validation?.isValid ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>URI is valid and completely unique across the database!</span>
                    </p>
                  ) : validation?.error ? (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{validation.error}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Use 3–50 lowercase characters, numbers, and hyphens (e.g. <code>metro-dental-hub</code>).
                    </p>
                  )}
                </div>
              </div>

              {/* In-Progress View */}
              {isUpdating && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-2xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-900 dark:text-teal-200">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                      <span>{progressStep}</span>
                    </span>
                    <span className="font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-teal-100 dark:bg-teal-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-teal-700 dark:text-teal-300 italic">
                    Please do not close this window while database writes are committing.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {updateError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{updateError}</span>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUpdating}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteUpdate}
                  disabled={!isFormValid}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Updating Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Validate & Update URI Everywhere</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
