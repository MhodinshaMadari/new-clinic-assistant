import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  QrCode, 
  FileText, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Building2,
  Calendar,
  User,
  Tag,
  Sparkles,
  History
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { Appointment, Bill, BillingItem, Invoice, InvoiceItem, UserProfile, PaymentRecord, BillPaymentStatus } from '../types';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';

// Helper to recursively remove undefined values from Firestore payloads
const sanitizeFirestoreData = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestoreData).filter(item => item !== undefined);
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = sanitizeFirestoreData(value);
      }
    }
    return result;
  }
  return data;
};

export interface AppointmentBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  existingBill?: Bill | null;
  existingInvoice?: Invoice | null;
  userProfile?: UserProfile | null;
  treatments?: any[];
  activeClinic?: any;
  onSuccess?: (bill: Bill) => void;
  onDelete?: (billId: string) => void;
  onBillSaved?: (savedBill: Bill, savedInvoice: Invoice) => void;
  onBillDeleted?: (appId: string) => void;
}

const COMMON_PRESET_ITEMS = [
  { name: 'Consultation Fee', type: 'consultation', price: 450 },
  { name: 'Dental X-Ray (IOPA)', type: 'equipment', price: 250 },
  { name: 'Local Anaesthesia (Lignox 2%)', type: 'stock', price: 150 },
  { name: 'Sterile Surgical Glove & Mask Kit', type: 'stock', price: 120 },
  { name: 'Composite Restorative Filling (Per Tooth)', type: 'other', price: 1200 },
  { name: 'Root Canal File & Dressing Kit', type: 'stock', price: 850 },
  { name: 'Ultrasonic Scaling & Polishing', type: 'other', price: 1500 },
  { name: 'Post-Op Analgesic & Antibiotic Pack', type: 'stock', price: 320 },
];

