import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useClinicData } from '../hooks/useClinicData';
import { useAuth } from '../context/AuthContext';
import { 
  ClinicLiveStatus, 
  DoctorAvailabilityStatus, 
  DoctorAvailability, 
  ScheduledStatusSlot, 
  ScheduledClinicSlot 
} from '../types';
import { 
  Activity, 
  CheckCircle2, 
  Coffee, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Stethoscope, 
  User, 
  Edit3, 
  Save, 
  Radio,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CalendarClock,
  RefreshCw,
  X,
  Check,
  Building2,
  Timer
} from 'lucide-react';

export function ClinicLiveStatusBar() {
  const { activeClinic, updateClinic } = useClinic();
  const { dentists, surgeons } = useClinicData();
  const { userProfile } = useAuth();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showDoctorDrawer, setShowDoctorDrawer] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Clinic Scheduling Modal State
  const [showClinicScheduleModal, setShowClinicScheduleModal] = useState(false);
  const [scheduleClinicMode, setScheduleClinicMode] = useState<'open' | 'lunch_break' | 'emergency_only' | 'closed'>('lunch_break');
  const [scheduleClinicStart, setScheduleClinicStart] = useState('');
  const [scheduleClinicEnd, setScheduleClinicEnd] = useState('');
  const [scheduleClinicNote, setScheduleClinicNote] = useState('');
  const [scheduleClinicAutoRevert, setScheduleClinicAutoRevert] = useState(true);

  // Doctor Scheduling Modal State
  const [schedulingDoctor, setSchedulingDoctor] = useState<{ id: string; name: string; specialty: string } | null>(null);
  const [scheduleDoctorStatus, setScheduleDoctorStatus] = useState<DoctorAvailabilityStatus>('in_surgery');
  const [scheduleDoctorStart, setScheduleDoctorStart] = useState('');
  const [scheduleDoctorEnd, setScheduleDoctorEnd] = useState('');
  const [scheduleDoctorChair, setScheduleDoctorChair] = useState('Chair 1');
  const [scheduleDoctorNote, setScheduleDoctorNote] = useState('');
  const [scheduleDoctorAutoRevert, setScheduleDoctorAutoRevert] = useState(true);

  // If user is a patient or not logged in, they cannot manage status
  if (!userProfile || userProfile.role === 'patient') {
    return null;
  }

  const liveStatus: ClinicLiveStatus = activeClinic?.liveStatus || {
    isOpen: true,
    statusMode: 'open',
    customNote: 'Walk-ins & scheduled appointments welcome',
    expectedResumeTime: '',
    doctorAvailability: {}
  };

  const activeSlug = activeClinic?.slug || 'revon-dental';

  // Compile full list of doctors/dentists strictly scoped to the active clinic
  const doctorsList = useMemo(() => {
    const list: { id: string; name: string; specialty: string; clinicSlug?: string }[] = [];
    
    // Add dentists strictly scoped to active clinic
    dentists.forEach(d => {
      const docSlug = d.clinicSlug || 'revon-dental';
      if (docSlug === activeSlug && !list.some(item => item.id === d.uid)) {
        list.push({
          id: d.uid,
          name: d.displayName || 'Dentist',
          specialty: d.specialty || 'General Dental Practitioner',
          clinicSlug: docSlug
        });
      }
    });

    // Add surgeons strictly scoped to active clinic
    surgeons.forEach(s => {
      const docSlug = s.clinicSlug || 'revon-dental';
      if (s.isActive && docSlug === activeSlug && !list.some(item => item.id === s.id)) {
        list.push({
          id: s.id,
          name: s.displayName,
          specialty: s.specialty || 'Dental Surgeon',
          clinicSlug: docSlug
        });
      }
    });

    return list;
  }, [dentists, surgeons, activeSlug]);

  // Format Helper: Get time string e.g. "02:30 PM" from Date
  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Helper: Format time for datetime-local or time input (HH:mm)
  const formatTimeInput = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Automated schedule monitor: evaluates active slots and auto-reverts when expired
  useEffect(() => {
    const checkSchedules = async () => {
      if (!activeClinic?.id || !activeClinic.liveStatus) return;
      const now = new Date();
      let hasChanges = false;
      const live = { ...activeClinic.liveStatus };

      // 1. Check clinic scheduled slot
      if (live.scheduledSlot?.endTime) {
        const endD = new Date(live.scheduledSlot.endTime);
        const isExpired = !isNaN(endD.getTime()) && now >= endD;
        if (isExpired && live.scheduledSlot.autoRevert !== false) {
          live.statusMode = 'open';
          live.isOpen = true;
          live.customNote = 'Scheduled window completed. Clinic is open.';
          live.expectedResumeTime = '';
          live.scheduledSlot = undefined;
          live.scheduledUntil = '';
          hasChanges = true;
        }
      }

      // 2. Check each doctor's scheduled slot
      if (live.doctorAvailability) {
        const updatedDocs = { ...live.doctorAvailability };
        Object.keys(updatedDocs).forEach(docId => {
          const docItem = updatedDocs[docId];
          if (docItem?.scheduledSlot?.endTime) {
            const docEndD = new Date(docItem.scheduledSlot.endTime);
            if (!isNaN(docEndD.getTime()) && now >= docEndD && docItem.scheduledSlot.autoRevert !== false) {
              updatedDocs[docId] = {
                ...docItem,
                status: 'available',
                statusNote: 'Scheduled procedure completed',
                scheduledUntil: '',
                scheduledSlot: undefined,
                updatedAt: new Date().toISOString(),
                updatedBy: 'Automated Schedule Manager'
              };
              hasChanges = true;
            }
          }
        });
        if (hasChanges) {
          live.doctorAvailability = updatedDocs;
        }
      }

      if (hasChanges) {
        live.updatedAt = new Date().toISOString();
        await updateClinic(activeClinic.id, { liveStatus: live });
      }
    };

    const interval = setInterval(checkSchedules, 20000); // Check every 20s
    return () => clearInterval(interval);
  }, [activeClinic, updateClinic]);

  // Synchronize available doctors for the respective clinic scope alone
  const handleSyncAvailableDoctors = async () => {
    if (!activeClinic) return;
    try {
      setIsUpdating(true);
      const currentDocAvail = { ...(liveStatus.doctorAvailability || {}) };
      const validDoctorIds = new Set(doctorsList.map(d => d.id));
      
      // Prune doctors that do not belong to this clinic scope
      const syncedAvail: Record<string, DoctorAvailability> = {};
      Object.entries(currentDocAvail).forEach(([id, data]) => {
        if (validDoctorIds.has(id)) {
          syncedAvail[id] = data;
        }
      });

      // Ensure all current clinic doctors exist in the availability map
      doctorsList.forEach(doc => {
        if (!syncedAvail[doc.id]) {
          syncedAvail[doc.id] = {
            dentistId: doc.id,
            dentistName: doc.name,
            status: 'available',
            statusNote: 'Ready for consults',
            updatedAt: new Date().toISOString(),
            updatedBy: userProfile.displayName || userProfile.role
          };
        }
      });

      const updatedLiveStatus: ClinicLiveStatus = {
        ...liveStatus,
        doctorAvailability: syncedAvail,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      await updateClinic(activeClinic.id, { liveStatus: updatedLiveStatus });
      setSuccessToast(`Synchronized ${doctorsList.length} doctors exclusively for ${activeClinic.name}`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to sync doctors:', err);
      alert('Failed to sync doctors: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle immediate clinic mode change
  const handleSetClinicMode = async (mode: 'open' | 'lunch_break' | 'emergency_only' | 'closed') => {
    if (!activeClinic) return;
    try {
      setIsUpdating(true);
      const isOpen = mode === 'open' || mode === 'emergency_only';
      let customNote = '';
      let expectedResumeTime = '';

      if (mode === 'open') {
        customNote = 'Walk-ins & scheduled consultations welcome';
      } else if (mode === 'lunch_break') {
        customNote = 'Staff on afternoon lunch break';
        expectedResumeTime = '02:00 PM';
      } else if (mode === 'emergency_only') {
        customNote = 'Emergency on-call dental procedures only';
      } else {
        customNote = 'Clinic is currently closed for the day';
      }

      const updatedLiveStatus: ClinicLiveStatus = {
        ...liveStatus,
        isOpen,
        statusMode: mode,
        customNote,
        expectedResumeTime,
        scheduledSlot: undefined, // Clear schedule on manual override
        scheduledUntil: undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      await updateClinic(activeClinic.id, { liveStatus: updatedLiveStatus });
      setSuccessToast(`Clinic status set to ${mode.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to update clinic status:', err);
      alert('Failed to update clinic status: ' + (err.message || 'Error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Clinic Schedule Modal
  const handleOpenClinicScheduleModal = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    setScheduleClinicMode(liveStatus.statusMode === 'open' ? 'lunch_break' : liveStatus.statusMode);
    setScheduleClinicStart(formatTimeInput(now));
    setScheduleClinicEnd(formatTimeInput(end));
    setScheduleClinicNote(liveStatus.customNote || 'Scheduled operational window');
    setScheduleClinicAutoRevert(true);
    setShowClinicScheduleModal(true);
  };

  // Apply Clinic Schedule
  const handleSaveClinicSchedule = async () => {
    if (!activeClinic || !scheduleClinicStart || !scheduleClinicEnd) {
      alert('Please select both start and end times for the schedule.');
      return;
    }

    try {
      setIsUpdating(true);
      const now = new Date();
      
      // Build ISO timestamps for today with given times
      const [startH, startM] = scheduleClinicStart.split(':').map(Number);
      const [endH, endM] = scheduleClinicEnd.split(':').map(Number);

      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, 0);
      let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, 0);
      if (endDate <= startDate) {
        // If end time is earlier, assume next day
        endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
      }

      const formattedEndDisplay = formatTimeDisplay(endDate);
      const scheduledSlot: ScheduledClinicSlot = {
        statusMode: scheduleClinicMode,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        note: scheduleClinicNote.trim() || undefined,
        autoRevert: scheduleClinicAutoRevert
      };

      const updatedLiveStatus: ClinicLiveStatus = {
        ...liveStatus,
        isOpen: scheduleClinicMode === 'open' || scheduleClinicMode === 'emergency_only',
        statusMode: scheduleClinicMode,
        customNote: scheduleClinicNote.trim() || `Scheduled ${scheduleClinicMode.replace('_', ' ')}`,
        expectedResumeTime: formattedEndDisplay,
        scheduledUntil: formattedEndDisplay,
        scheduledSlot,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      await updateClinic(activeClinic.id, { liveStatus: updatedLiveStatus });
      setShowClinicScheduleModal(false);
      setSuccessToast(`Scheduled ${scheduleClinicMode.replace('_', ' ').toUpperCase()} until ${formattedEndDisplay}`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to schedule clinic status:', err);
      alert('Failed to save schedule: ' + (err.message || 'Error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Clear / Cancel Clinic Schedule
  const handleClearClinicSchedule = async () => {
    if (!activeClinic) return;
    try {
      setIsUpdating(true);
      const updatedLiveStatus: ClinicLiveStatus = {
        ...liveStatus,
        isOpen: true,
        statusMode: 'open',
        customNote: 'Walk-ins & scheduled appointments welcome',
        expectedResumeTime: '',
        scheduledUntil: '',
        scheduledSlot: undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };
      await updateClinic(activeClinic.id, { liveStatus: updatedLiveStatus });
      setSuccessToast('Scheduled clinic window cleared. Clinic is Open.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert('Failed to clear schedule: ' + (err.message || 'Error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle immediate doctor status change
  const handleUpdateDoctorStatus = async (
    dentistId: string, 
    dentistName: string, 
    status: DoctorAvailabilityStatus,
    note?: string
  ) => {
    if (!activeClinic) return;
    try {
      setIsUpdating(true);
      const currentDocAvail = { ...(liveStatus.doctorAvailability || {}) };
      
      currentDocAvail[dentistId] = {
        dentistId,
        dentistName,
        status,
        statusNote: note !== undefined ? note : (currentDocAvail[dentistId]?.statusNote || ''),
        chairRoom: currentDocAvail[dentistId]?.chairRoom || 'Chair 1',
        scheduledUntil: undefined, // Clear schedule on manual switch
        scheduledSlot: undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      const updatedLiveStatus: ClinicLiveStatus = {
        ...liveStatus,
        doctorAvailability: currentDocAvail,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      await updateClinic(activeClinic.id, { liveStatus: updatedLiveStatus });
      setSuccessToast(`${dentistName} marked as ${status.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to update doctor availability:', err);
      alert('Failed to update doctor status: ' + (err.message || 'Error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Doctor Scheduling Modal
  const handleOpenDoctorScheduleModal = (doc: { id: string; name: string; specialty: string }) => {
    const now = new Date();
    const end = new Date(now.getTime() + 45 * 60 * 1000); // 45 mins default for procedure
    const existing = liveStatus.doctorAvailability?.[doc.id];

    setSchedulingDoctor(doc);
    setScheduleDoctorStatus(existing?.status && existing.status !== 'available' ? existing.status : 'in_surgery');
    setScheduleDoctorStart(formatTimeInput(now));
    setScheduleDoctorEnd(formatTimeInput(end));
    setScheduleDoctorChair(existing?.chairRoom || 'Chair 1');
    setScheduleDoctorNote(existing?.statusNote || 'Chairside Procedure');
    setScheduleDoctorAutoRevert(true);
  };

  // Apply Doctor Schedule
  const handleSaveDoctorSchedule = async () => {
    if (!activeClinic || !schedulingDoctor || !scheduleDoctorStart || !scheduleDoctorEnd) {
      alert('Please specify both start and end times for the doctor schedule.');
      return;
    }

    try {
      setIsUpdating(true);
      const now = new Date();
      const [startH, startM] = scheduleDoctorStart.split(':').map(Number);
      const [endH, endM] = scheduleDoctorEnd.split(':').map(Number);

      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, 0);
      let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, 0);
      if (endDate <= startDate) {
        endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
      }

      const formattedEndDisplay = formatTimeDisplay(endDate);
      const scheduledSlot: ScheduledStatusSlot = {
        status: scheduleDoctorStatus,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        reason: scheduleDoctorNote.trim() || undefined,
        autoRevert: scheduleDoctorAutoRevert
      };

      const currentDocAvail = { ...(liveStatus.doctorAvailability || {}) };
      currentDocAvail[schedulingDoctor.id] = {
        dentistId: schedulingDoctor.id,
        dentistName: schedulingDoctor.name,
        status: scheduleDoctorStatus,
        statusNote: scheduleDoctorNote.trim() || `${scheduleDoctorStatus.replace('_', ' ')} until ${formattedEndDisplay}`,
        chairRoom: scheduleDoctorChair,
        scheduledUntil: formattedEndDisplay,
        scheduledSlot,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      const updatedLiveStatus: ClinicLiveStatus = {
        ...liveStatus,
        doctorAvailability: currentDocAvail,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      await updateClinic(activeClinic.id, { liveStatus: updatedLiveStatus });
      setSchedulingDoctor(null);
      setSuccessToast(`Scheduled ${schedulingDoctor.name} (${scheduleDoctorStatus.replace('_', ' ')}) until ${formattedEndDisplay}`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to schedule doctor:', err);
      alert('Failed to save doctor schedule: ' + (err.message || 'Error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Clear Doctor Schedule
  const handleClearDoctorSchedule = async (docId: string, docName: string) => {
    if (!activeClinic) return;
    try {
      setIsUpdating(true);
      const currentDocAvail = { ...(liveStatus.doctorAvailability || {}) };
      if (currentDocAvail[docId]) {
        currentDocAvail[docId] = {
          ...currentDocAvail[docId],
          status: 'available',
          statusNote: 'Available for consultations',
          scheduledUntil: undefined,
          scheduledSlot: undefined,
          updatedAt: new Date().toISOString(),
          updatedBy: userProfile.displayName || userProfile.role
        };
      }

      const updatedLiveStatus: ClinicLiveStatus = {
        ...liveStatus,
        doctorAvailability: currentDocAvail,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile.displayName || userProfile.role
      };

      await updateClinic(activeClinic.id, { liveStatus: updatedLiveStatus });
      setSuccessToast(`${docName} schedule cleared. Now Available.`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert('Failed to clear doctor schedule: ' + (err.message || 'Error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Clinic Mode Badge config
  const getClinicModeBadge = () => {
    switch (liveStatus.statusMode) {
      case 'open':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500 animate-pulse',
          icon: CheckCircle2,
          label: 'CLINIC OPEN'
        };
      case 'lunch_break':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
          icon: Coffee,
          label: 'LUNCH BREAK'
        };
      case 'emergency_only':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500 animate-ping',
          icon: AlertTriangle,
          label: 'EMERGENCY ONLY'
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: XCircle,
          label: 'CLINIC CLOSED'
        };
    }
  };

  const currentBadge = getClinicModeBadge();
  const hasActiveClinicSchedule = Boolean(liveStatus.scheduledSlot || liveStatus.scheduledUntil);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4 mb-4 animate-fadeIn">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Active Clinic Schedule Alert Banner */}
      {hasActiveClinicSchedule && (
        <div className="p-3 bg-amber-50/90 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center space-x-2.5 text-xs text-amber-900 dark:text-amber-200">
            <CalendarClock className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px]">Active Schedule:</span>{' '}
              <span className="font-semibold">{liveStatus.statusMode.replace('_', ' ').toUpperCase()}</span>{' '}
              {liveStatus.scheduledUntil && (
                <span>until <strong className="font-mono">{liveStatus.scheduledUntil}</strong></span>
              )}
              {liveStatus.customNote && <span className="text-amber-700 dark:text-amber-300"> — {liveStatus.customNote}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenClinicScheduleModal}
              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-100/50 cursor-pointer transition-all"
            >
              Modify
            </button>
            <button
              type="button"
              onClick={handleClearClinicSchedule}
              className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg cursor-pointer transition-all"
            >
              Clear Schedule
            </button>
          </div>
        </div>
      )}

      {/* Main Bar Flex Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Current Live Status Overview & Clinic Scope */}
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5 sm:mt-0">
            <Radio className="h-5 w-5 text-teal-600 dark:text-teal-400 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm font-display">
                Real-Time Clinic & Doctor Live Status
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1.5 ${currentBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${currentBadge.dot}`} />
                <span>{currentBadge.label}</span>
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-300 font-mono bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/60 dark:border-teal-800/60 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>Scope: {activeClinic?.name}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>{liveStatus.customNote || 'Walk-ins & consultations welcome'}</span>
              {liveStatus.expectedResumeTime && (
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  · Resumes {liveStatus.expectedResumeTime}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Clinic Mode Switcher & Schedule Action */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleSetClinicMode('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              liveStatus.statusMode === 'open' && !hasActiveClinicSchedule
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Instant switch: Clinic Open"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Open</span>
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleSetClinicMode('lunch_break')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              liveStatus.statusMode === 'lunch_break' && !hasActiveClinicSchedule
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Instant switch: Lunch Break"
          >
            <Coffee className="h-3.5 w-3.5" />
            <span>Lunch Break</span>
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleSetClinicMode('emergency_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              liveStatus.statusMode === 'emergency_only' && !hasActiveClinicSchedule
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Instant switch: Emergency Only"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Emergency</span>
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleSetClinicMode('closed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              liveStatus.statusMode === 'closed' && !hasActiveClinicSchedule
                ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Instant switch: Clinic Closed"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Closed</span>
          </button>

          {/* Schedule Status Button */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleOpenClinicScheduleModal}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              hasActiveClinicSchedule
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
            }`}
            title="Schedule clinic operational status window with automatic reversion"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            <span>{hasActiveClinicSchedule ? 'Scheduled Active' : 'Schedule Status'}</span>
          </button>

          {/* Doctor Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowDoctorDrawer(!showDoctorDrawer)}
            className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-teal-300/80 dark:border-teal-800 shadow-xs"
          >
            <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
            <span>Doctor Availability ({doctorsList.length})</span>
            {showDoctorDrawer ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

      </div>

      {/* Expandable Doctor Roster Availability Panel */}
      {showDoctorDrawer && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                <span>Doctor Chairside & Surgery Availability Roster</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exclusively synced to <strong className="text-teal-600 dark:text-teal-400">{activeClinic?.name}</strong>. Assistants can toggle real-time chair status or schedule future procedure windows.
              </p>
            </div>
            
            {/* Sync Available Doctors for This Clinic Scope Button */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSyncAvailableDoctors}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-xs"
                title="Sync and clean roster for active clinic scope alone"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-teal-600 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>Sync Clinic Doctors ({doctorsList.length})</span>
              </button>
            </div>
          </div>

          {doctorsList.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <User className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No Specialists Configured for this Clinic Scope</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Add specialists in the Team Manager tab under Admin Portal to manage their chairside availability here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {doctorsList.map((doc) => {
                const currentDocState = liveStatus.doctorAvailability?.[doc.id] || {
                  dentistId: doc.id,
                  dentistName: doc.name,
                  status: 'available' as DoctorAvailabilityStatus,
                  statusNote: ''
                };

                const hasSchedule = Boolean(currentDocState.scheduledSlot || currentDocState.scheduledUntil);

                const statusColor = {
                  available: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
                  in_surgery: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
                  on_break: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                  out_of_clinic: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }[currentDocState.status];

                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5 transition-all hover:border-teal-300/60 dark:hover:border-teal-800/80 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{doc.name}</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{doc.specialty}</p>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 uppercase ${statusColor}`}>
                        {currentDocState.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Active Doctor Schedule Badge if present */}
                    {hasSchedule && (
                      <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-[10px] text-indigo-900 dark:text-indigo-200">
                        <div className="flex items-center space-x-1.5 truncate">
                          <CalendarClock className="h-3.5 w-3.5 text-indigo-600 shrink-0 animate-pulse" />
                          <span className="truncate">
                            Until <strong className="font-mono">{currentDocState.scheduledUntil}</strong>
                            {currentDocState.chairRoom && ` (${currentDocState.chairRoom})`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleClearDoctorSchedule(doc.id, doc.name)}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer shrink-0 ml-1"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* 4 Quick Instant Status Switch Buttons */}
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateDoctorStatus(doc.id, doc.name, 'available')}
                        className={`py-1 rounded-lg font-bold transition-all cursor-pointer text-center ${
                          currentDocState.status === 'available' && !hasSchedule
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Available
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateDoctorStatus(doc.id, doc.name, 'in_surgery')}
                        className={`py-1 rounded-lg font-bold transition-all cursor-pointer text-center ${
                          currentDocState.status === 'in_surgery' && !hasSchedule
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        In Surgery
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateDoctorStatus(doc.id, doc.name, 'on_break')}
                        className={`py-1 rounded-lg font-bold transition-all cursor-pointer text-center ${
                          currentDocState.status === 'on_break' && !hasSchedule
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Break
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateDoctorStatus(doc.id, doc.name, 'out_of_clinic')}
                        className={`py-1 rounded-lg font-bold transition-all cursor-pointer text-center ${
                          currentDocState.status === 'out_of_clinic' && !hasSchedule
                            ? 'bg-slate-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Off Duty
                      </button>
                    </div>

                    {/* Schedule Doctor Action Button */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">
                        {currentDocState.chairRoom ? `Chair: ${currentDocState.chairRoom}` : 'No room set'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenDoctorScheduleModal(doc)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <CalendarClock className="h-3 w-3" />
                        <span>{hasSchedule ? 'Edit Schedule' : 'Schedule Status'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* Clinic Status Scheduling Modal                                            */}
      {/* ========================================================================= */}
      {showClinicScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Schedule Clinic Status</h3>
                  <p className="text-[11px] text-slate-400">For {activeClinic?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClinicScheduleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Status Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Scheduled Operational Mode
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScheduleClinicMode('lunch_break')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    scheduleClinicMode === 'lunch_break'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Coffee className="h-4 w-4" />
                  <span>Lunch Break</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleClinicMode('closed')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    scheduleClinicMode === 'closed'
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  <span>Closed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleClinicMode('emergency_only')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    scheduleClinicMode === 'emergency_only'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Emergency Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleClinicMode('open')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    scheduleClinicMode === 'open'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Scheduled Open</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Durations */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Quick Duration Presets
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setScheduleClinicStart(formatTimeInput(now));
                    setScheduleClinicEnd(formatTimeInput(new Date(now.getTime() + 30 * 60000)));
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  30 Mins
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setScheduleClinicStart(formatTimeInput(now));
                    setScheduleClinicEnd(formatTimeInput(new Date(now.getTime() + 60 * 60000)));
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleClinicStart('13:00');
                    setScheduleClinicEnd('14:00');
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Lunch (1-2 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setScheduleClinicStart(formatTimeInput(now));
                    setScheduleClinicEnd('20:00');
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Until 8 PM
                </button>
              </div>
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={scheduleClinicStart}
                  onChange={(e) => setScheduleClinicStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Expected Resume / End Time
                </label>
                <input
                  type="time"
                  value={scheduleClinicEnd}
                  onChange={(e) => setScheduleClinicEnd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Announcement Note (shown to patients)
              </label>
              <input
                type="text"
                placeholder="e.g. Afternoon department sanitization & staff meeting"
                value={scheduleClinicNote}
                onChange={(e) => setScheduleClinicNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Auto Revert Checkbox */}
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={scheduleClinicAutoRevert}
                onChange={(e) => setScheduleClinicAutoRevert(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Automatically revert clinic status to <strong>Open</strong> when window ends</span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClinicScheduleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveClinicSchedule}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save & Activate Schedule</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Doctor Availability Scheduling Modal                                      */}
      {/* ========================================================================= */}
      {schedulingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Schedule Doctor Availability</h3>
                  <p className="text-[11px] text-slate-400">{schedulingDoctor.name} · {schedulingDoctor.specialty}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Status Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Scheduled Chairside Status
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScheduleDoctorStatus('in_surgery')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    scheduleDoctorStatus === 'in_surgery'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>In Surgery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleDoctorStatus('on_break')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    scheduleDoctorStatus === 'on_break'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Coffee className="h-4 w-4" />
                  <span>On Break</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleDoctorStatus('out_of_clinic')}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center space-x-1.5 border cursor-pointer ${
                    scheduleDoctorStatus === 'out_of_clinic'
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  <span>Off Duty</span>
                </button>
              </div>
            </div>

            {/* Quick Procedure Durations */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Procedure Duration Presets
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setScheduleDoctorStart(formatTimeInput(now));
                    setScheduleDoctorEnd(formatTimeInput(new Date(now.getTime() + 15 * 60000)));
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  15m Consult
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setScheduleDoctorStart(formatTimeInput(now));
                    setScheduleDoctorEnd(formatTimeInput(new Date(now.getTime() + 30 * 60000)));
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  30m Filling
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setScheduleDoctorStart(formatTimeInput(now));
                    setScheduleDoctorEnd(formatTimeInput(new Date(now.getTime() + 45 * 60000)));
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  45m RCT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setScheduleDoctorStart(formatTimeInput(now));
                    setScheduleDoctorEnd(formatTimeInput(new Date(now.getTime() + 60 * 60000)));
                  }}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  60m Surgery
                </button>
              </div>
            </div>

            {/* Operatory / Chair Room & Time */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chair / Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chair 1"
                  value={scheduleDoctorChair}
                  onChange={(e) => setScheduleDoctorChair(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={scheduleDoctorStart}
                  onChange={(e) => setScheduleDoctorStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Available At
                </label>
                <input
                  type="time"
                  value={scheduleDoctorEnd}
                  onChange={(e) => setScheduleDoctorEnd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Note / Procedure Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Procedure Details / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Molar root canal instrumentation on chair 2"
                value={scheduleDoctorNote}
                onChange={(e) => setScheduleDoctorNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Auto Revert Checkbox */}
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={scheduleDoctorAutoRevert}
                onChange={(e) => setScheduleDoctorAutoRevert(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span>Automatically switch back to <strong>Available</strong> when time arrives</span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSchedulingDoctor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveDoctorSchedule}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save Doctor Schedule</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
