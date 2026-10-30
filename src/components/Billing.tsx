import React, { useState, useEffect } from 'react';
import { APP_NAME, getClinicUrl } from '../config/appConfig';
import { PaginationControls } from './PaginationControls';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button as MuiButton 
} from '@mui/material';
import { db, auth } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { Invoice, InvoiceItem, UserProfile, Appointment, PaymentRecord, BillPaymentStatus } from '../types';
// @ts-ignore
import mainLogo from '../assets/images/main_logo_1783512166748.jpg';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { 
  Plus, Trash2, Download, Printer, Search, Filter, 
  CheckCircle, Clock, AlertCircle, FileText, ChevronDown, User, Calendar, RefreshCw, X,
  History, Tag, CreditCard
} from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Helper functions to load images and convert to base64 for jsPDF
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

const getBase64Image = (img: HTMLImageElement): string => {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(img, 0, 0);
  }
  return canvas.toDataURL("image/jpeg");
};

const generateQRCodeWithLogo = async (text: string, logoUrl: string): Promise<string> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    
    // Draw the QR code onto the canvas
    await QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#1e293b', // Deep slate
        light: '#ffffff'
      }
    });

    // Load the logo
    try {
      const logoImg = await loadImage(logoUrl);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const logoSize = 70; // Center size
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        
        // Draw white square behind logo
        ctx.fillStyle = '#ffffff';
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x - 6, y - 6, logoSize + 12, logoSize + 12, 12);
          ctx.fill();
        } else {
          ctx.fillRect(x - 6, y - 6, logoSize + 12, logoSize + 12);
        }
        
        // Draw logo
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      }
    } catch (logoErr) {
      console.warn("Failed to overlay logo on QR code:", logoErr);
    }
    
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error("Failed to generate QR Code:", err);
    return '';
  }
};

// Safe Firestore payload cleaner to completely prevent "Function setDoc() called with invalid data. Unsupported field value: undefined"
function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

interface BillingProps {
  userProfile?: UserProfile;
}

