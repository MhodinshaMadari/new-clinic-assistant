import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Send, 
  Trash2, 
  DollarSign, 
  Info,
  X,
  Filter,
  Building2,
  MapPin,
  Receipt,
  Pencil
} from 'lucide-react';
import { Appointment, AppointmentStatus, Bill, Invoice, UserRole } from '../types';
import { STANDARD_TIME_SLOTS, isSlotBooked } from './DentistSlotBreakdownView';

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  bills: Bill[];
  invoices: Invoice[];
  userRole?: UserRole;
  onUpdateStatus?: (id: string, status: AppointmentStatus) => void;
  onDelete?: (id: string) => void;
  onTriggerReminder?: (app: Appointment) => void;
  onDraftBill?: (app: Appointment) => void;
  onAddBill?: (app: Appointment) => void;
  onEditBill?: (app: Appointment, bill: Bill | null, invoice?: Invoice | null) => void;
  onDeleteBill?: (app: Appointment, bill?: Bill | null, invoice?: Invoice | null) => void;
  onNewBookingForDate?: (dateStr: string, slotTime?: string) => void;
}

export const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({
  appointments,
  bills,
  invoices,
  userRole = 'patient',
  onUpdateStatus,
  onDelete,
  onTriggerReminder,
  onDraftBill,
  onAddBill,
  onEditBill,
  onDeleteBill,
  onNewBookingForDate
}) => {
  const { userProfile } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<{ dateStr: string; apps: Appointment[] } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create grid cells (leading prev month days, current month days, trailing next month days)
  const calendarCells: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    const dateStr = prevDate.toISOString().split('T')[0];
    calendarCells.push({ date: prevDate, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    // YYYY-MM-DD format (local date)
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    calendarCells.push({ date: currDate, isCurrentMonth: true, dateStr });
  }

  // Next month leading days to complete week rows (35 or 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = nextDate.toISOString().split('T')[0];
    calendarCells.push({ date: nextDate, isCurrentMonth: false, dateStr });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  // Filter appointments
  const filteredApps = appointments.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    return true;
  });

  // Group appointments by date string YYYY-MM-DD
  const appsByDate: Record<string, Appointment[]> = {};
  filteredApps.forEach(app => {
    if (!app.dateTime) return;
    const datePart = app.dateTime.split('T')[0];
    if (!appsByDate[datePart]) {
      appsByDate[datePart] = [];
    }
    appsByDate[datePart].push(app);
  });

  // Sort appointments within each date by time
  Object.keys(appsByDate).forEach(dateKey => {
    appsByDate[dateKey].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  });

  const getStatusBadgeStyle = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700 line-through opacity-70';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-revon-blue/10 dark:bg-revon-blue/20 rounded-xl text-revon-blue">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredApps.length} appointment{filteredApps.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="dark:bg-slate-800">All Statuses</option>
              <option value="pending" className="dark:bg-slate-800">Pending</option>
              <option value="confirmed" className="dark:bg-slate-800">Confirmed</option>
              <option value="completed" className="dark:bg-slate-800">Completed</option>
              <option value="cancelled" className="dark:bg-slate-800">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        <div className="py-2 text-rose-500 dark:text-rose-400">Sun</div>
        <div className="py-2">Mon</div>
        <div className="py-2">Tue</div>
        <div className="py-2">Wed</div>
        <div className="py-2">Thu</div>
        <div className="py-2">Fri</div>
        <div className="py-2">Sat</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((cell, idx) => {
          const dayApps = appsByDate[cell.dateStr] || [];
          const isToday = cell.dateStr === todayStr;

          return (
            <div
              key={idx}
              className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between group ${
                cell.isCurrentMonth
                  ? isToday
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-revon-blue shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-900 text-slate-300 dark:text-slate-700'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs font-bold font-mono h-6 w-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-revon-blue text-white shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                {cell.isCurrentMonth && onNewBookingForDate && (
                  <button
                    onClick={() => onNewBookingForDate(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-md transition-all cursor-pointer"
                    title={`Book appointment on ${cell.dateStr}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Appointments List for Day */}
              <div className="space-y-1 my-1 overflow-hidden">
                {dayApps.slice(0, 3).map((app) => {
                  const timeStr = new Date(app.dateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const isMine = app.patientId === userProfile?.uid || app.patientEmail === userProfile?.email;
                  const displayName = userRole !== 'patient' || isMine ? app.patientName : 'Reserved Slot';

                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelectedAppointment(app)}
                      className={`w-full text-left p-1 rounded-md text-[10px] font-medium border transition-all truncate block cursor-pointer ${getStatusBadgeStyle(
                        app.status
                      )}`}
                      title={`${timeStr} - ${displayName} (${app.treatment})`}
                    >
                      <div className="font-bold truncate leading-tight font-display">
                        <span className="font-mono font-semibold mr-1">{timeStr}</span>
                        {displayName}
                      </div>
                      <div className="text-[9px] opacity-80 truncate">{app.treatment}</div>
                    </button>
                  );
                })}

                {dayApps.length > 3 && (
                  <button
                    onClick={() => setSelectedDayAppointments({ dateStr: cell.dateStr, apps: dayApps })}
                    className="w-full text-center text-[10px] font-bold text-revon-blue hover:underline py-0.5 cursor-pointer block"
                  >
                    +{dayApps.length - 3} more
                  </button>
                )}
              </div>

              {/* Empty indicator helper */}
              {dayApps.length === 0 && cell.isCurrentMonth && (
                <div className="h-2"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (() => {
        const isMine = selectedAppointment.patientId === userProfile?.uid || selectedAppointment.patientEmail === userProfile?.email;
        const displayPatientName = userRole !== 'patient' || isMine ? selectedAppointment.patientName : 'Reserved Slot';
        const displayEmail = userRole !== 'patient' || isMine ? selectedAppointment.patientEmail : 'Confidential';
        const displayPhone = userRole !== 'patient' || isMine ? (selectedAppointment.patientPhone || 'N/A') : 'Confidential';

        return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-revon-blue bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-1 rounded-full uppercase font-mono">
                  {selectedAppointment.treatment}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mt-2">
                  {displayPatientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px]">Date & Time</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5 text-revon-blue shrink-0" />
                  <span>{new Date(selectedAppointment.dateTime).toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px]">Specialist Dentist</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                  <User className="h-3.5 w-3.5 text-revon-blue shrink-0" />
                  <span>{selectedAppointment.dentistName}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px]">Clinic Name</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                  <Building2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>{selectedAppointment.clinicName || 'Revon Healthcare Clinic'}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px]">Branch Location</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{selectedAppointment.locationName || 'Main Branch'}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px]">Contact Email</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{displayEmail}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px]">Contact Phone</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{displayPhone}</p>
              </div>
            </div>

            {selectedAppointment.notes && (userRole !== 'patient' || isMine) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Notes:</span>
                <p className="text-slate-600 dark:text-slate-400">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Billing & Invoice Context */}
            {(() => {
              const matchingBill = bills.find(b => b.id === selectedAppointment.id || b.appointmentId === selectedAppointment.id);
              const matchingInvoice = invoices.find(i => i.appointmentId === selectedAppointment.id);
              if (!matchingBill && !matchingInvoice) return null;

              return (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-display">
                      <Receipt className="h-3.5 w-3.5 text-teal-600" />
                      <span>Billing & Receipts Status:</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                      (matchingBill?.status === 'collected' || matchingInvoice?.status === 'collected')
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {(matchingBill?.status === 'collected' || matchingInvoice?.status === 'collected') ? 'Collected' : 'Pending'}
                    </span>
                  </div>

                  {matchingBill && (
                    <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px] flex justify-between items-center">
                      <span>Bill Total ({matchingBill.items?.length || 0} items):</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{matchingBill.totalAmount} {matchingBill.paymentMode ? `(${matchingBill.paymentMode})` : ''}
                      </span>
                    </div>
                  )}

                  {matchingInvoice && (
                    <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px] flex justify-between items-center">
                      <span>Invoice #{matchingInvoice.invoiceNumber}:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        ₹{matchingInvoice.totalAmount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
              {userRole !== 'patient' && onUpdateStatus && selectedAppointment.status === 'pending' && (
                <button
                  onClick={() => {
                    onUpdateStatus(selectedAppointment.id, 'confirmed');
                    setSelectedAppointment(null);
                  }}
                  className="px-3 py-1.5 bg-revon-blue text-white font-bold rounded-xl text-xs hover:bg-opacity-90 cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Confirm</span>
                </button>
              )}

              {userRole !== 'patient' && onUpdateStatus && selectedAppointment.status === 'confirmed' && (
                <button
                  onClick={() => {
                    onUpdateStatus(selectedAppointment.id, 'completed');
                    setSelectedAppointment(null);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Mark Done</span>
                </button>
              )}

              {/* Add / Edit / Delete Bill Actions for Staff */}
              {userRole !== 'patient' && (() => {
                const appBill = bills.find(b => b.id === selectedAppointment.id || b.appointmentId === selectedAppointment.id);
                const appInvoice = invoices.find(i => i.appointmentId === selectedAppointment.id);

                if (appBill || appInvoice) {
                  return (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (onEditBill) {
                            onEditBill(selectedAppointment, appBill || null, appInvoice || null);
                          } else if (onDraftBill) {
                            onDraftBill(selectedAppointment);
                          }
                          setSelectedAppointment(null);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center space-x-1 transition-colors shadow-2xs"
                        title="Edit line items, charges, or status"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit Bill</span>
                      </button>

                      {onDeleteBill && (
                        <button
                          onClick={() => {
                            onDeleteBill(selectedAppointment, appBill || null, appInvoice || null);
                            setSelectedAppointment(null);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold rounded-xl text-xs cursor-pointer flex items-center space-x-1 transition-colors"
                          title="Delete Bill & Invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Bill</span>
                        </button>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <button
                      onClick={() => {
                        if (onAddBill) {
                          onAddBill(selectedAppointment);
                        } else if (onDraftBill) {
                          onDraftBill(selectedAppointment);
                        }
                        setSelectedAppointment(null);
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center space-x-1 transition-colors shadow-2xs"
                      title="Add Bill and generate receipt for this appointment"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>+ Add Bill</span>
                    </button>
                  );
                }
              })()}

              {onTriggerReminder && (
                <button
                  onClick={() => {
                    onTriggerReminder(selectedAppointment);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Reminder</span>
                </button>
              )}

              {onUpdateStatus && selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                <button
                  onClick={() => {
                    onUpdateStatus(selectedAppointment.id, 'cancelled');
                    setSelectedAppointment(null);
                  }}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs hover:bg-rose-100 cursor-pointer flex items-center space-x-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(selectedAppointment.id);
                    setSelectedAppointment(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Delete Appointment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>
        </div>
        );
      })()}

      {/* Multiple Appointments Day List Modal */}
      {selectedDayAppointments && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4 animate-fadeIn max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white font-display text-base">
                  Schedule for {selectedDayAppointments.dateStr}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedDayAppointments.apps.length} booked • {10 - selectedDayAppointments.apps.length} available slots
                </p>
              </div>
              <button
                onClick={() => setSelectedDayAppointments(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Active Bookings */}
              <div>
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-2">Booked Appointments</span>
                <div className="space-y-2">
                  {selectedDayAppointments.apps.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No bookings recorded for this day yet.</p>
                  ) : (
                    selectedDayAppointments.apps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => {
                          setSelectedAppointment(app);
                          setSelectedDayAppointments(null);
                        }}
                        className="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 transition-all cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs font-display">
                            {userRole !== 'patient' || app.patientId === userProfile?.uid || app.patientEmail === userProfile?.email ? app.patientName : 'Reserved Slot'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {app.treatment} ({app.dentistName})
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                            <span className="flex items-center space-x-0.5 text-teal-600 dark:text-teal-400 font-semibold">
                              <Building2 className="h-2.5 w-2.5 shrink-0" />
                              <span>{app.clinicName || 'Clinic'}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span>{app.locationName || 'Main Branch'}</span>
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusBadgeStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Slot Availability Grid */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Daily Slot Status (09:00 AM - 06:00 PM)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {STANDARD_TIME_SLOTS.map((slot) => {
                    const check = isSlotBooked(appointments, selectedDayAppointments.dateStr, slot.value);
                    const isBooked = check.isBooked;
                    const app = check.appointment;

                    return (
                      <div
                        key={slot.value}
                        className={`p-2 rounded-xl border text-xs flex justify-between items-center ${
                          isBooked
                            ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="font-bold font-mono">{slot.label}</div>
                        {isBooked ? (
                          <span className="text-[9px] font-bold uppercase bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md">
                            Booked
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDayAppointments(null);
                              if (onNewBookingForDate) onNewBookingForDate(selectedDayAppointments.dateStr, slot.value);
                            }}
                            className="text-[9px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-md cursor-pointer transition-all"
                          >
                            + Book
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