export function AppointmentBillModal({
  isOpen,
  onClose,
  appointment,
  existingBill,
  existingInvoice,
  userProfile,
  treatments,
  activeClinic: propClinic,
  onSuccess,
  onDelete,
  onBillSaved,
  onBillDeleted
}: AppointmentBillModalProps) {
  const { activeClinic: contextClinic } = useClinic();
  const { userProfile: contextUserProfile } = useAuth();
  const activeClinic = propClinic || contextClinic;
  const effectiveUserProfile = userProfile || contextUserProfile;

  const [items, setItems] = useState<BillingItem[]>([]);
  const [taxPercent, setTaxPercent] = useState<number>(18); // Default 18% VAT/GST
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [status, setStatus] = useState<BillPaymentStatus>('pending');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Other'>('UPI');
  const [notes, setNotes] = useState<string>('');

  // Payment ledger & partial payment state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>('');
  const [newPaymentMode, setNewPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Other'>('UPI');
  const [newPaymentNote, setNewPaymentNote] = useState<string>('');

  // Item composer state
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'consultation' | 'equipment' | 'stock' | 'other'>('stock');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemPrice, setNewItemPrice] = useState<number>(100);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or re-populate when appointment / existingBill changes
  useEffect(() => {
    if (!isOpen || !appointment) return;

    setErrorMessage(null);
    setShowPrintPreview(false);

    if (existingBill) {
      // Edit mode: pre-populate with existing bill
      setItems(existingBill.items && existingBill.items.length > 0 ? [...existingBill.items] : []);
      const sub = existingBill.subtotal || 0;
      const tax = existingBill.tax || 0;
      if (sub > 0 && tax > 0) {
        setTaxPercent(Math.round((tax / sub) * 100));
      } else {
        setTaxPercent(tax > 0 ? 18 : 0);
      }
      setDiscountAmount(0);
      setStatus(existingBill.status || 'pending');
      setPaymentMode(existingBill.paymentMode || 'UPI');
      setNotes((existingBill as any).notes || '');

      if (existingBill.payments && existingBill.payments.length > 0) {
        setPayments([...existingBill.payments]);
      } else if (existingBill.status === 'collected') {
        setPayments([
          {
            id: 'init-' + Date.now(),
            amount: existingBill.totalAmount || 0,
            paymentMode: existingBill.paymentMode || 'UPI',
            paymentDate: existingBill.paymentDate || new Date().toISOString(),
            collectedBy: existingBill.collectedBy || effectiveUserProfile?.displayName || 'Clinic Reception',
            notes: 'Settled in full'
          }
        ]);
      } else if ((existingBill.paidAmount || 0) > 0) {
        setPayments([
          {
            id: 'init-' + Date.now(),
            amount: existingBill.paidAmount!,
            paymentMode: existingBill.paymentMode || 'UPI',
            paymentDate: existingBill.paymentDate || new Date().toISOString(),
            collectedBy: existingBill.collectedBy || effectiveUserProfile?.displayName || 'Clinic Reception',
            notes: 'Recorded partial payment'
          }
        ]);
      } else {
        setPayments([]);
      }
    } else if (existingInvoice) {
      // Pre-populate with existing invoice if bill didn't exist
      const mappedItems: BillingItem[] = (existingInvoice.items || []).map((it) => ({
        id: it.id,
        name: it.name,
        type: (it.type === 'consumable' ? 'stock' : it.type) as any,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total
      }));
      setItems(mappedItems);
      const sub = existingInvoice.subtotal || 0;
      const tax = existingInvoice.tax || 0;
      if (sub > 0 && tax > 0) {
        setTaxPercent(Math.round((tax / sub) * 100));
      } else {
        setTaxPercent(18);
      }
      setStatus(existingInvoice.status || 'pending');
      setPaymentMode(existingInvoice.paymentMode || 'UPI');
      setNotes('');

      if (existingInvoice.payments && existingInvoice.payments.length > 0) {
        setPayments([...existingInvoice.payments]);
      } else if (existingInvoice.status === 'collected') {
        setPayments([
          {
            id: 'init-' + Date.now(),
            amount: existingInvoice.totalAmount || 0,
            paymentMode: existingInvoice.paymentMode || 'UPI',
            paymentDate: existingInvoice.paymentDate || new Date().toISOString(),
            collectedBy: existingInvoice.collectedBy || effectiveUserProfile?.displayName || 'Clinic Reception',
            notes: 'Settled in full'
          }
        ]);
      } else if ((existingInvoice.paidAmount || 0) > 0) {
        setPayments([
          {
            id: 'init-' + Date.now(),
            amount: existingInvoice.paidAmount!,
            paymentMode: existingInvoice.paymentMode || 'UPI',
            paymentDate: existingInvoice.paymentDate || new Date().toISOString(),
            collectedBy: existingInvoice.collectedBy || effectiveUserProfile?.displayName || 'Clinic Reception',
            notes: 'Recorded partial payment'
          }
        ]);
      } else {
        setPayments([]);
      }
    } else {
      // Add mode: default consultation line item from treatment
      const baseFee = 450;
      setItems([
        {
          id: 'initial-' + Date.now(),
          name: `Procedure Consultation: ${appointment.treatment || 'Dental Visit'}`,
          type: 'consultation',
          quantity: 1,
          unitPrice: baseFee,
          total: baseFee
        }
      ]);
      setTaxPercent(18);
      setDiscountAmount(0);
      setStatus('pending');
      setPaymentMode('UPI');
      setNotes('');
      setPayments([]);
    }

    // Reset composer inputs
    setNewItemName('');
    setNewItemType('stock');
    setNewItemQty(1);
    setNewItemPrice(100);
    setNewPaymentAmount('');
    setNewPaymentNote('');
  }, [isOpen, appointment, existingBill, existingInvoice]);

  if (!isOpen || !appointment) return null;

  // Calculation helpers
  const subtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const tax = Math.round(subtotal * (taxPercent / 100));
  const totalAmount = Math.max(0, subtotal + tax - discountAmount);

  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - totalPaid);

  // Derived status
  const effectiveStatus: BillPaymentStatus = 
    totalPaid >= totalAmount && totalAmount > 0 
      ? 'collected' 
      : totalPaid > 0 
        ? 'partially_paid' 
        : status;

  // Add Item
  const handleAddItem = (preset?: { name: string; type: string; price: number }) => {
    const name = preset ? preset.name : newItemName.trim();
    const type = preset ? (preset.type as any) : newItemType;
    const price = preset ? preset.price : Math.max(0, newItemPrice);
    const qty = preset ? 1 : Math.max(1, newItemQty);

    if (!name) {
      setErrorMessage('Please provide an item description.');
      return;
    }

    setErrorMessage(null);
    const newItem: BillingItem = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      type,
      quantity: qty,
      unitPrice: price,
      total: qty * price
    };

    setItems([...items, newItem]);

    if (!preset) {
      setNewItemName('');
      setNewItemQty(1);
      setNewItemPrice(100);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(it => it.id !== id));
  };

  const handleUpdateItemQty = (id: string, newQty: number) => {
    const qty = Math.max(1, newQty);
    setItems(items.map(it => it.id === id ? { ...it, quantity: qty, total: qty * it.unitPrice } : it));
  };

  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    const price = Math.max(0, newPrice);
    setItems(items.map(it => it.id === id ? { ...it, unitPrice: price, total: it.quantity * price } : it));
  };

  // Payment collection & installment handlers
  const handleAddPayment = () => {
    const amt = parseFloat(newPaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than ₹0.');
      return;
    }
    if (amt > remainingAmount) {
      setErrorMessage(`Payment amount cannot exceed remaining balance of ₹${remainingAmount.toLocaleString()}.`);
      return;
    }
    setErrorMessage(null);

    const newRecord: PaymentRecord = {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      amount: amt,
      paymentMode: newPaymentMode,
      paymentDate: new Date().toISOString(),
      collectedBy: effectiveUserProfile?.displayName || 'Clinic Reception',
      ...(newPaymentNote.trim() ? { notes: newPaymentNote.trim() } : {})
    };

    const updatedPayments = [...payments, newRecord];
    setPayments(updatedPayments);
    const newTotalPaid = updatedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (newTotalPaid >= totalAmount && totalAmount > 0) {
      setStatus('collected');
    } else if (newTotalPaid > 0) {
      setStatus('partially_paid');
    }
    setNewPaymentAmount('');
    setNewPaymentNote('');
  };

  const handleRemovePayment = (id: string) => {
    const updatedPayments = payments.filter(p => p.id !== id);
    setPayments(updatedPayments);
    const newTotalPaid = updatedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (newTotalPaid >= totalAmount && totalAmount > 0) {
      setStatus('collected');
    } else if (newTotalPaid > 0) {
      setStatus('partially_paid');
    } else {
      setStatus('pending');
    }
  };

  const handleFillPaymentAmount = (amt: number) => {
    const clamped = Math.min(Math.max(1, amt), remainingAmount);
    setNewPaymentAmount(String(clamped));
  };

  const handleMarkCollectedInFull = () => {
    if (remainingAmount > 0) {
      const fullRecord: PaymentRecord = {
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        amount: remainingAmount,
        paymentMode,
        paymentDate: new Date().toISOString(),
        notes: 'Full balance settled',
        collectedBy: effectiveUserProfile?.displayName || 'Clinic Reception'
      };
      setPayments(prev => [...prev, fullRecord]);
    }
    setStatus('collected');
  };

  // Save Bill & Cascade to Invoices & Bills collections
  const handleSaveBill = async () => {
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item to generate the bill.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const clinicSlug = appointment.clinicSlug || activeClinic?.slug || 'revon-dental';
    const nowIso = new Date().toISOString();

    const finalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const finalRemaining = Math.max(0, totalAmount - finalPaid);
    const finalStatus: BillPaymentStatus = 
      finalPaid >= totalAmount && totalAmount > 0 
        ? 'collected' 
        : finalPaid > 0 
          ? 'partially_paid' 
          : status;

    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

    const billData: Bill = {
      id: appointment.id,
      appointmentId: appointment.id,
      clinicSlug,
      patientId: appointment.patientId || '',
      patientName: appointment.patientName || '',
      patientEmail: appointment.patientEmail || '',
      dentistId: appointment.dentistId || '',
      dentistName: appointment.dentistName || 'Attending Clinician',
      treatmentName: appointment.treatment || 'Dental Procedure',
      items,
      subtotal,
      tax,
      totalAmount,
      status: finalStatus,
      paidAmount: finalPaid,
      remainingAmount: finalRemaining,
      payments,
      paymentMode: latestPayment?.paymentMode || paymentMode,
      paymentDate: latestPayment?.paymentDate || (finalStatus === 'collected' ? (existingBill?.paymentDate || nowIso) : undefined),
      collectedBy: latestPayment?.collectedBy || (effectiveUserProfile?.displayName || 'Clinic Reception'),
      createdAt: existingBill?.createdAt || nowIso
    };

    try {
      // 1. Save to `bills` collection using sanitizeFirestoreData to eliminate any undefined
      await setDoc(doc(db, 'bills', appointment.id), sanitizeFirestoreData({
        ...billData,
        notes: notes.trim(),
        updatedAt: nowIso
      }));

      // 2. Synchronize to `invoices` collection
      const invoicesRef = collection(db, 'invoices');
      const invoiceQuery = query(invoicesRef, where('appointmentId', '==', appointment.id));
      const invoiceSnap = await getDocs(invoiceQuery);

      const invoiceItems: InvoiceItem[] = items.map(it => ({
        id: it.id,
        name: it.name,
        type: (it.type === 'stock' ? 'consumable' : it.type) as any,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total
      }));

      const invoicePayload = sanitizeFirestoreData({
        appointmentId: appointment.id,
        clinicSlug,
        patientId: appointment.patientId || '',
        patientName: appointment.patientName || '',
        patientEmail: appointment.patientEmail || `${(appointment.patientName || 'patient').toLowerCase().replace(/\s+/g, '')}@example.com`,
        patientPhone: appointment.patientPhone || '',
        dentistId: appointment.dentistId || '',
        dentistName: appointment.dentistName || 'Attending Clinician',
        treatmentName: appointment.treatment || 'Dental Procedure',
        items: invoiceItems,
        subtotal,
        tax,
        totalAmount,
        status: finalStatus,
        paidAmount: finalPaid,
        remainingAmount: finalRemaining,
        payments,
        paymentMode: latestPayment?.paymentMode || paymentMode,
        paymentDate: latestPayment?.paymentDate || (finalStatus === 'collected' ? (existingBill?.paymentDate || nowIso) : null),
        collectedBy: latestPayment?.collectedBy || (effectiveUserProfile?.displayName || 'Clinic Reception'),
        updatedAt: nowIso
      });

      let savedInvoiceDocId = existingInvoice?.id || '';
      let savedInvoiceNumber = existingInvoice?.invoiceNumber || '';

      if (!invoiceSnap.empty) {
        // Update existing invoice
        const existingInvDoc = invoiceSnap.docs[0];
        savedInvoiceDocId = existingInvDoc.id;
        savedInvoiceNumber = existingInvDoc.data().invoiceNumber || savedInvoiceNumber;
        await updateDoc(doc(db, 'invoices', existingInvDoc.id), invoicePayload);
      } else if (existingInvoice?.id) {
        await updateDoc(doc(db, 'invoices', existingInvoice.id), invoicePayload);
      } else {
        // Create new invoice document
        const newInvoiceNum = `INV-${Date.now().toString().slice(-6)}`;
        savedInvoiceNumber = newInvoiceNum;
        const newDocRef = await addDoc(collection(db, 'invoices'), {
          ...invoicePayload,
          invoiceNumber: newInvoiceNum,
          createdAt: nowIso
        });
        savedInvoiceDocId = newDocRef.id;
      }

      if (onSuccess) {
        onSuccess(billData);
      }

      if (onBillSaved) {
        onBillSaved(billData, {
          ...invoicePayload,
          id: savedInvoiceDocId || appointment.id,
          invoiceNumber: savedInvoiceNumber || `INV-${Date.now().toString().slice(-6)}`
        } as any);
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save bill:', err);
      setErrorMessage('Failed to save bill to database: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Bill and Cascade deletion to both `bills` and `invoices`
  const handleDeleteBill = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the bill for ${appointment.patientName}? This will permanently remove the record from both the Appointment Monitor and Billing & Receipts.`
    );
    if (!isConfirmed) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      // 1. Delete from bills collection
      await deleteDoc(doc(db, 'bills', appointment.id));

      // 2. Query and delete any matching invoices
      const invoicesRef = collection(db, 'invoices');
      const invoiceQuery = query(invoicesRef, where('appointmentId', '==', appointment.id));
      const invoiceSnap = await getDocs(invoiceQuery);

      const deletePromises: Promise<void>[] = [];
      invoiceSnap.forEach((invDoc) => {
        deletePromises.push(deleteDoc(doc(db, 'invoices', invDoc.id)));
      });

      if (existingInvoice?.id) {
        deletePromises.push(deleteDoc(doc(db, 'invoices', existingInvoice.id)));
      }

      await Promise.all(deletePromises);

      if (onDelete) {
        onDelete(appointment.id);
      }

      if (onBillDeleted) {
        onBillDeleted(appointment.id);
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to delete bill:', err);
      setErrorMessage('Failed to delete bill: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg font-display tracking-tight text-white">
                  {existingBill || existingInvoice ? 'Edit Appointment Bill & Invoice' : 'Add Bill & Generate Receipt'}
                </h3>
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                  effectiveStatus === 'collected'
                    ? 'bg-emerald-400/20 text-emerald-100 border-emerald-300/40'
                    : effectiveStatus === 'partially_paid'
                      ? 'bg-amber-400/20 text-amber-100 border-amber-300/40'
                      : 'bg-white/20 text-white border-white/30'
                }`}>
                  {effectiveStatus === 'collected' ? 'Paid in Full' : effectiveStatus === 'partially_paid' ? `Partial • Due ₹${remainingAmount}` : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5 font-medium">
                Appointment: <strong className="text-white">{appointment.patientName}</strong> • {appointment.treatment}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(existingBill || existingInvoice) && (
              <button
                type="button"
                onClick={() => setShowPrintPreview(!showPrintPreview)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Print Preview / Receipt"
              >
                <Printer className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium shrink-0">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Modal Body: Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs">

          {/* Printable Receipt Preview Mode */}
          {showPrintPreview ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h4 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    {activeClinic?.name || 'Revon Dental Clinic'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {appointment.clinicName || activeClinic?.locations?.[0]?.name || 'Main Dental Facility'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Receipt Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-teal-700 dark:text-teal-400">
                    {existingInvoice?.invoiceNumber || `BILL-${appointment.id.substring(0, 8).toUpperCase()}`}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                    effectiveStatus === 'collected' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : effectiveStatus === 'partially_paid' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {effectiveStatus === 'collected' 
                      ? `PAID IN FULL (${paymentMode})` 
                      : effectiveStatus === 'partially_paid' 
                        ? `PARTIALLY PAID • DUE ₹${remainingAmount}` 
                        : 'PENDING PAYMENT'}
                  </span>
                </div>
              </div>

              {/* Patient & Doctor metadata */}
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Patient</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{appointment.patientName}</span>
                  <div className="text-slate-500">{appointment.patientPhone || appointment.patientEmail}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Dentist / Surgeon</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{appointment.dentistName || 'Dr. Specialist'}</span>
                  <div className="text-slate-500">{appointment.treatment}</div>
                </div>
              </div>

              {/* Items in Receipt */}
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 uppercase font-bold">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2">{it.name}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">₹{it.unitPrice}</td>
                      <td className="py-2 text-right font-bold">₹{it.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals in Receipt */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1 font-mono text-right">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">GST / Tax ({taxPercent}%):</span>
                    <span>₹{tax}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-teal-600 dark:text-teal-400">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Total Paid to Date:</span>
                  <span>₹{totalPaid}</span>
                </div>
                <div className={`flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-700 ${
                  remainingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}>
                  <span>Remaining Balance Due:</span>
                  <span className="font-mono text-base">₹{remainingAmount}</span>
                </div>
              </div>

              {/* Payment History Log in Print Preview */}
              {payments.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Payment Receipts & Installment History ({payments.length})
                  </span>
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[9px]">
                        <th className="py-1">Date</th>
                        <th className="py-1">Mode</th>
                        <th className="py-1">Reference / Note</th>
                        <th className="py-1">Collector</th>
                        <th className="py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-1 text-slate-600 dark:text-slate-400">
                            {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                            {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-1 font-bold text-teal-600 dark:text-teal-400">{p.paymentMode}</td>
                          <td className="py-1 text-slate-500">{p.notes || '—'}</td>
                          <td className="py-1 text-slate-500">{p.collectedBy || 'Staff'}</td>
                          <td className="py-1 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{p.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Back to Edit
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Patient & Booking Details Header Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Patient</span>
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5">{appointment.patientName}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{appointment.patientPhone || appointment.patientEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Doctor / Clinician</span>
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5">{appointment.dentistName || 'Attending Doctor'}</p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-mono font-medium truncate">ID: {appointment.dentistId?.substring(0, 6)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Treatment</span>
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5">{appointment.treatment}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{appointment.clinicName || 'Clinic'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Scheduled Slot</span>
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5">
                    {new Date(appointment.dateTime).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 font-display">
                    <Receipt className="h-3.5 w-3.5 text-teal-600" />
                    <span>Itemized Treatment & Consumables Breakdown ({items.length} items)</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Syncs automatically with Billing & Receipts
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Description / Item</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price (₹)</th>
                        <th className="p-3 text-right">Total (₹)</th>
                        <th className="p-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                            No items added yet. Click one of the quick presets below or compose custom items.
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                              {item.name}
                            </td>
                            <td className="p-3">
                              <span className={`inline-block text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                                item.type === 'consultation' 
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                                  : item.type === 'equipment'
                                  ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                                  : item.type === 'stock'
                                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value) || 1)}
                                className="w-14 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono text-xs bg-white dark:bg-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                min={0}
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItemPrice(item.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-mono text-xs bg-white dark:bg-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ₹{item.total}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  Quick Add Common Clinical Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PRESET_ITEMS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddItem(preset)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-2.5 w-2.5 text-teal-600" />
                      <span>{preset.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">(₹{preset.price})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Composer Form Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase font-mono">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Custom Item or Clinical Inventory Kit</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Item / Service Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Suture Removal, Intraoral Camera Scan..."
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem();
                        }
                      }}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Category</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value as any)}
                    >
                      <option value="consultation">Consultation Fee</option>
                      <option value="equipment">Dental Equipment</option>
                      <option value="stock">Medical Stocks/Medicines</option>
                      <option value="other">Procedures & Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-center"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-right"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add To Bill List</span>
                  </button>
                </div>
              </div>

              {/* Financial Balance Summary Banner */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Bill Grand Total</span>
                  <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
                    ₹{totalAmount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{items.length} billable items</span>
                </div>

                <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 font-mono block">Paid Amount</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                    ₹{totalPaid.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
                    {payments.length} installment{payments.length === 1 ? '' : 's'} logged
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  remainingAmount > 0 
                    ? 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800/70' 
                    : 'bg-teal-50/60 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60'
                }`}>
                  <span className={`text-[10px] uppercase font-bold font-mono block ${
                    remainingAmount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-teal-700 dark:text-teal-300'
                  }`}>
                    Remaining Due
                  </span>
                  <div className={`text-lg sm:text-xl font-black font-mono mt-1 ${
                    remainingAmount > 0 ? 'text-amber-800 dark:text-amber-200' : 'text-teal-700 dark:text-teal-300'
                  }`}>
                    ₹{remainingAmount.toLocaleString()}
                  </div>
                  <span className={`text-[10px] mt-0.5 block ${
                    remainingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'
                  }`}>
                    {remainingAmount > 0 ? 'Pending collection' : 'Fully Settled'}
                  </span>
                </div>
              </div>

              {/* Comprehensive Payment & Ledger Management Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                
                {/* Status Switcher */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      Overall Bill Status
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-500">
                      Calculated: <strong className="uppercase">{effectiveStatus.replace('_', ' ')}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('pending')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        effectiveStatus === 'pending'
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Clock className="h-3.5 w-3.5 text-rose-600" />
                        <span>Pending</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">₹0 collected</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('partially_paid')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        effectiveStatus === 'partially_paid'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Tag className="h-3.5 w-3.5 text-amber-600" />
                        <span>Partially Paid</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Due ₹{remainingAmount}</p>
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkCollectedInFull}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        effectiveStatus === 'collected'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Paid in Full</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Settle all due</p>
                    </button>
                  </div>
                </div>

                {/* Record New Payment / Installment */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                      <span>Record Payment / Installment</span>
                    </span>
                    {remainingAmount > 0 && (
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                        Max Payable: ₹{remainingAmount}
                      </span>
                    )}
                  </div>

                  {remainingAmount > 0 ? (
                    <div className="space-y-2.5">
                      {/* Quick Amount Chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick Fill:</span>
                        <button
                          type="button"
                          onClick={() => handleFillPaymentAmount(remainingAmount)}
                          className="px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950 dark:hover:bg-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          Full Due (₹{remainingAmount})
                        </button>
                        {remainingAmount > 100 && (
                          <button
                            type="button"
                            onClick={() => handleFillPaymentAmount(Math.round(remainingAmount / 2))}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold cursor-pointer"
                          >
                            50% (₹{Math.round(remainingAmount / 2)})
                          </button>
                        )}
                        {remainingAmount >= 500 && (
                          <button
                            type="button"
                            onClick={() => handleFillPaymentAmount(500)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold cursor-pointer"
                          >
                            ₹500
                          </button>
                        )}
                        {remainingAmount >= 1000 && (
                          <button
                            type="button"
                            onClick={() => handleFillPaymentAmount(1000)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold cursor-pointer"
                          >
                            ₹1,000
                          </button>
                        )}
                      </div>

                      {/* Payment Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            min={1}
                            max={remainingAmount}
                            placeholder={`e.g. ${remainingAmount}`}
                            value={newPaymentAmount}
                            onChange={(e) => setNewPaymentAmount(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Mode</label>
                          <select
                            value={newPaymentMode}
                            onChange={(e) => setNewPaymentMode(e.target.value as any)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium cursor-pointer"
                          >
                            <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                            <option value="Cash">Cash at Reception</option>
                            <option value="Card">Debit / Credit Card</option>
                            <option value="Other">Net Banking / Cheque / Other</option>
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Transaction Ref / Note</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="e.g. UPI Ref #1234, Cash token..."
                              value={newPaymentNote}
                              onChange={(e) => setNewPaymentNote(e.target.value)}
                              className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <button
                              type="button"
                              onClick={handleAddPayment}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm shrink-0"
                              title="Add payment installment"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">Total bill of ₹{totalAmount.toLocaleString()} is fully settled.</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-full">
                        Zero Balance Due
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment History Ledger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                      <History className="h-3.5 w-3.5 text-teal-600" />
                      <span>Payment History & Receipts ({payments.length})</span>
                    </span>
                    {payments.length > 0 && (
                      <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Total Logged: ₹{totalPaid.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {payments.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700/60 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden font-mono text-xs">
                      {payments.map((pay, idx) => (
                        <div key={pay.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-bold flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  ₹{pay.amount.toLocaleString()}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {pay.paymentMode}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {new Date(pay.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(pay.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {pay.notes && <span className="text-slate-500"> • {pay.notes}</span>}
                                {pay.collectedBy && <span className="text-teal-600/80"> • by {pay.collectedBy}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePayment(pay.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Remove payment record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                      No payment installments logged yet. Click <strong className="text-teal-600 font-medium">Add</strong> above to record partial or full collections.
                    </div>
                  )}
                </div>

                {/* Subtotal, Tax, Discount Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Remarks / Clinical Billing Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Follow-up consultation in 14 days, Cash received..."
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 font-mono text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Subtotal ({items.length} items):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{subtotal}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Tax Rate:</span>
                        <select
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(parseInt(e.target.value) || 0)}
                          className="px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] bg-slate-50 dark:bg-slate-800 cursor-pointer"
                        >
                          <option value={0}>0% (Tax Exempt)</option>
                          <option value={5}>5% (GST)</option>
                          <option value={12}>12% (Clinical Gear)</option>
                          <option value={18}>18% (Standard)</option>
                        </select>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{tax}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Discount (₹):</span>
                        <input
                          type="number"
                          min={0}
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] bg-slate-50 dark:bg-slate-800 text-right"
                        />
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {discountAmount > 0 ? `-₹${discountAmount}` : '₹0'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {(existingBill || existingInvoice) && (
              <button
                type="button"
                onClick={handleDeleteBill}
                disabled={isDeleting || isSaving}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                title="Permanently remove bill and synced invoices"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Bill'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveBill}
              disabled={isSaving || isDeleting}
              className="px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isSaving ? 'Saving & Syncing...' : (existingBill || existingInvoice ? 'Update Bill & Sync' : 'Save Bill & Sync with Billing')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