export function Billing({ userProfile: propsUserProfile }: BillingProps) {
  const { userProfile: contextUserProfile } = useAuth();
  const userProfile: UserProfile = propsUserProfile || contextUserProfile || {
    uid: auth.currentUser?.uid || 'anonymous-user',
    email: auth.currentUser?.email || '',
    displayName: auth.currentUser?.displayName || 'Reception Staff',
    role: 'receptionist',
    phone: '',
    createdAt: new Date().toISOString()
  };

  const { activeClinic, clinics } = useClinic();
  const activeSlug = activeClinic?.slug || 'revon-dental';
  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin);

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (() => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirmCallback: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirmCallback();
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for creating a new invoice
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [dentistName, setDentistName] = useState(userProfile?.role === 'dentist' ? (userProfile?.displayName || '') : '');
  const [treatmentName, setTreatmentName] = useState('');
  const [status, setStatus] = useState<'pending' | 'collected'>('pending');
  
  // Lists for dropdown selections
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [dentists, setDentists] = useState<UserProfile[]>([]);

  // Line items state
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  const [currentItemName, setCurrentItemName] = useState('');
  const [currentItemType, setCurrentItemType] = useState<'equipment' | 'consumable' | 'consultation' | 'other'>('consultation');
  const [currentItemPrice, setCurrentItemPrice] = useState('');
  const [currentItemQty, setCurrentItemQty] = useState('1');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partially_paid' | 'collected'>('all');

  // Payment collection states
  const [collectPaymentInvoice, setCollectPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Other'>('Cash');
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [deleteConfirmInvoiceId, setDeleteConfirmInvoiceId] = useState<string | null>(null);

  // Firestore error handler helper
  function handleFirestoreError(err: unknown, op: OperationType, path: string | null) {
    const errInfo = {
      error: err instanceof Error ? err.message : String(err),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType: op,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setError(`Database operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Load invoices, appointments, patients, and dentists
  useEffect(() => {
    setLoading(true);
    const invoicesRef = collection(db, 'invoices');
    const unsubInvoices = onSnapshot(invoicesRef, (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((d) => {
        const inv = { id: d.id, ...d.data() } as Invoice;
        const itemSlug = inv.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push(inv);
        }
      });
      // Sort invoices by date desc
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(list);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'invoices');
      setLoading(false);
    });

    // Fetch supporting lists
    const fetchSupportData = async () => {
      try {
        const apptsSnap = await getDocs(collection(db, 'appointments'));
        const apptsList: Appointment[] = [];
        apptsSnap.forEach((d) => {
          const app = { id: d.id, ...d.data() } as Appointment;
          const itemSlug = app.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) {
            apptsList.push(app);
          }
        });
        setAppointments(apptsList);

        const usersSnap = await getDocs(collection(db, 'users'));
        const patList: UserProfile[] = [];
        const dentList: UserProfile[] = [];
        usersSnap.forEach((d) => {
          const u = d.data() as UserProfile;
          const itemSlug = u.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) {
            if (u.role === 'patient') patList.push(u);
            if (u.role === 'dentist') dentList.push(u);
          }
        });
        setPatients(patList);
        setDentists(dentList);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users/appointments');
      }
    };

    fetchSupportData();

    return () => {
      unsubInvoices();
    };
  }, [activeSlug, isSuperAdmin]);

  // Sync details when an appointment is selected
  useEffect(() => {
    if (selectedAppointment) {
      setPatientName(selectedAppointment.patientName || '');
      setPatientEmail(selectedAppointment.patientEmail || '');
      setPatientPhone(selectedAppointment.patientPhone || '');
      setDentistName(selectedAppointment.dentistName || '');
      setTreatmentName(selectedAppointment.treatment || '');
    }
  }, [selectedAppointment]);

  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItemName.trim() || !currentItemPrice || !currentItemQty) {
      return;
    }

    const price = parseFloat(currentItemPrice);
    const qty = parseInt(currentItemQty, 10);

    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      alert("Please enter valid price and quantity.");
      return;
    }

    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      name: currentItemName.trim(),
      type: currentItemType,
      quantity: qty,
      unitPrice: price,
      total: price * qty
    };

    setLineItems([...lineItems, newItem]);
    setCurrentItemName('');
    setCurrentItemPrice('');
    setCurrentItemQty('1');
  };

  const handleRemoveLineItem = (id: string, name: string) => {
    triggerConfirm(
      'Remove Item',
      `Are you sure you want to remove "${name}" from this invoice?`,
      () => setLineItems(lineItems.filter(item => item.id !== id))
    );
  };

  // Calculate totals
  const subtotal = lineItems.reduce((acc, curr) => acc + curr.total, 0);
  const tax = Math.round(subtotal * 0.1); // 10% tax
  const totalAmount = subtotal + tax;

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert("Patient name is required.");
      return;
    }
    if (lineItems.length === 0) {
      alert("Please add at least one billing item to the invoice.");
      return;
    }

    triggerConfirm(
      'Save Invoice',
      `Are you sure you want to save and launch this invoice for Rs. ${totalAmount.toLocaleString()}?`,
      () => performSaveInvoice()
    );
  };

  const performSaveInvoice = async () => {
    try {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${year}-${randNum}`;

      // Try to find matching patient in patients list to link patientId
      let matchedPatientId = selectedAppointment?.patientId || 'manual';
      if (matchedPatientId === 'manual' && patientEmail.trim()) {
        const foundPat = patients.find(p => p.email?.toLowerCase() === patientEmail.trim().toLowerCase());
        if (foundPat) {
          matchedPatientId = foundPat.uid;
        } else {
          // Try by name matching
          const foundPatByName = patients.find(p => p.displayName?.toLowerCase() === patientName.trim().toLowerCase());
          if (foundPatByName) {
            matchedPatientId = foundPatByName.uid;
          }
        }
      }

      const collectorName = userProfile?.displayName || auth.currentUser?.displayName || 'Reception Staff';
      const initialPaid = status === 'collected' ? totalAmount : 0;
      const initialRemaining = status === 'collected' ? 0 : totalAmount;
      const initialPayments: PaymentRecord[] = status === 'collected' ? [{
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: totalAmount,
        paymentMode: 'Cash',
        paymentDate: new Date().toISOString(),
        collectedBy: collectorName
      }] : [];

      const invoiceData = sanitizeFirestoreData({
        invoiceNumber,
        appointmentId: selectedAppointment?.id || 'manual',
        patientId: matchedPatientId,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim() || `${patientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        patientPhone: patientPhone.trim(),
        dentistId: selectedAppointment?.dentistId || auth.currentUser?.uid || 'manual',
        dentistName: dentistName || userProfile?.displayName || 'Doctor',
        treatmentName: treatmentName || 'General Consultation',
        items: lineItems,
        subtotal,
        tax,
        totalAmount,
        paidAmount: initialPaid,
        remainingAmount: initialRemaining,
        payments: initialPayments,
        status,
        clinicSlug: activeClinic?.slug || 'revon-dental',
        createdAt: new Date().toISOString(),
        ...(status === 'collected' ? {
          paymentMode: 'Cash',
          paymentDate: new Date().toISOString(),
          collectedBy: collectorName
        } : {})
      });

      await addDoc(collection(db, 'invoices'), invoiceData);
      
      // Sync with bills collection if linked to an appointment
      if (selectedAppointment?.id && selectedAppointment.id !== 'manual') {
        try {
          await setDoc(doc(db, 'bills', selectedAppointment.id), sanitizeFirestoreData({
            appointmentId: selectedAppointment.id,
            patientId: matchedPatientId,
            patientName: patientName.trim(),
            patientEmail: patientEmail.trim(),
            dentistId: selectedAppointment.dentistId || userProfile?.uid || 'manual',
            dentistName: dentistName || userProfile?.displayName || 'Doctor',
            treatmentName: treatmentName || 'General Consultation',
            items: lineItems,
            subtotal,
            tax,
            totalAmount,
            paidAmount: initialPaid,
            remainingAmount: initialRemaining,
            payments: initialPayments,
            status,
            clinicSlug: activeClinic?.slug || 'revon-dental',
            createdAt: new Date().toISOString(),
            ...(status === 'collected' ? {
              paymentMode: 'Cash',
              paymentDate: new Date().toISOString(),
              collectedBy: collectorName
            } : {})
          }), { merge: true });
        } catch (syncErr) {
          console.error("Error syncing bill record:", syncErr);
        }
      }

      // Reset form states
      setShowCreateModal(false);
      setSelectedAppointment(null);
      setPatientName('');
      setPatientEmail('');
      setPatientPhone('');
      setDentistName(userProfile?.role === 'dentist' ? (userProfile?.displayName || '') : '');
      setTreatmentName('');
      setLineItems([]);
      setStatus('pending');
      
      alert(`Invoice ${invoiceNumber} successfully generated and saved!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'invoices');
    }
  };

  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectPaymentInvoice) return;

    const numAmount = parseFloat(collectAmount) || 0;
    if (numAmount <= 0) {
      alert("Please enter a valid payment collection amount.");
      return;
    }

    triggerConfirm(
      'Record Payment',
      `Are you sure you want to record payment of ₹${numAmount.toLocaleString()} via ${paymentMode}?`,
      () => performCollectPayment()
    );
  };

  const performCollectPayment = async () => {
    if (!collectPaymentInvoice) return;
    try {
      const numAmount = parseFloat(collectAmount) || 0;
      if (numAmount <= 0) {
        alert("Please enter a valid payment collection amount.");
        return;
      }

      const existingPayments: PaymentRecord[] = collectPaymentInvoice.payments || [];
      const prevPaid = collectPaymentInvoice.paidAmount ?? existingPayments.reduce((s, p) => s + p.amount, 0);
      const currentRemaining = Math.max(0, collectPaymentInvoice.totalAmount - prevPaid);

      if (numAmount > currentRemaining && currentRemaining > 0) {
        alert(`Entered amount (₹${numAmount}) exceeds the remaining balance due (₹${currentRemaining}).`);
        return;
      }

      const collectorName = userProfile?.displayName || auth.currentUser?.displayName || 'Reception Staff';
      const newPaymentRecord: PaymentRecord = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: numAmount,
        paymentMode,
        paymentDate: new Date().toISOString(),
        collectedBy: collectorName,
        ...(paymentNotes.trim() ? { notes: paymentNotes.trim() } : {})
      };

      const updatedPayments = [...existingPayments, newPaymentRecord];
      const newTotalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
      const newRemaining = Math.max(0, collectPaymentInvoice.totalAmount - newTotalPaid);
      const newStatus: BillPaymentStatus = newRemaining <= 0 ? 'collected' : (newTotalPaid > 0 ? 'partially_paid' : 'pending');

      const invoiceRef = doc(db, 'invoices', collectPaymentInvoice.id);
      const updatePayload = sanitizeFirestoreData({
        status: newStatus,
        paymentMode,
        paymentDate: new Date().toISOString(),
        collectedBy: collectorName,
        paidAmount: newTotalPaid,
        remainingAmount: newRemaining,
        payments: updatedPayments
      });

      await updateDoc(invoiceRef, updatePayload);

      // Synchronize matching bill record in bills collection if linked to an appointment
      if (collectPaymentInvoice.appointmentId && collectPaymentInvoice.appointmentId !== 'manual') {
        try {
          const billRef = doc(db, 'bills', collectPaymentInvoice.appointmentId);
          await updateDoc(billRef, updatePayload);
        } catch (syncErr) {
          console.warn("Could not find direct bill with appointmentId:", syncErr);
        }
      }

      setCollectPaymentInvoice(null);
      setCollectAmount('');
      setPaymentNotes('');
      alert(newRemaining <= 0 
        ? "Invoice settled in full and receipt finalized!" 
        : `Payment of ₹${numAmount.toLocaleString()} recorded! Remaining balance: ₹${newRemaining.toLocaleString()}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `invoices/${collectPaymentInvoice.id}`);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const targetInvoice = invoices.find(i => i.id === invoiceId);
      await deleteDoc(doc(db, 'invoices', invoiceId));

      // Also clean up linked bill in bills collection
      if (targetInvoice?.appointmentId && targetInvoice.appointmentId !== 'manual') {
        try {
          await deleteDoc(doc(db, 'bills', targetInvoice.appointmentId));
        } catch (syncErr) {
          console.warn("Could not delete matching bill record:", syncErr);
        }
      }

      alert("Invoice deleted successfully.");
      setDeleteConfirmInvoiceId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `invoices/${invoiceId}`);
    }
  };

  // Helper to draw the logo into jsPDF
  const drawPDFLogo = (docInstance: jsPDF, x: number, y: number, logoBase64: string | null, logoRatio: number, clinicName: string = APP_NAME) => {
    if (logoBase64) {
      const height = 16;
      const width = Math.min(32, height * logoRatio);
      docInstance.addImage(logoBase64, 'JPEG', x, y, width, height);

      // Draw Clinic Name beside logo
      docInstance.setFont("Helvetica", "bold");
      docInstance.setFontSize(13);
      docInstance.setTextColor(11, 82, 163); // Deep Royal Blue
      docInstance.text(clinicName, x + width + 4, y + 10.5);
    } else {
      // Fallback vector logo if image load fails
      docInstance.setDrawColor(11, 82, 163);
      docInstance.setLineWidth(1.5);
      docInstance.line(x + 5, y + 8, x + 3, y + 15);
      docInstance.line(x + 15, y + 8, x + 17, y + 15);
      docInstance.line(x + 3, y + 15, x + 7, y + 22);
      docInstance.line(x + 17, y + 15, x + 13, y + 22);
      docInstance.line(x + 7, y + 22, x + 10, y + 18);
      docInstance.line(x + 13, y + 22, x + 10, y + 18);
      docInstance.line(x + 5, y + 8, x + 10, y + 11);
      docInstance.line(x + 15, y + 8, x + 10, y + 11);

      docInstance.setDrawColor(0, 163, 173);
      docInstance.setLineWidth(2);
      docInstance.line(x + 1, y + 18, x + 10, y + 24);
      docInstance.line(x + 10, y + 24, x + 19, y + 14);

      docInstance.setFillColor(0, 163, 173);
      docInstance.circle(x + 18, y + 7, 1.2, 'F');
      
      docInstance.setFont("Helvetica", "bold");
      docInstance.setFontSize(14);
      docInstance.setTextColor(11, 82, 163);
      docInstance.text(clinicName, x + 26, y + 12);
    }
  };

  // Helper to draw custom page headers on each page
  const drawPDFHeader = (docInstance: jsPDF, invoice: Invoice, pageNum: number, totalPages: number, logoBase64: string | null, logoRatio: number, clinicName: string = APP_NAME) => {
    // Header accent strip
    docInstance.setFillColor(30, 136, 229); // Blue
    docInstance.rect(0, 0, 210, 4, 'F');

    // Logo & Clinic Details
    drawPDFLogo(docInstance, 15, 10, logoBase64, logoRatio, clinicName);

    // Invoice Header Metadata on the right
    docInstance.setFont("Helvetica", "normal");
    docInstance.setFontSize(9);
    docInstance.setTextColor(71, 85, 105); // Slate-600
    
    docInstance.text("Invoice No:", 145, 15);
    docInstance.setFont("Helvetica", "bold");
    docInstance.setTextColor(30, 41, 59);
    docInstance.text(invoice.invoiceNumber, 168, 15);

    docInstance.setFont("Helvetica", "normal");
    docInstance.setTextColor(71, 85, 105);
    docInstance.text("Created At:", 145, 20);
    docInstance.setFont("Helvetica", "bold");
    docInstance.setTextColor(30, 41, 59);
    docInstance.text(new Date(invoice.createdAt).toLocaleDateString('en-GB'), 168, 20);

    docInstance.setFont("Helvetica", "normal");
    docInstance.setTextColor(71, 85, 105);
    docInstance.text("Page No:", 145, 25);
    docInstance.setFont("Helvetica", "bold");
    docInstance.setTextColor(30, 41, 59);
    docInstance.text(`${pageNum} of ${totalPages}`, 168, 25);

    // Thick divider line below header
    docInstance.setDrawColor(226, 232, 240); // Slate-200
    docInstance.setLineWidth(0.5);
    docInstance.line(15, 34, 195, 34);
  };

  // Helper to draw custom footer
  const drawPDFFooter = (docInstance: jsPDF, pageNum: number, totalPages: number, qrBase64?: string | null, clinicName: string = APP_NAME) => {
    docInstance.setDrawColor(226, 232, 240);
    docInstance.setLineWidth(0.5);
    docInstance.line(15, 265, 195, 265);

    if (qrBase64) {
      try {
        // Draw QR code on bottom left
        docInstance.addImage(qrBase64, 'PNG', 15, 268, 20, 20);
      } catch (err) {
        console.warn("Error drawing QR code in footer:", err);
      }
    }

    docInstance.setFont("Helvetica", "normal");
    docInstance.setFontSize(8);
    docInstance.setTextColor(71, 85, 105); // Slate-600
    docInstance.text(`Scan to open the ${clinicName} Patient Portal & manage your appointments.`, 38, 275);

    docInstance.setFont("Helvetica", "italic");
    docInstance.setFontSize(7.5);
    docInstance.setTextColor(148, 163, 184); // Slate-400
    docInstance.text(`Thank you for your trust in ${clinicName.toUpperCase()}. This is a computer-generated treatment invoice.`, 38, 281);

    // Page Number on other end of the footer
    docInstance.setFont("Helvetica", "normal");
    docInstance.setFontSize(8);
    docInstance.setTextColor(100, 116, 139);
    docInstance.text(`Page ${pageNum} of ${totalPages}`, 195, 275, { align: 'right' });

    // Crafted by ZF CREATIONS at the bottom right
    docInstance.setFont("Helvetica", "bold");
    docInstance.setFontSize(8.5);
    docInstance.setTextColor(15, 23, 42); // Dark slate
    docInstance.text("crafted by ZF CREATIONS", 195, 282, { align: 'right' });
  };

  // Download PDF Action
  const handleDownloadPDF = async (invoice: Invoice) => {
    const invoiceClinic = (clinics || []).find(c => c.slug === invoice.clinicSlug || c.id === invoice.clinicSlug) || activeClinic;
    const logoToUse = invoiceClinic?.logoUrl || mainLogo;
    const clinicNameToUse = invoiceClinic?.name || APP_NAME;
    const clinicSlugToUse = invoiceClinic?.slug || invoice.clinicSlug || activeSlug || 'revon-dental';

    let logoBase64: string | null = null;
    let logoRatio = 2.222; // default ratio
    try {
      const img = await loadImage(logoToUse);
      logoBase64 = getBase64Image(img);
      logoRatio = (img.width && img.height) ? (img.width / img.height) : 2.222;
    } catch (err) {
      console.warn("Failed to load clinic logo image, trying fallback logo:", err);
      try {
        const fallbackImg = await loadImage(mainLogo);
        logoBase64 = getBase64Image(fallbackImg);
        logoRatio = fallbackImg.width / fallbackImg.height;
      } catch (e) {}
    }

    let qrBase64: string | null = null;
    try {
      const appUrl = getClinicUrl(clinicSlugToUse);
      qrBase64 = await generateQRCodeWithLogo(appUrl, logoToUse);
    } catch (qrErr) {
      console.warn("Failed to generate QR Code for PDF footer:", qrErr);
    }

    // Create new A4 jsPDF instance [portrait, millimeters, a4]
    const docInstance = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Determine total pages. Since standard invoice items are brief, usually 1 page, but let's pre-calculate.
    const itemsPerPage = 12;
    const totalPages = Math.max(1, Math.ceil(invoice.items.length / itemsPerPage));

    for (let page = 1; page <= totalPages; page++) {
      if (page > 1) {
        docInstance.addPage();
      }

      // 1. Draw Page Header & Brand
      drawPDFHeader(docInstance, invoice, page, totalPages, logoBase64, logoRatio, clinicNameToUse);

      // 2. Detail section (only on Page 1)
      if (page === 1) {
        // Shaded Customer Panel Background
        docInstance.setFillColor(248, 250, 252); // Slate-50
        docInstance.roundedRect(15, 40, 180, 30, 2, 2, 'F');
        docInstance.setDrawColor(241, 245, 249); // Slate-100
        docInstance.roundedRect(15, 40, 180, 30, 2, 2, 'D');

        // Customer Details (Left side)
        docInstance.setFont("Helvetica", "bold");
        docInstance.setFontSize(9);
        docInstance.setTextColor(30, 136, 229); // Blue
        docInstance.text("PATIENT INFORMATION", 20, 47);

        docInstance.setFont("Helvetica", "bold");
        docInstance.setFontSize(11);
        docInstance.setTextColor(15, 23, 42); // Slate-900
        docInstance.text(invoice.patientName, 20, 53);

        docInstance.setFont("Helvetica", "normal");
        docInstance.setFontSize(9);
        docInstance.setTextColor(71, 85, 105); // Slate-600
        docInstance.text(`Email: ${invoice.patientEmail}`, 20, 59);
        docInstance.text(`Phone: ${invoice.patientPhone || 'N/A'}`, 20, 64);

        // Attending Doctor Details (Right side)
        docInstance.setFont("Helvetica", "bold");
        docInstance.setFontSize(9);
        docInstance.setTextColor(38, 166, 154); // Teal
        docInstance.text("CLINICAL TEAM", 115, 47);

        docInstance.setFont("Helvetica", "bold");
        docInstance.setFontSize(11);
        docInstance.setTextColor(15, 23, 42); // Slate-900
        docInstance.text(invoice.dentistName, 115, 53);

        docInstance.setFont("Helvetica", "normal");
        docInstance.setFontSize(9);
        docInstance.setTextColor(71, 85, 105); // Slate-600
        docInstance.text(`Procedure: ${invoice.treatmentName}`, 115, 59);
        
        const invoiceStatusText = invoice.status === 'collected' 
          ? `Status: PAID via ${invoice.paymentMode || 'Cash'}`
          : 'Status: PAYMENT PENDING';
        docInstance.setFont("Helvetica", "bold");
        if (invoice.status === 'collected') {
          docInstance.setTextColor(16, 185, 129); // Green
        } else {
          docInstance.setTextColor(245, 158, 11); // Amber
        }
        docInstance.text(invoiceStatusText, 115, 64);
      }

      // 3. Billing Breakup Table
      const startY = page === 1 ? 78 : 42;
      
      // Table Header Row
      docInstance.setFillColor(241, 245, 249); // Slate-100
      docInstance.rect(15, startY, 180, 8, 'F');
      
      docInstance.setFont("Helvetica", "bold");
      docInstance.setFontSize(8.5);
      docInstance.setTextColor(51, 65, 85); // Slate-700
      docInstance.text("ITEM DESCRIPTION", 18, startY + 5.5);
      docInstance.text("TYPE", 85, startY + 5.5);
      docInstance.text("QTY", 125, startY + 5.5);
      docInstance.text("UNIT PRICE", 145, startY + 5.5);
      docInstance.text("TOTAL", 175, startY + 5.5);

      // Slice items for current page
      const startIndex = (page - 1) * itemsPerPage;
      const pageItems = invoice.items.slice(startIndex, startIndex + itemsPerPage);

      let currentY = startY + 8;
      
      docInstance.setFont("Helvetica", "normal");
      docInstance.setFontSize(8.5);
      docInstance.setTextColor(15, 23, 42);

      pageItems.forEach((item, index) => {
        // Alternate subtle row shading
        if (index % 2 === 1) {
          docInstance.setFillColor(248, 250, 252);
          docInstance.rect(15, currentY, 180, 7.5, 'F');
        }
        
        // Horizontal cell divider line
        docInstance.setDrawColor(241, 245, 249);
        docInstance.line(15, currentY + 7.5, 195, currentY + 7.5);

        // Render Item details
        docInstance.text(item.name, 18, currentY + 5);
        
        // Capitalize category type
        const capitalizedType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        docInstance.text(capitalizedType, 85, currentY + 5);
        docInstance.text(String(item.quantity), 127, currentY + 5);
        docInstance.text(`Rs. ${item.unitPrice.toLocaleString()}`, 145, currentY + 5);
        docInstance.text(`Rs. ${item.total.toLocaleString()}`, 175, currentY + 5);

        currentY += 7.5;
      });

      // 4. Totals and Summary Box (Draw only on final page)
      if (page === totalPages) {
        currentY += 4;
        
        const alreadyPaid = invoice.paidAmount !== undefined 
          ? invoice.paidAmount 
          : (invoice.payments?.reduce((s, p) => s + p.amount, 0) ?? (invoice.status === 'collected' ? invoice.totalAmount : 0));
        const remainingDue = invoice.remainingAmount !== undefined 
          ? invoice.remainingAmount 
          : Math.max(0, invoice.totalAmount - alreadyPaid);

        // Box detailing totals
        const boxHeight = alreadyPaid > 0 ? 38 : 26;
        docInstance.setDrawColor(241, 245, 249);
        docInstance.setLineWidth(0.5);
        docInstance.roundedRect(125, currentY, 70, boxHeight, 1, 1, 'D');

        docInstance.setFont("Helvetica", "normal");
        docInstance.setFontSize(8.5);
        docInstance.setTextColor(71, 85, 105);
        docInstance.text("Subtotal:", 130, currentY + 6);
        docInstance.text(`Rs. ${invoice.subtotal.toLocaleString()}`, 175, currentY + 6);

        docInstance.text("GST / Tax (10%):", 130, currentY + 12);
        docInstance.text(`Rs. ${invoice.tax.toLocaleString()}`, 175, currentY + 12);

        // Double line divider
        docInstance.line(125, currentY + 16, 195, currentY + 16);

        docInstance.setFont("Helvetica", "bold");
        docInstance.setFontSize(9.5);
        docInstance.setTextColor(30, 136, 229); // Blue brand color
        docInstance.text("Grand Total:", 130, currentY + 22);
        docInstance.text(`Rs. ${invoice.totalAmount.toLocaleString()}`, 173, currentY + 22);

        if (alreadyPaid > 0) {
          docInstance.setFontSize(8.5);
          docInstance.setTextColor(16, 185, 129); // Emerald
          docInstance.text("Paid Amount:", 130, currentY + 28);
          docInstance.text(`Rs. ${alreadyPaid.toLocaleString()}`, 175, currentY + 28);

          docInstance.setTextColor(remainingDue > 0 ? 217 : 16, remainingDue > 0 ? 119 : 185, remainingDue > 0 ? 6 : 129);
          docInstance.text("Balance Due:", 130, currentY + 34);
          docInstance.text(`Rs. ${remainingDue.toLocaleString()}`, 175, currentY + 34);
        }
      }

      // 5. Draw Footer
      drawPDFFooter(docInstance, page, totalPages, qrBase64, clinicNameToUse);
    }

    // Save final vector PDF file to downloads
    docInstance.save(`${APP_NAME.replace(/\s+/g, '_')}_Invoice_${invoice.invoiceNumber}.pdf`);
  };

  // Standard Print Preview and Print Command
  const handlePrintHTML = (invoice: Invoice) => {
    const invoiceClinic = (clinics || []).find(c => c.slug === invoice.clinicSlug || c.id === invoice.clinicSlug) || activeClinic;
    const logoToUse = invoiceClinic?.logoUrl || mainLogo;
    const clinicNameToUse = invoiceClinic?.name || APP_NAME;

    // Generate clean print window structure
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocked! Please allow popups to print the invoice.");
      return;
    }

    const itemsHTML = invoice.items.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 10px; text-align: left; color: #1e293b;">${item.name}</td>
        <td style="padding: 10px; text-align: left; text-transform: capitalize; color: #64748b;">${item.type}</td>
        <td style="padding: 10px; text-align: center; color: #1e293b;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right; color: #1e293b;">₹${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #1e293b;">₹${item.total.toLocaleString()}</td>
      </tr>
    `).join('');

    const alreadyPaid = invoice.paidAmount !== undefined 
      ? invoice.paidAmount 
      : (invoice.payments?.reduce((s, p) => s + p.amount, 0) ?? (invoice.status === 'collected' ? invoice.totalAmount : 0));
    const remainingDue = invoice.remainingAmount !== undefined 
      ? invoice.remainingAmount 
      : Math.max(0, invoice.totalAmount - alreadyPaid);

    const invoiceStatusBadge = invoice.status === 'collected'
      ? `<span style="background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">Paid (${invoice.paymentMode || 'Settled'})</span>`
      : invoice.status === 'partially_paid'
      ? `<span style="background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">Partially Paid (Due ₹${remainingDue.toLocaleString()})</span>`
      : `<span style="background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">Payment Pending</span>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${clinicNameToUse} Invoice - ${invoice.invoiceNumber}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                background-color: #ffffff;
                color: #000000;
              }
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #1e293b;
              background-color: #f8fafc;
            }
            .a4-container {
              max-width: 800px;
              margin: 30px auto;
              background: #ffffff;
              padding: 40px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            @media print {
              .a4-container {
                border: none;
                box-shadow: none;
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
            .header-bar {
              height: 5px;
              background-color: #1e88e5;
              border-radius: 6px 6px 0 0;
              margin-bottom: 25px;
            }
            .logo-section {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .logo-placeholder {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo-icon {
              width: 40px;
              height: 40px;
              background: #1e88e5;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: bold;
              font-size: 20px;
            }
            .brand-name {
              font-size: 24px;
              font-weight: 800;
              color: #1e293b;
              letter-spacing: -0.5px;
            }
            .brand-sub {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #26a69a;
              font-weight: 700;
              margin-top: 2px;
            }
            .meta-info {
              text-align: right;
              font-size: 14px;
              color: #475569;
            }
            .meta-row {
              margin-bottom: 4px;
            }
            .meta-val {
              font-weight: bold;
              color: #1e293b;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              background-color: #f8fafc;
              border: 1px solid #f1f5f9;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .detail-title {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #1e88e5;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .detail-name {
              font-size: 16px;
              font-weight: bold;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .detail-val {
              font-size: 13px;
              color: #475569;
              line-height: 1.5;
            }
            .table-styled {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .table-header {
              background-color: #f1f5f9;
              font-size: 11px;
              text-transform: uppercase;
              color: #475569;
              font-weight: bold;
            }
            .table-header th {
              padding: 12px 10px;
            }
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              width: 250px;
              font-size: 14px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              color: #475569;
            }
            .grand-total {
              border-top: 2px solid #f1f5f9;
              padding-top: 10px;
              margin-top: 10px;
              font-size: 16px;
              font-weight: bold;
              color: #1e88e5;
            }
            .footer-section {
              border-top: 1px solid #e2e8f0;
              margin-top: 40px;
              padding-top: 15px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              font-style: italic;
            }
            .print-btn-bar {
              background-color: #0f172a;
              padding: 12px 20px;
              display: flex;
              justify-content: flex-end;
              gap: 10px;
              border-radius: 8px;
              max-width: 800px;
              margin: 20px auto 0 auto;
            }
            .btn {
              padding: 8px 16px;
              border-radius: 6px;
              font-weight: bold;
              font-size: 13px;
              cursor: pointer;
              border: none;
            }
            .btn-primary {
              background-color: #1e88e5;
              color: #ffffff;
            }
            .btn-secondary {
              background-color: #334155;
              color: #ffffff;
            }
          </style>
        </head>
        <body>
          <div class="print-btn-bar no-print">
            <button class="btn btn-secondary" onclick="window.close()">Cancel</button>
            <button class="btn btn-primary" onclick="window.print()">Print Invoice</button>
          </div>

          <div class="a4-container">
            <div class="header-bar"></div>
            <div class="logo-section">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${logoToUse}" style="height: 55px; width: auto; max-width: 180px; object-fit: contain; border-radius: 6px;" alt="${clinicNameToUse}" />
                <span style="font-size: 22px; font-weight: bold; color: #0b52a3; font-family: sans-serif;">${clinicNameToUse}</span>
              </div>
              <div class="meta-info">
                <div class="meta-row">Invoice Number: <span class="meta-val">${invoice.invoiceNumber}</span></div>
                <div class="meta-row">Created Date: <span class="meta-val">${new Date(invoice.createdAt).toLocaleDateString('en-GB')}</span></div>
              </div>
            </div>

            <div class="detail-grid">
              <div>
                <div class="detail-title">Patient / Billed To</div>
                <div class="detail-name">${invoice.patientName}</div>
                <div class="detail-val">Email: ${invoice.patientEmail}</div>
                <div class="detail-val">Phone: ${invoice.patientPhone || 'N/A'}</div>
              </div>
              <div>
                <div class="detail-title">Attending Clinician</div>
                <div class="detail-name">${invoice.dentistName}</div>
                <div class="detail-val">Procedure: ${invoice.treatmentName}</div>
                <div class="detail-val" style="margin-top: 8px;">${invoiceStatusBadge}</div>
              </div>
            </div>

            <table class="table-styled">
              <thead>
                <tr class="table-header">
                  <th style="text-align: left; padding: 12px 10px;">Item Description</th>
                  <th style="text-align: left; padding: 12px 10px;">Type</th>
                  <th style="text-align: center; padding: 12px 10px;">Qty</th>
                  <th style="text-align: right; padding: 12px 10px;">Unit Price</th>
                  <th style="text-align: right; padding: 12px 10px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-card">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span style="font-weight: bold; color: #1e293b;">₹${invoice.subtotal.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                  <span>Tax / GST (10%)</span>
                  <span style="font-weight: bold; color: #1e293b;">₹${invoice.tax.toLocaleString()}</span>
                </div>
                <div class="summary-row grand-total">
                  <span>Grand Total</span>
                  <span>₹${invoice.totalAmount.toLocaleString()}</span>
                </div>
                ${alreadyPaid > 0 ? `
                <div class="summary-row" style="margin-top: 6px; color: #059669; font-weight: 600;">
                  <span>Paid Amount</span>
                  <span>₹${alreadyPaid.toLocaleString()}</span>
                </div>
                <div class="summary-row" style="margin-top: 4px; color: ${remainingDue > 0 ? '#d97706' : '#059669'}; font-weight: 700;">
                  <span>Balance Due</span>
                  <span>₹${remainingDue.toLocaleString()}</span>
                </div>
                ` : ''}
              </div>
            </div>

            ${invoice.payments && invoice.payments.length > 0 ? `
              <div style="margin-top: 25px;">
                <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 8px; letter-spacing: 0.5px;">Payment Installments History</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">
                      <th style="padding: 6px 8px; text-align: left;">Date</th>
                      <th style="padding: 6px 8px; text-align: left;">Mode</th>
                      <th style="padding: 6px 8px; text-align: left;">Reference / Notes</th>
                      <th style="padding: 6px 8px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.payments.map(p => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 6px 8px;">${new Date(p.paymentDate).toLocaleDateString('en-GB')}</td>
                        <td style="padding: 6px 8px;">${p.paymentMode}</td>
                        <td style="padding: 6px 8px; color: #64748b;">${p.notes || '-'}</td>
                        <td style="padding: 6px 8px; text-align: right; font-weight: bold;">₹${p.amount.toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <div class="footer-section">
              Care Beyond Smiles • Thank you for your visit to REVON!
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Pagination state for invoices
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Filter and search invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.dentistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || 
      invoice.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Search and Filters Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by Invoice No, Patient, or Doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-revon-blue/20 focus:border-revon-blue transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
            <Filter className="text-slate-400 h-3.5 w-3.5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Invoices</option>
              <option value="pending">Unpaid (Pending)</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="collected">Paid in Full</option>
            </select>
          </div>
        </div>

        {/* Generate Invoice Action (Allowed for Dentists, Receptionists, Admins, Super Admins) */}
        {['dentist', 'receptionist', 'admin', 'super-admin'].includes(userProfile?.role) || isSuperAdmin ? (
          <button
            onClick={() => {
              setLineItems([]);
              setShowCreateModal(true);
            }}
            className="w-full md:w-auto px-5 py-2.5 bg-revon-blue hover:bg-revon-blue-dark text-white font-extrabold rounded-xl text-xs shadow-md shadow-revon-blue/10 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            Create Treatment Invoice
          </button>
        ) : null}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-800">Database Issue Identified</p>
            <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Invoices List Board */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-revon-blue mb-2" />
            <span className="text-xs font-semibold">Fetching Invoices Database...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-slate-300" />
            <span>No invoices match your active filters or searches.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                  <th className="p-4">Invoice Number</th>
                  <th className="p-4">Patient details</th>
                  <th className="p-4">Doctor & procedure</th>
                  <th className="p-4">Line Items Summary</th>
                  <th className="p-4">Amount & Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedInvoices.map((inv) => {
                  const alreadyPaid = inv.paidAmount !== undefined ? inv.paidAmount : (inv.payments?.reduce((s, p) => s + p.amount, 0) ?? (inv.status === 'collected' ? inv.totalAmount : 0));
                  const remainingDue = inv.remainingAmount !== undefined ? inv.remainingAmount : Math.max(0, inv.totalAmount - alreadyPaid);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{inv.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.patientEmail}</div>
                        {inv.patientPhone && <div className="text-[10px] text-slate-400 font-mono">{inv.patientPhone}</div>}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{inv.treatmentName}</div>
                        <div className="text-[10px] text-slate-500">Attended by: Dr. {inv.dentistName}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] space-y-0.5">
                          {inv.items.map((item) => (
                            <div key={item.id} className="flex justify-between gap-4 max-w-[200px]">
                              <span className="text-slate-500 truncate">{item.name} ({item.quantity}x)</span>
                              <span className="font-mono text-slate-700">₹{item.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-mono">
                        <div className="font-bold text-slate-900 text-sm">₹{inv.totalAmount.toLocaleString()}</div>
                        {alreadyPaid > 0 && inv.status !== 'collected' && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Paid: ₹{alreadyPaid.toLocaleString()}
                          </div>
                        )}
                        {remainingDue > 0 && (
                          <div className="text-[10px] text-amber-600 font-bold">
                            Due: ₹{remainingDue.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {inv.status === 'collected' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-800 border-emerald-200">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            Paid ({inv.paymentMode || 'Settled'})
                          </span>
                        ) : inv.status === 'partially_paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-amber-50 text-amber-800 border-amber-300">
                            <Tag className="h-3 w-3 text-amber-600" />
                            Partial (Due ₹{remainingDue.toLocaleString()})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-rose-50 text-rose-800 border-rose-200">
                            <Clock className="h-3 w-3 text-rose-600" />
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {(inv.status === 'pending' || inv.status === 'partially_paid') && (['receptionist', 'admin', 'super-admin'].includes(userProfile?.role) || isSuperAdmin) && (
                          <button
                            onClick={() => {
                              setCollectPaymentInvoice(inv);
                              setCollectAmount(String(remainingDue > 0 ? remainingDue : inv.totalAmount));
                              setPaymentMode('Cash');
                              setPaymentNotes('');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] shadow-sm cursor-pointer transition-colors"
                          >
                            {inv.status === 'partially_paid' ? 'Collect Balance' : 'Collect Payment'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          title="Download standard PDF (A4)"
                          className="p-1.5 border border-slate-200 text-slate-600 hover:text-revon-blue hover:border-revon-blue rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </button>

                        <button
                          onClick={() => handlePrintHTML(inv)}
                          title="Print Invoice"
                          className="p-1.5 border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-600 rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </button>

                        {(userProfile?.role === 'admin' || userProfile?.role === 'super-admin' || isSuperAdmin) && (
                          <button
                            onClick={() => triggerConfirm(
                              'Delete Invoice',
                              `Are you sure you want to permanently delete invoice ${inv.invoiceNumber}? This action is irreversible.`,
                              () => handleDeleteInvoice(inv.id)
                            )}
                            className="p-1.5 border border-rose-100 hover:border-rose-300 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer inline-flex items-center"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredInvoices.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              idPrefix="billing-invoices"
            />
          </div>
        )}
      </div>

      {/* CREATE TREATMENT INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-base font-display">New Treatment Invoice</h4>
                <p className="text-xs text-slate-500">Draft itemized bill including consultations, consumables, and equipments.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveInvoice} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Row 1: Load from Appointment or Patient Profile (Optional but highly useful) */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-revon-blue uppercase tracking-wider block">Link Clinic Appointment or Patient Profile (Optional)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Appointment</label>
                    <select
                      value={selectedAppointment?.id || ''}
                      onChange={(e) => {
                        const found = appointments.find(a => a.id === e.target.value);
                        setSelectedAppointment(found || null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-revon-blue cursor-pointer"
                    >
                      <option value="">-- No Linked Appointment --</option>
                      {appointments
                        .filter(a => a.status !== 'cancelled')
                        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                        .map((appt) => {
                          const docName = appt.dentistName?.startsWith('Dr.') ? appt.dentistName : `Dr. ${appt.dentistName || 'Dentist'}`;
                          const formattedDate = appt.dateTime ? new Date(appt.dateTime).toLocaleDateString('en-GB') : '';
                          return (
                            <option key={appt.id} value={appt.id}>
                              {appt.patientName} - {docName} - {formattedDate}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Registered Patient</label>
                    <select
                      onChange={(e) => {
                        const found = patients.find(p => p.uid === e.target.value);
                        if (found) {
                          setPatientName(found.displayName || '');
                          setPatientEmail(found.email || '');
                          setPatientPhone(found.phone || '');
                          setSelectedAppointment(null); // Clear appointment to prevent conflicting links
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-revon-blue cursor-pointer"
                    >
                      <option value="">-- Select Registered Patient --</option>
                      {patients.map((pat) => (
                        <option key={pat.uid} value={pat.uid}>
                          {pat.displayName} ({pat.email || 'No Email'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Patient & Doctor Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-revon-blue"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Patient Email</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-revon-blue"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Patient Phone</label>
                  <input
                    type="text"
                    placeholder="Mobile contact number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-revon-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attending Dentist *</label>
                  <select
                    value={dentistName}
                    onChange={(e) => setDentistName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-revon-blue cursor-pointer"
                  >
                    <option value="">-- Select Clinician --</option>
                    {dentists.map((d) => (
                      <option key={d.uid} value={d.displayName}>{d.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Procedure/Treatment Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Root Canal, Scaling, Teeth Whitening"
                    value={treatmentName}
                    onChange={(e) => setTreatmentName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-revon-blue"
                  />
                </div>
              </div>

              {/* Line Items Composer */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Line Items Composer</span>
                  <span className="text-[10px] text-slate-500 font-mono">Add equipment, consumables, and consultation fees</span>
                </div>

                {/* Line Item Inputs */}
                <div className="p-4 bg-slate-50/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Scaling Tool Fee, Composite Resin..."
                      value={currentItemName}
                      onChange={(e) => setCurrentItemName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-revon-blue"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category Type</label>
                    <select
                      value={currentItemType}
                      onChange={(e) => setCurrentItemType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-revon-blue cursor-pointer"
                    >
                      <option value="consultation">Consultation Fee</option>
                      <option value="equipment">Equipment Fee</option>
                      <option value="consumable">Consumable Material</option>
                      <option value="other">Other Accents</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      placeholder="INR Price"
                      value={currentItemPrice}
                      onChange={(e) => setCurrentItemPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-revon-blue"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={currentItemQty}
                      onChange={(e) => setCurrentItemQty(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-revon-blue"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Composited Items list */}
                {lineItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs border-t border-slate-200 italic">
                    No billing elements appended yet. Compose your invoice above.
                  </div>
                ) : (
                  <div className="border-t border-slate-200 divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                    {lineItems.map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/55 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="font-bold text-slate-800 truncate">{item.name}</div>
                          <span className="inline-flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 rounded px-1.5 py-0.5 mt-0.5">
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-semibold text-slate-700">{item.quantity} x ₹{item.unitPrice.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-slate-400 font-mono">₹{item.total.toLocaleString()}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id, item.name)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom: Invoice Status & Calculation Recap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Payment Status</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 p-3 border rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        status === 'pending' 
                          ? 'border-amber-400 bg-amber-50 text-amber-800 font-bold' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="initialStatus"
                          checked={status === 'pending'}
                          onChange={() => setStatus('pending')}
                          className="sr-only"
                        />
                        Payment Pending
                      </label>
                      <label className={`flex-1 p-3 border rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        status === 'collected' 
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-bold' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="initialStatus"
                          checked={status === 'collected'}
                          onChange={() => setStatus('collected')}
                          className="sr-only"
                        />
                        Collected / Paid
                      </label>
                    </div>
                  </div>
                </div>

                {/* Mathematical calculations Box */}
                <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-2xl text-xs space-y-2.5">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>GST/Tax (10%):</span>
                    <span className="font-mono">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5 flex justify-between text-slate-900 font-bold text-sm">
                    <span className="text-revon-blue">Grand Total:</span>
                    <span className="font-mono text-revon-blue">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-revon-blue hover:bg-revon-blue-dark text-white font-extrabold rounded-xl text-xs shadow-md shadow-revon-blue/10 cursor-pointer"
                >
                  Save & Launch Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {collectPaymentInvoice && (() => {
        const alreadyPaid = collectPaymentInvoice.paidAmount !== undefined 
          ? collectPaymentInvoice.paidAmount 
          : (collectPaymentInvoice.payments?.reduce((s, p) => s + p.amount, 0) ?? (collectPaymentInvoice.status === 'collected' ? collectPaymentInvoice.totalAmount : 0));
        const remainingDue = collectPaymentInvoice.remainingAmount !== undefined 
          ? collectPaymentInvoice.remainingAmount 
          : Math.max(0, collectPaymentInvoice.totalAmount - alreadyPaid);
        const invoicePayments = collectPaymentInvoice.payments || [];
        const numAmount = parseFloat(collectAmount) || 0;
        const willSettleFully = numAmount >= remainingDue && remainingDue > 0;

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 space-y-5 animate-scaleUp">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-base font-display">Record Patient Payment</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record full or partial payment for invoice <span className="font-mono font-bold text-slate-700">{collectPaymentInvoice.invoiceNumber}</span>.
                  </p>
                </div>
                <button 
                  onClick={() => setCollectPaymentInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Patient & Procedure Summary */}
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Patient:</span>
                  <span className="font-semibold text-slate-800">{collectPaymentInvoice.patientName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Procedure:</span>
                  <span className="font-semibold text-slate-800">{collectPaymentInvoice.treatmentName}</span>
                </div>
              </div>

              {/* Financial Balance Summary Banner */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Billed</div>
                  <div className="text-sm font-mono font-extrabold text-slate-800 mt-0.5">₹{collectPaymentInvoice.totalAmount.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Paid So Far</div>
                  <div className="text-sm font-mono font-extrabold text-emerald-700 mt-0.5">₹{alreadyPaid.toLocaleString()}</div>
                </div>
                <div className={`p-2 rounded-lg border shadow-2xs ${
                  remainingDue <= 0 
                    ? 'bg-emerald-50/60 border-emerald-100 text-emerald-700' 
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Remaining Due</div>
                  <div className="text-sm font-mono font-extrabold mt-0.5">₹{remainingDue.toLocaleString()}</div>
                </div>
              </div>

              <form onSubmit={handleCollectPayment} className="space-y-4">
                {/* Amount to collect */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Payment Amount (₹) *
                    </label>
                    {remainingDue > 0 && (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        Due: ₹{remainingDue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={remainingDue > 0 ? remainingDue : undefined}
                      step="any"
                      required
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-revon-blue/20 focus:border-revon-blue"
                    />
                  </div>

                  {/* Quick-fill preset buttons */}
                  {remainingDue > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setCollectAmount(String(remainingDue))}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-revon-blue/10 text-revon-blue hover:bg-revon-blue/20 cursor-pointer"
                      >
                        Full Due (₹{remainingDue.toLocaleString()})
                      </button>
                      {remainingDue > 100 && (
                        <button
                          type="button"
                          onClick={() => setCollectAmount(String(Math.round(remainingDue / 2)))}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          50% (₹{Math.round(remainingDue / 2).toLocaleString()})
                        </button>
                      )}
                      {remainingDue >= 500 && (
                        <button
                          type="button"
                          onClick={() => setCollectAmount('500')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          ₹500
                        </button>
                      )}
                      {remainingDue >= 1000 && (
                        <button
                          type="button"
                          onClick={() => setCollectAmount('1000')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          ₹1,000
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Cash', 'UPI', 'Card', 'Other'] as const).map((mode) => (
                      <label
                        key={mode}
                        className={`p-2.5 border rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                          paymentMode === mode 
                            ? 'border-revon-blue bg-blue-50 text-revon-blue shadow-2xs' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMode"
                          checked={paymentMode === mode}
                          onChange={() => setPaymentMode(mode)}
                          className="sr-only"
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reference Note / Transaction ID */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Transaction ID / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. UPI Ref #, Cheque No, Installment 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-revon-blue/20 focus:border-revon-blue"
                  />
                </div>

                {/* Past Payment History Ledger */}
                {invoicePayments.length > 0 && (
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2 max-h-36 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <History className="h-3 w-3 text-slate-400" />
                      Payment History ({invoicePayments.length})
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {invoicePayments.map((p, idx) => (
                        <div key={p.id || idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                          <div>
                            <span className="font-bold text-slate-800">₹{p.amount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5 font-medium">via {p.paymentMode}</span>
                            {p.notes && <div className="text-[10px] text-slate-400">{p.notes}</div>}
                          </div>
                          <div className="text-right text-[10px] text-slate-400">
                            <div>{new Date(p.paymentDate).toLocaleDateString()}</div>
                            {p.collectedBy && <div className="text-slate-500">by {p.collectedBy}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCollectPaymentInvoice(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all"
                  >
                    {willSettleFully ? 'Confirm Settle in Full' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
      {/* MUI CONFIRMATION DIALOG */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '24px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle className="font-bold text-slate-900 font-display">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="text-slate-600 text-sm">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions className="p-4 space-x-2">
          <MuiButton
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            variant="outlined"
            style={{
              borderColor: '#e2e8f0',
              color: '#64748b',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            {confirmDialog.cancelText || 'Cancel'}
          </MuiButton>
          <MuiButton
            onClick={() => {
              if (confirmDialog.onConfirm) {
                confirmDialog.onConfirm();
              }
            }}
            variant="contained"
            color="primary"
            style={{
              backgroundColor: '#1e88e5', // Brand blue color
              color: '#ffffff',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            {confirmDialog.confirmText || 'Confirm'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
