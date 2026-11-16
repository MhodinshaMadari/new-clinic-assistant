import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  PrintDocumentPayload,
  PrintInvoicePayload,
  PrintPostOpPayload,
  PrintFinancialStatementPayload,
  PrintAnalyticsReportPayload,
  printElementViaHiddenIframe,
  exportSheetToA4Pdf
} from '../utils/printService';

interface PrintPreviewModalProps {
  documentData: PrintDocumentPayload | null;
  onClose: () => void;
}

const fmtCurrency = (val: number): string =>
  `₹${Math.round(Number(val) || 0).toLocaleString('en-IN')}`;

const FONT_SANS =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

export function PrintPreviewModal({ documentData, onClose }: PrintPreviewModalProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setLogoLoadError(false);
    setFeedbackNotice(null);
  }, [documentData]);

  useEffect(() => {
    if (!documentData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [documentData, onClose]);

  if (!documentData) return null;

  const handlePrintNow = () => {
    if (!sheetRef.current) return;
    setFeedbackNotice(null);
    const ok = printElementViaHiddenIframe(
      sheetRef.current,
      `${documentData.clinic.clinicName} - ${documentData.documentTitle} (${documentData.documentNumber})`
    );
    if (ok) {
      setFeedbackNotice({
        type: 'info',
        text: 'Print dialog opened. If your browser preview blocks native print dialogs, click Download PDF right beside it.'
      });
    } else {
      setFeedbackNotice({
        type: 'error',
        text: 'Native print dialog is restricted in this frame. Click Download PDF to save a high-resolution A4 PDF.'
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!sheetRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setFeedbackNotice(null);
    try {
      await exportSheetToA4Pdf(
        sheetRef.current,
        documentData.fileName,
        `${documentData.clinic.clinicName} · ${documentData.documentNumber}`
      );
      setFeedbackNotice({
        type: 'success',
        text: `Downloaded ${documentData.fileName} (A4 Portrait PDF).`
      });
    } catch (err: any) {
      console.error('A4 PDF generation failed:', err);
      setFeedbackNotice({
        type: 'error',
        text: `Could not generate PDF (${err?.message || 'rendering error'}). Try Print Now instead.`
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const clinicInitials = documentData.clinic.clinicName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return createPortal(
    <div
      id="a4-print-portal-root"
      role="dialog"
      aria-modal="true"
      aria-label={`Print Preview - ${documentData.documentTitle}`}
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex flex-col overflow-hidden"
    >
      {/* Top Control Toolbar (Excluded from Print) */}
      <div className="no-print shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate">
                {documentData.documentTitle}
              </h2>
              <span className="text-[11px] font-mono text-sky-300 bg-sky-950/70 border border-sky-800 px-2 py-0.5 rounded shrink-0">
                {documentData.documentNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              A4 Clinical Stationery Preview (210 × 297 mm) · Light Paper Format
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrintNow}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Now</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            {isExportingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Inline Action Feedback Banner */}
      {feedbackNotice && (
        <div
          className={`no-print shrink-0 px-4 sm:px-6 py-2 text-xs font-medium flex items-center justify-center gap-2 border-b ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
              : feedbackNotice.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-slate-800 border-slate-700 text-sky-200'
          }`}
        >
          {feedbackNotice.type === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{feedbackNotice.text}</span>
        </div>
      )}

      {/* Scrollable Preview Viewport */}
      <div className="a4-preview-scroll flex-1 overflow-y-auto overflow-x-auto py-6 px-3 sm:px-6">
        {/* Strict HEX/RGB Light-Paper A4 Sheet (Zero Tailwind oklch/oklab classes inside for 100% html2canvas & print fidelity) */}
        <div
          id="a4-print-sheet"
          ref={sheetRef}
          style={{
            width: '794px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontFamily: FONT_SANS,
            padding: '26px 32px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
            boxSizing: 'border-box'
          }}
        >
          <div>
            {/* Top Brand Rule + Letterhead */}
            <div data-pdf-block="true">
              <div
                style={{
                  height: '4px',
                  background: 'linear-gradient(90deg, #0f55a5 0%, #00a896 100%)',
                  borderRadius: '3px',
                  marginBottom: '12px'
                }}
              />

              {/* Full Clinic Letterhead */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e2e8f0',
                  marginBottom: '14px'
                }}
              >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '62%' }}>
                {documentData.clinic.logoUrl && !logoLoadError ? (
                  <img
                    src={documentData.clinic.logoUrl}
                    alt={documentData.clinic.clinicName}
                    crossOrigin="anonymous"
                    onError={() => setLogoLoadError(true)}
                    style={{
                      width: '56px',
                      height: '56px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '3px',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '10px',
                      backgroundColor: '#0f55a5',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '18px',
                      letterSpacing: '0.04em',
                      flexShrink: 0
                    }}
                  >
                    {clinicInitials || 'DC'}
                  </div>
                )}

                <div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: '#0f172a',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2
                    }}
                  >
                    {documentData.clinic.clinicName}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#00a896',
                      marginTop: '2px'
                    }}
                  >
                    {documentData.clinic.tagline}
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: '#475569',
                      marginTop: '5px',
                      lineHeight: 1.45
                    }}
                  >
                    {documentData.clinic.address}
                    {documentData.clinic.phone ? ` · Tel: ${documentData.clinic.phone}` : ''}
                    {documentData.clinic.email ? ` · ${documentData.clinic.email}` : ''}
                    {documentData.clinic.website ? ` · ${documentData.clinic.website}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#0f55a5'
                  }}
                >
                  Official Clinical Document
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginTop: '2px'
                  }}
                >
                  {documentData.documentTitle}
                </div>
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#475569',
                    fontFamily: FONT_MONO,
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  <div>
                    Ref: <strong style={{ color: '#0f172a' }}>{documentData.documentNumber}</strong>
                  </div>
                  <div>
                    Issued: <strong style={{ color: '#0f172a' }}>{documentData.issueDate}</strong>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Document Variant Body */}
            {documentData.type === 'invoice' && <InvoiceDocumentBody data={documentData} />}
            {documentData.type === 'post_op_care' && <PostOpDocumentBody data={documentData} />}
            {documentData.type === 'financial_statement' && (
              <FinancialStatementBody data={documentData} />
            )}
            {documentData.type === 'analytics_report' && (
              <AnalyticsReportBody data={documentData} />
            )}
          </div>

          {/* Authorized Stationery Footer & Signature Block (Final Page Only) */}
          <div
            data-pdf-block="true"
            className="a4-avoid-break"
            style={{
              marginTop: '18px',
              paddingTop: '10px',
              borderTop: '1px solid #cbd5e1'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '24px'
              }}
            >
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.5, maxWidth: '62%' }}>
                <div style={{ fontWeight: 700, color: '#334155' }}>
                  {documentData.clinic.clinicName} · {documentData.clinic.locationName}
                </div>
                <div>
                  Working Hours: {documentData.clinic.workingHours} · Prepared By:{' '}
                  {documentData.preparedBy || 'Clinic Desk'}
                </div>
                <div style={{ marginTop: '2px', fontStyle: 'italic' }}>
                  System-verified A4 clinical record. For inquiries, contact {documentData.clinic.phone}.
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '180px' }}>
                <div
                  style={{
                    height: '22px',
                    borderBottom: '1px solid #475569',
                    marginBottom: '4px'
                  }}
                />
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a' }}>
                  Authorized Signatory / Stamp
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                  {documentData.clinic.clinicName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Invoice / Treatment Receipt Stationery Body                             */
/* -------------------------------------------------------------------------- */
function InvoiceDocumentBody({ data }: { data: PrintInvoicePayload }) {
  const statusStyles =
    data.status === 'collected'
      ? { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46', label: `PAID IN FULL (${data.paymentModeLabel})` }
      : data.status === 'partially_paid'
      ? {
          bg: '#fffbeb',
          border: '#fde68a',
          color: '#92400e',
          label: `PARTIALLY PAID · DUE ${fmtCurrency(data.remainingAmount)}`
        }
      : { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', label: 'PAYMENT PENDING' };

  return (
    <div>
      {/* Patient & Clinician Details Strip */}
      <div
        data-pdf-block="true"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px 16px',
          marginBottom: '18px'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#0f55a5',
              marginBottom: '4px'
            }}
          >
            Patient / Billed To
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {data.patientName}
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>
            {data.patientPhone && <div>Phone: {data.patientPhone}</div>}
            {data.patientEmail && <div>Email: {data.patientEmail}</div>}
            {data.appointmentDate && <div>Visit Date: {data.appointmentDate}</div>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#0f55a5',
              marginBottom: '4px'
            }}
          >
            Attending Clinician &amp; Status
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {data.dentistName}
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
            Procedure: {data.treatmentName}
          </div>
          <div style={{ marginTop: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 9px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 800,
                backgroundColor: statusStyles.bg,
                border: `1px solid ${statusStyles.border}`,
                color: statusStyles.color
              }}
            >
              {statusStyles.label}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Treatment Table */}
      <div style={{ marginBottom: '18px' }}>
        <div
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#334155',
            marginBottom: '6px'
          }}
        >
          Itemized Treatment &amp; Billing Breakdown
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: '#f1f5f9',
                borderTop: '1px solid #cbd5e1',
                borderBottom: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '10px',
                textTransform: 'uppercase'
              }}
            >
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Rate</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '14px',
                    textAlign: 'center',
                    color: '#64748b',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Standard Consultation &amp; Clinical Care
                </td>
              </tr>
            ) : (
              data.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                    {item.name}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: '#64748b',
                      textTransform: 'capitalize'
                    }}
                  >
                    {item.category}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'center',
                      fontFamily: FONT_MONO,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      fontFamily: FONT_MONO,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fmtCurrency(item.unitPrice)}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: FONT_MONO,
                      fontVariantNumeric: 'tabular-nums',
                      color: '#0f172a'
                    }}
                  >
                    {fmtCurrency(item.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Summary Card */}
      <div data-pdf-block="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, fontSize: '11px', color: '#475569' }}>
          {data.notes && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '10px 12px'
              }}
            >
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>
                Clinical &amp; Billing Notes
              </strong>
              <span>{data.notes}</span>
            </div>
          )}
        </div>

        <div
          style={{
            width: '270px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px 14px',
            backgroundColor: '#f8fafc',
            fontSize: '11.5px',
            fontFamily: FONT_MONO,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#475569' }}>
            <span>Subtotal</span>
            <span>{fmtCurrency(data.subtotal)}</span>
          </div>
          {data.tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#475569' }}>
              <span>{data.taxLabel || 'Tax / GST'}</span>
              <span>{fmtCurrency(data.tax)}</span>
            </div>
          )}
          {data.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#047857' }}>
              <span>Discount</span>
              <span>-{fmtCurrency(data.discount)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '7px',
              marginTop: '6px',
              borderTop: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 800,
              color: '#0f55a5'
            }}
          >
            <span>Grand Total</span>
            <span>{fmtCurrency(data.totalAmount)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontWeight: 700,
              color: '#065f46'
            }}
          >
            <span>Total Paid</span>
            <span>{fmtCurrency(data.paidAmount)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '5px',
              paddingTop: '6px',
              borderTop: '1px dashed #cbd5e1',
              fontWeight: 800,
              color: data.remainingAmount > 0 ? '#b45309' : '#64748b'
            }}
          >
            <span>Balance Due</span>
            <span>{fmtCurrency(data.remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Complete Payment History Table */}
      {data.payments.length > 0 && (
        <div className="a4-avoid-break">
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#334155',
              marginBottom: '6px'
            }}
          >
            Payment Receipts &amp; Installment Ledger ({data.payments.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#f1f5f9',
                  borderTop: '1px solid #cbd5e1',
                  borderBottom: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '9.5px',
                  textTransform: 'uppercase'
                }}
              >
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Date &amp; Time</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Mode</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Reference / Note</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Collected By</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontFamily: FONT_MONO, color: '#475569' }}>
                    {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0f55a5' }}>
                    {p.paymentMode}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#475569' }}>
                    {p.notes || p.transactionRef || '—'}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#475569' }}>
                    {p.collectedBy || 'Clinic Staff'}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: FONT_MONO,
                      color: '#065f46'
                    }}
                  >
                    {fmtCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Post-Op Care Instruction Slip Body                                      */
/* -------------------------------------------------------------------------- */
function PostOpDocumentBody({ data }: { data: PrintPostOpPayload }) {
  return (
    <div>
      {/* Patient & Procedure Metadata Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '18px',
          fontSize: '11.5px'
        }}
      >
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Patient Name
          </div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{data.patientName}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Contact Number
          </div>
          <div style={{ fontWeight: 700, color: '#0f55a5', fontFamily: FONT_MONO, marginTop: '2px' }}>
            {data.patientPhone || 'On File'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Attending Clinician
          </div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{data.dentistName}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Procedure Completed
          </div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{data.treatmentName}</div>
        </div>
      </div>

      {/* Care Protocol Section */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          backgroundColor: '#ffffff'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '10px',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '12px'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
            {data.guideName} — Recovery Protocol
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#0f55a5',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '3px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}
          >
            {data.guideCategory}
          </span>
        </div>

        <ul
          style={{
            margin: 0,
            paddingLeft: '18px',
            fontSize: '12px',
            color: '#1e293b',
            lineHeight: 1.65
          }}
        >
          {data.keyPoints.map((pt, idx) => (
            <li key={idx} style={{ marginBottom: '6px' }}>
              {pt}
            </li>
          ))}
        </ul>
      </div>

      {/* Diet & Hygiene Two-Column Box */}
      <div
        data-pdf-block="true"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginBottom: '16px'
        }}
      >
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 14px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f55a5', marginBottom: '5px', textTransform: 'uppercase' }}>
            Diet &amp; Nutrition Guidance
          </div>
          <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.55 }}>
            {data.dietAdvice}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 14px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#008c7d', marginBottom: '5px', textTransform: 'uppercase' }}>
            Oral Hygiene &amp; Rinsing
          </div>
          <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.55 }}>
            {data.hygieneAdvice}
          </div>
        </div>
      </div>

      {/* Custom Medications & Next Follow-Up */}
      {(data.customMedicationNote || data.followUpDate) && (
        <div
          data-pdf-block="true"
          style={{
            display: 'grid',
            gridTemplateColumns: data.customMedicationNote && data.followUpDate ? '1fr 1fr' : '1fr',
            gap: '14px',
            marginBottom: '16px'
          }}
        >
          {data.customMedicationNote && (
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', marginBottom: '4px' }}>
                Prescribed Medications &amp; Dosage
              </div>
              <div style={{ fontSize: '11.5px', color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {data.customMedicationNote}
              </div>
            </div>
          )}

          {data.followUpDate && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: '4px' }}>
                Next Follow-Up / Review Appointment
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                {data.followUpDate}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emergency Contact Box */}
      <div
        data-pdf-block="true"
        style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '12px 14px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: '4px' }}>
          Urgent Warning Signs — When to Contact the Clinic Immediately
        </div>
        <div style={{ fontSize: '11.5px', color: '#78350f', lineHeight: 1.55 }}>
          {data.emergencyAlert} Call our front desk immediately at <strong>{data.clinic.phone}</strong>.
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Monthly Financial & P&L Statement Stationery Body                       */
/* -------------------------------------------------------------------------- */
function FinancialStatementBody({ data }: { data: PrintFinancialStatementPayload }) {
  return (
    <div>
      {/* Operating Period Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '11.5px'
        }}
      >
        <div>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Accounting Period: </span>
          <strong style={{ color: '#0f172a', fontSize: '13px' }}>{data.periodLabel}</strong>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>
          {data.kpis.targetAmount > 0 ? (
            <span style={{ color: data.kpis.isTargetAchieved ? '#065f46' : '#0f55a5', fontWeight: 700 }}>
              Monthly Target: {fmtCurrency(data.kpis.targetAmount)} ({data.kpis.targetProgressPct.toFixed(1)}% achieved)
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>Monthly Target: Not Configured</span>
          )}
        </div>
      </div>

      {/* 4 Headline Financial KPI Cards */}
      <div
        data-pdf-block="true"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '18px'
        }}
      >
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Gross Earnings
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46', fontFamily: FONT_MONO, marginTop: '4px' }}>
            {fmtCurrency(data.kpis.grossEarnings)}
          </div>
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Total Expenses
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#991b1b', fontFamily: FONT_MONO, marginTop: '4px' }}>
            {fmtCurrency(data.kpis.totalExpenses)}
          </div>
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Net Revenue ({data.kpis.netMarginPct.toFixed(1)}%)
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: data.kpis.netRevenue >= 0 ? '#0f55a5' : '#991b1b',
              fontFamily: FONT_MONO,
              marginTop: '4px'
            }}
          >
            {fmtCurrency(data.kpis.netRevenue)}
          </div>
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Pending Receivables
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#b45309', fontFamily: FONT_MONO, marginTop: '4px' }}>
            {fmtCurrency(data.kpis.totalPendingReceivables)}
          </div>
        </div>
      </div>

      {/* Revenue Composition + Receivables Summary */}
      <div
        data-pdf-block="true"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginBottom: '18px',
          fontSize: '11px'
        }}
      >
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', marginBottom: '6px' }}>
            Earnings Composition
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Collected Invoices</span>
            <strong style={{ fontFamily: FONT_MONO }}>{fmtCurrency(data.kpis.collectedInvoicesRevenue)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Collected Appointment Bills</span>
            <strong style={{ fontFamily: FONT_MONO }}>{fmtCurrency(data.kpis.collectedBillsRevenue)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Direct Collection Vouchers</span>
            <strong style={{ fontFamily: FONT_MONO }}>{fmtCurrency(data.kpis.collectedVouchersRevenue)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Additional Miscellaneous Revenue</span>
            <strong style={{ fontFamily: FONT_MONO }}>{fmtCurrency(data.kpis.additionalDirectRevenue)}</strong>
          </div>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', marginBottom: '6px' }}>
            Target &amp; Obligations Status
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Net Revenue Target</span>
            <strong style={{ fontFamily: FONT_MONO }}>{fmtCurrency(data.kpis.targetAmount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>{data.kpis.isTargetAchieved ? 'Surplus Above Target' : 'Remaining to Target'}</span>
            <strong style={{ fontFamily: FONT_MONO, color: data.kpis.isTargetAchieved ? '#065f46' : '#0f55a5' }}>
              {fmtCurrency(data.kpis.isTargetAchieved ? data.kpis.surplusOverTarget : data.kpis.remainingToTarget)}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Unpaid Patient Invoices</span>
            <strong style={{ fontFamily: FONT_MONO }}>{fmtCurrency(data.kpis.totalPendingReceivables)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pending Expense Vouchers</span>
            <strong style={{ fontFamily: FONT_MONO }}>{fmtCurrency(data.kpis.pendingVouchersAmount)}</strong>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div data-pdf-block="true" style={{ marginBottom: '18px' }} className="a4-avoid-break">
        <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#334155', marginBottom: '6px' }}>
          Operating Expense Breakdown (Configured Ceilings vs. Logged Vouchers)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '9.5px', textTransform: 'uppercase', color: '#475569' }}>
              <th style={{ padding: '7px 8px', textAlign: 'left' }}>Expense Category</th>
              <th style={{ padding: '7px 8px', textAlign: 'left' }}>Active Basis</th>
              <th style={{ padding: '7px 8px', textAlign: 'right' }}>Configured Ceiling</th>
              <th style={{ padding: '7px 8px', textAlign: 'right' }}>Paid Vouchers</th>
              <th style={{ padding: '7px 8px', textAlign: 'right' }}>Effective Ledger Total</th>
            </tr>
          </thead>
          <tbody>
            {data.categoryBreakdown.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>{row.label}</td>
                <td style={{ padding: '7px 8px', color: '#475569' }}>{row.mode}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: FONT_MONO }}>{fmtCurrency(row.budgetedAmount)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: FONT_MONO }}>{fmtCurrency(row.loggedPaidAmount)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: FONT_MONO, fontWeight: 800, color: '#0f172a' }}>
                  {fmtCurrency(row.effectiveAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Complete Itemized Vouchers Ledger */}
      <div>
        <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#334155', marginBottom: '6px' }}>
          Complete Monthly Vouchers Ledger ({data.vouchers.length} Entries)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '9px', textTransform: 'uppercase', color: '#475569' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Particulars</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Vendor / Party</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Mode &amp; Status</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  No itemized expense or collection vouchers recorded for {data.periodLabel}.
                </td>
              </tr>
            ) : (
              data.vouchers.map((v, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontFamily: FONT_MONO, color: '#475569', whiteSpace: 'nowrap' }}>
                    {v.date}
                  </td>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: '#0f172a' }}>{v.title}</td>
                  <td style={{ padding: '6px 8px', color: '#475569', textTransform: 'capitalize' }}>
                    {v.category}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#475569' }}>{v.vendor}</td>
                  <td style={{ padding: '6px 8px', color: '#475569', textTransform: 'capitalize' }}>
                    {v.paymentMode} · {v.status}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'right',
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                      color: v.voucherType === 'collected' ? '#065f46' : '#991b1b'
                    }}
                  >
                    {v.voucherType === 'collected' ? '+' : '-'}
                    {fmtCurrency(v.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.notes && (
        <div
          style={{
            marginTop: '14px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '9px 12px',
            fontSize: '11px',
            color: '#334155'
          }}
        >
          <strong>Auditor / Administrator Notes:</strong> {data.notes}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Executive Clinical & Financial Analytics Report Body                    */
/* -------------------------------------------------------------------------- */
function AnalyticsReportBody({ data }: { data: PrintAnalyticsReportPayload }) {
  return (
    <div>
      {/* Reporting Horizon Banner */}
      <div
        data-pdf-block="true"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '7px 12px',
          marginBottom: '10px',
          fontSize: '11px'
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>Active Horizon: </span>
          <strong style={{ color: '#0f172a' }}>{data.horizonLabel}</strong>
          <span style={{ color: '#94a3b8', margin: '0 8px' }}>|</span>
          <span style={{ color: '#64748b' }}>Operating Month: </span>
          <strong style={{ color: '#0f55a5' }}>{data.periodLabel}</strong>
        </div>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>
          Target Pacing: {data.financialSummary.pacingLabel}
        </div>
      </div>

      {/* Patient Attendance Volume Across 4 Time Horizons */}
      <div data-pdf-block="true" style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#334155', marginBottom: '4px' }}>
          Patient Attendance Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            {
              label: 'Today Attended',
              attended: data.attendanceMetrics.todayAttended,
              scheduled: data.attendanceMetrics.todayScheduled
            },
            {
              label: 'This Week Attended',
              attended: data.attendanceMetrics.weekAttended,
              scheduled: data.attendanceMetrics.weekScheduled
            },
            {
              label: `Month (${data.periodLabel})`,
              attended: data.attendanceMetrics.monthAttended,
              scheduled: data.attendanceMetrics.monthScheduled
            },
            {
              label: 'Last 6 Months',
              attended: data.attendanceMetrics.sixMonthsAttended,
              scheduled: data.attendanceMetrics.sixMonthsScheduled
            }
          ].map((box, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '7px 10px',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                {box.label}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', fontFamily: FONT_MONO, marginTop: '2px' }}>
                {box.attended}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                of {box.scheduled} scheduled
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial & Target Performance Summary */}
      <div data-pdf-block="true" style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#334155', marginBottom: '4px' }}>
          Financial Performance &amp; Target Pacing ({data.horizonLabel})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Gross Earnings</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#065f46', fontFamily: FONT_MONO, marginTop: '2px' }}>
              {fmtCurrency(data.financialSummary.grossEarnings)}
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b' }}>
              Collection Rate: {data.financialSummary.collectionRatePct.toFixed(1)}%
            </div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Spendings</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#991b1b', fontFamily: FONT_MONO, marginTop: '2px' }}>
              {fmtCurrency(data.financialSummary.totalExpenses)}
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b' }}>Synced Ledger Outflow</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Revenue</div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: data.financialSummary.netRevenue >= 0 ? '#0f55a5' : '#991b1b',
                fontFamily: FONT_MONO,
                marginTop: '2px'
              }}
            >
              {fmtCurrency(data.financialSummary.netRevenue)}
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b' }}>
              Margin: {data.financialSummary.profitMarginPct.toFixed(1)}%
            </div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Monthly Target</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: FONT_MONO, marginTop: '2px' }}>
              {fmtCurrency(data.financialSummary.targetAmount)}
            </div>
            <div style={{ fontSize: '9.5px', color: '#0f55a5' }}>
              {data.financialSummary.targetProgressPct.toFixed(1)}% · Due {fmtCurrency(data.financialSummary.pendingReceivables)}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown & Top Procedures Side by Side */}
      <div data-pdf-block="true" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }} className="a4-avoid-break">
        <div>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
            Expense Distribution
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '8.5px', textTransform: 'uppercase', color: '#475569' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '4px 6px', textAlign: 'left' }}>Basis</th>
                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.expenseBreakdown.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '4px 6px', fontWeight: 600 }}>{item.label}</td>
                  <td style={{ padding: '4px 6px', color: '#64748b' }}>{item.source}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: FONT_MONO, fontWeight: 700 }}>
                    {fmtCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
            Top Procedures &amp; Status Rates
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '8.5px', textTransform: 'uppercase', color: '#475569' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left' }}>Treatment</th>
                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Cases</th>
                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.treatmentDistribution.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '6px', textAlign: 'center', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    No appointments in selected horizon
                  </td>
                </tr>
              ) : (
                data.treatmentDistribution.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>{t.treatmentName}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: FONT_MONO }}>{t.count}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: FONT_MONO }}>{t.sharePct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ fontSize: '9.5px', color: '#475569', marginTop: '4px' }}>
            Completed: <strong>{data.attendanceMetrics.completedCount}</strong> · Confirmed:{' '}
            <strong>{data.attendanceMetrics.confirmedCount}</strong> · Cancelled:{' '}
            <strong>{data.attendanceMetrics.cancelledCount}</strong> ({data.attendanceMetrics.cancellationRatePct}% cancel rate)
          </div>
        </div>
      </div>

      {/* Doctor Productivity Table */}
      <div style={{ marginBottom: '10px' }}>
        <div data-pdf-block="true" style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
          Doctor-Wise Patient Distribution &amp; Revenue Contribution
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '8.5px', textTransform: 'uppercase', color: '#475569' }}>
              <th style={{ padding: '4px 7px', textAlign: 'left' }}>Clinician</th>
              <th style={{ padding: '4px 7px', textAlign: 'left' }}>Specialty</th>
              <th style={{ padding: '4px 7px', textAlign: 'right' }}>Attended / Booked</th>
              <th style={{ padding: '4px 7px', textAlign: 'right' }}>Avg Ticket</th>
              <th style={{ padding: '4px 7px', textAlign: 'right' }}>Collected Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.doctorDistribution.length === 0 ? (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td colSpan={5} style={{ padding: '6px 7px', color: '#64748b', textAlign: 'center' }}>
                  No practitioners registered to this clinic for the selected period.
                </td>
              </tr>
            ) : (
              data.doctorDistribution.map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '4px 7px', fontWeight: 700, color: '#0f172a' }}>{d.doctorName}</td>
                  <td style={{ padding: '4px 7px', color: '#475569' }}>{d.specialty}</td>
                  <td style={{ padding: '4px 7px', textAlign: 'right', fontFamily: FONT_MONO }}>
                    {d.attendedCount} / {d.totalBooked}
                  </td>
                  <td style={{ padding: '4px 7px', textAlign: 'right', fontFamily: FONT_MONO }}>
                    {fmtCurrency(d.avgTicketSize)}
                  </td>
                  <td style={{ padding: '4px 7px', textAlign: 'right', fontFamily: FONT_MONO, fontWeight: 700, color: '#065f46' }}>
                    {fmtCurrency(d.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 6-Month Historical Performance Ledger */}
      <div>
        <div data-pdf-block="true" style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
          6-Month Historical Financial &amp; Attendance Trend
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', fontSize: '8.5px', textTransform: 'uppercase', color: '#475569' }}>
              <th style={{ padding: '4px 7px', textAlign: 'left' }}>Month</th>
              <th style={{ padding: '4px 7px', textAlign: 'right' }}>Patients Attended</th>
              <th style={{ padding: '4px 7px', textAlign: 'right' }}>Gross Earnings</th>
              <th style={{ padding: '4px 7px', textAlign: 'right' }}>Expenses</th>
              <th style={{ padding: '4px 7px', textAlign: 'right' }}>Net Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.sixMonthTrend.map((m, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '4px 7px', fontWeight: 700 }}>{m.monthLabel}</td>
                <td style={{ padding: '4px 7px', textAlign: 'right', fontFamily: FONT_MONO }}>
                  {m.attended} / {m.scheduled}
                </td>
                <td style={{ padding: '4px 7px', textAlign: 'right', fontFamily: FONT_MONO, color: '#065f46' }}>
                  {fmtCurrency(m.earnings)}
                </td>
                <td style={{ padding: '4px 7px', textAlign: 'right', fontFamily: FONT_MONO, color: '#991b1b' }}>
                  {fmtCurrency(m.expenses)}
                </td>
                <td
                  style={{
                    padding: '4px 7px',
                    textAlign: 'right',
                    fontFamily: FONT_MONO,
                    fontWeight: 800,
                    color: m.netProfit >= 0 ? '#0f55a5' : '#991b1b'
                  }}
                >
                  {fmtCurrency(m.netProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
