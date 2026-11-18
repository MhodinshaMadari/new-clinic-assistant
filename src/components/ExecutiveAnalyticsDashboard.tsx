import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot
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
  FINANCE_MONTH_NAMES,
  FINANCE_SHORT_MONTH_NAMES,
  buildMonthlyFinancesMap,
  calculateMonthFinances,
  calculateSixMonthTrend,
  parseLocalFriendlyDate,
  formatLocalYMD
} from '../utils/clinicFinanceSync';
import {
  filterClinicRegisteredDoctors,
  findRegisteredDoctorMatch,
  getDefaultPractitionerSpecialty,
  isAdminRole,
  matchesClinicScope
} from '../utils/clinicDoctorScope';
import { executeFirestoreWrite } from '../utils/firestoreUtils';
// @ts-ignore
import mainLogo from '../assets/images/main_logo_1783512166748.jpg';
import { PrintPreviewModal } from './PrintPreviewModal';
import { buildClinicLetterhead, PrintDocumentPayload } from '../utils/printService';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  CheckCircle,
  Plus,
  Printer,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Stethoscope,
  Activity,
  Receipt,
  PieChart,
  Save,
  X,
  BarChart3,
  Wallet,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ExecutiveAnalyticsDashboardProps {
  userProfile?: UserProfile | null;
  onNavigateTab?: (tab: string) => void;
  selectedYear?: number;
  selectedMonth?: number;
  onMonthChange?: (year: number, month: number) => void;
}

type TimeHorizon = 'today' | 'week' | 'month' | 'six_months';

