import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { UserProfile, MonthlyFinance, Expense, ExpenseCategory, Invoice, Bill } from '../types';
import { useClinic } from '../context/ClinicContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building, 
  Users, 
  Package, 
  Layers, 
  Plus, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Copy, 
  Save, 
  X, 
  ShieldCheck, 
  ArrowUpRight, 
  FileSpreadsheet,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface FinanceDashboardProps {
  userProfile?: UserProfile | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function FinanceDashboard({ userProfile }: FinanceDashboardProps) {
  const { activeClinic } = useClinic();
  const clinicSlug = activeClinic?.slug || 'revon-dental';

  // Current system date
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12

  // Month key string e.g. "2026-09"
  const selectedMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const selectedMonthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  // Role verification
  const isAdminOrSuperAdmin = Boolean(
    userProfile?.role === 'admin' || 
    userProfile?.role === 'super-admin' || 
    userProfile?.isSuperAdmin
  );

  // ---------------------------------------------------------------------------
  // Firestore Real-Time Subscriptions
  // ---------------------------------------------------------------------------
  const [monthlyFinances, setMonthlyFinances] = useState<Record<string, MonthlyFinance>>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingFinances, setLoadingFinances] = useState<boolean>(true);
  const [loadingExpenses, setLoadingExpenses] = useState<boolean>(true);

  // 1. Subscribe to monthly_finances for current clinic
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'monthly_finances'), (snapshot) => {
      const finMap: Record<string, MonthlyFinance> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MonthlyFinance;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          finMap[data.monthKey || docSnap.id] = {
            ...data,
            id: docSnap.id
          };
        }
      });
      setMonthlyFinances(finMap);
      setLoadingFinances(false);
    }, (err) => {
      console.error('Failed to load monthly finances:', err);
      setLoadingFinances(false);
    });

    return () => unsub();
  }, [clinicSlug]);

  // 2. Subscribe to expenses collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Expense;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          list.push({
            ...data,
            id: docSnap.id
          });
        }
      });
      // Sort newest first
      list.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
      setExpenses(list);
      setLoadingExpenses(false);
    }, (err) => {
      console.error('Failed to load expenses:', err);
      setLoadingExpenses(false);
    });

    return () => unsub();
  }, [clinicSlug]);

  // 3. Subscribe to invoices
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const invList: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Invoice;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          invList.push({
            ...data,
            id: docSnap.id
          });
        }
      });
      setInvoices(invList);
    }, (err) => {
      console.error('Failed to load invoices:', err);
    });

    return () => unsub();
  }, [clinicSlug]);

  // 4. Subscribe to bills
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bills'), (snapshot) => {
      const billList: Bill[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Bill;
        if (!data.clinicSlug || data.clinicSlug === clinicSlug) {
          billList.push({
            ...data,
            id: docSnap.id
          });
        }
      });
      setBills(billList);
    }, (err) => {
      console.error('Failed to load bills:', err);
    });

    return () => unsub();
  }, [clinicSlug]);

  // ---------------------------------------------------------------------------
  // Calculations for Current Selected Month
  // ---------------------------------------------------------------------------
  const currentMonthFinance = monthlyFinances[selectedMonthKey];

  // Invoices for selected month
  const monthInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const dateStr = inv.paymentDate || inv.createdAt || '';
      return dateStr.startsWith(selectedMonthKey);
    });
  }, [invoices, selectedMonthKey]);

  // Bills for selected month
  const monthBills = useMemo(() => {
    return bills.filter((b) => {
      const dateStr = b.paymentDate || b.createdAt || '';
      return dateStr.startsWith(selectedMonthKey);
    });
  }, [bills, selectedMonthKey]);

  // Gross Collected Revenue from treatment invoices
  const collectedInvoicesRevenue = useMemo(() => {
    return monthInvoices
      .filter((inv) => inv.status === 'collected')
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [monthInvoices]);

  // Collected revenue from bills (avoid double counting if matching appointmentId already collected in invoices)
  const collectedBillsRevenue = useMemo(() => {
    const invoiceApptIds = new Set(
      monthInvoices.filter((inv) => inv.status === 'collected').map((inv) => inv.appointmentId).filter(Boolean)
    );
    return monthBills
      .filter((b) => b.status === 'collected' && (!b.appointmentId || !invoiceApptIds.has(b.appointmentId)))
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  }, [monthBills, monthInvoices]);

  // Uncollected / Pending Invoices for selected month
  const pendingInvoicedAmount = useMemo(() => {
    return monthInvoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [monthInvoices]);

  // Additional miscellaneous revenue set by admin (e.g. lab rebates, camps)
  const additionalDirectRevenue = Number(currentMonthFinance?.otherRevenue) || 0;

  // Total Gross Revenue / Earning for this month
  const totalRevenue = collectedInvoicesRevenue + collectedBillsRevenue + additionalDirectRevenue;

  // Monthly Expenses:
  // Admin budgeted / set figures
  const setClinicRent = Number(currentMonthFinance?.clinicRent) || 0;
  const setStaffSalary = Number(currentMonthFinance?.staffSalary) || 0;
  const setConsumableItems = Number(currentMonthFinance?.consumableItems) || 0;
  const setOtherExpenses = Number(currentMonthFinance?.otherExpenses) || 0;
  const totalSetExpenses = setClinicRent + setStaffSalary + setConsumableItems + setOtherExpenses;

  // Itemized logged expense vouchers for selected month
  const monthExpenseVouchers = useMemo(() => {
    return expenses.filter((e) => {
      const dateStr = e.date || e.createdAt || '';
      return dateStr.startsWith(selectedMonthKey) || e.monthKey === selectedMonthKey;
    });
  }, [expenses, selectedMonthKey]);

  // Category sums of logged vouchers
  const loggedCategoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      rent: 0,
      salary: 0,
      consumable: 0,
      other: 0
    };
    monthExpenseVouchers.forEach((e) => {
      const cat = e.category || 'other';
      if (totals[cat] !== undefined) {
        totals[cat] += Number(e.amount) || 0;
      } else {
        totals.other += Number(e.amount) || 0;
      }
    });
    return totals;
  }, [monthExpenseVouchers]);

  const totalLoggedExpenses = 
    loggedCategoryTotals.rent + 
    loggedCategoryTotals.salary + 
    loggedCategoryTotals.consumable + 
    loggedCategoryTotals.other;

  // Expense mode: If admin explicitly set monthly figures, use set figures as canonical monthly overhead,
  // or show logged vouchers if greater or if set figures are 0.
  const hasSetExpenses = Boolean(currentMonthFinance && totalSetExpenses > 0);
  
  // Total effective monthly expenses (prefers set budget if configured, or logged vouchers sum)
  const effectiveRent = setClinicRent > 0 ? setClinicRent : loggedCategoryTotals.rent;
  const effectiveSalary = setStaffSalary > 0 ? setStaffSalary : loggedCategoryTotals.salary;
  const effectiveConsumables = setConsumableItems > 0 ? setConsumableItems : loggedCategoryTotals.consumable;
  const effectiveOther = setOtherExpenses > 0 ? setOtherExpenses : loggedCategoryTotals.other;
  const totalEffectiveExpenses = effectiveRent + effectiveSalary + effectiveConsumables + effectiveOther;

  // Net Profit / Net Margin calculation
  const netEarnings = totalRevenue - totalEffectiveExpenses;
  const profitMarginPercent = totalRevenue > 0 
    ? ((netEarnings / totalRevenue) * 100).toFixed(1) 
    : '0.0';

  // ---------------------------------------------------------------------------
  // Modals & Forms State
  // ---------------------------------------------------------------------------
  const [showSetBudgetModal, setShowSetBudgetModal] = useState<boolean>(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [savingBudget, setSavingBudget] = useState<boolean>(false);
  const [savingExpense, setSavingExpense] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for Setting Monthly Expenses
  const [budgetForm, setBudgetForm] = useState({
    clinicRent: '',
    staffSalary: '',
    consumableItems: '',
    otherExpenses: '',
    otherRevenue: '',
    notes: ''
  });

  // Populate budget form when opening modal or changing month
  useEffect(() => {
    if (currentMonthFinance) {
      setBudgetForm({
        clinicRent: currentMonthFinance.clinicRent ? String(currentMonthFinance.clinicRent) : '',
        staffSalary: currentMonthFinance.staffSalary ? String(currentMonthFinance.staffSalary) : '',
        consumableItems: currentMonthFinance.consumableItems ? String(currentMonthFinance.consumableItems) : '',
        otherExpenses: currentMonthFinance.otherExpenses ? String(currentMonthFinance.otherExpenses) : '',
        otherRevenue: currentMonthFinance.otherRevenue ? String(currentMonthFinance.otherRevenue) : '',
        notes: currentMonthFinance.notes || ''
      });
    } else {
      // Default initial baseline suggestions
      setBudgetForm({
        clinicRent: '45000',
        staffSalary: '120000',
        consumableItems: '25000',
        otherExpenses: '15000',
        otherRevenue: '',
        notes: ''
      });
    }
  }, [currentMonthFinance, selectedMonthKey]);

  // Form state for Adding/Editing Itemized Expense Voucher
  const [expenseForm, setExpenseForm] = useState<{
    title: string;
    category: ExpenseCategory;
    amount: string;
    date: string;
    vendor: string;
    paymentMode: 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Card' | 'Other';
    receiptNumber: string;
    paidStatus: 'paid' | 'pending';
    notes: string;
  }>({
    title: '',
    category: 'consumable',
    amount: '',
    date: `${selectedMonthKey}-01`,
    vendor: '',
    paymentMode: 'Bank Transfer',
    receiptNumber: '',
    paidStatus: 'paid',
    notes: ''
  });

  // Table filtering & pagination
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>('all');
  const [expenseFilterStatus, setExpenseFilterStatus] = useState<string>('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('');
  const [expensePage, setExpensePage] = useState<number>(1);
  const [expensePageSize, setExpensePageSize] = useState<number>(6);

  // Filtered expense vouchers
  const filteredExpenseVouchers = useMemo(() => {
    return monthExpenseVouchers.filter((e) => {
      const matchCat = expenseFilterCategory === 'all' || e.category === expenseFilterCategory;
      const matchStatus = expenseFilterStatus === 'all' || e.paidStatus === expenseFilterStatus;
      const matchSearch = 
        !expenseSearchQuery.trim() || 
        e.title.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
        (e.vendor && e.vendor.toLowerCase().includes(expenseSearchQuery.toLowerCase())) ||
        (e.receiptNumber && e.receiptNumber.toLowerCase().includes(expenseSearchQuery.toLowerCase()));
      return matchCat && matchStatus && matchSearch;
    });
  }, [monthExpenseVouchers, expenseFilterCategory, expenseFilterStatus, expenseSearchQuery]);

  // ---------------------------------------------------------------------------
  // Month Navigation Handlers
  // ---------------------------------------------------------------------------
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setExpensePage(1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setExpensePage(1);
  };

  const handleCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
    setExpensePage(1);
  };

  // ---------------------------------------------------------------------------
  // Action Handlers (Admin / Super Admin)
  // ---------------------------------------------------------------------------
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrSuperAdmin) {
      alert('Unauthorized: Only an Admin or Super Admin can set monthly expenses.');
      return;
    }

    setSavingBudget(true);
    setStatusMessage(null);

    try {
      const rent = Number(budgetForm.clinicRent) || 0;
      const salary = Number(budgetForm.staffSalary) || 0;
      const consumables = Number(budgetForm.consumableItems) || 0;
      const other = Number(budgetForm.otherExpenses) || 0;
      const directRev = Number(budgetForm.otherRevenue) || 0;
      const totalBudget = rent + salary + consumables + other;

      const docId = `${clinicSlug}_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
      const docRef = doc(db, 'monthly_finances', docId);

      const payload: MonthlyFinance = {
        id: docId,
        clinicSlug,
        year: selectedYear,
        month: selectedMonth,
        monthKey: selectedMonthKey,
        monthLabel: selectedMonthLabel,
        clinicRent: rent,
        staffSalary: salary,
        consumableItems: consumables,
        otherExpenses: other,
        totalBudgetedExpenses: totalBudget,
        otherRevenue: directRev,
        notes: budgetForm.notes.trim(),
        setBy: userProfile?.displayName || userProfile?.email || 'Admin',
        setByRole: userProfile?.role || 'admin',
        setAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
      setStatusMessage({ 
        type: 'success', 
        text: `Monthly expenses for ${selectedMonthLabel} saved successfully!` 
      });
      setShowSetBudgetModal(false);
    } catch (err: any) {
      console.error('Error saving monthly budget:', err);
      setStatusMessage({ 
        type: 'error', 
        text: `Failed to save monthly expenses: ${err?.message || 'Unknown error'}` 
      });
    } finally {
      setSavingBudget(false);
    }
  };

  // Quick Copy from Previous Month
  const handleCopyFromPreviousMonth = () => {
    let prevYear = selectedYear;
    let prevMonth = selectedMonth - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const prevData = monthlyFinances[prevKey];

    if (prevData) {
      setBudgetForm({
        clinicRent: String(prevData.clinicRent || 0),
        staffSalary: String(prevData.staffSalary || 0),
        consumableItems: String(prevData.consumableItems || 0),
        otherExpenses: String(prevData.otherExpenses || 0),
        otherRevenue: String(prevData.otherRevenue || 0),
        notes: prevData.notes ? `Copied from ${prevData.monthLabel || prevKey}: ${prevData.notes}` : ''
      });
      alert(`Copied expense parameters from ${MONTH_NAMES[prevMonth - 1]} ${prevYear}! Review and click Save.`);
    } else {
      alert(`No saved budget found for ${MONTH_NAMES[prevMonth - 1]} ${prevYear} to copy from.`);
    }
  };

  // Add or Edit Expense Voucher
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '',
      category: 'consumable',
      amount: '',
      date: `${selectedMonthKey}-05`,
      vendor: '',
      paymentMode: 'Bank Transfer',
      receiptNumber: '',
      paidStatus: 'paid',
      notes: ''
    });
    setShowAddExpenseModal(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
      vendor: expense.vendor || '',
      paymentMode: expense.paymentMode || 'Bank Transfer',
      receiptNumber: expense.receiptNumber || '',
      paidStatus: expense.paidStatus,
      notes: expense.notes || ''
    });
    setShowAddExpenseModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrSuperAdmin) {
      alert('Unauthorized: Only an Admin or Super Admin can log expenses.');
      return;
    }

    if (!expenseForm.title.trim() || !expenseForm.amount) {
      alert('Please provide a title and amount for the expense.');
      return;
    }

    setSavingExpense(true);

    try {
      const expenseMonthKey = expenseForm.date.substring(0, 7); // YYYY-MM
      const amountVal = Number(expenseForm.amount) || 0;

      const expenseData: Omit<Expense, 'id'> = {
        clinicSlug,
        monthKey: expenseMonthKey,
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: amountVal,
        date: expenseForm.date,
        vendor: expenseForm.vendor.trim(),
        paymentMode: expenseForm.paymentMode,
        receiptNumber: expenseForm.receiptNumber.trim(),
        paidStatus: expenseForm.paidStatus,
        notes: expenseForm.notes.trim(),
        createdBy: userProfile?.displayName || userProfile?.email || 'Admin',
        createdAt: editingExpense?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingExpense) {
        await updateDoc(doc(db, 'expenses', editingExpense.id), expenseData);
      } else {
        await addDoc(collection(db, 'expenses'), expenseData);
      }

      setShowAddExpenseModal(false);
      setEditingExpense(null);
    } catch (err: any) {
      console.error('Error saving expense voucher:', err);
      alert(`Failed to save expense: ${err?.message || 'Unknown error'}`);
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!isAdminOrSuperAdmin) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setStatusMessage({ type: 'success', text: `Expense voucher "${title}" was deleted.` });
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      setStatusMessage({ type: 'error', text: `Failed to delete expense voucher: ${err?.message || 'Unknown error'}` });
    }
  };

  const handleTogglePaidStatus = async (expense: Expense) => {
    if (!isAdminOrSuperAdmin) return;
    const newStatus = expense.paidStatus === 'paid' ? 'pending' : 'paid';
    try {
      await updateDoc(doc(db, 'expenses', expense.id), {
        paidStatus: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to toggle expense status:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // 6-Month Comparison Data for Visualization Bar Chart
  // ---------------------------------------------------------------------------
  const sixMonthTrend = useMemo(() => {
    const list = [];
    for (let i = 5; i >= 0; i--) {
      let targetMonth = selectedMonth - i;
      let targetYear = selectedYear;
      while (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      const mKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
      const mLabel = `${MONTH_NAMES[targetMonth - 1].substring(0, 3)} '${String(targetYear).substring(2)}`;

      // Calculate collected revenue for that month
      const mInvs = invoices.filter((inv) => (inv.paymentDate || inv.createdAt || '').startsWith(mKey));
      const mBills = bills.filter((b) => (b.paymentDate || b.createdAt || '').startsWith(mKey));
      const invRevenue = mInvs.filter((inv) => inv.status === 'collected').reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
      const billRevenue = mBills.filter((b) => b.status === 'collected').reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      const mFin = monthlyFinances[mKey];
      const mDirectRev = Number(mFin?.otherRevenue) || 0;
      const mRev = invRevenue + billRevenue + mDirectRev;

      // Calculate expenses for that month
      const mRent = Number(mFin?.clinicRent) || 0;
      const mSal = Number(mFin?.staffSalary) || 0;
      const mCons = Number(mFin?.consumableItems) || 0;
      const mOth = Number(mFin?.otherExpenses) || 0;
      const mSetExp = mRent + mSal + mCons + mOth;

      // Itemized sum
      const mVouchers = expenses.filter((e) => (e.date || e.createdAt || '').startsWith(mKey) || e.monthKey === mKey);
      const mVoucherSum = mVouchers.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const mExp = mSetExp > 0 ? mSetExp : mVoucherSum;
      const mProfit = mRev - mExp;

      list.push({
        monthKey: mKey,
        label: mLabel,
        revenue: mRev,
        expenses: mExp,
        profit: mProfit
      });
    }
    return list;
  }, [selectedMonth, selectedYear, invoices, bills, monthlyFinances, expenses]);

  // Max value in 6 months for scaling the visual bars
  const maxTrendVal = useMemo(() => {
    let max = 10000;
    sixMonthTrend.forEach((m) => {
      if (m.revenue > max) max = m.revenue;
      if (m.expenses > max) max = m.expenses;
    });
    return max * 1.15;
  }, [sixMonthTrend]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Vendor', 'Amount (INR)', 'Payment Mode', 'Status', 'Receipt Number', 'Notes'];
    const rows = monthExpenseVouchers.map((e) => [
      `"${e.date || ''}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${e.paymentMode || ''}"`,
      `"${e.paidStatus}"`,
      `"${e.receiptNumber || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    // Financial summary rows
    const summaryRows = [
      [],
      ['MONTHLY FINANCIAL SUMMARY', selectedMonthLabel],
      ['Total Gross Revenue / Earnings', totalRevenue],
      ['Total Monthly Expenses', totalEffectiveExpenses],
      ['  - Clinic Rent', effectiveRent],
      ['  - Staff Salary', effectiveSalary],
      ['  - Consumable Items', effectiveConsumables],
      ['  - Other Expenses', effectiveOther],
      ['Net Profit / Net Margin', netEarnings],
      ['Net Profit Margin %', `${profitMarginPercent}%`],
      []
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      summaryRows.map((r) => r.join(',')).join('\n') +
      headers.join(',') + '\n' +
      rows.map((r) => r.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${clinicSlug}-finances-${selectedMonthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Financial Summary Statement
  const handlePrintReport = () => {
    window.print();
  };

  if (userProfile?.role === 'patient') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Access Restricted</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clinic financial analytics, revenue tracking, and operating expenses are confidential and restricted to authorized clinic staff members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* --------------------------------------------------------------------------- */}
      {/* 1. Header Bar with Month Picker & Admin Controls */}
      {/* --------------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/60">
              <TrendingUp className="h-5 w-5" />
            </span>
            <h2 className="font-bold text-slate-900 dark:text-white text-xl font-display tracking-tight">
              Monthly Earnings & Expenses Dashboard
            </h2>
            {isAdminOrSuperAdmin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                <ShieldCheck className="h-3 w-3 mr-1" />
                ADMIN CONTROL
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track gross earnings, collected revenue, and monthly overheads (Clinic Rent, Staff Salary, Consumable Items, and Other Overheads) for {activeClinic?.name || 'Clinic'}.
          </p>
        </div>

        {/* Month Navigator & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Month Selector Carousel */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 py-1 flex items-center space-x-1.5 font-display font-bold text-xs text-slate-800 dark:text-slate-100 min-w-[130px] justify-center">
              <Calendar className="h-3.5 w-3.5 text-revon-blue dark:text-cyan-400" />
              <span>{selectedMonthLabel}</span>
            </div>
            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="ml-1 px-2 py-1 text-[10px] font-bold uppercase bg-white dark:bg-slate-700 text-revon-blue dark:text-cyan-300 rounded-md shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              Current
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button
              id="print-statement-btn"
              onClick={handlePrintReport}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
              title="Print Monthly Statement"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Set Monthly Expenses Button (Admin / Super Admin) */}
            <button
              id="set-monthly-expenses-btn"
              onClick={() => setShowSetBudgetModal(true)}
              disabled={!isAdminOrSuperAdmin}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
                isAdminOrSuperAdmin
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title={isAdminOrSuperAdmin ? 'Configure monthly rent, salary & expenses' : 'Requires Admin or Super Admin role'}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Set Monthly Expenses</span>
            </button>

            {/* Add Itemized Expense Voucher */}
            <button
              id="add-expense-voucher-btn"
              onClick={handleOpenAddExpense}
              disabled={!isAdminOrSuperAdmin}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
                isAdminOrSuperAdmin
                  ? 'bg-revon-blue hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title={isAdminOrSuperAdmin ? 'Log an individual expense voucher' : 'Requires Admin or Super Admin role'}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status notification banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* 2. Top-Level KPI Summary Cards */}
      {/* --------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Gross Earnings / Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Total Gross Earnings
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {monthInvoices.filter(i => i.status === 'collected').length} invoices collected
            </span>
            {pendingInvoicedAmount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium font-mono">
                (₹{pendingInvoicedAmount.toLocaleString('en-IN')} pending)
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Total Monthly Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  Total Expenses
                </span>
                {hasSetExpenses && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-50 dark:bg-blue-950 text-revon-blue dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    SET
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                ₹{totalEffectiveExpenses.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {monthExpenseVouchers.length} vouchers logged
            </span>
            <span className="text-slate-400 font-mono">
              ₹{totalLoggedExpenses.toLocaleString('en-IN')} logged
            </span>
          </div>
        </div>

        {/* KPI 3: Net Earnings / Profit Margin */}
        <div className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden flex flex-col justify-between ${
          netEarnings >= 0 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60' 
            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/60'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Net Profit / Earnings
              </span>
              <h3 className={`text-2xl font-black font-mono mt-1 ${
                netEarnings >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}>
                {netEarnings >= 0 ? '+' : ''}₹{netEarnings.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${
              netEarnings >= 0 
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
            }`}>
              {netEarnings >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className={`font-bold ${netEarnings >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {netEarnings >= 0 ? 'Profitable' : 'Deficit / Loss'}
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {profitMarginPercent}% Margin
            </span>
          </div>
        </div>

        {/* KPI 4: Monthly Expense Configuration Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Expense Setup Status
              </span>
              <div className="mt-1 flex items-center space-x-2">
                {hasSetExpenses ? (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Month Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Pending Admin Setup
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {currentMonthFinance?.setBy ? `Set by ${currentMonthFinance.setBy}` : 'Set by Admin / Super Admin'}
            </span>
            {isAdminOrSuperAdmin && (
              <button
                onClick={() => setShowSetBudgetModal(true)}
                className="text-revon-blue dark:text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                {hasSetExpenses ? 'Edit' : 'Set Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------- */}
      {/* 3. The 4 Expense Categories Breakdown Cards */}
      {/* --------------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 font-display flex items-center space-x-2">
            <Layers className="h-4 w-4 text-revon-blue" />
            <span>Core Expense Categories Breakdown (Configured for {selectedMonthLabel})</span>
          </h4>
          <span className="text-xs text-slate-400">
            Rent • Salaries • Consumables • Overheads
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category 1: Clinic Rent */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 text-revon-blue dark:text-blue-400 rounded-xl">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs font-display">Clinic Rent</h5>
                  <p className="text-[10px] text-slate-400">Facility lease & premises</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {totalEffectiveExpenses > 0 ? ((effectiveRent / totalEffectiveExpenses) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{effectiveRent.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Logged: ₹{loggedCategoryTotals.rent.toLocaleString('en-IN')}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalEffectiveExpenses > 0 ? Math.min(100, (effectiveRent / totalEffectiveExpenses) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category 2: Staff Salary */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs font-display">Staff Salary</h5>
                  <p className="text-[10px] text-slate-400">Dentists, nurses & reception</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {totalEffectiveExpenses > 0 ? ((effectiveSalary / totalEffectiveExpenses) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{effectiveSalary.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Logged: ₹{loggedCategoryTotals.salary.toLocaleString('en-IN')}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalEffectiveExpenses > 0 ? Math.min(100, (effectiveSalary / totalEffectiveExpenses) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category 3: Consumable Items */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs font-display">Consumable Items</h5>
                  <p className="text-[10px] text-slate-400">Composites, PPE, anesthesia</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {totalEffectiveExpenses > 0 ? ((effectiveConsumables / totalEffectiveExpenses) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{effectiveConsumables.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Logged: ₹{loggedCategoryTotals.consumable.toLocaleString('en-IN')}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalEffectiveExpenses > 0 ? Math.min(100, (effectiveConsumables / totalEffectiveExpenses) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category 4: Other Expenses */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs font-display">Other Expenses</h5>
                  <p className="text-[10px] text-slate-400">Power, bio-waste, repairs</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {totalEffectiveExpenses > 0 ? ((effectiveOther / totalEffectiveExpenses) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{effectiveOther.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Logged: ₹{loggedCategoryTotals.other.toLocaleString('en-IN')}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalEffectiveExpenses > 0 ? Math.min(100, (effectiveOther / totalEffectiveExpenses) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------- */}
      {/* 4. Visual Comparison Charts (6-Month Trend & Distribution) */}
      {/* --------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 6-Month Revenue vs Expenses Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-revon-blue" />
                <span>6-Month Trend: Earnings vs. Overheads vs. Profit</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Historical comparison across the last 6 operating months.</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Earnings</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Expenses</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Net</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Canvas */}
          <div className="h-56 pt-4 flex items-end justify-between gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            {sixMonthTrend.map((m) => {
              const revHeight = maxTrendVal > 0 ? Math.max(8, (m.revenue / maxTrendVal) * 100) : 8;
              const expHeight = maxTrendVal > 0 ? Math.max(8, (m.expenses / maxTrendVal) * 100) : 8;
              const isSelected = m.monthKey === selectedMonthKey;

              return (
                <div key={m.monthKey} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg font-mono">
                    <div className="font-bold text-slate-300">{m.label}</div>
                    <div className="text-emerald-400">Revenue: ₹{m.revenue.toLocaleString('en-IN')}</div>
                    <div className="text-rose-400">Expenses: ₹{m.expenses.toLocaleString('en-IN')}</div>
                    <div className="text-cyan-300">Profit: ₹{m.profit.toLocaleString('en-IN')}</div>
                  </div>

                  {/* Side-by-side bars */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44">
                    {/* Revenue Bar */}
                    <div 
                      className={`w-3 sm:w-5 rounded-t-md transition-all duration-300 ${
                        isSelected ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-400/80 hover:bg-emerald-500'
                      }`}
                      style={{ height: `${revHeight}%` }}
                      title={`Revenue: ₹${m.revenue.toLocaleString('en-IN')}`}
                    />
                    {/* Expense Bar */}
                    <div 
                      className={`w-3 sm:w-5 rounded-t-md transition-all duration-300 ${
                        isSelected ? 'bg-rose-500 shadow-sm' : 'bg-rose-400/80 hover:bg-rose-500'
                      }`}
                      style={{ height: `${expHeight}%` }}
                      title={`Expenses: ₹${m.expenses.toLocaleString('en-IN')}`}
                    />
                  </div>

                  {/* Month Label */}
                  <span className={`text-[10px] font-medium mt-2 font-mono ${
                    isSelected ? 'font-black text-revon-blue dark:text-cyan-400' : 'text-slate-400'
                  }`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Y-Axis Auto-Scaled to Peak Monthly Volume</span>
            <span className="font-mono">Peak Benchmark: ₹{Math.round(maxTrendVal).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Right 1 Col: Category Distribution Donut / Progress breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display flex items-center space-x-2">
              <PieChartIcon className="h-4 w-4 text-purple-600" />
              <span>Expense Proportions</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Share of {selectedMonthLabel} operational budget.</p>
          </div>

          {/* Visual Stacked Progress Bar */}
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-600 h-full" 
                style={{ width: `${totalEffectiveExpenses > 0 ? (effectiveRent / totalEffectiveExpenses) * 100 : 25}%` }}
                title="Rent"
              />
              <div 
                className="bg-purple-600 h-full" 
                style={{ width: `${totalEffectiveExpenses > 0 ? (effectiveSalary / totalEffectiveExpenses) * 100 : 40}%` }}
                title="Staff Salary"
              />
              <div 
                className="bg-amber-500 h-full" 
                style={{ width: `${totalEffectiveExpenses > 0 ? (effectiveConsumables / totalEffectiveExpenses) * 100 : 20}%` }}
                title="Consumables"
              />
              <div 
                className="bg-teal-500 h-full" 
                style={{ width: `${totalEffectiveExpenses > 0 ? (effectiveOther / totalEffectiveExpenses) * 100 : 15}%` }}
                title="Other"
              />
            </div>

            {/* List with percentages */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Clinic Rent</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{effectiveRent.toLocaleString('en-IN')} ({totalEffectiveExpenses > 0 ? ((effectiveRent / totalEffectiveExpenses) * 100).toFixed(0) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600 inline-block" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Staff Salary</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{effectiveSalary.toLocaleString('en-IN')} ({totalEffectiveExpenses > 0 ? ((effectiveSalary / totalEffectiveExpenses) * 100).toFixed(0) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Consumables</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{effectiveConsumables.toLocaleString('en-IN')} ({totalEffectiveExpenses > 0 ? ((effectiveConsumables / totalEffectiveExpenses) * 100).toFixed(0) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500 inline-block" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Other Overheads</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{effectiveOther.toLocaleString('en-IN')} ({totalEffectiveExpenses > 0 ? ((effectiveOther / totalEffectiveExpenses) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            {currentMonthFinance?.notes ? (
              <p className="italic">"{currentMonthFinance.notes}"</p>
            ) : (
              <span>Monthly overhead targets set by clinic leadership.</span>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------- */}
      {/* 5. Itemized Expense Vouchers Table & Management */}
      {/* --------------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Header & Search/Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4 text-revon-blue" />
              <span>Itemized Expense Vouchers ({selectedMonthLabel})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specific bills, supplier invoices, payroll stubs, and rent vouchers logged for accounting.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={expenseSearchQuery}
                onChange={(e) => {
                  setExpenseSearchQuery(e.target.value);
                  setExpensePage(1);
                }}
                placeholder="Search vendor, title..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-revon-blue/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Category Filter */}
            <select
              value={expenseFilterCategory}
              onChange={(e) => {
                setExpenseFilterCategory(e.target.value);
                setExpensePage(1);
              }}
              className="py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="rent">Clinic Rent</option>
              <option value="salary">Staff Salary</option>
              <option value="consumable">Consumable Items</option>
              <option value="other">Other Expenses</option>
            </select>

            {/* Status Filter */}
            <select
              value={expenseFilterStatus}
              onChange={(e) => {
                setExpenseFilterStatus(e.target.value);
                setExpensePage(1);
              }}
              className="py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>

            {isAdminOrSuperAdmin && (
              <button
                onClick={handleOpenAddExpense}
                className="px-3 py-1.5 bg-revon-blue hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Voucher</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loadingExpenses ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="h-6 w-6 mx-auto animate-spin text-revon-blue mb-2" />
            <span className="text-xs">Loading expense records...</span>
          </div>
        ) : filteredExpenseVouchers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <p className="text-xs">
              No itemized expense vouchers found for {selectedMonthLabel}
              {expenseFilterCategory !== 'all' ? ` in "${expenseFilterCategory}"` : ''}.
            </p>
            {isAdminOrSuperAdmin && (
              <button
                onClick={handleOpenAddExpense}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                + Log First Expense Voucher for {selectedMonthLabel}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 font-mono">
                    <th className="p-4">Date</th>
                    <th className="p-4">Title & Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Vendor / Payee</th>
                    <th className="p-4">Payment Mode</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    {isAdminOrSuperAdmin && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {filteredExpenseVouchers
                    .slice((expensePage - 1) * expensePageSize, expensePage * expensePageSize)
                    .map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{exp.title}</div>
                          {exp.notes && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5">{exp.notes}</div>
                          )}
                          {exp.receiptNumber && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {exp.receiptNumber}</div>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            exp.category === 'rent'
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : exp.category === 'salary'
                              ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : exp.category === 'consumable'
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                          }`}>
                            {exp.category === 'rent' && 'Clinic Rent'}
                            {exp.category === 'salary' && 'Staff Salary'}
                            {exp.category === 'consumable' && 'Consumables'}
                            {exp.category === 'other' && 'Other Expense'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                          {exp.vendor || '—'}
                        </td>
                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                          {exp.paymentMode || 'Bank Transfer'}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <button
                            onClick={() => handleTogglePaidStatus(exp)}
                            disabled={!isAdminOrSuperAdmin}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer ${
                              exp.paidStatus === 'paid'
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                            title={isAdminOrSuperAdmin ? 'Click to toggle Paid/Pending' : undefined}
                          >
                            {exp.paidStatus === 'paid' ? 'Paid' : 'Pending'}
                          </button>
                        </td>
                        {isAdminOrSuperAdmin && (
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditExpense(exp)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                              title="Edit expense"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id, exp.title)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredExpenseVouchers.length > expensePageSize && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <PaginationControls
                  currentPage={expensePage}
                  totalItems={filteredExpenseVouchers.length}
                  pageSize={expensePageSize}
                  onPageChange={(p) => setExpensePage(p)}
                  onPageSizeChange={(sz) => {
                    setExpensePageSize(sz);
                    setExpensePage(1);
                  }}
                  pageSizeOptions={[6, 12, 24, 50]}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* --------------------------------------------------------------------------- */}
      {/* 6. MODAL: Set Monthly Expenses (Admin / Super Admin Only) */}
      {/* --------------------------------------------------------------------------- */}
      {showSetBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                    Set Monthly Expenses & Budget
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configuring for <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMonthLabel}</span> (Admin / Super Admin)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSetBudgetModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4 text-xs">
              {/* Quick Copy Tool */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-center justify-between">
                <span className="text-blue-900 dark:text-blue-200 text-xs">
                  Save time on recurring overheads:
                </span>
                <button
                  type="button"
                  onClick={handleCopyFromPreviousMonth}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-revon-blue dark:text-cyan-300 font-bold rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy from Last Month</span>
                </button>
              </div>

              {/* The 4 core expense categories explicitly requested by user */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Clinic Rent */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Building className="h-3.5 w-3.5 text-blue-600" />
                    <span>Clinic Rent (₹)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={budgetForm.clinicRent}
                    onChange={(e) => setBudgetForm({ ...budgetForm, clinicRent: e.target.value })}
                    placeholder="e.g. 45000"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Monthly facility rent/lease for clinic</span>
                </div>

                {/* 2. Staff Salary */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                    <span>Staff Salary (₹)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={budgetForm.staffSalary}
                    onChange={(e) => setBudgetForm({ ...budgetForm, staffSalary: e.target.value })}
                    placeholder="e.g. 120000"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Payroll for dentists, hygienists, reception</span>
                </div>

                {/* 3. Consumable Items */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Package className="h-3.5 w-3.5 text-amber-600" />
                    <span>Consumable Items (₹)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={budgetForm.consumableItems}
                    onChange={(e) => setBudgetForm({ ...budgetForm, consumableItems: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Dental composites, gloves, needles, burs</span>
                </div>

                {/* 4. Other Expenses */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Layers className="h-3.5 w-3.5 text-teal-600" />
                    <span>Other Expenses (₹)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={budgetForm.otherExpenses}
                    onChange={(e) => setBudgetForm({ ...budgetForm, otherExpenses: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">Electricity, bio-waste, maintenance, water</span>
                </div>
              </div>

              {/* Total Computed Budget Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between font-mono">
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  Total Configured Monthly Expenses:
                </span>
                <span className="font-extrabold text-base text-rose-600 dark:text-rose-400">
                  ₹{(
                    (Number(budgetForm.clinicRent) || 0) +
                    (Number(budgetForm.staffSalary) || 0) +
                    (Number(budgetForm.consumableItems) || 0) +
                    (Number(budgetForm.otherExpenses) || 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Additional Miscellaneous Revenue (Optional) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Direct Clinic Revenue (₹) <span className="text-slate-400 font-normal">(Optional: lab rebates, dental camps)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={budgetForm.otherRevenue}
                  onChange={(e) => setBudgetForm({ ...budgetForm, otherRevenue: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Financial Notes / Targets
                </label>
                <textarea
                  rows={2}
                  value={budgetForm.notes}
                  onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                  placeholder="e.g. Annual lease increment applied this month; ordered bulk composite supplies."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowSetBudgetModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingBudget ? 'Saving...' : `Save Expenses for ${selectedMonthLabel}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* 7. MODAL: Add / Edit Itemized Expense Voucher */}
      {/* --------------------------------------------------------------------------- */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-revon-blue/10 dark:bg-cyan-950 text-revon-blue dark:text-cyan-400 rounded-xl">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                    {editingExpense ? 'Edit Expense Voucher' : 'Log New Expense Voucher'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Record supplier bills, rent receipts, payroll stubs, or consumables
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Description / Title *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Monthly Clinic Lease - Indiranagar Flagship"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="rent">Clinic Rent</option>
                    <option value="salary">Staff Salary</option>
                    <option value="consumable">Consumable Items</option>
                    <option value="other">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Date & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Payee
                  </label>
                  <input
                    type="text"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    placeholder="e.g. Dentsply Sirona / Landlord"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment Mode & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={expenseForm.paymentMode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={expenseForm.paidStatus}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidStatus: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt / Bill Ref
                  </label>
                  <input
                    type="text"
                    value={expenseForm.receiptNumber}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
                    placeholder="e.g. INV-8492"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Specification
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Optional details regarding item batch, warranty, or purpose."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-revon-blue/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-5 py-2 bg-revon-blue hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingExpense ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
