import { Bill, Expense, ExpenseCategory, Invoice, MonthlyFinance } from '../types';

export const FINANCE_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const FINANCE_SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export interface CanonicalMonthFinanceResult {
  monthKey: string;
  monthInvoices: Invoice[];
  monthBills: Bill[];
  monthExpenseVouchers: Expense[];
  monthPaidVouchers: Expense[];
  monthCollectedVouchers: Expense[];
  collectedInvoicesRevenue: number;
  collectedInvoicesCount: number;
  collectedBillsRevenue: number;
  pendingInvoicedAmount: number;
  additionalDirectRevenue: number;
  totalCollectedVouchers: number;
  totalPaidVouchers: number;
  netVoucherExpense: number;
  totalRevenue: number;
  totalBilled: number;
  loggedCategoryTotals: Record<ExpenseCategory, number>;
  totalLoggedExpenses: number;
  setClinicRent: number;
  setStaffSalary: number;
  setConsumableItems: number;
  setOtherExpenses: number;
  totalSetExpenses: number;
  hasSetExpenses: boolean;
  effectiveRent: number;
  effectiveSalary: number;
  effectiveConsumables: number;
  effectiveOther: number;
  totalEffectiveExpenses: number;
  netEarnings: number;
  profitMarginPercent: string;
  monthVoucherTarget: number;
  targetAchievementPercent: number;
  isTargetAchieved: boolean;
  remainingToTarget: number;
  surplusOverTarget: number;
}

export interface SixMonthTrendItem {
  monthKey: string;
  label: string;
  shortYearLabel: string;
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
  summary: CanonicalMonthFinanceResult;
}

/**
 * Normalizes monthly_finances snapshot items into a monthKey-keyed map,
 * deterministically preferring records explicitly scoped to `clinicSlug` over
 * legacy unscoped records.
 */
export function buildMonthlyFinancesMap(
  entries: Array<{ id: string; data: MonthlyFinance }>,
  clinicSlug: string
): Record<string, MonthlyFinance> {
  const finMap: Record<string, MonthlyFinance> = {};
  const exactMatchKeys = new Set<string>();

  entries.forEach(({ id, data }) => {
    const isExact = data.clinicSlug === clinicSlug;
    const isLegacy = !data.clinicSlug;
    if (!isExact && !isLegacy) return;

    const key = data.monthKey || id;
    if (isExact) {
      exactMatchKeys.add(key);
      finMap[key] = { ...data, id };
    } else if (!exactMatchKeys.has(key)) {
      finMap[key] = { ...data, id };
    }
  });

  return finMap;
}

/**
 * Parses YYYY-MM-DD in local time so date-only strings never shift a day
 * due to UTC midnight offsets, while parsing full ISO timestamps normally.
 */
export function parseLocalFriendlyDate(dateVal: string | undefined): Date | null {
  if (!dateVal) return null;
  const trimmed = dateVal.trim();
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymdMatch) {
    return new Date(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]), 12, 0, 0);
  }
  const d = new Date(trimmed);
  return !isNaN(d.getTime()) ? d : null;
}

export function formatLocalYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Single canonical monthly financial calculation engine shared identically
 * by Finances & Expenses and Analytics & KPIs.
 */
