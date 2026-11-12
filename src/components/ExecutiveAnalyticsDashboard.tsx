import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  Appointment, 
  Bill, 
  Invoice, 
  Expense, 
  MonthlyFinance, 
  UserProfile, 
  ExpenseCategory 
} from '../types';
import { useClinic } from '../context/ClinicContext';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Printer, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Stethoscope, 
  Activity, 
  Receipt, 
  PieChart, 
  Sliders, 
  Save, 
  X, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BarChart3,
  Wallet,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ExecutiveAnalyticsDashboardProps {
  userProfile?: UserProfile | null;
  onNavigateTab?: (tab: string) => void;
}

type TimeHorizon = 'today' | 'week' | 'month' | 'six_months';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function ExecutiveAnalyticsDashboard({ 
  userProfile,
  onNavigateTab 
}: ExecutiveAnalyticsDashboardProps) {
  const { activeClinic } = useClinic();
  const clinicSlug = activeClinic?.slug || 'revon-dental';
  const clinicName = activeClinic?.name || 'Revon Advance Dental Care';

  // System Date Anchors
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;

  // Time Horizon View Selection
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>('month');

  // Firestore Real-Time Data States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyFinances, setMonthlyFinances] = useState<Record<string, MonthlyFinance>>({});
  const [dentists, setDentists] = useState<UserProfile[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Target Adjustment Modal States
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetAmountInput, setTargetAmountInput] = useState<string>('250000');
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetSaveSuccess, setTargetSaveSuccess] = useState(false);

  // Quick Expense Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('consumable');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expensePaymentMode, setExpensePaymentMode] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('UPI');
  const [expenseReceiptNo, setExpenseReceiptNo] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseSuccess, setExpenseSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. Subscribe to Firestore Collections in Real-Time
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);

    // 1. Appointments
    const unsubApp = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Appointment;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          list.push(data);
        }
      });
      setAppointments(list);
    }, (err) => console.warn("Appointments listener err:", err));

    // 2. Bills
    const unsubBills = onSnapshot(collection(db, 'bills'), (snapshot) => {
      const list: Bill[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Bill;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          list.push(data);
        }
      });
      setBills(list);
    }, (err) => console.warn("Bills listener err:", err));

    // 3. Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Invoice;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          list.push(data);
        }
      });
      setInvoices(list);
    }, (err) => console.warn("Invoices listener err:", err));

    // 4. Expenses
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Expense;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          list.push(data);
        }
      });
      setExpenses(list);
    }, (err) => console.warn("Expenses listener err:", err));

    // 5. Monthly Finances (for custom targets & budgets)
    const unsubFinances = onSnapshot(collection(db, 'monthly_finances'), (snapshot) => {
      const map: Record<string, MonthlyFinance> = {};
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as MonthlyFinance;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          map[data.monthKey || docSnap.id] = data;
        }
      });
      setMonthlyFinances(map);
    }, (err) => console.warn("Monthly finances listener err:", err));

    // 6. Users / Dentists
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const dList: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        if (data.role === 'dentist' || data.role === 'doctor' || data.role === 'specialist') {
          if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
            dList.push(data);
          }
        }
      });
      setDentists(dList);
      setLoading(false);
    }, (err) => {
      console.warn("Users listener err:", err);
      setLoading(false);
    });

    return () => {
      unsubApp();
      unsubBills();
      unsubInvoices();
      unsubExpenses();
      unsubFinances();
      unsubUsers();
    };
  }, [clinicSlug]);

  // Load current month target into input once loaded
  useEffect(() => {
    const curFin = monthlyFinances[currentMonthKey];
    if (curFin && curFin.voucherTargetAmount) {
      setTargetAmountInput(String(curFin.voucherTargetAmount));
    } else {
      setTargetAmountInput('250000');
    }
  }, [monthlyFinances, currentMonthKey]);

  // ---------------------------------------------------------------------------
  // Date Helpers for 4 Time Horizons
  // ---------------------------------------------------------------------------
  const dateRanges = useMemo(() => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Current Week (Monday to Sunday)
    const d = new Date(now);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Current Month range
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Last 6 Months (including current month)
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);

    // List of individual 6 months keys & labels
    const last6MonthsList: { monthKey: string; label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(currentYear, currentMonth - 1 - i, 1);
      const y = mDate.getFullYear();
      const m = mDate.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      last6MonthsList.push({
        monthKey: key,
        label: `${SHORT_MONTH_NAMES[m - 1]} ${y}`,
        year: y,
        month: m
      });
    }

    return {
      todayStr,
      monday,
      sunday,
      startOfMonth,
      endOfMonth,
      sixMonthsAgo,
      last6MonthsList
    };
  }, [currentYear, currentMonth]);

  // Helper to test if a date string falls within a range
  const parseAppDate = (dateVal: string | undefined): Date | null => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d;
    } catch {
      // ignore
    }
    return null;
  };

  const getLocalDateStr = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // 2. Compute Patient Attendance Metrics Across 4 Horizons
  // ---------------------------------------------------------------------------
  const attendanceMetrics = useMemo(() => {
    let todayAttended = 0;
    let todayScheduled = 0;

    let weekAttended = 0;
    let weekScheduled = 0;

    let monthAttended = 0;
    let monthScheduled = 0;

    let sixMonthsAttended = 0;
    let sixMonthsScheduled = 0;

    // Monthly breakdown map for the 6 months
    const monthlyStats: Record<string, { attended: number; scheduled: number; earnings: number; spendings: number }> = {};
    dateRanges.last6MonthsList.forEach(m => {
      monthlyStats[m.monthKey] = { attended: 0, scheduled: 0, earnings: 0, spendings: 0 };
    });

    appointments.forEach((app) => {
      const d = parseAppDate(app.dateTime) || parseAppDate(app.createdAt);
      if (!d) return;

      const dateStr = getLocalDateStr(d);
      const isCompleted = app.status === 'completed';
      const isCancelled = app.status === 'cancelled';
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mKey = `${y}-${String(m).padStart(2, '0')}`;

      // 1. Today
      if (dateStr === dateRanges.todayStr) {
        todayScheduled++;
        if (isCompleted) todayAttended++;
      }

      // 2. This Week
      if (d >= dateRanges.monday && d <= dateRanges.sunday) {
        weekScheduled++;
        if (isCompleted) weekAttended++;
      }

      // 3. This Month
      if (y === currentYear && m === currentMonth) {
        monthScheduled++;
        if (isCompleted) monthAttended++;
      }

      // 4. Last 6 Months
      if (d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth) {
        sixMonthsScheduled++;
        if (isCompleted) sixMonthsAttended++;
      }

      // Populate monthly history map
      if (monthlyStats[mKey]) {
        monthlyStats[mKey].scheduled++;
        if (isCompleted) monthlyStats[mKey].attended++;
      }
    });

    // Populate earnings and spendings into monthly history
    invoices.forEach(inv => {
      const d = parseAppDate(inv.createdAt);
      if (!d) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyStats[mKey]) {
        const collected = inv.paidAmount !== undefined 
          ? inv.paidAmount 
          : (inv.status === 'collected' ? inv.totalAmount : 0);
        monthlyStats[mKey].earnings += (collected || 0);
      }
    });

    bills.forEach(b => {
      const d = parseAppDate(b.createdAt);
      if (!d) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyStats[mKey]) {
        const collected = b.paidAmount !== undefined 
          ? b.paidAmount 
          : (b.status === 'collected' ? b.totalAmount : 0);
        monthlyStats[mKey].earnings += (collected || 0);
      }
    });

    expenses.forEach(exp => {
      const d = parseAppDate(exp.date) || parseAppDate(exp.createdAt);
      if (!d) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyStats[mKey] && exp.voucherType !== 'collected') {
        monthlyStats[mKey].spendings += (exp.amount || 0);
      }
    });

    // Also include monthly fixed budgeted expenses from monthly_finances if recorded
    Object.keys(monthlyFinances).forEach(mKey => {
      if (monthlyStats[mKey]) {
        const fin = monthlyFinances[mKey];
        const fixedBudget = (fin.clinicRent || 0) + (fin.staffSalary || 0) + (fin.consumableItems || 0) + (fin.otherExpenses || 0);
        // Only supplement if expenses logged are lower than budgeted baseline
        if (fixedBudget > monthlyStats[mKey].spendings) {
          monthlyStats[mKey].spendings = fixedBudget;
        }
      }
    });

    return {
      todayAttended,
      todayScheduled,
      weekAttended,
      weekScheduled,
      monthAttended,
      monthScheduled,
      sixMonthsAttended,
      sixMonthsScheduled,
      monthlyHistory: dateRanges.last6MonthsList.map(m => ({
        ...m,
        attended: monthlyStats[m.monthKey]?.attended || 0,
        scheduled: monthlyStats[m.monthKey]?.scheduled || 0,
        earnings: monthlyStats[m.monthKey]?.earnings || 0,
        spendings: monthlyStats[m.monthKey]?.spendings || 0,
        profit: (monthlyStats[m.monthKey]?.earnings || 0) - (monthlyStats[m.monthKey]?.spendings || 0)
      }))
    };
  }, [appointments, invoices, bills, expenses, monthlyFinances, dateRanges, currentYear, currentMonth]);

  // ---------------------------------------------------------------------------
  // 3. Compute Financials & Target Pacing Engine
  // ---------------------------------------------------------------------------
  const financialMetrics = useMemo(() => {
    // Helper to filter financial records based on selected horizon
    const filterRecordDate = (dateVal: string | undefined): boolean => {
      const d = parseAppDate(dateVal);
      if (!d) return false;
      const dateStr = getLocalDateStr(d);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      if (selectedHorizon === 'today') {
        return dateStr === dateRanges.todayStr;
      }
      if (selectedHorizon === 'week') {
        return d >= dateRanges.monday && d <= dateRanges.sunday;
      }
      if (selectedHorizon === 'month') {
        return y === currentYear && m === currentMonth;
      }
      if (selectedHorizon === 'six_months') {
        return d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth;
      }
      return false;
    };

    // Calculate Earnings (from collected invoices, bills, and other revenue)
    let grossEarnings = 0;
    let totalBilled = 0;
    let pendingReceivables = 0;

    invoices.forEach(inv => {
      if (filterRecordDate(inv.createdAt)) {
        totalBilled += (inv.totalAmount || 0);
        const collected = inv.paidAmount !== undefined 
          ? inv.paidAmount 
          : (inv.status === 'collected' ? inv.totalAmount : 0);
        grossEarnings += collected;
        const due = (inv.totalAmount || 0) - collected;
        if (due > 0) pendingReceivables += due;
      }
    });

    bills.forEach(b => {
      if (filterRecordDate(b.createdAt)) {
        totalBilled += (b.totalAmount || 0);
        const collected = b.paidAmount !== undefined 
          ? b.paidAmount 
          : (b.status === 'collected' ? b.totalAmount : 0);
        grossEarnings += collected;
        const due = (b.totalAmount || 0) - collected;
        if (due > 0) pendingReceivables += due;
      }
    });

    // Calculate Spendings / Expenses
    let totalSpendings = 0;
    const categoryBreakdown: Record<ExpenseCategory, number> = {
      rent: 0,
      salary: 0,
      consumable: 0,
      other: 0
    };

    expenses.forEach(exp => {
      if (filterRecordDate(exp.date || exp.createdAt) && exp.voucherType !== 'collected') {
        const amt = exp.amount || 0;
        totalSpendings += amt;
        const cat = exp.category || 'other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      }
    });

    // Current Month Budget / Target
    const curMonthFinance = monthlyFinances[currentMonthKey];
    const targetRevenue = curMonthFinance?.voucherTargetAmount || 250000;

    // Fixed budget addition if looking at month horizon and logged expenses are lower
    if (selectedHorizon === 'month' && curMonthFinance) {
      const fixedTotal = (curMonthFinance.clinicRent || 0) + 
                         (curMonthFinance.staffSalary || 0) + 
                         (curMonthFinance.consumableItems || 0) + 
                         (curMonthFinance.otherExpenses || 0);
      if (fixedTotal > totalSpendings) {
        totalSpendings = fixedTotal;
      }
    }

    const netProfit = grossEarnings - totalSpendings;
    const profitMargin = grossEarnings > 0 ? (netProfit / grossEarnings) * 100 : 0;
    const collectionEfficiency = totalBilled > 0 ? (grossEarnings / totalBilled) * 100 : 100;

    // Monthly Target Pacing Calculation
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = Math.min(now.getDate(), daysInMonth);
    const timeElapsedPercent = (currentDay / daysInMonth) * 100;
    const targetAchievedPercent = targetRevenue > 0 ? (grossEarnings / targetRevenue) * 100 : 0;
    const pacingDelta = targetAchievedPercent - timeElapsedPercent;

    let pacingStatus: 'ahead' | 'on_track' | 'behind' = 'on_track';
    if (pacingDelta >= 5) pacingStatus = 'ahead';
    else if (pacingDelta <= -10) pacingStatus = 'behind';

    // Projected Month-End Revenue based on daily velocity
    const dailyVelocity = currentDay > 0 ? grossEarnings / currentDay : 0;
    const projectedMonthEnd = Math.round(dailyVelocity * daysInMonth);

    return {
      grossEarnings,
      totalSpendings,
      netProfit,
      profitMargin,
      totalBilled,
      pendingReceivables,
      collectionEfficiency,
      targetRevenue,
      targetAchievedPercent,
      timeElapsedPercent,
      pacingDelta,
      pacingStatus,
      projectedMonthEnd,
      daysInMonth,
      currentDay,
      categoryBreakdown
    };
  }, [invoices, bills, expenses, monthlyFinances, selectedHorizon, currentMonthKey, dateRanges, currentYear, currentMonth]);

  // ---------------------------------------------------------------------------
  // 4. Analytics Widgets: Treatments, Status, Doctors, Receivables
  // ---------------------------------------------------------------------------
  const widgetMetrics = useMemo(() => {
    // 1. Treatment Breakdown
    const treatmentCounts: Record<string, { count: number; revenue: number }> = {};
    let totalTreatmentsCount = 0;

    // Filter appointments for the current time horizon
    appointments.forEach((app) => {
      const d = parseAppDate(app.dateTime) || parseAppDate(app.createdAt);
      if (!d) return;

      const dateStr = getLocalDateStr(d);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      let inHorizon = false;
      if (selectedHorizon === 'today') inHorizon = dateStr === dateRanges.todayStr;
      else if (selectedHorizon === 'week') inHorizon = d >= dateRanges.monday && d <= dateRanges.sunday;
      else if (selectedHorizon === 'month') inHorizon = y === currentYear && m === currentMonth;
      else if (selectedHorizon === 'six_months') inHorizon = d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth;

      if (!inHorizon) return;

      const treatName = app.treatment?.trim() || 'General Consultation';
      if (!treatmentCounts[treatName]) {
        treatmentCounts[treatName] = { count: 0, revenue: 0 };
      }
      treatmentCounts[treatName].count++;
      totalTreatmentsCount++;
    });

    const topTreatments = Object.entries(treatmentCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        percentage: totalTreatmentsCount > 0 ? Math.round((data.count / totalTreatmentsCount) * 100) : 0,
        estimatedRevenue: data.count * 1500 // fallback avg procedure estimate
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 2. Appointment Status & Cancellation Rate
    let completedCount = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalScopeApps = 0;

    appointments.forEach((app) => {
      const d = parseAppDate(app.dateTime) || parseAppDate(app.createdAt);
      if (!d) return;

      const dateStr = getLocalDateStr(d);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      let inHorizon = false;
      if (selectedHorizon === 'today') inHorizon = dateStr === dateRanges.todayStr;
      else if (selectedHorizon === 'week') inHorizon = d >= dateRanges.monday && d <= dateRanges.sunday;
      else if (selectedHorizon === 'month') inHorizon = y === currentYear && m === currentMonth;
      else if (selectedHorizon === 'six_months') inHorizon = d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth;

      if (!inHorizon) return;

      totalScopeApps++;
      if (app.status === 'completed') completedCount++;
      else if (app.status === 'confirmed') confirmedCount++;
      else if (app.status === 'pending') pendingCount++;
      else if (app.status === 'cancelled') cancelledCount++;
    });

    const cancellationRate = totalScopeApps > 0 
      ? Math.round((cancelledCount / totalScopeApps) * 100 * 10) / 10 
      : 0;

    // 3. Doctor-Wise Distribution & Productivity
    const doctorStatsMap: Record<string, { 
      name: string; 
      specialty: string; 
      attended: number; 
      totalBooked: number; 
      revenue: number 
    }> = {};

    // Seed from registered dentists
    dentists.forEach(d => {
      doctorStatsMap[d.uid] = {
        name: d.displayName || 'Doctor',
        specialty: d.specialty || 'Dental Surgeon',
        attended: 0,
        totalBooked: 0,
        revenue: 0
      };
    });

    // Fallback known doctors if dentists collection was empty
    if (Object.keys(doctorStatsMap).length === 0) {
      doctorStatsMap['dr-tohid'] = {
        name: 'Dr. Mohammad Tohid Kaginalli',
        specialty: 'Chief Implantologist & Cosmetic Dentist',
        attended: 0,
        totalBooked: 0,
        revenue: 0
      };
    }

    appointments.forEach(app => {
      const d = parseAppDate(app.dateTime) || parseAppDate(app.createdAt);
      if (!d) return;

      const dateStr = getLocalDateStr(d);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      let inHorizon = false;
      if (selectedHorizon === 'today') inHorizon = dateStr === dateRanges.todayStr;
      else if (selectedHorizon === 'week') inHorizon = d >= dateRanges.monday && d <= dateRanges.sunday;
      else if (selectedHorizon === 'month') inHorizon = y === currentYear && m === currentMonth;
      else if (selectedHorizon === 'six_months') inHorizon = d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth;

      if (!inHorizon) return;

      const docId = app.dentistId || 'general';
      const docName = app.dentistName || 'Attending Dentist';

      if (!doctorStatsMap[docId]) {
        doctorStatsMap[docId] = {
          name: docName,
          specialty: 'Dental Surgeon',
          attended: 0,
          totalBooked: 0,
          revenue: 0
        };
      }

      doctorStatsMap[docId].totalBooked++;
      if (app.status === 'completed') {
        doctorStatsMap[docId].attended++;
      }
    });

    // Attribute revenue to doctors from invoices
    invoices.forEach(inv => {
      const d = parseAppDate(inv.createdAt);
      if (!d) return;
      const docId = inv.dentistId;
      if (docId && doctorStatsMap[docId]) {
        const amt = inv.paidAmount !== undefined 
          ? inv.paidAmount 
          : (inv.status === 'collected' ? inv.totalAmount : 0);
        doctorStatsMap[docId].revenue += (amt || 0);
      }
    });

    const doctorProductivity = Object.values(doctorStatsMap).map(doc => ({
      ...doc,
      avgTicketSize: doc.attended > 0 ? Math.round(doc.revenue / doc.attended) : 0
    }));

    return {
      topTreatments,
      totalTreatmentsCount,
      completedCount,
      confirmedCount,
      pendingCount,
      cancelledCount,
      cancellationRate,
      totalScopeApps,
      doctorProductivity
    };
  }, [appointments, dentists, invoices, selectedHorizon, dateRanges, currentYear, currentMonth]);

  // ---------------------------------------------------------------------------
  // 5. Actions: Save Target & Log Expense
  // ---------------------------------------------------------------------------
  const handleSaveTarget = async () => {
    const val = parseFloat(targetAmountInput.replace(/,/g, ''));
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid target revenue amount.");
      return;
    }

    setSavingTarget(true);
    setTargetSaveSuccess(false);

    try {
      const docId = `${clinicSlug}_${currentYear}_${String(currentMonth).padStart(2, '0')}`;
      const docRef = doc(db, 'monthly_finances', docId);

      await setDoc(docRef, {
        clinicSlug,
        year: currentYear,
        month: currentMonth,
        monthKey: currentMonthKey,
        monthLabel: currentMonthLabel,
        voucherTargetAmount: val,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setTargetSaveSuccess(true);
      setTimeout(() => {
        setTargetSaveSuccess(false);
        setShowTargetModal(false);
      }, 1200);
    } catch (err) {
      console.error("Failed to save target:", err);
      alert("Failed to update target in database. Please check permissions.");
    } finally {
      setSavingTarget(false);
    }
  };

  const handleSaveQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount.replace(/,/g, ''));
    if (!expenseTitle.trim() || isNaN(amt) || amt <= 0) {
      alert("Please enter an expense title and valid amount.");
      return;
    }

    setSavingExpense(true);
    setExpenseSuccess(false);

    try {
      const expDate = expenseDate || new Date().toISOString().split('T')[0];
      const mKey = expDate.substring(0, 7);

      await addDoc(collection(db, 'expenses'), {
        clinicSlug,
        monthKey: mKey,
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: amt,
        date: expDate,
        vendor: expenseVendor.trim() || 'Direct Expense',
        paymentMode: expensePaymentMode,
        receiptNumber: expenseReceiptNo.trim() || `EXP-${Date.now().toString().slice(-6)}`,
        paidStatus: 'paid',
        voucherType: 'paid',
        createdBy: userProfile?.displayName || userProfile?.email || 'Clinic Assistant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setExpenseSuccess(true);
      setTimeout(() => {
        setExpenseSuccess(false);
        setShowExpenseModal(false);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseVendor('');
        setExpenseReceiptNo('');
      }, 1200);
    } catch (err) {
      console.error("Failed to log expense:", err);
      alert("Failed to log expense. Please verify connection.");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* --------------------------------------------------------------------- */}
      {/* 1. DASHBOARD HEADER & CONTROLS */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-bold text-revon-blue dark:text-revon-teal">{clinicName}</span>
              <span aria-hidden="true">·</span>
              <span>Executive Command Center</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{dateRanges.todayStr}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              Clinical & Financial Intelligence
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time patient attendance volume, cashflow monitoring, and monthly target pacing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Actions */}
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Expense</span>
            </button>

            <button
              onClick={() => setShowTargetModal(true)}
              className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Target className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600" />
              <span>Set Target</span>
            </button>

            <button
              onClick={handlePrintDashboard}
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              title="Print / Save Report"
            >
              <Printer className="h-4 w-4" />
            </button>

            <button
              onClick={handleManualRefresh}
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-revon-blue' : ''}`} />
            </button>
          </div>
        </div>

        {/* Time Horizon Segmented Control */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => setSelectedHorizon('today')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedHorizon === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedHorizon('week')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedHorizon === 'week'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedHorizon('month')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedHorizon === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              This Month ({SHORT_MONTH_NAMES[currentMonth - 1]})
            </button>
            <button
              onClick={() => setSelectedHorizon('six_months')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedHorizon === 'six_months'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Last 6 Months
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Firestore Synchronized</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. CORE PATIENT ATTENDANCE HUB (Today, Week, Month, 6 Months) */}
      {/* --------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center space-x-2">
            <Users className="h-3.5 w-3.5 text-revon-blue" />
            <span>Patient Attendance Velocity</span>
          </h2>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-mono hidden sm:inline">
              {attendanceMetrics.monthAttended} attended in {currentMonthLabel}
            </span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('appointments')}
              className="font-bold text-revon-blue dark:text-revon-teal hover:underline cursor-pointer"
            >
              View Appointments Monitor →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today */}
          <div className={`p-5 rounded-2xl border transition-all ${
            selectedHorizon === 'today'
              ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold">Attended Today</span>
              <Calendar className="h-4 w-4 text-revon-blue" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {attendanceMetrics.todayAttended}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {attendanceMetrics.todayScheduled} scheduled
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Today's Date</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{dateRanges.todayStr}</span>
            </div>
          </div>

          {/* Card 2: This Week */}
          <div className={`p-5 rounded-2xl border transition-all ${
            selectedHorizon === 'week'
              ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold">Attended This Week</span>
              <Activity className="h-4 w-4 text-teal-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {attendanceMetrics.weekAttended}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {attendanceMetrics.weekScheduled} scheduled
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Current Week</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">Mon – Sun</span>
            </div>
          </div>

          {/* Card 3: This Month */}
          <div className={`p-5 rounded-2xl border transition-all ${
            selectedHorizon === 'month'
              ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold">Attended This Month</span>
              <Stethoscope className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {attendanceMetrics.monthAttended}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {attendanceMetrics.monthScheduled} scheduled
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Period</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{SHORT_MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
            </div>
          </div>

          {/* Card 4: Last 6 Months */}
          <div className={`p-5 rounded-2xl border transition-all ${
            selectedHorizon === 'six_months'
              ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold">Last 6 Months Attended</span>
              <BarChart3 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {attendanceMetrics.sixMonthsAttended}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {attendanceMetrics.sixMonthsScheduled} scheduled
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>6-Month Span</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                {dateRanges.last6MonthsList[0]?.label} – {dateRanges.last6MonthsList[5]?.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. TARGET TRACKING & PACING GAUGE */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                Monthly Revenue Target & Pacing Gauge ({currentMonthLabel})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assesses actual collections against the target ceiling based on day velocity.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono flex items-center space-x-1 ${
              financialMetrics.pacingStatus === 'ahead'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : financialMetrics.pacingStatus === 'behind'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            }`}>
              {financialMetrics.pacingStatus === 'ahead' && <ArrowUpRight className="h-3.5 w-3.5" />}
              {financialMetrics.pacingStatus === 'behind' && <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>
                {financialMetrics.pacingStatus === 'ahead' 
                  ? `Ahead of Pace (+${financialMetrics.pacingDelta.toFixed(1)}%)`
                  : financialMetrics.pacingStatus === 'behind'
                  ? `Behind Target (${financialMetrics.pacingDelta.toFixed(1)}%)`
                  : 'On Track with Goal'}
              </span>
            </span>

            <button
              onClick={() => setShowTargetModal(true)}
              className="text-xs font-bold text-revon-blue dark:text-revon-teal hover:underline cursor-pointer"
            >
              Adjust Goal
            </button>
          </div>
        </div>

        {/* Progress Bar & Numerical Pacing */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Current Earnings</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                ₹{financialMetrics.grossEarnings.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-400 ml-1.5 font-bold">
                ({financialMetrics.targetAchievedPercent.toFixed(1)}% of Target)
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Monthly Goal Target</span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                ₹{financialMetrics.targetRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                financialMetrics.targetAchievedPercent >= 100 
                  ? 'bg-emerald-500' 
                  : financialMetrics.pacingStatus === 'ahead'
                  ? 'bg-gradient-to-r from-revon-blue to-emerald-500'
                  : 'bg-revon-blue'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, financialMetrics.targetAchievedPercent))}%` }}
            />
            {/* Timeline Marker for Days Elapsed */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
              style={{ left: `${financialMetrics.timeElapsedPercent}%` }}
              title={`Day ${financialMetrics.currentDay} of ${financialMetrics.daysInMonth} (${financialMetrics.timeElapsedPercent.toFixed(0)}% elapsed)`}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Day {financialMetrics.currentDay} of {financialMetrics.daysInMonth} elapsed ({financialMetrics.timeElapsedPercent.toFixed(0)}% of month)</span>
            <span>Projected Velocity: ₹{financialMetrics.projectedMonthEnd.toLocaleString('en-IN')} by Month-End</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. FINANCIAL PERFORMANCE: EARNINGS, SPENDINGS, NET PROFIT */}
      {/* --------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center space-x-2">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            <span>Financial Inflows & Outflows ({selectedHorizon === 'today' ? 'Today' : selectedHorizon === 'week' ? 'This Week' : selectedHorizon === 'month' ? currentMonthLabel : 'Last 6 Months'})</span>
          </h2>
          <button
            onClick={() => onNavigateTab && onNavigateTab('billing')}
            className="text-xs font-bold text-revon-blue dark:text-revon-teal hover:underline cursor-pointer"
          >
            Open Billing Panel →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Earnings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">Gross Earnings (Inflows)</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                ₹{financialMetrics.grossEarnings.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                From completed patient consultations & treatment invoices.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Collection Efficiency</span>
              <span className="font-mono font-bold text-emerald-600">
                {financialMetrics.collectionEfficiency.toFixed(1)}% collected
              </span>
            </div>
          </div>

          {/* Spendings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">Clinic Spendings (Expenses)</span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                ₹{financialMetrics.totalSpendings.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Operational vouchers, supplies, salaries & rent.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Category Leader</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 capitalize">
                Consumables & Rent
              </span>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">Net Operational Margin</span>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-revon-blue">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className={`text-3xl font-extrabold font-mono tabular-nums ${
                financialMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {financialMetrics.netProfit >= 0 ? '+' : ''}₹{financialMetrics.netProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Operating surplus after deducting all logged expenses.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Profit Margin</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {financialMetrics.profitMargin.toFixed(1)}% net
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. HISTORICAL 6-MONTH TREND VISUALIZATION */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
              6-Month Longitudinal Performance Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Month-by-month patient attendance, earnings vs expenses, and operational margins.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Earnings</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
              <span>Expenses</span>
            </span>
          </div>
        </div>

        {/* 6-Month Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {attendanceMetrics.monthlyHistory.map((m) => {
            const isCurrent = m.monthKey === currentMonthKey;
            return (
              <div 
                key={m.monthKey}
                className={`p-3.5 rounded-2xl border text-center space-y-2 transition-all ${
                  isCurrent 
                    ? 'bg-slate-50/80 dark:bg-slate-800/60 border-revon-blue ring-1 ring-revon-blue' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {m.label} {isCurrent && <span className="text-[10px] text-revon-blue font-mono font-bold block">(Active)</span>}
                </div>

                {/* Attended Pill */}
                <div className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Attended</div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {m.attended}
                  </div>
                </div>

                {/* Cashflow metrics */}
                <div className="space-y-1 text-left text-[11px] font-mono pt-1">
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>In:</span>
                    <span className="font-bold tabular-nums">₹{m.earnings.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Out:</span>
                    <span className="font-bold tabular-nums">₹{m.spendings.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <span>Net:</span>
                    <span className={`tabular-nums ${m.profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {m.profit >= 0 ? '+' : ''}₹{m.profit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 6. ANALYTICS WIDGETS (Treatments, Cancellation, Doctors, Receivables) */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget A: Top Treatments Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieChart className="h-4 w-4 text-revon-blue" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                Top Treatments & Procedure Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {widgetMetrics.totalTreatmentsCount} total procedures
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {widgetMetrics.topTreatments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No treatment appointments logged for this period yet.
              </div>
            ) : (
              widgetMetrics.topTreatments.map((t, idx) => (
                <div key={t.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {idx + 1}. {t.name}
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {t.count} visits ({t.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-revon-blue rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, t.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget B: Appointment Status & Cancellation Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                Appointment Status & Retention Rate
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
              widgetMetrics.cancellationRate <= 8
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }`}>
              {widgetMetrics.cancellationRate}% Cancel Rate
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-center">
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider font-mono">
                Completed
              </div>
              <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                {widgetMetrics.completedCount}
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-center">
              <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider font-mono">
                Confirmed
              </div>
              <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                {widgetMetrics.confirmedCount}
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl text-center">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider font-mono">
                Pending
              </div>
              <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                {widgetMetrics.pendingCount}
              </div>
            </div>

            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-center">
              <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider font-mono">
                Cancelled
              </div>
              <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300 font-mono tabular-nums">
                {widgetMetrics.cancelledCount}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
            Assistants can trigger automated WhatsApp / Email post-op instructions to maintain high retention and avoid lost chair-time.
          </p>
        </div>

        {/* Widget C: Doctor-Wise Patient Distribution & Productivity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                Doctor Patient Distribution & Productivity
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {widgetMetrics.doctorProductivity.length} Doctors Scoped
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {widgetMetrics.doctorProductivity.map((doc) => (
              <div key={doc.name} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {doc.specialty}
                  </p>
                </div>
                <div className="text-right shrink-0 font-mono text-xs space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {doc.attended} Attended <span className="text-slate-400 font-normal">({doc.totalBooked} booked)</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold tabular-nums">
                    ₹{doc.revenue.toLocaleString('en-IN')} revenue
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget D: Outstanding Receivables & Collection Efficiency */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                Receivables & Collection Recovery
              </h3>
            </div>
            <span className="text-xs text-emerald-600 font-mono font-bold">
              {financialMetrics.collectionEfficiency.toFixed(1)}% Collected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Total Invoiced</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                ₹{financialMetrics.totalBilled.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="text-xs text-rose-600 font-mono uppercase tracking-wider mb-1">Pending Due Balance</div>
              <div className="text-2xl font-extrabold text-rose-600 font-mono tabular-nums">
                ₹{financialMetrics.pendingReceivables.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {financialMetrics.pendingReceivables > 0 
                ? 'Follow up with patients having outstanding balances.'
                : 'All issued patient bills are fully settled!'}
            </span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('billing')}
              className="px-3 py-1.5 bg-revon-blue text-white rounded-lg text-xs font-bold hover:bg-revon-blue/90 transition-all cursor-pointer shadow-xs"
            >
              Open Bills Ledger
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 7. MODAL: ADJUST MONTHLY REVENUE TARGET */}
      {/* --------------------------------------------------------------------- */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                    Set Monthly Target Goal
                  </h3>
                  <p className="text-xs text-slate-400">{currentMonthLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Monthly Target Revenue (₹) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={targetAmountInput}
                    onChange={(e) => setTargetAmountInput(e.target.value)}
                    className="w-full text-base font-bold font-mono pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-revon-blue text-slate-900 dark:text-white"
                    placeholder="e.g. 250000"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for real-time progress gauge and daily run-rate pacing calculations.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {[150000, 200000, 250000, 350000, 500000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetAmountInput(String(val))}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all"
                    >
                      ₹{(val / 1000)}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                disabled={savingTarget}
                className="px-5 py-2 bg-revon-blue hover:bg-revon-blue/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                {savingTarget ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : targetSaveSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Target Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Target</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 8. MODAL: LOG QUICK CLINIC EXPENSE */}
      {/* --------------------------------------------------------------------- */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveQuickExpense}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fadeIn"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                    Log Direct Clinic Expense
                  </h3>
                  <p className="text-xs text-slate-400">Record operational expense outflow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Expense Description / Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dental Anesthesia Kits, Autoclave Pouches, Electricity Bill"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-revon-blue text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Category *
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                  >
                    <option value="consumable">Consumables & Dental Stock</option>
                    <option value="rent">Clinic Premises Rent</option>
                    <option value="salary">Staff & Doctor Payroll</option>
                    <option value="other">Utilities, Sanitation & Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold font-mono">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full text-xs font-bold font-mono pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-revon-blue font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Payment Mode
                  </label>
                  <select
                    value={expensePaymentMode}
                    onChange={(e) => setExpensePaymentMode(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                  >
                    <option value="UPI">UPI / Google Pay</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank Transfer">Bank NEFT / IMPS</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Vendor / Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Dental Supplies"
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Receipt / Bill Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-8821"
                    value={expenseReceiptNo}
                    onChange={(e) => setExpenseReceiptNo(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-revon-blue font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingExpense}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                {savingExpense ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : expenseSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-white" />
                    <span>Expense Logged!</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Record Expense</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
