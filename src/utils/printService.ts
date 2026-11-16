import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Appointment,
  Bill,
  Clinic,
  Invoice,
  PaymentRecord
} from '../types';
import { APP_NAME } from '../config/appConfig';

export interface ClinicLetterheadInfo {
  clinicName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  locationName: string;
  workingHours: string;
  clinicSlug: string;
}

export interface PrintInvoiceLineItem {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PrintInvoicePayload {
  type: 'invoice';
  fileName: string;
  documentTitle: string;
  documentNumber: string;
  issueDate: string;
  clinic: ClinicLetterheadInfo;
  status: 'collected' | 'partially_paid' | 'pending';
  paymentModeLabel: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  dentistName: string;
  treatmentName: string;
  appointmentDate?: string;
  items: PrintInvoiceLineItem[];
  subtotal: number;
  tax: number;
  taxLabel?: string;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payments: PaymentRecord[];
  notes?: string;
  preparedBy?: string;
}

export interface PrintPostOpPayload {
  type: 'post_op_care';
  fileName: string;
  documentTitle: string;
  documentNumber: string;
  issueDate: string;
  clinic: ClinicLetterheadInfo;
  patientName: string;
  patientPhone?: string;
  dentistName: string;
  treatmentName: string;
  guideName: string;
  guideCategory: string;
  keyPoints: string[];
  dietAdvice: string;
  hygieneAdvice: string;
  emergencyAlert: string;
  customMedicationNote?: string;
  followUpDate?: string;
  preparedBy?: string;
}

export interface PrintFinancialCategoryRow {
  label: string;
  mode: 'Configured Ceiling' | 'Logged Vouchers';
  budgetedAmount: number;
  loggedPaidAmount: number;
  effectiveAmount: number;
}

export interface PrintFinancialVoucherRow {
  date: string;
  title: string;
  category: string;
  voucherType: 'paid' | 'collected';
  vendor: string;
  paymentMode: string;
  status: string;
  amount: number;
}

export interface PrintFinancialStatementPayload {
  type: 'financial_statement';
  fileName: string;
  documentTitle: string;
  documentNumber: string;
  periodLabel: string;
  issueDate: string;
  clinic: ClinicLetterheadInfo;
  kpis: {
    grossEarnings: number;
    totalExpenses: number;
    netRevenue: number;
    netMarginPct: number;
    targetAmount: number;
    targetProgressPct: number;
    isTargetAchieved: boolean;
    remainingToTarget: number;
    surplusOverTarget: number;
    collectedInvoicesRevenue: number;
    collectedBillsRevenue: number;
    collectedVouchersRevenue: number;
    additionalDirectRevenue: number;
    totalPendingReceivables: number;
    pendingVouchersAmount: number;
  };
  categoryBreakdown: PrintFinancialCategoryRow[];
  vouchers: PrintFinancialVoucherRow[];
  notes?: string;
  preparedBy?: string;
}

export interface PrintAnalyticsReportPayload {
  type: 'analytics_report';
  fileName: string;
  documentTitle: string;
  documentNumber: string;
  periodLabel: string;
  horizonLabel: string;
  issueDate: string;
  clinic: ClinicLetterheadInfo;
  attendanceMetrics: {
    todayAttended: number;
    todayScheduled: number;
    weekAttended: number;
    weekScheduled: number;
    monthAttended: number;
    monthScheduled: number;
    sixMonthsAttended: number;
    sixMonthsScheduled: number;
    completedCount: number;
    confirmedCount: number;
    pendingCount: number;
    cancelledCount: number;
    cancellationRatePct: number;
  };
  financialSummary: {
    grossEarnings: number;
    totalExpenses: number;
    netRevenue: number;
    profitMarginPct: number;
    targetAmount: number;
    targetProgressPct: number;
    pacingLabel: string;
    projectedMonthEndNet: number;
    collectionRatePct: number;
    pendingReceivables: number;
  };
  expenseBreakdown: Array<{
    label: string;
    amount: number;
    source: 'Configured' | 'Vouchers';
  }>;
  doctorDistribution: Array<{
    doctorName: string;
    specialty: string;
    totalBooked: number;
    attendedCount: number;
    revenue: number;
    avgTicketSize: number;
  }>;
  treatmentDistribution: Array<{
    treatmentName: string;
    count: number;
    sharePct: number;
  }>;
  sixMonthTrend: Array<{
    monthLabel: string;
    attended: number;
    scheduled: number;
    earnings: number;
    expenses: number;
    netProfit: number;
  }>;
  preparedBy?: string;
}

export type PrintDocumentPayload =
  | PrintInvoicePayload
  | PrintPostOpPayload
  | PrintFinancialStatementPayload
  | PrintAnalyticsReportPayload;

export function buildClinicLetterhead(
  clinic?: Clinic | null,
  fallbackName: string = APP_NAME,
  fallbackLogo: string = ''
): ClinicLetterheadInfo {
  const primaryLoc =
    clinic?.locations?.find((l) => l.isPrimary) || clinic?.locations?.[0];

  const addressParts = [primaryLoc?.address, primaryLoc?.city].filter(Boolean);

  return {
    clinicName: clinic?.name || fallbackName || 'Revon Advance Dental Care',
    tagline: clinic?.tagline || 'Precision Dental & Oral Healthcare Center',
    logoUrl: clinic?.logoUrl || fallbackLogo || '',
    phone: primaryLoc?.phone || clinic?.phone || '+91 98765 43210',
    email: primaryLoc?.email || clinic?.email || 'care@clinic.com',
    website: clinic?.website || '',
    address:
      addressParts.length > 0
        ? addressParts.join(', ')
        : 'Main Clinical Suite & Outpatient Center',
    locationName: primaryLoc?.name || 'Primary Clinical Branch',
    workingHours: primaryLoc?.workingHours || 'Mon–Sat · 9:30 AM – 8:00 PM',
    clinicSlug: clinic?.slug || 'clinic'
  };
}

export function buildInvoicePrintPayload(params: {
  invoice?: Invoice | null;
  bill?: Bill | null;
  appointment?: Appointment | null;
  clinic?: Clinic | null;
  fallbackName?: string;
  fallbackLogo?: string;
  preparedBy?: string;
  discountAmount?: number;
  taxLabel?: string;
  notes?: string;
}): PrintInvoicePayload {
  const {
    invoice,
    bill,
    appointment,
    clinic,
    fallbackName,
    fallbackLogo,
    preparedBy,
    discountAmount = 0,
    taxLabel,
    notes
  } = params;

  const letterhead = buildClinicLetterhead(clinic, fallbackName, fallbackLogo);
  const source = invoice || bill;

  const totalAmount = Number(source?.totalAmount ?? 0);
  const payments: PaymentRecord[] = Array.isArray(source?.payments)
    ? source.payments
    : [];
  const computedPaidFromLog = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const paidAmount =
    source?.paidAmount !== undefined
      ? Number(source.paidAmount)
      : payments.length > 0
      ? computedPaidFromLog
      : source?.status === 'collected'
      ? totalAmount
      : 0;

  const remainingAmount =
    source?.remainingAmount !== undefined
      ? Number(source.remainingAmount)
      : Math.max(0, totalAmount - paidAmount);

  const rawItems = source?.items || [];
  const items: PrintInvoiceLineItem[] = rawItems.map((it) => ({
    name: it.name,
    category: it.type || 'procedure',
    quantity: Number(it.quantity) || 1,
    unitPrice: Number(it.unitPrice) || 0,
    total: Number(it.total) || 0
  }));

  const docNum =
    invoice?.invoiceNumber ||
    (bill?.id ? `BILL-${bill.id.slice(0, 8).toUpperCase()}` : `BILL-${Date.now().toString().slice(-6)}`);

  const issueDateRaw = source?.createdAt || new Date().toISOString();
  const formattedIssueDate = new Date(issueDateRaw).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const apptDateFormatted = appointment?.dateTime
    ? new Date(appointment.dateTime).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : undefined;

  return {
    type: 'invoice',
    fileName: `${letterhead.clinicSlug}_Invoice_${docNum}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_'),
    documentTitle: invoice ? 'Tax Invoice & Treatment Receipt' : 'Treatment Bill & Payment Receipt',
    documentNumber: docNum,
    issueDate: formattedIssueDate,
    clinic: letterhead,
    status: source?.status || 'pending',
    paymentModeLabel: source?.paymentMode || payments[payments.length - 1]?.paymentMode || 'Cash / UPI',
    patientName: source?.patientName || appointment?.patientName || 'Patient',
    patientPhone: (invoice?.patientPhone || appointment?.patientPhone || '') || undefined,
    patientEmail: source?.patientEmail || appointment?.patientEmail || undefined,
    dentistName: source?.dentistName || appointment?.dentistName || 'Attending Dental Surgeon',
    treatmentName: source?.treatmentName || appointment?.treatment || 'Dental Consultation & Care',
    appointmentDate: apptDateFormatted,
    items,
    subtotal: Number(source?.subtotal ?? totalAmount),
    tax: Number(source?.tax ?? 0),
    taxLabel,
    discount: Number(discountAmount) || 0,
    totalAmount,
    paidAmount,
    remainingAmount,
    payments,
    notes,
    preparedBy: preparedBy || source?.collectedBy || 'Clinic Billing Desk'
  };
}

/**
 * Triggers native browser printing inside a clean, self-contained hidden same-origin iframe.
 * Avoids window.open() popup blockers and prevents dark mode or dashboard chrome bleed.
 */
export function printElementViaHiddenIframe(
  sheetElement: HTMLElement,
  documentTitle: string
): boolean {
  try {
    const existingFrame = document.getElementById('revon-hidden-print-frame');
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'revon-hidden-print-frame';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc || !iframe.contentWindow) {
      return false;
    }

    const clone = sheetElement.cloneNode(true) as HTMLElement;
    clone.style.margin = '0 auto';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.width = '100%';
    clone.style.maxWidth = '190mm';

    const safeTitle = documentTitle.replace(/[<>]/g, '');

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    tr, .a4-avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    thead {
      display: table-header-group;
    }
    img {
      max-width: 100%;
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    const triggerPrint = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) return;
        win.focus();
        win.print();
      } catch (err) {
        console.warn('Hidden iframe print invocation failed:', err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1200);
      }
    };

    const images = Array.from(frameDoc.querySelectorAll('img'));
    if (images.length === 0) {
      setTimeout(triggerPrint, 120);
    } else {
      let settled = 0;
      let triggered = false;
      const doneOne = () => {
        settled++;
        if (settled >= images.length && !triggered) {
          triggered = true;
          setTimeout(triggerPrint, 80);
        }
      };
      images.forEach((img) => {
        if (img.complete) {
          doneOne();
        } else {
          img.addEventListener('load', doneOne, { once: true });
          img.addEventListener('error', doneOne, { once: true });
        }
      });
      // Safety timeout so broken external images never stall printing
      setTimeout(() => {
        if (!triggered) {
          triggered = true;
          triggerPrint();
        }
      }, 650);
    }

    return true;
  } catch (err) {
    console.error('Failed to initialize hidden print frame:', err);
    return false;
  }
}

/**
 * Exports any A4 stationery DOM element into crisp, block-safe A4 PDF pages
 * without overlapping margins, duplicated footers, or mid-row clipping.
 */
export async function exportSheetToA4Pdf(
  sheetElement: HTMLElement,
  fileName: string,
  footerLabel?: string
): Promise<void> {
  const prevWidth = sheetElement.style.width;
  const prevMaxWidth = sheetElement.style.maxWidth;
  const prevMinHeight = sheetElement.style.minHeight;
  const prevBoxShadow = sheetElement.style.boxShadow;
  const prevBorder = sheetElement.style.border;

  // Normalize exact desktop A4 width & natural content height during capture
  sheetElement.style.width = '794px';
  sheetElement.style.maxWidth = '794px';
  sheetElement.style.minHeight = 'auto';
  sheetElement.style.boxShadow = 'none';
  sheetElement.style.border = 'none';

  try {
    // Allow layout to settle after removing minHeight before measuring DOM bounds
    await new Promise((r) => setTimeout(r, 30));

    const sheetRect = sheetElement.getBoundingClientRect();
    const totalCssHeight = Math.max(
      sheetElement.scrollHeight,
      Math.ceil(sheetRect.height)
    );

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297mm
    const marginX = 8;
    const marginTop = 8;
    const marginBottom = 12; // Room for clean vector Page X of Y footer
    const printableWidthMm = pageWidthMm - marginX * 2; // 194mm
    const printableHeightMm = pageHeightMm - marginTop - marginBottom; // 277mm

    // Max CSS pixel height that fits inside 1 printable A4 page at 794px width
    const sheetCssWidth = sheetElement.offsetWidth || 794;
    const maxPageCssPx = Math.floor(
      (printableHeightMm / printableWidthMm) * sheetCssWidth
    );

    // Measure atomic DOM blocks & table rows to snap page breaks cleanly between items
    const atomicNodes = Array.from(
      sheetElement.querySelectorAll<HTMLElement>('[data-pdf-block], tr')
    );
    const atomicBoxes = atomicNodes
      .map((node) => {
        const r = node.getBoundingClientRect();
        const top = r.top - sheetRect.top;
        const bottom = r.bottom - sheetRect.top;
        return { top, bottom, height: bottom - top };
      })
      .filter((b) => b.height > 4 && b.bottom > 0);

    const pageRanges: Array<{ startCss: number; endCss: number }> = [];
    let currentStart = 0;

    while (currentStart < totalCssHeight - 2) {
      const targetEnd = currentStart + maxPageCssPx;
      if (targetEnd >= totalCssHeight - 2) {
        pageRanges.push({ startCss: currentStart, endCss: totalCssHeight });
        break;
      }

      // Snap break upward before any row or atomic block crossing targetEnd
      let chosenBreak = targetEnd;
      const crossingTops = atomicBoxes
        .filter(
          (b) =>
            b.top < targetEnd &&
            b.bottom > targetEnd &&
            b.top > currentStart + 60 &&
            b.height < maxPageCssPx * 0.65
        )
        .map((b) => Math.floor(b.top) - 4);

      if (crossingTops.length > 0) {
        const earliestTop = Math.min(...crossingTops);
        if (earliestTop > currentStart + 60) {
          chosenBreak = earliestTop;
        }
      }

      if (chosenBreak <= currentStart) {
        chosenBreak = targetEnd;
      }

      pageRanges.push({ startCss: currentStart, endCss: chosenBreak });
      currentStart = chosenBreak;
    }

    if (pageRanges.length === 0) {
      pageRanges.push({ startCss: 0, endCss: totalCssHeight });
    }

    const fullCanvas = await html2canvas(sheetElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794
    });

    const scaleRatioY = fullCanvas.height / totalCssHeight;
    const totalPages = pageRanges.length;

    const sliceCanvas = document.createElement('canvas');
    const sliceCtx = sliceCanvas.getContext('2d');

    for (let i = 0; i < totalPages; i++) {
      const { startCss, endCss } = pageRanges[i];
      const srcY = Math.max(0, Math.round(startCss * scaleRatioY));
      const srcEnd = Math.min(fullCanvas.height, Math.round(endCss * scaleRatioY));
      const srcH = Math.max(1, srcEnd - srcY);

      if (i > 0) {
        pdf.addPage();
      }

      if (sliceCtx) {
        sliceCanvas.width = fullCanvas.width;
        sliceCanvas.height = srcH;
        sliceCtx.fillStyle = '#ffffff';
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        sliceCtx.drawImage(
          fullCanvas,
          0,
          srcY,
          fullCanvas.width,
          srcH,
          0,
          0,
          fullCanvas.width,
          srcH
        );

        const sliceImg = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceHeightMm = (srcH * printableWidthMm) / fullCanvas.width;

        pdf.addImage(
          sliceImg,
          'PNG',
          marginX,
          marginTop,
          printableWidthMm,
          sliceHeightMm,
          undefined,
          'FAST'
        );
      }

      // Crisp bottom-margin footer metadata & Page X of Y numbering
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(marginX, pageHeightMm - 9.5, pageWidthMm - marginX, pageHeightMm - 9.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      if (footerLabel) {
        pdf.text(footerLabel, marginX, pageHeightMm - 5.5);
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 65, 85);
      pdf.text(`Page ${i + 1} of ${totalPages}`, pageWidthMm - marginX, pageHeightMm - 5.5, {
        align: 'right'
      });
    }

    const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(safeFileName);
  } finally {
    sheetElement.style.width = prevWidth;
    sheetElement.style.maxWidth = prevMaxWidth;
    sheetElement.style.minHeight = prevMinHeight;
    sheetElement.style.boxShadow = prevBoxShadow;
    sheetElement.style.border = prevBorder;
  }
}
