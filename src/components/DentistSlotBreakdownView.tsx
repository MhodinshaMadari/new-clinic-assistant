import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  AlertCircle,
  ShieldCheck,
  Phone,
  Mail,
  Activity
} from 'lucide-react';
import { Appointment, AppointmentStatus, UserProfile, UserRole } from '../types';

export const STANDARD_TIME_SLOTS = [
  { value: '09:00', label: '09:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '18:00', label: '06:00 PM' },
];

export function isSlotBooked(
  appointments: Appointment[],
  dateStr: string,
  timeStr: string,
  dentistId?: string
): { isBooked: boolean; appointment?: Appointment } {
  if (!dateStr || !timeStr) return { isBooked: false };

  const matched = appointments.find(app => {
    if (app.status === 'cancelled') return false;
    if (dentistId && app.dentistId !== dentistId) return false;
    if (!app.dateTime) return false;

    const appDate = app.dateTime.split('T')[0];
    const appTime = app.dateTime.split('T')[1]?.substring(0, 5);

    return appDate === dateStr && appTime === timeStr;
  });

  return { isBooked: !!matched, appointment: matched };
}

interface DentistSlotBreakdownViewProps {
  appointments: Appointment[];
  dentists: UserProfile[];
  userRole?: UserRole;
  onBookSlot: (dentistId: string, dateStr: string, timeStr: string) => void;
  onUpdateStatus?: (id: string, status: AppointmentStatus) => void;
  onDelete?: (id: string) => void;
  onTriggerReminder?: (app: Appointment) => void;
}

export const DentistSlotBreakdownView: React.FC<DentistSlotBreakdownViewProps> = ({
  appointments,
  dentists,
  userRole = 'patient',
  onBookSlot,
  onUpdateStatus,
  onDelete,
  onTriggerReminder
}) => {
  const { userProfile } = useAuth();
  const [selectedDentistId, setSelectedDentistId] = useState<string>(
    dentists[0]?.uid || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const activeDentist = dentists.find(d => d.uid === selectedDentistId) || dentists[0];

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Compute total booked and available
  const slotStatusList = STANDARD_TIME_SLOTS.map(slot => {
    const check = isSlotBooked(appointments, selectedDate, slot.value, activeDentist?.uid);
    return {
      ...slot,
      isBooked: check.isBooked,
      appointment: check.appointment
    };
  });

  const bookedCount = slotStatusList.filter(s => s.isBooked).length;
  const availableCount = slotStatusList.length - bookedCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-fadeIn">
      
      {/* Header controls: Specialist and Date */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-mono font-bold bg-blue-50 dark:bg-blue-950 text-revon-blue px-2.5 py-0.5 rounded-full">
              Live Slot Inspector
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Real-time Availability
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
            Specialist Daily Schedule & Slots
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View occupied and available appointment slots for both patients and staff.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Select Dentist */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <User className="h-4 w-4 text-revon-blue ml-1 flex-shrink-0" />
            <select
              value={selectedDentistId || (activeDentist?.uid || '')}
              onChange={(e) => setSelectedDentistId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
            >
              {dentists.map(d => (
                <option key={d.uid} value={d.uid} className="dark:bg-slate-800">
                  {d.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker + Arrows */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevDay}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer px-1"
            />
            <button
              onClick={handleToday}
              className="px-2 py-0.5 text-[10px] font-bold text-revon-blue hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer font-mono"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
            Specialist Assigned
          </span>
          <div className="font-bold text-slate-900 dark:text-white text-sm font-display mt-1 flex items-center space-x-2">
            <User className="h-4 w-4 text-revon-blue" />
            <span>{activeDentist?.displayName || 'All Specialists'}</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono block">
            Available Slots
          </span>
          <div className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 font-display mt-1 flex items-center justify-between">
            <span>{availableCount} Slots</span>
            <span className="text-xs bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
              Open
            </span>
          </div>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 font-mono block">
            Booked Slots
          </span>
          <div className="text-2xl font-extrabold text-rose-800 dark:text-rose-300 font-display mt-1 flex items-center justify-between">
            <span>{bookedCount} Slots</span>
            <span className="text-xs bg-rose-200/70 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-2.5 py-0.5 rounded-full font-mono">
              Occupied
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 10 Daily Time Slots */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
          <span>Schedule Breakdown for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>10 Standard Clinic Slots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slotStatusList.map((slot) => {
            const isBooked = slot.isBooked;
            const app = slot.appointment;

            return (
              <div
                key={slot.value}
                className={`p-4 rounded-2xl border transition-all space-y-2 ${
                  isBooked
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className={`h-4 w-4 ${isBooked ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                      {slot.label}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase border ${
                    isBooked
                      ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  }`}>
                    {isBooked ? 'Booked' : 'Available'}
                  </span>
                </div>

                {isBooked && app ? (
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 space-y-1 text-xs">
                    {userRole !== 'patient' ? (
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white font-display text-xs">
                              {app.patientName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center space-x-2">
                              <span>{app.treatment}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            app.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            app.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono pt-1">
                          <span className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{app.patientEmail}</span>
                          </span>
                          {app.patientPhone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{app.patientPhone}</span>
                            </span>
                          )}
                        </div>

                        {/* Action buttons for staff */}
                        <div className="pt-2 flex flex-wrap gap-2 justify-end">
                          {onUpdateStatus && app.status === 'pending' && (
                            <button
                              onClick={() => onUpdateStatus(app.id, 'confirmed')}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 cursor-pointer flex items-center space-x-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Confirm</span>
                            </button>
                          )}
                          {onTriggerReminder && (
                            <button
                              onClick={() => onTriggerReminder(app)}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-300 cursor-pointer flex items-center space-x-1"
                            >
                              <Send className="h-3 w-3" />
                              <span>Remind</span>
                            </button>
                          )}
                          {onUpdateStatus && app.status !== 'cancelled' && app.status !== 'completed' && (
                            <button
                              onClick={() => onUpdateStatus(app.id, 'cancelled')}
                              className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-bold hover:bg-rose-200 cursor-pointer flex items-center space-x-1"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Cancel Slot</span>
                            </button>
                          )}
                        </div>
                      </>
                    ) : (app.patientId === userProfile?.uid || app.patientEmail === userProfile?.email) ? (
                      <div className="flex justify-between items-center py-1">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            Your Booking: {app.patientName}
                          </div>
                          <div className="text-[11px] text-revon-blue dark:text-teal-400 font-mono font-semibold">
                            {app.treatment}
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          app.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          app.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-600 dark:text-slate-400 italic text-xs py-1">
                        Reserved by another patient.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex justify-between items-center text-xs">
                    <span className="text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                      Slot is open for booking
                    </span>
                    <button
                      onClick={() => onBookSlot(activeDentist?.uid || '', selectedDate, slot.value)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Book This Slot</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