export function ExecutiveAnalyticsDashboard({
  userProfile,
  onNavigateTab,
  selectedYear: controlledYear,
  selectedMonth: controlledMonth,
  onMonthChange
}: ExecutiveAnalyticsDashboardProps) {
  const { activeClinic } = useClinic();
  const clinicSlug = activeClinic?.slug || 'revon-dental';
  const clinicName = activeClinic?.name || 'Revon Advance Dental Care';
  const isAdminOrSuperAdmin = isAdminRole(userProfile?.role, userProfile?.isSuperAdmin);

  // System Date Anchors & Controlled Selected Month (synced with Finances & Expenses tab)
  const now = new Date();
  const systemYear = now.getFullYear();
  const systemMonth = now.getMonth() + 1;
  const [internalYear, setInternalYear] = useState<number>(systemYear);
  const [internalMonth, setInternalMonth] = useState<number>(systemMonth);

  const currentYear = controlledYear ?? internalYear;
  const currentMonth = controlledMonth ?? internalMonth;
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthLabel = `${FINANCE_MONTH_NAMES[currentMonth - 1]} ${currentYear}`;
  const isCurrentSystemMonth = currentYear === systemYear && currentMonth === systemMonth;

  const updateSelectedPeriod = (year: number, month: number) => {
    setInternalYear(year);
    setInternalMonth(month);
    if (onMonthChange) {
      onMonthChange(year, month);
    }
  };

  const handlePrevMonth = () => {
    setSelectedHorizon('month');
    if (currentMonth === 1) updateSelectedPeriod(currentYear - 1, 12);
    else updateSelectedPeriod(currentYear, currentMonth - 1);
  };

  const handleNextMonth = () => {
    setSelectedHorizon('month');
    if (currentMonth === 12) updateSelectedPeriod(currentYear + 1, 1);
    else updateSelectedPeriod(currentYear, currentMonth + 1);
  };

  const handleResetToCurrentMonth = () => {
    setSelectedHorizon('month');
    updateSelectedPeriod(systemYear, systemMonth);
  };

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
  const [printPreviewDoc, setPrintPreviewDoc] = useState<PrintDocumentPayload | null>(null);

  // Target Adjustment Modal States
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetAmountInput, setTargetAmountInput] = useState<string>('');
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetSaveSuccess, setTargetSaveSuccess] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  // Quick Expense Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('consumable');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expensePaymentMode, setExpensePaymentMode] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('UPI');
  const [expenseReceiptNo, setExpenseReceiptNo] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseSuccess, setExpenseSuccess] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const clinicId = activeClinic?.id;

  // ---------------------------------------------------------------------------
  // 1. Subscribe to Firestore Collections in Real-Time (strict clinic scope)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);

    // 1. Appointments
    const unsubApp = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Appointment;
        if (matchesClinicScope(data, clinicSlug, clinicId)) {
          list.push(data);
        }
      });
      setAppointments(list);
    }, (err) => console.warn('Appointments listener err:', err));

    // 2. Bills
    const unsubBills = onSnapshot(collection(db, 'bills'), (snapshot) => {
      const list: Bill[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Bill;
        if (matchesClinicScope(data, clinicSlug, clinicId)) {
          list.push(data);
        }
      });
      setBills(list);
    }, (err) => console.warn('Bills listener err:', err));

    // 3. Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Invoice;
        if (matchesClinicScope(data, clinicSlug, clinicId)) {
          list.push(data);
        }
      });
      setInvoices(list);
    }, (err) => console.warn('Invoices listener err:', err));

    // 4. Expenses
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Expense;
        if (matchesClinicScope(data, clinicSlug, clinicId)) {
          list.push(data);
        }
      });
      setExpenses(list);
    }, (err) => console.warn('Expenses listener err:', err));

    // 5. Monthly Finances (normalized with buildMonthlyFinancesMap matching FinanceDashboard)
    const unsubFinances = onSnapshot(collection(db, 'monthly_finances'), (snapshot) => {
      const entries: Array<{ id: string; data: MonthlyFinance }> = [];
      snapshot.forEach((docSnap) => {
        entries.push({ id: docSnap.id, data: docSnap.data() as MonthlyFinance });
      });
      setMonthlyFinances(buildMonthlyFinancesMap(entries, clinicSlug));
    }, (err) => console.warn('Monthly finances listener err:', err));

    // 6. Registered Clinical Practitioners strictly scoped to active clinic
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const rawUsers: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        rawUsers.push({ uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'uid'>) });
      });
      setDentists(filterClinicRegisteredDoctors(rawUsers, clinicSlug, clinicId));
      setLoading(false);
    }, (err) => {
      console.warn('Users listener err:', err);
      setDentists([]);
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
  }, [clinicSlug, clinicId]);

  // Keep target modal input synced with FinanceDashboard's voucherTargetAmount
  useEffect(() => {
    const curFin = monthlyFinances[currentMonthKey];
    const existingTarget = Number(curFin?.voucherTargetAmount) || Number(curFin?.totalBudgetedExpenses) || 0;
    setTargetAmountInput(existingTarget > 0 ? String(existingTarget) : '');
  }, [monthlyFinances, currentMonthKey]);

  // ---------------------------------------------------------------------------
  // Date Helpers for 4 Time Horizons
  // ---------------------------------------------------------------------------
  const dateRanges = useMemo(() => {
    const todayDate = new Date();
    const todayStr = formatLocalYMD(todayDate);

    // Current Week (Monday to Sunday)
    const d = new Date(todayDate);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Selected Month range
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Last 6 Months ending on selected Month
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1, 0, 0, 0, 0);

    const last6MonthsList: { monthKey: string; label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      while (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      const key = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
      last6MonthsList.push({
        monthKey: key,
        label: `${FINANCE_SHORT_MONTH_NAMES[targetMonth - 1]} ${targetYear}`,
        year: targetYear,
        month: targetMonth
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

  // ---------------------------------------------------------------------------
  // Shared Canonical 6-Month Financial Trend (identical to FinanceDashboard)
  // ---------------------------------------------------------------------------
  const sixMonthTrendData = useMemo(() => {
    return calculateSixMonthTrend({
      anchorYear: currentYear,
      anchorMonth: currentMonth,
      invoices,
      bills,
      expenses,
      monthlyFinances
    });
  }, [currentYear, currentMonth, invoices, bills, expenses, monthlyFinances]);

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

    const monthlyAttendedMap: Record<string, { attended: number; scheduled: number }> = {};
    sixMonthTrendData.forEach((m) => {
      monthlyAttendedMap[m.monthKey] = { attended: 0, scheduled: 0 };
    });

    appointments.forEach((app) => {
      const d = parseLocalFriendlyDate(app.dateTime) || parseLocalFriendlyDate(app.createdAt);
      if (!d) return;

      const dateStr = formatLocalYMD(d);
      const isCompleted = app.status === 'completed';
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mKey = `${y}-${String(m).padStart(2, '0')}`;

      if (dateStr === dateRanges.todayStr) {
        todayScheduled++;
        if (isCompleted) todayAttended++;
      }

      if (d >= dateRanges.monday && d <= dateRanges.sunday) {
        weekScheduled++;
        if (isCompleted) weekAttended++;
      }

      if (y === currentYear && m === currentMonth) {
        monthScheduled++;
        if (isCompleted) monthAttended++;
      }

      if (d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth) {
        sixMonthsScheduled++;
        if (isCompleted) sixMonthsAttended++;
      }

      if (monthlyAttendedMap[mKey]) {
        monthlyAttendedMap[mKey].scheduled++;
        if (isCompleted) monthlyAttendedMap[mKey].attended++;
      }
    });

    const monthlyHistory = sixMonthTrendData.map((m) => ({
      monthKey: m.monthKey,
      label: m.label,
      year: m.year,
      month: m.month,
      attended: monthlyAttendedMap[m.monthKey]?.attended || 0,
      scheduled: monthlyAttendedMap[m.monthKey]?.scheduled || 0,
      earnings: m.revenue,
      spendings: m.expenses,
      profit: m.profit
    }));

    return {
      todayAttended,
      todayScheduled,
      weekAttended,
      weekScheduled,
      monthAttended,
      monthScheduled,
      sixMonthsAttended,
      sixMonthsScheduled,
      monthlyHistory
    };
  }, [appointments, sixMonthTrendData, dateRanges, currentYear, currentMonth]);

  // ---------------------------------------------------------------------------
  // 3. Compute Financials & Net Revenue Target Pacing (100% Synced with FinanceDashboard)
  // ---------------------------------------------------------------------------
  const financialMetrics = useMemo(() => {
    const selectedMonthSummary = calculateMonthFinances({
      monthKey: currentMonthKey,
      invoices,
      bills,
      expenses,
      monthlyFinances
    });

    const isDateInSubHorizon = (dateVal: string | undefined, horizon: 'today' | 'week'): boolean => {
      const d = parseLocalFriendlyDate(dateVal);
      if (!d) return false;
      if (horizon === 'today') {
        return formatLocalYMD(d) === dateRanges.todayStr;
      }
      return d >= dateRanges.monday && d <= dateRanges.sunday;
    };

    let grossEarnings = 0;
    let totalSpendings = 0;
    let pendingReceivables = 0;
    let totalBilled = 0;
    let collectedInvoicesRevenue = 0;
    let collectedBillsRevenue = 0;
    let additionalDirectRevenue = 0;
    let totalCollectedVouchers = 0;
    let totalPaidVouchers = 0;
    let paidVouchersCount = 0;
    let collectedInvoicesCount = 0;
    let hasSetExpenses = false;
    const categoryBreakdown: Record<ExpenseCategory, number> = {
      rent: 0,
      salary: 0,
      consumable: 0,
      other: 0
    };

    if (selectedHorizon === 'month') {
      grossEarnings = selectedMonthSummary.totalRevenue;
      totalSpendings = selectedMonthSummary.totalEffectiveExpenses;
      pendingReceivables = selectedMonthSummary.pendingInvoicedAmount;
      totalBilled = selectedMonthSummary.totalBilled;
      collectedInvoicesRevenue = selectedMonthSummary.collectedInvoicesRevenue;
      collectedBillsRevenue = selectedMonthSummary.collectedBillsRevenue;
      additionalDirectRevenue = selectedMonthSummary.additionalDirectRevenue;
      totalCollectedVouchers = selectedMonthSummary.totalCollectedVouchers;
      totalPaidVouchers = selectedMonthSummary.totalPaidVouchers;
      paidVouchersCount = selectedMonthSummary.monthPaidVouchers.length;
      collectedInvoicesCount = selectedMonthSummary.collectedInvoicesCount;
      hasSetExpenses = selectedMonthSummary.hasSetExpenses;
      categoryBreakdown.rent = selectedMonthSummary.effectiveRent;
      categoryBreakdown.salary = selectedMonthSummary.effectiveSalary;
      categoryBreakdown.consumable = selectedMonthSummary.effectiveConsumables;
      categoryBreakdown.other = selectedMonthSummary.effectiveOther;
    } else if (selectedHorizon === 'six_months') {
      sixMonthTrendData.forEach((m) => {
        const ms = m.summary;
        grossEarnings += ms.totalRevenue;
        totalSpendings += ms.totalEffectiveExpenses;
        pendingReceivables += ms.pendingInvoicedAmount;
        totalBilled += ms.totalBilled;
        collectedInvoicesRevenue += ms.collectedInvoicesRevenue;
        collectedBillsRevenue += ms.collectedBillsRevenue;
        additionalDirectRevenue += ms.additionalDirectRevenue;
        totalCollectedVouchers += ms.totalCollectedVouchers;
        totalPaidVouchers += ms.totalPaidVouchers;
        paidVouchersCount += ms.monthPaidVouchers.length;
        collectedInvoicesCount += ms.collectedInvoicesCount;
        if (ms.hasSetExpenses) hasSetExpenses = true;
        categoryBreakdown.rent += ms.effectiveRent;
        categoryBreakdown.salary += ms.effectiveSalary;
        categoryBreakdown.consumable += ms.effectiveConsumables;
        categoryBreakdown.other += ms.effectiveOther;
      });
    } else {
      // 'today' or 'week' using identical FinanceDashboard status & deduplication rules
      const scopedInvoices = invoices.filter((inv) =>
        isDateInSubHorizon(inv.paymentDate || inv.createdAt, selectedHorizon)
      );
      const scopedBills = bills.filter((b) =>
        isDateInSubHorizon(b.paymentDate || b.createdAt, selectedHorizon)
      );

      const collectedInvs = scopedInvoices.filter((inv) => inv.status === 'collected');
      collectedInvoicesCount = collectedInvs.length;
      collectedInvoicesRevenue = collectedInvs.reduce(
        (sum, inv) => sum + (Number(inv.totalAmount) || 0),
        0
      );

      const invApptIds = new Set(
        collectedInvs.map((inv) => inv.appointmentId).filter(Boolean)
      );

      collectedBillsRevenue = scopedBills
        .filter((b) => b.status === 'collected' && (!b.appointmentId || !invApptIds.has(b.appointmentId)))
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

      pendingReceivables = scopedInvoices
        .filter((inv) => inv.status === 'pending')
        .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

      const scopedExpenses = expenses.filter((exp) =>
        isDateInSubHorizon(exp.date || exp.createdAt, selectedHorizon)
      );

      totalCollectedVouchers = scopedExpenses
        .filter((e) => e.voucherType === 'collected')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const paidVouchers = scopedExpenses.filter((e) => (e.voucherType || 'paid') === 'paid');
      paidVouchersCount = paidVouchers.length;

      paidVouchers.forEach((e) => {
        const amt = Number(e.amount) || 0;
        const cat = e.category || 'other';
        if (categoryBreakdown[cat] !== undefined) {
          categoryBreakdown[cat] += amt;
        } else {
          categoryBreakdown.other += amt;
        }
        totalSpendings += amt;
      });

      totalPaidVouchers = totalSpendings;
      grossEarnings = collectedInvoicesRevenue + collectedBillsRevenue + totalCollectedVouchers;
      totalBilled = grossEarnings + pendingReceivables;
    }

    const netProfit = grossEarnings - totalSpendings;
    const profitMargin = grossEarnings > 0 ? (netProfit / grossEarnings) * 100 : 0;
    const collectionEfficiency = totalBilled > 0 ? (grossEarnings / totalBilled) * 100 : 100;

    // Canonical Net Revenue Target & Month Status (identical to selectedMonthSummary)
    const targetRevenue = selectedMonthSummary.monthVoucherTarget;
    const currentMonthNetProfit = selectedMonthSummary.netEarnings;
    const currentMonthGross = selectedMonthSummary.totalRevenue;
    const currentMonthSpendings = selectedMonthSummary.totalEffectiveExpenses;
    const targetAchievedPercent = selectedMonthSummary.targetAchievementPercent;
    const isTargetAchieved = selectedMonthSummary.isTargetAchieved;
    const remainingToTarget = selectedMonthSummary.remainingToTarget;
    const surplusOverTarget = selectedMonthSummary.surplusOverTarget;

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const isPastMonth =
      currentYear < systemYear || (currentYear === systemYear && currentMonth < systemMonth);
    const isFutureMonth =
      currentYear > systemYear || (currentYear === systemYear && currentMonth > systemMonth);
    const currentDay = isPastMonth
      ? daysInMonth
      : isFutureMonth
      ? 0
      : Math.min(new Date().getDate(), daysInMonth);
    const timeElapsedPercent = daysInMonth > 0 ? (currentDay / daysInMonth) * 100 : 0;
    const pacingDelta = targetRevenue > 0 ? targetAchievedPercent - timeElapsedPercent : 0;

    let pacingStatus: 'unset' | 'achieved' | 'ahead' | 'on_track' | 'behind' = 'on_track';
    if (targetRevenue <= 0) pacingStatus = 'unset';
    else if (isTargetAchieved) pacingStatus = 'achieved';
    else if (pacingDelta >= 5) pacingStatus = 'ahead';
    else if (pacingDelta <= -10) pacingStatus = 'behind';

    const dailyNetVelocity = currentDay > 0 ? currentMonthNetProfit / currentDay : 0;
    const projectedMonthEndNet = Math.round(dailyNetVelocity * daysInMonth);

    const rawCategoryEntries: Array<{ key: ExpenseCategory; label: string; amount: number }> = [
      { key: 'rent', label: 'Clinic Rent', amount: categoryBreakdown.rent },
      { key: 'salary', label: 'Staff Payroll', amount: categoryBreakdown.salary },
      { key: 'consumable', label: 'Consumables', amount: categoryBreakdown.consumable },
      { key: 'other', label: 'Other Overhead', amount: categoryBreakdown.other }
    ];
    const categoryEntries = [...rawCategoryEntries].sort((a, b) => b.amount - a.amount);

    const topCategoryLabel =
      categoryEntries[0] && categoryEntries[0].amount > 0
        ? `${categoryEntries[0].label} (₹${categoryEntries[0].amount.toLocaleString('en-IN')})`
        : 'No expenses logged';

    return {
      grossEarnings,
      totalSpendings,
      netProfit,
      profitMargin,
      totalBilled,
      pendingReceivables,
      collectionEfficiency,
      collectedInvoicesRevenue,
      collectedBillsRevenue,
      additionalDirectRevenue,
      totalCollectedVouchers,
      totalPaidVouchers,
      paidVouchersCount,
      collectedInvoicesCount,
      hasSetExpenses,
      targetRevenue,
      currentMonthNetProfit,
      currentMonthGross,
      currentMonthSpendings,
      targetAchievedPercent,
      isTargetAchieved,
      remainingToTarget,
      surplusOverTarget,
      timeElapsedPercent,
      pacingDelta,
      pacingStatus,
      projectedMonthEndNet,
      daysInMonth,
      currentDay,
      categoryBreakdown,
      topCategoryLabel
    };
  }, [
    sixMonthTrendData,
    invoices,
    bills,
    expenses,
    monthlyFinances,
    selectedHorizon,
    currentMonthKey,
    dateRanges,
    currentYear,
    currentMonth,
    systemYear,
    systemMonth
  ]);

  // ---------------------------------------------------------------------------
  // 4. Analytics Widgets: Treatments, Status, Doctors, Receivables
  // ---------------------------------------------------------------------------
  const widgetMetrics = useMemo(() => {
    const isInHorizon = (dateVal: string | undefined): boolean => {
      if (!dateVal) return false;
      if (selectedHorizon === 'month') {
        return dateVal.startsWith(currentMonthKey);
      }
      const d = parseLocalFriendlyDate(dateVal);
      if (!d) return false;
      const dateStr = formatLocalYMD(d);

      if (selectedHorizon === 'today') return dateStr === dateRanges.todayStr;
      if (selectedHorizon === 'week') return d >= dateRanges.monday && d <= dateRanges.sunday;
      return d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth;
    };

    const isAppointmentInHorizon = (dateVal: string | undefined): boolean => {
      const d = parseLocalFriendlyDate(dateVal);
      if (!d) return false;
      const dateStr = formatLocalYMD(d);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      if (selectedHorizon === 'today') return dateStr === dateRanges.todayStr;
      if (selectedHorizon === 'week') return d >= dateRanges.monday && d <= dateRanges.sunday;
      if (selectedHorizon === 'month') return y === currentYear && m === currentMonth;
      return d >= dateRanges.sixMonthsAgo && d <= dateRanges.endOfMonth;
    };

    const treatmentCounts: Record<string, { count: number }> = {};
    let totalTreatmentsCount = 0;

    let completedCount = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalScopeApps = 0;

    const doctorStatsMap: Record<
      string,
      { name: string; specialty: string; attended: number; totalBooked: number; revenue: number }
    > = {};

    dentists.forEach((d) => {
      doctorStatsMap[d.uid] = {
        name: d.displayName || 'Registered Practitioner',
        specialty: d.specialty || getDefaultPractitionerSpecialty(d.role),
        attended: 0,
        totalBooked: 0,
        revenue: 0
      };
    });

    appointments.forEach((app) => {
      if (!isAppointmentInHorizon(app.dateTime || app.createdAt)) return;

      const treatName = app.treatment?.trim() || 'General Consultation';
      if (!treatmentCounts[treatName]) {
        treatmentCounts[treatName] = { count: 0 };
      }
      treatmentCounts[treatName].count++;
      totalTreatmentsCount++;

      totalScopeApps++;
      if (app.status === 'completed') completedCount++;
      else if (app.status === 'confirmed') confirmedCount++;
      else if (app.status === 'pending') pendingCount++;
      else if (app.status === 'cancelled') cancelledCount++;

      const matchedDoctor = findRegisteredDoctorMatch(dentists, app.dentistId, app.dentistName);
      if (matchedDoctor && doctorStatsMap[matchedDoctor.uid]) {
        doctorStatsMap[matchedDoctor.uid].totalBooked++;
        if (app.status === 'completed') {
          doctorStatsMap[matchedDoctor.uid].attended++;
        }
      }
    });

    const topTreatments = Object.entries(treatmentCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        percentage: totalTreatmentsCount > 0 ? Math.round((data.count / totalTreatmentsCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const cancellationRate =
      totalScopeApps > 0 ? Math.round((cancelledCount / totalScopeApps) * 100 * 10) / 10 : 0;

    // Attribute revenue strictly to practitioners registered to this clinic
    const collectedInvApptIds = new Set<string>();
    invoices.forEach((inv) => {
      if (!isInHorizon(inv.paymentDate || inv.createdAt)) return;
      if (inv.status !== 'collected') return;
      if (inv.appointmentId) collectedInvApptIds.add(inv.appointmentId);

      const matchedDoctor = findRegisteredDoctorMatch(dentists, inv.dentistId, inv.dentistName);
      if (matchedDoctor && doctorStatsMap[matchedDoctor.uid]) {
        doctorStatsMap[matchedDoctor.uid].revenue += Number(inv.totalAmount) || 0;
      }
    });

    bills.forEach((b) => {
      if (!isInHorizon(b.paymentDate || b.createdAt)) return;
      if (b.status !== 'collected') return;
      if (b.appointmentId && collectedInvApptIds.has(b.appointmentId)) return;

      const matchedDoctor = findRegisteredDoctorMatch(dentists, b.dentistId, b.dentistName);
      if (matchedDoctor && doctorStatsMap[matchedDoctor.uid]) {
        doctorStatsMap[matchedDoctor.uid].revenue += Number(b.totalAmount) || 0;
      }
    });

    const doctorProductivity = Object.values(doctorStatsMap).map((docItem) => ({
      ...docItem,
      avgTicketSize: docItem.attended > 0 ? Math.round(docItem.revenue / docItem.attended) : 0
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
  }, [appointments, dentists, invoices, bills, selectedHorizon, currentMonthKey, dateRanges, currentYear, currentMonth]);

  // ---------------------------------------------------------------------------
  // 5. Actions: Save Target & Log Expense (Synced with FinanceDashboard schema)
  // ---------------------------------------------------------------------------
  const handleSaveTarget = async () => {
    setTargetError(null);
    const val = parseFloat(targetAmountInput.replace(/,/g, ''));
    if (isNaN(val) || val < 0) {
      setTargetError('Please enter a valid net revenue target amount.');
      return;
    }

    setSavingTarget(true);
    setTargetSaveSuccess(false);

    try {
      const docId = `${clinicSlug}_${currentYear}_${String(currentMonth).padStart(2, '0')}`;
      const docRef = doc(db, 'monthly_finances', docId);

      await executeFirestoreWrite(() =>
        setDoc(
          docRef,
          {
            id: docId,
            clinicSlug,
            year: currentYear,
            month: currentMonth,
            monthKey: currentMonthKey,
            monthLabel: currentMonthLabel,
            voucherTargetAmount: val,
            setBy: userProfile?.displayName || userProfile?.email || 'Clinic Staff',
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        )
      );

      setTargetSaveSuccess(true);
      setTimeout(() => {
        setTargetSaveSuccess(false);
        setShowTargetModal(false);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save target:', err);
      setTargetError(err?.message || 'Failed to update target in database.');
    } finally {
      setSavingTarget(false);
    }
  };

  const handleSaveQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError(null);
    const amt = parseFloat(expenseAmount.replace(/,/g, ''));
    if (!expenseTitle.trim() || isNaN(amt) || amt <= 0) {
      setExpenseError('Please enter an expense description and a valid amount.');
      return;
    }

    setSavingExpense(true);
    setExpenseSuccess(false);

    try {
      const expDate = expenseDate || new Date().toISOString().split('T')[0];
      const mKey = expDate.substring(0, 7);

      await executeFirestoreWrite(() =>
        addDoc(collection(db, 'expenses'), {
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
        })
      );

      setExpenseSuccess(true);
      setTimeout(() => {
        setExpenseSuccess(false);
        setShowExpenseModal(false);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseVendor('');
        setExpenseReceiptNo('');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to log expense:', err);
      setExpenseError(err?.message || 'Failed to record expense in database.');
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
    const letterhead = buildClinicLetterhead(
      activeClinic,
      clinicName,
      mainLogo
    );
    const curFin = monthlyFinances[currentMonthKey];
    const hasSetRent = (curFin?.clinicRent || 0) > 0;
    const hasSetSalary = (curFin?.staffSalary || 0) > 0;
    const hasSetConsumable = (curFin?.consumableItems || 0) > 0;
    const hasSetOther = (curFin?.otherExpenses || 0) > 0;

    const pacingLabelText =
      financialMetrics.pacingStatus === 'achieved'
        ? 'Target Achieved'
        : financialMetrics.pacingStatus === 'ahead'
        ? 'Ahead of Schedule'
        : financialMetrics.pacingStatus === 'on_track'
        ? 'On Track'
        : financialMetrics.pacingStatus === 'behind'
        ? 'Behind Pace'
        : 'Target Not Set';

    setPrintPreviewDoc({
      type: 'analytics_report',
      fileName: `${letterhead.clinicSlug}_Analytics_KPI_${currentMonthKey}.pdf`.replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      ),
      documentTitle: 'Clinical & Financial Performance Report',
      documentNumber: `KPI-${currentMonthKey}`,
      periodLabel: currentMonthLabel,
      horizonLabel,
      issueDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      clinic: letterhead,
      attendanceMetrics: {
        todayAttended: attendanceMetrics.todayAttended,
        todayScheduled: attendanceMetrics.todayScheduled,
        weekAttended: attendanceMetrics.weekAttended,
        weekScheduled: attendanceMetrics.weekScheduled,
        monthAttended: attendanceMetrics.monthAttended,
        monthScheduled: attendanceMetrics.monthScheduled,
        sixMonthsAttended: attendanceMetrics.sixMonthsAttended,
        sixMonthsScheduled: attendanceMetrics.sixMonthsScheduled,
        completedCount: widgetMetrics.completedCount,
        confirmedCount: widgetMetrics.confirmedCount,
        pendingCount: widgetMetrics.pendingCount,
        cancelledCount: widgetMetrics.cancelledCount,
        cancellationRatePct: widgetMetrics.cancellationRate
      },
      financialSummary: {
        grossEarnings: financialMetrics.grossEarnings,
        totalExpenses: financialMetrics.totalSpendings,
        netRevenue: financialMetrics.netProfit,
        profitMarginPct: financialMetrics.profitMargin,
        targetAmount: financialMetrics.targetRevenue,
        targetProgressPct: financialMetrics.targetAchievedPercent,
        pacingLabel: pacingLabelText,
        projectedMonthEndNet: financialMetrics.projectedMonthEndNet,
        collectionRatePct: financialMetrics.collectionEfficiency,
        pendingReceivables: financialMetrics.pendingReceivables
      },
      expenseBreakdown: [
        {
          label: 'Clinic Rent',
          amount: financialMetrics.categoryBreakdown.rent,
          source: selectedHorizon === 'month' && hasSetRent ? 'Configured' : 'Vouchers'
        },
        {
          label: 'Staff Payroll',
          amount: financialMetrics.categoryBreakdown.salary,
          source: selectedHorizon === 'month' && hasSetSalary ? 'Configured' : 'Vouchers'
        },
        {
          label: 'Dental Consumables',
          amount: financialMetrics.categoryBreakdown.consumable,
          source: selectedHorizon === 'month' && hasSetConsumable ? 'Configured' : 'Vouchers'
        },
        {
          label: 'Other Overhead',
          amount: financialMetrics.categoryBreakdown.other,
          source: selectedHorizon === 'month' && hasSetOther ? 'Configured' : 'Vouchers'
        }
      ],
      doctorDistribution: widgetMetrics.doctorProductivity.map((d) => ({
        doctorName: d.name,
        specialty: d.specialty,
        totalBooked: d.totalBooked,
        attendedCount: d.attended,
        revenue: d.revenue,
        avgTicketSize: d.avgTicketSize
      })),
      treatmentDistribution: widgetMetrics.topTreatments.map((t) => ({
        treatmentName: t.name,
        count: t.count,
        sharePct: t.percentage
      })),
      sixMonthTrend: attendanceMetrics.monthlyHistory.map((m) => ({
        monthLabel: m.label,
        attended: m.attended,
        scheduled: m.scheduled,
        earnings: m.earnings,
        expenses: m.spendings,
        netProfit: m.profit
      })),
      preparedBy: userProfile?.displayName || userProfile?.email || 'Executive Analytics'
    });
  };

  const horizonLabel =
    selectedHorizon === 'today'
      ? 'Today'
      : selectedHorizon === 'week'
      ? 'This Week'
      : selectedHorizon === 'month'
      ? currentMonthLabel
      : 'Last 6 Months';

  if (loading && appointments.length === 0 && invoices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-3">
        <RefreshCw className="h-7 w-7 animate-spin text-revon-blue mx-auto" />
        <p className="text-xs font-mono text-slate-500">Synchronizing live clinic analytics & finances...</p>
      </div>
    );
  }

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
              Clinical &amp; Financial Intelligence
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time patient attendance volume, unified revenue &amp; expense ledger synced with Finances &amp; Expenses, and net revenue target pacing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setExpenseError(null);
                setShowExpenseModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Expense</span>
            </button>

            {isAdminOrSuperAdmin && (
              <button
                onClick={() => {
                  setTargetError(null);
                  setShowTargetModal(true);
                }}
                className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Target className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600" />
                <span>Set Target</span>
              </button>
            )}

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

        {/* Time Horizon Segmented Control + Synced Month Navigator */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
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
                Monthly ({FINANCE_SHORT_MONTH_NAMES[currentMonth - 1]})
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

            {/* Month Switcher synced identically with Finances & Expenses */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700">
              <button
                onClick={handlePrevMonth}
                title="Previous Month (syncs with Finances & Expenses)"
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-100 min-w-[116px] text-center">
                {currentMonthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                title="Next Month (syncs with Finances & Expenses)"
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {!isCurrentSystemMonth && (
                <button
                  onClick={handleResetToCurrentMonth}
                  className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-white dark:bg-slate-700 text-revon-blue dark:text-cyan-300 rounded-md shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  Current
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('finances')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1.5 cursor-pointer"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Synced 1:1 with Finances &amp; Expenses →</span>
          </button>
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
          <button
            type="button"
            onClick={() => setSelectedHorizon('today')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedHorizon === 'today'
                ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
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
              <span>Today&apos;s Date</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{dateRanges.todayStr}</span>
            </div>
          </button>

          {/* Card 2: This Week */}
          <button
            type="button"
            onClick={() => setSelectedHorizon('week')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedHorizon === 'week'
                ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
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
          </button>

          {/* Card 3: Selected Month */}
          <button
            type="button"
            onClick={() => setSelectedHorizon('month')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedHorizon === 'month'
                ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold">Attended ({FINANCE_SHORT_MONTH_NAMES[currentMonth - 1]})</span>
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
              <span>Selected Month</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                {FINANCE_SHORT_MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
            </div>
          </button>

          {/* Card 4: Last 6 Months */}
          <button
            type="button"
            onClick={() => setSelectedHorizon('six_months')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedHorizon === 'six_months'
                ? 'bg-white dark:bg-slate-900 border-revon-blue ring-1 ring-revon-blue shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
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
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. TARGET TRACKING & PACING GAUGE (NET REVENUE vs MONTHLY TARGET) */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                Monthly Net Revenue Target &amp; Pacing ({currentMonthLabel})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synced with Finances &amp; Expenses: Gross Earnings (₹{financialMetrics.currentMonthGross.toLocaleString('en-IN')}) − Total Expenses (₹{financialMetrics.currentMonthSpendings.toLocaleString('en-IN')}) = Net Revenue.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider font-mono flex items-center space-x-1 ${
                financialMetrics.pacingStatus === 'achieved' || financialMetrics.pacingStatus === 'ahead'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : financialMetrics.pacingStatus === 'behind'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : financialMetrics.pacingStatus === 'unset'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {(financialMetrics.pacingStatus === 'achieved' || financialMetrics.pacingStatus === 'ahead') && (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {financialMetrics.pacingStatus === 'behind' && <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>
                {financialMetrics.pacingStatus === 'unset'
                  ? 'No Target Set'
                  : financialMetrics.pacingStatus === 'achieved'
                  ? `Target Achieved (+₹${financialMetrics.surplusOverTarget.toLocaleString('en-IN')})`
                  : financialMetrics.pacingStatus === 'ahead'
                  ? `Ahead of Pace (+${financialMetrics.pacingDelta.toFixed(1)}%)`
                  : financialMetrics.pacingStatus === 'behind'
                  ? `Behind Target (${financialMetrics.pacingDelta.toFixed(1)}%)`
                  : 'On Track with Goal'}
              </span>
            </span>

            {isAdminOrSuperAdmin && (
              <button
                onClick={() => {
                  setTargetError(null);
                  setShowTargetModal(true);
                }}
                className="text-xs font-bold text-revon-blue dark:text-revon-teal hover:underline cursor-pointer"
              >
                {financialMetrics.targetRevenue > 0 ? 'Adjust Target' : 'Set Target'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">
                {currentMonthLabel} Net Revenue
              </span>
              <span
                className={`text-xl font-extrabold tabular-nums ${
                  financialMetrics.currentMonthNetProfit >= 0
                    ? 'text-slate-900 dark:text-white'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {financialMetrics.currentMonthNetProfit < 0 ? '-' : ''}₹
                {Math.abs(financialMetrics.currentMonthNetProfit).toLocaleString('en-IN')}
              </span>
              {financialMetrics.targetRevenue > 0 && (
                <span className="text-slate-400 ml-1.5 font-bold">
                  ({Math.max(0, financialMetrics.targetAchievedPercent).toFixed(1)}% of Target)
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">
                Monthly Net Target
              </span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {financialMetrics.targetRevenue > 0
                  ? `₹${financialMetrics.targetRevenue.toLocaleString('en-IN')}`
                  : 'Not Set'}
              </span>
            </div>
          </div>

          <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                financialMetrics.targetAchievedPercent >= 100
                  ? 'bg-emerald-500'
                  : financialMetrics.pacingStatus === 'ahead'
                  ? 'bg-gradient-to-r from-revon-blue to-emerald-500'
                  : 'bg-revon-blue'
              }`}
              style={{
                width: `${
                  financialMetrics.targetRevenue > 0
                    ? Math.min(100, Math.max(0, financialMetrics.targetAchievedPercent))
                    : 0
                }%`
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
              style={{ left: `${financialMetrics.timeElapsedPercent}%` }}
              title={`Day ${financialMetrics.currentDay} of ${financialMetrics.daysInMonth} (${financialMetrics.timeElapsedPercent.toFixed(0)}% elapsed)`}
            />
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>
              Day {financialMetrics.currentDay} of {financialMetrics.daysInMonth} elapsed (
              {financialMetrics.timeElapsedPercent.toFixed(0)}% of month)
            </span>
            <span>
              {financialMetrics.targetRevenue > 0 && !financialMetrics.isTargetAchieved
                ? `Remaining to target: ₹${financialMetrics.remainingToTarget.toLocaleString('en-IN')} · Projected month-end net: ₹${financialMetrics.projectedMonthEndNet.toLocaleString('en-IN')}`
                : `Projected month-end net velocity: ₹${financialMetrics.projectedMonthEndNet.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. FINANCIAL PERFORMANCE: EARNINGS, SPENDINGS, NET PROFIT */}
      {/* --------------------------------------------------------------------- */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center space-x-2">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            <span>Financial Inflows &amp; Outflows ({horizonLabel})</span>
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigateTab && onNavigateTab('finances')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Open Finances &amp; Expenses →
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('billing')}
              className="text-xs font-bold text-revon-blue dark:text-revon-teal hover:underline cursor-pointer"
            >
              Open Billing Panel →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Earnings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">Total Gross Earnings</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                ₹{financialMetrics.grossEarnings.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {financialMetrics.collectedInvoicesCount} invoices (₹{financialMetrics.collectedInvoicesRevenue.toLocaleString('en-IN')})
                {financialMetrics.collectedBillsRevenue > 0 && ` + ₹${financialMetrics.collectedBillsRevenue.toLocaleString('en-IN')} bills`}
                {financialMetrics.totalCollectedVouchers > 0 && ` + ₹${financialMetrics.totalCollectedVouchers.toLocaleString('en-IN')} vouchers`}
                {financialMetrics.additionalDirectRevenue > 0 && ` + ₹${financialMetrics.additionalDirectRevenue.toLocaleString('en-IN')} other rev`}
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
              <div className="flex items-center space-x-1.5">
                <span className="font-bold">Total Expenses</span>
                {financialMetrics.hasSetExpenses && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-50 dark:bg-blue-950 text-revon-blue dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-mono">
                    SET
                  </span>
                )}
              </div>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                ₹{financialMetrics.totalSpendings.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Rent ₹{financialMetrics.categoryBreakdown.rent.toLocaleString('en-IN')} · Salary ₹{financialMetrics.categoryBreakdown.salary.toLocaleString('en-IN')} · Stock ₹{financialMetrics.categoryBreakdown.consumable.toLocaleString('en-IN')} · Other ₹{financialMetrics.categoryBreakdown.other.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>{financialMetrics.paidVouchersCount} paid vouchers (₹{financialMetrics.totalPaidVouchers.toLocaleString('en-IN')})</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {financialMetrics.topCategoryLabel}
              </span>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">Net Profit / Earnings</span>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-revon-blue">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div
                className={`text-3xl font-extrabold font-mono tabular-nums ${
                  financialMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {financialMetrics.netProfit >= 0 ? '+' : '-'}₹
                {Math.abs(financialMetrics.netProfit).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Gross Revenue (₹{financialMetrics.grossEarnings.toLocaleString('en-IN')}) − Total Expenses (₹{financialMetrics.totalSpendings.toLocaleString('en-IN')}).
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>{financialMetrics.netProfit >= 0 ? 'Profitable' : 'Deficit / Loss'}</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {financialMetrics.profitMargin.toFixed(1)}% Margin
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
              Month-by-month patient attendance, gross earnings vs expenses, and net margins synced identically with Finances &amp; Expenses.
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {attendanceMetrics.monthlyHistory.map((m) => {
            const isSelected = m.monthKey === currentMonthKey;
            return (
              <button
                type="button"
                key={m.monthKey}
                onClick={() => {
                  setSelectedHorizon('month');
                  updateSelectedPeriod(m.year, m.month);
                }}
                className={`p-3.5 rounded-2xl border text-center space-y-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-50/80 dark:bg-slate-800/60 border-revon-blue ring-1 ring-revon-blue'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {m.label} {isSelected && <span className="text-[10px] text-revon-blue font-mono font-bold block">(Selected)</span>}
                </div>

                <div className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Attended</div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {m.attended}
                  </div>
                </div>

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
                      {m.profit >= 0 ? '+' : '-'}₹{Math.abs(m.profit).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </button>
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
                Top Treatments &amp; Procedure Distribution
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
                Appointment Status &amp; Retention Rate
              </h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
                widgetMetrics.cancellationRate <= 8
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
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
            Assistants can trigger automated WhatsApp / Email post-op instructions from the Reminders tab to sustain high retention and avoid lost chair-time.
          </p>
        </div>

        {/* Widget C: Doctor-Wise Patient Distribution & Productivity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4 text-indigo-600 shrink-0" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                Doctor Patient Distribution &amp; Productivity
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap shrink-0">
              {widgetMetrics.doctorProductivity.length} {widgetMetrics.doctorProductivity.length === 1 ? 'Doctor' : 'Doctors'} Scoped
            </span>
          </div>

          {widgetMetrics.doctorProductivity.length === 0 ? (
            <div className="py-8 px-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 text-center space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                No practitioners registered to {clinicName} yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Only Dentist, Doctor, or Specialist accounts explicitly registered to this clinic appear in Doctor Productivity and Reports.
              </p>
              {isAdminOrSuperAdmin && onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('admin')}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Manage Registered Users
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {widgetMetrics.doctorProductivity.map((docItem) => (
                <div key={docItem.name} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {docItem.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {docItem.specialty}
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {docItem.attended} Attended <span className="text-slate-400 font-normal">({docItem.totalBooked} booked)</span>
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      ₹{docItem.revenue.toLocaleString('en-IN')} revenue · Avg ₹{docItem.avgTicketSize.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget D: Outstanding Receivables & Collection Efficiency */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                Receivables &amp; Collection Recovery
              </h3>
            </div>
            <span className="text-xs text-emerald-600 font-mono font-bold">
              {financialMetrics.collectionEfficiency.toFixed(1)}% Collected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Total Billed &amp; Inflow</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                ₹{financialMetrics.totalBilled.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="text-xs text-rose-600 font-mono uppercase tracking-wider mb-1">Pending Receivables</div>
              <div className="text-2xl font-extrabold text-rose-600 font-mono tabular-nums">
                ₹{financialMetrics.pendingReceivables.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {financialMetrics.pendingReceivables > 0
                ? 'Follow up with patients having pending treatment invoices.'
                : 'All issued treatment invoices in this horizon are settled!'}
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
      {/* 7. MODAL: ADJUST MONTHLY NET REVENUE TARGET */}
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
                    Set Monthly Net Revenue Target
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

            {targetError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{targetError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Monthly Net Target (₹) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={targetAmountInput}
                    onChange={(e) => setTargetAmountInput(e.target.value)}
                    className="w-full text-base font-bold font-mono pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-revon-blue text-slate-900 dark:text-white"
                    placeholder="e.g. 50000"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Updates the shared Finances &amp; Expenses net revenue target for {currentMonthLabel}.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {[50000, 100000, 150000, 250000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetAmountInput(String(val))}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all"
                    >
                      ₹{val / 1000}k
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
                  <p className="text-xs text-slate-400">Syncs directly with Finances &amp; Expenses ledger</p>
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

            {expenseError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{expenseError}</span>
              </div>
            )}

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
                    <option value="consumable">Consumables &amp; Dental Stock</option>
                    <option value="rent">Clinic Premises Rent</option>
                    <option value="salary">Staff &amp; Doctor Payroll</option>
                    <option value="other">Utilities, Sanitation &amp; Other</option>
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

      <PrintPreviewModal
        documentData={printPreviewDoc}
        onClose={() => setPrintPreviewDoc(null)}
      />
    </div>
  );
}