export function calculateMonthFinances(params: {
  monthKey: string;
  invoices: Invoice[];
  bills: Bill[];
  expenses: Expense[];
  monthlyFinances: Record<string, MonthlyFinance>;
}): CanonicalMonthFinanceResult {
  const { monthKey, invoices, bills, expenses, monthlyFinances } = params;
  const currentMonthFinance = monthlyFinances[monthKey];

  const monthInvoices = invoices.filter((inv) => {
    const dateStr = inv.paymentDate || inv.createdAt || '';
    return dateStr.startsWith(monthKey);
  });

  const monthBills = bills.filter((b) => {
    const dateStr = b.paymentDate || b.createdAt || '';
    return dateStr.startsWith(monthKey);
  });

  const collectedInvoices = monthInvoices.filter((inv) => inv.status === 'collected');
  const collectedInvoicesCount = collectedInvoices.length;
  const collectedInvoicesRevenue = collectedInvoices.reduce(
    (sum, inv) => sum + (Number(inv.totalAmount) || 0),
    0
  );

  const invoiceApptIds = new Set(
    collectedInvoices.map((inv) => inv.appointmentId).filter(Boolean)
  );

  const collectedBillsRevenue = monthBills
    .filter((b) => b.status === 'collected' && (!b.appointmentId || !invoiceApptIds.has(b.appointmentId)))
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const pendingInvoicedAmount = monthInvoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const additionalDirectRevenue = Number(currentMonthFinance?.otherRevenue) || 0;

  const monthExpenseVouchers = expenses.filter((e) => {
    const dateStr = e.date || e.createdAt || '';
    return dateStr.startsWith(monthKey) || e.monthKey === monthKey;
  });

  const monthPaidVouchers = monthExpenseVouchers.filter((e) => (e.voucherType || 'paid') === 'paid');
  const monthCollectedVouchers = monthExpenseVouchers.filter((e) => e.voucherType === 'collected');

  const totalPaidVouchers = monthPaidVouchers.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalCollectedVouchers = monthCollectedVouchers.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const totalRevenue =
    collectedInvoicesRevenue +
    collectedBillsRevenue +
    additionalDirectRevenue +
    totalCollectedVouchers;

  const totalBilled = totalRevenue + pendingInvoicedAmount;

  const setClinicRent = Number(currentMonthFinance?.clinicRent) || 0;
  const setStaffSalary = Number(currentMonthFinance?.staffSalary) || 0;
  const setConsumableItems = Number(currentMonthFinance?.consumableItems) || 0;
  const setOtherExpenses = Number(currentMonthFinance?.otherExpenses) || 0;
  const totalSetExpenses = setClinicRent + setStaffSalary + setConsumableItems + setOtherExpenses;

  const netVoucherExpense = totalPaidVouchers - totalCollectedVouchers;

  const loggedCategoryTotals: Record<ExpenseCategory, number> = {
    rent: 0,
    salary: 0,
    consumable: 0,
    other: 0
  };

  monthPaidVouchers.forEach((e) => {
    const cat = e.category || 'other';
    if (loggedCategoryTotals[cat] !== undefined) {
      loggedCategoryTotals[cat] += Number(e.amount) || 0;
    } else {
      loggedCategoryTotals.other += Number(e.amount) || 0;
    }
  });

  const totalLoggedExpenses =
    loggedCategoryTotals.rent +
    loggedCategoryTotals.salary +
    loggedCategoryTotals.consumable +
    loggedCategoryTotals.other;

  const hasSetExpenses = Boolean(currentMonthFinance && totalSetExpenses > 0);

  const effectiveRent = setClinicRent > 0 ? setClinicRent : loggedCategoryTotals.rent;
  const effectiveSalary = setStaffSalary > 0 ? setStaffSalary : loggedCategoryTotals.salary;
  const effectiveConsumables =
    setConsumableItems > 0 ? setConsumableItems : loggedCategoryTotals.consumable;
  const effectiveOther = setOtherExpenses > 0 ? setOtherExpenses : loggedCategoryTotals.other;
  const totalEffectiveExpenses =
    effectiveRent + effectiveSalary + effectiveConsumables + effectiveOther;

  const netEarnings = totalRevenue - totalEffectiveExpenses;
  const profitMarginPercent =
    totalRevenue > 0 ? ((netEarnings / totalRevenue) * 100).toFixed(1) : '0.0';

  const monthVoucherTarget =
    Number(currentMonthFinance?.voucherTargetAmount) ||
    Number(currentMonthFinance?.totalBudgetedExpenses) ||
    0;

  const targetAchievementPercent =
    monthVoucherTarget > 0 ? (netEarnings / monthVoucherTarget) * 100 : 0;
  const isTargetAchieved = monthVoucherTarget > 0 && netEarnings >= monthVoucherTarget;
  const remainingToTarget =
    monthVoucherTarget > 0 ? Math.max(0, monthVoucherTarget - netEarnings) : 0;
  const surplusOverTarget = isTargetAchieved ? netEarnings - monthVoucherTarget : 0;

  return {
    monthKey,
    monthInvoices,
    monthBills,
    monthExpenseVouchers,
    monthPaidVouchers,
    monthCollectedVouchers,
    collectedInvoicesRevenue,
    collectedInvoicesCount,
    collectedBillsRevenue,
    pendingInvoicedAmount,
    additionalDirectRevenue,
    totalCollectedVouchers,
    totalPaidVouchers,
    netVoucherExpense,
    totalRevenue,
    totalBilled,
    loggedCategoryTotals,
    totalLoggedExpenses,
    setClinicRent,
    setStaffSalary,
    setConsumableItems,
    setOtherExpenses,
    totalSetExpenses,
    hasSetExpenses,
    effectiveRent,
    effectiveSalary,
    effectiveConsumables,
    effectiveOther,
    totalEffectiveExpenses,
    netEarnings,
    profitMarginPercent,
    monthVoucherTarget,
    targetAchievementPercent,
    isTargetAchieved,
    remainingToTarget,
    surplusOverTarget
  };
}

/**
 * Generates the trailing 6-month trend ending at `(anchorYear, anchorMonth)`
 * using `calculateMonthFinances` so both dashboards report identical values.
 */
export function calculateSixMonthTrend(params: {
  anchorYear: number;
  anchorMonth: number;
  invoices: Invoice[];
  bills: Bill[];
  expenses: Expense[];
  monthlyFinances: Record<string, MonthlyFinance>;
}): SixMonthTrendItem[] {
  const { anchorYear, anchorMonth, invoices, bills, expenses, monthlyFinances } = params;
  const list: SixMonthTrendItem[] = [];

  for (let i = 5; i >= 0; i--) {
    let targetMonth = anchorMonth - i;
    let targetYear = anchorYear;
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const label = `${FINANCE_SHORT_MONTH_NAMES[targetMonth - 1]} ${targetYear}`;
    const shortYearLabel = `${FINANCE_MONTH_NAMES[targetMonth - 1].substring(0, 3)} '${String(targetYear).substring(2)}`;

    const summary = calculateMonthFinances({
      monthKey,
      invoices,
      bills,
      expenses,
      monthlyFinances
    });

    list.push({
      monthKey,
      label,
      shortYearLabel,
      year: targetYear,
      month: targetMonth,
      revenue: summary.totalRevenue,
      expenses: summary.totalEffectiveExpenses,
      profit: summary.netEarnings,
      summary
    });
  }

  return list;
}
