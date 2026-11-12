import React, { useState, useEffect, useMemo } from 'react';
import { APP_NAME } from '../config/appConfig';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button as MuiButton 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { useAppointments } from '../hooks/useAppointments';
import { useClinicData, TREATMENTS } from '../hooks/useClinicData';
import { ZFCreationsBrand } from './ZFCreationsBrand';
import { AppointmentStatus, Appointment, UserProfile, Dependent, BillingItem, Bill, MenuPermissions, UserRole, Invoice, InvoiceItem, Surgeon, SocialHandle, TreatmentService, ClinicFeatures, Clinic } from '../types';
import { Billing } from './Billing';
import { SupportSystem } from './SupportSystem';
import { PaginationControls } from './PaginationControls';
import { AppointmentCalendarView } from './AppointmentCalendarView';
import { DentistSlotBreakdownView, STANDARD_TIME_SLOTS, isSlotBooked } from './DentistSlotBreakdownView';
import { AdminFacilitiesManager } from './AdminFacilitiesManager';
import { AdminReviewsManager } from './AdminReviewsManager';
import { FinanceDashboard } from './FinanceDashboard';
import { ExecutiveAnalyticsDashboard } from './ExecutiveAnalyticsDashboard';
// @ts-ignore
import mainLogo from '../assets/images/main_logo_1783512166748.jpg';
// @ts-ignore
import clinicReceptionImg from '../assets/images/clinic_reception_1784288696289.jpg';
// @ts-ignore
import clinicTreatmentRoomImg from '../assets/images/clinic_treatment_room_1784288709431.jpg';
import { 
  Calendar, 
  Clock, 
  User, 
  Star,
  TrendingUp,
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  RefreshCw, 
  Search, 
  Plus, 
  Send, 
  Filter, 
  Mail, 
  Activity, 
  ListOrdered,
  Users,
  ChevronLeft,
  ChevronRight,
  Database,
  Trash2,
  DollarSign,
  Shield,
  Check,
  Lock,
  PlusCircle,
  CreditCard,
  FileText,
  Edit,
  Printer,
  Award,
  History,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Link,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  List,
  LayoutGrid,
  Stethoscope,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  MapPin,
  Building2,
  Sliders,
  Maximize2,
  Minimize2,
  PartyPopper,
  Globe,
  Receipt,
  Pencil,
  FileX,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { FestivalDecorModal } from './FestivalDecorModal';
import { UpdateClinicUriModal } from './UpdateClinicUriModal';
import { AppointmentBillModal } from './AppointmentBillModal';
import { ClinicLiveStatusBar } from './ClinicLiveStatusBar';
import { PostOpCareModal } from './PostOpCareModal';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  addDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, initializeAuth, createUserWithEmailAndPassword, signOut as secondarySignOut, setPersistence, inMemoryPersistence } from 'firebase/auth';

// Firebase configuration copied locally for the secondary Auth app setup
const firebaseConfig = {
  projectId: "gpslocationfortravellers",
  appId: "1:636698830604:web:f58b1f50421dc43b074b29",
  apiKey: "AIzaSyDu7lH6I02Beanznw9V8ZLRpP8giKVVAEc",
  authDomain: "gpslocationfortravellers.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-dentalclinicsche-a8e7add1-2304-43a4-bdbd-fb178b060b74",
  storageBucket: "gpslocationfortravellers.firebasestorage.app",
  messagingSenderId: "636698830604"
};

export function Dashboard({ 
  initialTab,
  onNavigate 
}: { 
  initialTab?: string;
  onNavigate?: (view: string, clinicSlug?: string) => void;
} = {}) {
  const { userProfile } = useAuth();
  const { activeClinic, clinics, updateClinic, activeLocationId, setActiveLocationId } = useClinic();
  const activeSlug = activeClinic?.slug || 'revon-dental';
  const roleLower = (userProfile?.role || '').toLowerCase();
  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin || roleLower === 'super-admin' || roleLower === 'superadmin');
  const isAdminOrSuper = Boolean(
    isSuperAdmin ||
    roleLower === 'admin'
  );

  const { appointments, loading: appLoading, error: appError, createAppointment, updateAppointmentStatus, deleteAppointment } = useAppointments();
  const { dentists, treatments, reminderLogs, triggerManualReminder, surgeons, createSurgeon, updateSurgeon, deleteSurgeon, socialHandles, updateSocialHandles, services, createService, updateService, deleteService, createReview } = useClinicData();

  // Filter patient's own appointments for personal list/tracker view
  const myAppointments = useMemo(() => {
    if (userProfile?.role === 'patient') {
      return appointments.filter(a => a.patientId === userProfile.uid || a.patientEmail === userProfile.email);
    }
    return appointments;
  }, [appointments, userProfile]);

  // Patient Review State
  const [showPatientReviewModal, setShowPatientReviewModal] = useState(false);
  const [patientReviewRating, setPatientReviewRating] = useState<number>(5);
  const [patientReviewTreatment, setPatientReviewTreatment] = useState('');
  const [patientReviewComment, setPatientReviewComment] = useState('');
  const [patientReviewSubmitting, setPatientReviewSubmitting] = useState(false);
  const [patientReviewSuccess, setPatientReviewSuccess] = useState(false);
  const [patientReviewError, setPatientReviewError] = useState<string | null>(null);

  const handlePatientSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientReviewComment.trim()) {
      setPatientReviewError('Please provide your review feedback.');
      return;
    }
    setPatientReviewSubmitting(true);
    setPatientReviewError(null);
    try {
      await createReview(
        userProfile?.displayName || 'Patient',
        patientReviewRating,
        patientReviewComment,
        {
          patientEmail: userProfile?.email || '',
          patientId: userProfile?.uid || '',
          treatmentName: patientReviewTreatment.trim(),
          isVerifiedPatient: true,
          isPublished: true
        }
      );
      setPatientReviewSuccess(true);
      setTimeout(() => {
        setPatientReviewSuccess(false);
        setShowPatientReviewModal(false);
        setPatientReviewComment('');
        setPatientReviewTreatment('');
        setPatientReviewRating(5);
      }, 2000);
    } catch (err: any) {
      setPatientReviewError(err.message || 'Failed to submit review.');
    } finally {
      setPatientReviewSubmitting(false);
    }
  };

  // Social handles administration states
  const [editingHandles, setEditingHandles] = useState<SocialHandle[]>([]);
  const [isSavingHandles, setIsSavingHandles] = useState(false);
  const [saveHandlesSuccess, setSaveHandlesSuccess] = useState(false);
  const [saveHandlesError, setSaveHandlesError] = useState<string | null>(null);
  const [showAddCustomLinkInput, setShowAddCustomLinkInput] = useState(false);
  const [newCustomLinkName, setNewCustomLinkName] = useState('');
  const [newCustomLinkUrl, setNewCustomLinkUrl] = useState('');

  useEffect(() => {
    if (socialHandles && !isSavingHandles) {
      setEditingHandles(socialHandles);
    }
  }, [socialHandles, isSavingHandles]);

  // ---------------------------------------------------------------------------
  // Real-Time States for Persistent Settings & Custom Collections
  // ---------------------------------------------------------------------------
  const [permissions, setPermissions] = useState<MenuPermissions>({
    appointments: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
    reminders: ['admin', 'super-admin', 'receptionist'],
    patients: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
    billing: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
    finances: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
    patientHistory: ['admin', 'super-admin', 'dentist', 'doctor', 'specialist'],
    reviews: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist']
  });
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingBills, setLoadingBills] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [showClinicUriModal, setShowClinicUriModal] = useState(false);
  const [selectedClinicForUri, setSelectedClinicForUri] = useState<Clinic | null>(null);

  // Admin Clinic Logo & Showcase Images state
  const [adminLogoUrl, setAdminLogoUrl] = useState(activeClinic?.logoUrl || '');
  const [adminLobbyUrl, setAdminLobbyUrl] = useState(activeClinic?.lobbyImageUrl || '');
  const [adminTreatmentRoomUrl, setAdminTreatmentRoomUrl] = useState(activeClinic?.treatmentRoomImageUrl || '');
  
  const [adminLogoSaving, setAdminLogoSaving] = useState(false);
  const [adminLogoSaved, setAdminLogoSaved] = useState(false);
  const [adminLobbySaving, setAdminLobbySaving] = useState(false);
  const [adminLobbySaved, setAdminLobbySaved] = useState(false);
  const [adminTreatmentRoomSaving, setAdminTreatmentRoomSaving] = useState(false);
  const [adminTreatmentRoomSaved, setAdminTreatmentRoomSaved] = useState(false);
  const [adminAllBrandingSaving, setAdminAllBrandingSaving] = useState(false);
  const [adminAllBrandingSaved, setAdminAllBrandingSaved] = useState(false);

  useEffect(() => {
    if (activeClinic) {
      setAdminLogoUrl(activeClinic.logoUrl || '');
      setAdminLobbyUrl(activeClinic.lobbyImageUrl || '');
      setAdminTreatmentRoomUrl(activeClinic.treatmentRoomImageUrl || '');
    }
  }, [activeClinic]);

  const handleAdminLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Logo image size should be less than 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAdminLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdminLobbyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Lobby image size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAdminLobbyUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdminTreatmentRoomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Treatment room image size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAdminTreatmentRoomUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAdminLogo = async () => {
    if (!activeClinic) return;
    setAdminLogoSaving(true);
    setAdminLogoSaved(false);
    try {
      await updateClinic(activeClinic.id, { logoUrl: adminLogoUrl });
      setAdminLogoSaved(true);
      setTimeout(() => setAdminLogoSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save logo:", err);
      alert("Failed to save clinic logo.");
    } finally {
      setAdminLogoSaving(false);
    }
  };

  const handleSaveAdminLobby = async () => {
    if (!activeClinic) return;
    setAdminLobbySaving(true);
    setAdminLobbySaved(false);
    try {
      await updateClinic(activeClinic.id, { lobbyImageUrl: adminLobbyUrl });
      setAdminLobbySaved(true);
      setTimeout(() => setAdminLobbySaved(false), 3000);
    } catch (err) {
      console.error("Failed to save lobby image:", err);
      alert("Failed to save Premium Lobby showcase image.");
    } finally {
      setAdminLobbySaving(false);
    }
  };

  const handleSaveAdminTreatmentRoom = async () => {
    if (!activeClinic) return;
    setAdminTreatmentRoomSaving(true);
    setAdminTreatmentRoomSaved(false);
    try {
      await updateClinic(activeClinic.id, { treatmentRoomImageUrl: adminTreatmentRoomUrl });
      setAdminTreatmentRoomSaved(true);
      setTimeout(() => setAdminTreatmentRoomSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save treatment room image:", err);
      alert("Failed to save Hygienic & Ultra-Modern showcase image.");
    } finally {
      setAdminTreatmentRoomSaving(false);
    }
  };

  const handleSaveAllBrandingAssets = async () => {
    if (!activeClinic) return;
    setAdminAllBrandingSaving(true);
    setAdminAllBrandingSaved(false);
    try {
      await updateClinic(activeClinic.id, {
        logoUrl: adminLogoUrl,
        lobbyImageUrl: adminLobbyUrl,
        treatmentRoomImageUrl: adminTreatmentRoomUrl,
      });
      setAdminAllBrandingSaved(true);
      setTimeout(() => setAdminAllBrandingSaved(false), 3500);
    } catch (err) {
      console.error("Failed to save all branding assets:", err);
      alert("Failed to save branding assets.");
    } finally {
      setAdminAllBrandingSaving(false);
    }
  };

  // Load menu permissions
  useEffect(() => {
    if (!userProfile) return;

    const permRef = doc(db, 'settings', 'menu_permissions');
    const unsub = onSnapshot(permRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loaded: MenuPermissions = {
          appointments: data.appointments || ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          reminders: data.reminders || ['admin', 'super-admin', 'receptionist'],
          patients: data.patients || ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          billing: data.billing || ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          finances: data.finances || ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          patientHistory: data.patientHistory || ['admin', 'super-admin', 'dentist', 'doctor', 'specialist'],
          reviews: data.reviews || ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist']
        };
        setPermissions(loaded);

        // Auto-backfill finances and reviews into Firestore if missing from existing document
        if ((userProfile.role === 'admin' || userProfile.role === 'super-admin' || userProfile.isSuperAdmin) && (!data.finances || !data.reviews)) {
          setDoc(permRef, {
            finances: data.finances || ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
            reviews: data.reviews || ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist']
          }, { merge: true }).catch(err => console.warn("Auto-backfill permissions failed:", err));
        }
      } else if (userProfile.role === 'admin' || userProfile.role === 'super-admin' || userProfile.isSuperAdmin) {
        // Seed default menu permissions if they don't exist (admin only)
        setDoc(permRef, {
          appointments: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          reminders: ['admin', 'super-admin', 'receptionist'],
          patients: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          billing: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          finances: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          patientHistory: ['admin', 'super-admin', 'dentist', 'doctor', 'specialist'],
          reviews: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist']
        });
      } else {
        // Fallback for non-admin if document is not yet seeded
        setPermissions({
          appointments: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          reminders: ['admin', 'super-admin', 'receptionist'],
          patients: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          billing: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          finances: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist'],
          patientHistory: ['admin', 'super-admin', 'dentist', 'doctor', 'specialist'],
          reviews: ['admin', 'super-admin', 'dentist', 'receptionist', 'doctor', 'specialist']
        });
      }
      setLoadingPermissions(false);
    }, (err) => {
      console.error("Permissions snapshot error:", err);
      setLoadingPermissions(false);
    });
    return unsub;
  }, [userProfile]);

  // Load bills in real-time
  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.role === 'patient') {
      const q1 = query(collection(db, 'bills'), where('patientId', '==', userProfile.uid));
      const q2 = query(collection(db, 'bills'), where('patientEmail', '==', userProfile.email));

      const billsMap = new Map<string, Bill>();
      let loaded1 = false;
      let loaded2 = false;

      const updateBillsState = () => {
        const mergedList = Array.from(billsMap.values());
        mergedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBills(mergedList);
        if (loaded1 && loaded2) {
          setLoadingBills(false);
        }
      };

      const unsub1 = onSnapshot(q1, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            billsMap.delete(change.doc.id);
          } else {
            const b = { id: change.doc.id, ...change.doc.data() } as Bill;
            const itemSlug = b.clinicSlug || 'revon-dental';
            if (itemSlug === activeSlug) billsMap.set(change.doc.id, b);
          }
        });
        snapshot.forEach((doc) => {
          const b = { id: doc.id, ...doc.data() } as Bill;
          const itemSlug = b.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) billsMap.set(doc.id, b);
        });
        loaded1 = true;
        updateBillsState();
      }, (err) => {
        console.error("Bills sub1 error:", err);
        loaded1 = true;
        setLoadingBills(false);
      });

      const unsub2 = onSnapshot(q2, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            billsMap.delete(change.doc.id);
          } else {
            const b = { id: change.doc.id, ...change.doc.data() } as Bill;
            const itemSlug = b.clinicSlug || 'revon-dental';
            if (itemSlug === activeSlug) billsMap.set(change.doc.id, b);
          }
        });
        snapshot.forEach((doc) => {
          const b = { id: doc.id, ...doc.data() } as Bill;
          const itemSlug = b.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) billsMap.set(doc.id, b);
        });
        loaded2 = true;
        updateBillsState();
      }, (err) => {
        console.error("Bills sub2 error:", err);
        loaded2 = true;
        setLoadingBills(false);
      });

      return () => {
        unsub1();
        unsub2();
      };
    } else {
      const q = collection(db, 'bills');
      const unsub = onSnapshot(q, (snapshot) => {
        const list: Bill[] = [];
        snapshot.forEach((docSnap) => {
          const b = { id: docSnap.id, ...docSnap.data() } as any;
          const itemSlug = b.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) {
            list.push(b as Bill);
          }
        });
        setBills(list);
        setLoadingBills(false);
      }, (err) => {
        console.error("Bills snapshot error:", err);
        setLoadingBills(false);
      });
      return unsub;
    }
  }, [userProfile, activeSlug, isSuperAdmin]);

  // Load invoices in real-time
  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.role === 'patient') {
      const q1 = query(collection(db, 'invoices'), where('patientId', '==', userProfile.uid));
      const q2 = query(collection(db, 'invoices'), where('patientEmail', '==', userProfile.email));

      const invoicesMap = new Map<string, Invoice>();
      let loaded1 = false;
      let loaded2 = false;

      const updateInvoicesState = () => {
        const mergedList = Array.from(invoicesMap.values());
        mergedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(mergedList);
        if (loaded1 && loaded2) {
          setLoadingInvoices(false);
        }
      };

      const unsub1 = onSnapshot(q1, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            invoicesMap.delete(change.doc.id);
          } else {
            const inv = { id: change.doc.id, ...change.doc.data() } as Invoice;
            const itemSlug = inv.clinicSlug || 'revon-dental';
            if (itemSlug === activeSlug) invoicesMap.set(change.doc.id, inv);
          }
        });
        snapshot.forEach((docSnap) => {
          const inv = { id: docSnap.id, ...docSnap.data() } as Invoice;
          const itemSlug = inv.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) invoicesMap.set(docSnap.id, inv);
        });
        loaded1 = true;
        updateInvoicesState();
      }, (err) => {
        console.error("Invoices sub1 error:", err);
        loaded1 = true;
        setLoadingInvoices(false);
      });

      const unsub2 = onSnapshot(q2, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            invoicesMap.delete(change.doc.id);
          } else {
            const inv = { id: change.doc.id, ...change.doc.data() } as Invoice;
            const itemSlug = inv.clinicSlug || 'revon-dental';
            if (itemSlug === activeSlug) invoicesMap.set(change.doc.id, inv);
          }
        });
        snapshot.forEach((docSnap) => {
          const inv = { id: docSnap.id, ...docSnap.data() } as Invoice;
          const itemSlug = inv.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) invoicesMap.set(docSnap.id, inv);
        });
        loaded2 = true;
        updateInvoicesState();
      }, (err) => {
        console.error("Invoices sub2 error:", err);
        loaded2 = true;
        setLoadingInvoices(false);
      });

      return () => {
        unsub1();
        unsub2();
      };
    } else {
      const q = collection(db, 'invoices');
      const unsub = onSnapshot(q, (snapshot) => {
        const list: Invoice[] = [];
        snapshot.forEach((docSnap) => {
          const inv = { id: docSnap.id, ...docSnap.data() } as any;
          const itemSlug = inv.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) {
            list.push(inv as Invoice);
          }
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(list);
        setLoadingInvoices(false);
      }, (err) => {
        console.error("Invoices snapshot error:", err);
        setLoadingInvoices(false);
      });
      return unsub;
    }
  }, [userProfile, activeSlug, isSuperAdmin]);

  // Load all users for staff in real-time (filtered per clinic)
  useEffect(() => {
    if (userProfile && userProfile.role !== 'patient') {
      const usersRef = collection(db, 'users');
      const unsub = onSnapshot(usersRef, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const u = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          const itemSlug = u.clinicSlug || 'revon-dental';
          if (itemSlug === activeSlug) {
            list.push(u);
          }
        });
        setUsers(list);
        setLoadingUsers(false);
      }, (err) => {
        console.error("Staff users snapshot error:", err);
        setLoadingUsers(false);
      });
      return unsub;
    }
  }, [userProfile, activeSlug, isSuperAdmin]);

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

  // ---------------------------------------------------------------------------
  // Tab Navigation Controls
  // ---------------------------------------------------------------------------
  const [patientTab, setPatientTab] = useState<'appointments' | 'billing' | 'dependents' | 'support' | 'surgeons'>(() => {
    if (initialTab === 'billing') return 'billing';
    if (initialTab === 'dependents') return 'dependents';
    if (initialTab === 'support') return 'support';
    if (initialTab === 'surgeons') return 'surgeons';
    return 'appointments';
  });
  const [staffTab, setStaffTab] = useState<'analytics' | 'appointments' | 'reminders' | 'patients' | 'billing' | 'finances' | 'admin' | 'reviews' | 'support'>(() => {
    if (initialTab === 'appointments') return 'appointments';
    if (initialTab === 'reminders') return 'reminders';
    if (initialTab === 'patients') return 'patients';
    if (initialTab === 'billing') return 'billing';
    if (initialTab === 'finances') return 'finances';
    if (initialTab === 'reviews') return 'reviews';
    if (initialTab === 'admin') return 'admin';
    if (initialTab === 'support') return 'support';
    if (initialTab === 'analytics' || initialTab === 'kpis') return 'analytics';
    return 'analytics';
  });

  // Synchronize tabs whenever initialTab prop changes
  useEffect(() => {
    if (!initialTab) return;
    if (initialTab === 'analytics' || initialTab === 'kpis') {
      setStaffTab('analytics');
      if (userProfile?.role === 'patient') {
        window.history.replaceState({}, '', `/${activeClinic?.slug || 'revon-dental'}/dashboard`);
      }
    } else if (initialTab === 'appointments') {
      setStaffTab('appointments');
      setPatientTab('appointments');
    } else if (initialTab === 'dashboard') {
      setStaffTab(userProfile?.role === 'patient' ? 'appointments' : 'analytics');
      setPatientTab('appointments');
    } else if (initialTab === 'finances') {
      setStaffTab('finances');
      if (userProfile?.role === 'patient') {
        window.history.replaceState({}, '', `/${activeClinic?.slug || 'revon-dental'}/dashboard`);
      }
    } else if (initialTab === 'reviews') {
      setStaffTab('reviews');
      if (userProfile?.role === 'patient') {
        window.history.replaceState({}, '', `/${activeClinic?.slug || 'revon-dental'}/dashboard`);
      }
    } else if (initialTab === 'admin') {
      setStaffTab('admin');
      if (userProfile?.role === 'patient') {
        window.history.replaceState({}, '', `/${activeClinic?.slug || 'revon-dental'}/dashboard`);
      }
    } else if (initialTab === 'patients') {
      setStaffTab('patients');
    } else if (initialTab === 'billing') {
      setStaffTab('billing');
      setPatientTab('billing');
    } else if (initialTab === 'reminders') {
      setStaffTab('reminders');
    } else if (initialTab === 'support') {
      setStaffTab('support');
      setPatientTab('support');
    }
  }, [initialTab, userProfile?.role, activeClinic?.slug]);

  const handleStaffTabChange = (newTab: 'analytics' | 'appointments' | 'reminders' | 'patients' | 'billing' | 'finances' | 'admin' | 'reviews' | 'support') => {
    setStaffTab(newTab);
    setCurrentPage(1);
    const targetSubPath = newTab === 'appointments' ? 'appointments' : (newTab === 'analytics' ? 'analytics' : newTab);
    window.history.replaceState({}, '', `/${activeClinic?.slug || 'revon-dental'}/${targetSubPath}`);
  };

  const handlePatientTabChange = (newTab: 'appointments' | 'billing' | 'dependents' | 'support' | 'surgeons') => {
    setPatientTab(newTab);
    const targetSubPath = newTab === 'appointments' ? 'dashboard' : newTab;
    window.history.replaceState({}, '', `/${activeClinic?.slug || 'revon-dental'}/${targetSubPath}`);
  };
  const [billingSubTab, setBillingSubTab] = useState<'invoices' | 'bills'>('invoices');
  const [patientBillingSubTab, setPatientBillingSubTab] = useState<'invoices' | 'bills'>('invoices');

  // Dependents / Family Member Management states
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [dependentTargetPatientId, setDependentTargetPatientId] = useState('');
  const [newDependentName, setNewDependentName] = useState('');
  const [newDependentRelation, setNewDependentRelation] = useState<'Child' | 'Spouse' | 'Parent' | 'Sibling' | 'Relative' | 'Other'>('Child');
  const [newDependentPhone, setNewDependentPhone] = useState('');
  const [newDependentEmail, setNewDependentEmail] = useState('');

  const [bookForDependentId, setBookForDependentId] = useState<string>('myself');
  const [selectedPrimaryPatientId, setSelectedPrimaryPatientId] = useState<string>('');

  // Auto-populate target patient ID when Register Family Member modal opens
  useEffect(() => {
    if (showAddDependentModal) {
      if (userProfile?.role === 'patient') {
        setDependentTargetPatientId(userProfile.uid);
      } else if (!dependentTargetPatientId) {
        if (selectedPrimaryPatientId && selectedPrimaryPatientId !== 'walk-in') {
          setDependentTargetPatientId(selectedPrimaryPatientId);
        } else if (users.length > 0) {
          const firstPatient = users.find(u => u.role === 'patient') || users[0];
          if (firstPatient) {
            setDependentTargetPatientId(firstPatient.uid);
          }
        }
      }
    }
  }, [showAddDependentModal, userProfile, selectedPrimaryPatientId, users]);

  const handleAddDependentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Robustly fallback target patient ID if missing
    const targetPatientId = dependentTargetPatientId || (userProfile?.role === 'patient' ? userProfile?.uid : '') || (selectedPrimaryPatientId && selectedPrimaryPatientId !== 'walk-in' ? selectedPrimaryPatientId : '');

    if (!newDependentName.trim()) {
      alert("Please enter the family member's full name.");
      return;
    }

    if (!targetPatientId) {
      alert("Please select a primary patient account to attach this family member to.");
      return;
    }

    try {
      const patientRef = doc(db, 'users', targetPatientId);
      let targetUser = users.find(u => u.uid === targetPatientId) || (userProfile?.uid === targetPatientId ? userProfile : null);
      let existingDependents = targetUser?.dependents || [];

      // If patient not in memory array yet, fetch directly from Firestore
      if (!targetUser) {
        const snap = await getDoc(patientRef);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          existingDependents = data.dependents || [];
          targetUser = { uid: snap.id, ...data };
        }
      }

      const targetDisplayName = targetUser?.displayName || userProfile?.displayName || 'Primary Patient';

      const newDep: Dependent = {
        id: Math.random().toString(36).substring(2, 9),
        name: newDependentName.trim(),
        relationship: (newDependentRelation as any) || 'Relative',
        createdAt: new Date().toISOString()
      };
      if (newDependentPhone.trim()) {
        newDep.phone = newDependentPhone.trim();
      }
      if (newDependentEmail.trim()) {
        newDep.email = newDependentEmail.trim();
      }

      const updatedDependents = [...existingDependents, newDep];
      const cleanDependents = JSON.parse(JSON.stringify(updatedDependents));

      await setDoc(patientRef, {
        dependents: cleanDependents
      }, { merge: true });

      alert(`Successfully registered ${newDep.name} (${newDep.relationship}) under ${targetDisplayName}!`);
      
      // Reset form
      setNewDependentName('');
      setNewDependentRelation('Child');
      setNewDependentPhone('');
      setNewDependentEmail('');
      setShowAddDependentModal(false);

      // Pre-select new dependent for active booking flow
      setBookForDependentId(newDep.id);
      setBookPatientName(newDep.name);
      if (newDep.phone) setBookPatientPhone(newDep.phone);
      if (newDep.email) setBookPatientEmail(newDep.email);

    } catch (err: any) {
      console.error("Failed to add family member:", err);
      alert("Failed to add family member: " + err.message);
    }
  };

  const handleRemoveDependent = async (targetPatientId: string, dependentId: string) => {
    try {
      const patientRef = doc(db, 'users', targetPatientId);
      let targetUser = users.find(u => u.uid === targetPatientId) || (userProfile?.uid === targetPatientId ? userProfile : null);
      if (!targetUser) {
        const snap = await getDoc(patientRef);
        if (snap.exists()) {
          targetUser = { uid: snap.id, ...snap.data() } as UserProfile;
        }
      }
      if (!targetUser) return;

      const currentDependents = targetUser.dependents || [];
      const updatedDependents = currentDependents.filter(d => d.id !== dependentId);
      const cleanDependents = JSON.parse(JSON.stringify(updatedDependents));

      await setDoc(patientRef, { dependents: cleanDependents }, { merge: true });
      alert("Family member removed successfully.");
    } catch (err: any) {
      console.error("Failed to remove dependent:", err);
      alert("Failed to remove family member: " + err.message);
    }
  };

  // Automatically adjust staff tab selection if the currently selected tab becomes unpermitted or feature-disabled
  useEffect(() => {
    if (userProfile && userProfile.role !== 'patient') {
      const feats = activeClinic?.features;
      const allowed: string[] = [];

      if (permissions.finances?.includes(userProfile.role) || permissions.billing?.includes(userProfile.role) || isAdminOrSuper) {
        allowed.push('analytics');
      }
      if (feats?.appointments !== false && (permissions.appointments?.includes(userProfile.role) || isAdminOrSuper)) {
        allowed.push('appointments');
      }
      if (feats?.reminders !== false && (permissions.reminders?.includes(userProfile.role) || isAdminOrSuper)) {
        allowed.push('reminders');
      }
      if (permissions.patients?.includes(userProfile.role) || isAdminOrSuper) {
        allowed.push('patients');
      }
      if (feats?.billing !== false && (permissions.billing?.includes(userProfile.role) || isAdminOrSuper)) {
        allowed.push('billing');
      }
      if (feats?.finances !== false && (permissions.finances?.includes(userProfile.role) || isAdminOrSuper)) {
        allowed.push('finances');
      }
      if (feats?.reviews !== false && (permissions.reviews?.includes(userProfile.role) || isAdminOrSuper)) {
        allowed.push('reviews');
      }
      if (isAdminOrSuper) {
        allowed.push('admin');
      }
      if (feats?.supportSystem !== false) {
        allowed.push('support');
      }

      if (allowed.length > 0 && !allowed.includes(staffTab)) {
        setStaffTab(allowed[0] as any);
      }
    }
  }, [permissions, userProfile, activeClinic?.features, staffTab, isAdminOrSuper]);

  // Automatically adjust patient tab selection if the currently selected tab becomes feature-disabled
  useEffect(() => {
    if (userProfile && userProfile.role === 'patient') {
      const feats = activeClinic?.features;
      const allowed: string[] = [];

      if (feats?.appointments !== false) allowed.push('appointments');
      if (feats?.billing !== false) allowed.push('billing');
      allowed.push('dependents');
      if (feats?.supportSystem !== false) allowed.push('support');
      if (feats?.dentistBreakdown !== false) allowed.push('surgeons');
      if (feats?.reviews !== false) allowed.push('reviews');
      if (feats?.finances !== false) allowed.push('finances');

      if (allowed.length > 0 && !allowed.includes(patientTab)) {
        setPatientTab(allowed[0] as any);
      }
    }
  }, [userProfile, activeClinic?.features, patientTab]);

  // ---------------------------------------------------------------------------
  // Form and Modal States
  // ---------------------------------------------------------------------------
  const todayStr = new Date().toISOString().split('T')[0];
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState<any | null>(null);
  const [bookDentistId, setBookDentistId] = useState('');
  const [bookTreatmentId, setBookTreatmentId] = useState('');
  const [bookLocationId, setBookLocationId] = useState('');
  const [bookDate, setBookDate] = useState(todayStr);
  const [bookTime, setBookTime] = useState('09:00');
  const [bookNotes, setBookNotes] = useState('');
  
  // Custom patient details for receptionist booking
  const [bookPatientName, setBookPatientName] = useState('');
  const [bookPatientEmail, setBookPatientEmail] = useState('');
  const [bookPatientPhone, setBookPatientPhone] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Auto-population and fallback initialization for appointment booking modal
  useEffect(() => {
    if (showBookingModal) {
      const today = new Date().toISOString().split('T')[0];
      if (!bookDate) setBookDate(today);

      if (!bookLocationId && activeClinic?.locations && activeClinic.locations.length > 0) {
        const primaryLoc = activeClinic.locations.find(l => l.isPrimary) || activeClinic.locations[0];
        setBookLocationId(activeLocationId || primaryLoc.id);
      } else if (activeLocationId && !bookLocationId) {
        setBookLocationId(activeLocationId);
      }

      if ((!bookTreatmentId || !treatments.some(t => t.id === bookTreatmentId)) && treatments.length > 0) {
        setBookTreatmentId(treatments[0].id);
      }

      if ((!bookDentistId || !dentists.some(d => d.uid === bookDentistId)) && dentists.length > 0) {
        setBookDentistId(dentists[0].uid);
      }
    }
  }, [showBookingModal, activeClinic, treatments, dentists, activeLocationId]);

  // Filters, Search, and Sort States for Appointments
  type AppointmentSortKey = 
    | 'dateTime-desc' 
    | 'dateTime-asc' 
    | 'patientName-asc' 
    | 'patientName-desc' 
    | 'treatment-asc' 
    | 'treatment-desc' 
    | 'dentistName-asc' 
    | 'dentistName-desc' 
    | 'status-asc' 
    | 'status-desc';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dentistFilter, setDentistFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<AppointmentSortKey>('dateTime-desc');
  const [staffAppointmentView, setStaffAppointmentView] = useState<'list' | 'calendar' | 'slots'>('list');
  const [patientAppointmentView, setPatientAppointmentView] = useState<'list' | 'calendar' | 'slots'>('list');

  // Auto-switch bookTime if current slot is booked when date or dentist changes
  useEffect(() => {
    if (!bookDate || !bookDentistId || !showBookingModal) return;
    const slotCheck = isSlotBooked(appointments, bookDate, bookTime, bookDentistId);
    if (slotCheck.isBooked) {
      const available = STANDARD_TIME_SLOTS.find(s => !isSlotBooked(appointments, bookDate, s.value, bookDentistId).isBooked);
      if (available) {
        setBookTime(available.value);
      }
    }
  }, [bookDate, bookDentistId, appointments, showBookingModal]);

  const handleColumnSort = (field: 'patientName' | 'treatment' | 'dentistName' | 'dateTime' | 'status') => {
    setCurrentPage(1);
    if (sortKey.startsWith(field)) {
      const isAsc = sortKey.endsWith('-asc');
      setSortKey(`${field}-${isAsc ? 'desc' : 'asc'}` as AppointmentSortKey);
    } else {
      const defaultOrder = field === 'dateTime' ? 'desc' : 'asc';
      setSortKey(`${field}-${defaultOrder}` as AppointmentSortKey);
    }
  };

  // Staff Appointments Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Staff view additional section pagination states
  const [staffRemindersPage, setStaffRemindersPage] = useState(1);
  const [staffRemindersPageSize, setStaffRemindersPageSize] = useState(10);

  const [staffPatientsPage, setStaffPatientsPage] = useState(1);
  const [staffPatientsPageSize, setStaffPatientsPageSize] = useState(10);

  const [staffBillsPage, setStaffBillsPage] = useState(1);
  const [staffBillsPageSize, setStaffBillsPageSize] = useState(10);

  const [adminUsersPage, setAdminUsersPage] = useState(1);
  const [adminUsersPageSize, setAdminUsersPageSize] = useState(10);

  const [adminSurgeonsPage, setAdminSurgeonsPage] = useState(1);
  const [adminSurgeonsPageSize, setAdminSurgeonsPageSize] = useState(10);

  // Patient view pagination states
  const [patientAppointmentsPage, setPatientAppointmentsPage] = useState(1);
  const [patientAppointmentsPageSize, setPatientAppointmentsPageSize] = useState(10);

  const [patientRemindersPage, setPatientRemindersPage] = useState(1);
  const [patientRemindersPageSize, setPatientRemindersPageSize] = useState(10);

  const [patientInvoicesPage, setPatientInvoicesPage] = useState(1);
  const [patientInvoicesPageSize, setPatientInvoicesPageSize] = useState(10);

  const [patientBillsPage, setPatientBillsPage] = useState(1);
  const [patientBillsPageSize, setPatientBillsPageSize] = useState(10);

  const [patientDependentsPage, setPatientDependentsPage] = useState(1);
  const [patientDependentsPageSize, setPatientDependentsPageSize] = useState(10);

  const [patientSurgeonsPage, setPatientSurgeonsPage] = useState(1);
  const [patientSurgeonsPageSize, setPatientSurgeonsPageSize] = useState(10);

  const [triggeringReminderId, setTriggeringReminderId] = useState<string | null>(null);

  // Derived patient list (from appointments)
  const uniquePatients = Array.from(
    new Map(
      appointments.map((a) => [a.patientEmail, { name: a.patientName, email: a.patientEmail, phone: a.patientPhone }])
    ).values()
  );

  // ---------------------------------------------------------------------------
  // Dentist Treatment Billing Modals & Composing States
  // ---------------------------------------------------------------------------
  const [showAppointmentBillModal, setShowAppointmentBillModal] = useState(false);
  const [appointmentForBillAction, setAppointmentForBillAction] = useState<Appointment | null>(null);
  const [existingBillForAction, setExistingBillForAction] = useState<Bill | null>(null);
  const [existingInvoiceForAction, setExistingInvoiceForAction] = useState<Invoice | null>(null);

  const [showDraftBillModal, setShowDraftBillModal] = useState(false);
  const [selectedAppointmentForBill, setSelectedAppointmentForBill] = useState<Appointment | null>(null);
  const [selectedPostOpAppointment, setSelectedPostOpAppointment] = useState<Appointment | null>(null);
  
  // In-memory composer items for drafting bills
  const [draftBillItems, setDraftBillItems] = useState<BillingItem[]>([]);
  const [newBillItemName, setNewBillItemName] = useState('');
  const [newBillItemType, setNewBillItemType] = useState<'consultation' | 'equipment' | 'stock' | 'other'>('stock');
  const [newBillItemQty, setNewBillItemQty] = useState<number>(1);
  const [newBillItemPrice, setNewBillItemPrice] = useState<number>(100);

  // ---------------------------------------------------------------------------
  // Receptionist Bill Collection Modal States
  // ---------------------------------------------------------------------------
  const [showCollectPaymentModal, setShowCollectPaymentModal] = useState(false);
  const [selectedBillForCollection, setSelectedBillForCollection] = useState<Bill | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Other'>('UPI');
  const [collectingPayment, setCollectingPayment] = useState(false);

  // ---------------------------------------------------------------------------
  // Patient Detailed Receipt View States
  // ---------------------------------------------------------------------------
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);
  const [viewedBillForReceipt, setViewedBillForReceipt] = useState<Bill | null>(null);
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [viewedInvoiceForReceipt, setViewedInvoiceForReceipt] = useState<Invoice | null>(null);

  // ---------------------------------------------------------------------------
  // Admin User Creation Form States
  // ---------------------------------------------------------------------------
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('dentist');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Patients Directory Search & Filter States
  // ---------------------------------------------------------------------------
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState<'all' | 'registered' | 'walk-in'>('all');

  // ---------------------------------------------------------------------------
  // Admin User Editing Form States
  // ---------------------------------------------------------------------------
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('patient');
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Surgeon Management States
  // ---------------------------------------------------------------------------
  const [showAddSurgeonModal, setShowAddSurgeonModal] = useState(false);
  const [showEditSurgeonModal, setShowEditSurgeonModal] = useState(false);
  const [selectedSurgeonForEdit, setSelectedSurgeonForEdit] = useState<Surgeon | null>(null);
  const [surgeonName, setSurgeonName] = useState('');
  const [surgeonSpecialty, setSurgeonSpecialty] = useState('');
  const [surgeonBio, setSurgeonBio] = useState('');
  const [surgeonEmail, setSurgeonEmail] = useState('');
  const [surgeonPhone, setSurgeonPhone] = useState('');
  const [surgeonIsBoardCertified, setSurgeonIsBoardCertified] = useState(true);
  const [surgeonIsActive, setSurgeonIsActive] = useState(true);
  const [surgeonConsultationTiming, setSurgeonConsultationTiming] = useState('Mon - Fri: 09:00 AM - 05:00 PM');
  const [surgeonLoading, setSurgeonLoading] = useState(false);
  const [surgeonError, setSurgeonError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Offered Services Management States & Handlers
  // ---------------------------------------------------------------------------
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<TreatmentService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDuration, setServiceDuration] = useState<number>(30);
  const [servicePrice, setServicePrice] = useState<number>(1000);
  const [serviceShowPrice, setServiceShowPrice] = useState(true);
  const [serviceIsActive, setServiceIsActive] = useState(true);
  const [serviceIcon, setServiceIcon] = useState('Sparkles');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [adminServicesPage, setAdminServicesPage] = useState(1);
  const [adminServicesPageSize, setAdminServicesPageSize] = useState(5);

  // Sub-Tab Segregation & Controlled Card State for Admin Portal
  type AdminSubTab = 'overview' | 'profile' | 'team' | 'services' | 'feedback';

  const ALL_ADMIN_SECTIONS = ['clinic_uri', 'features', 'branding', 'social', 'users', 'surgeons', 'permissions', 'facilities', 'services', 'reviews'] as const;
  type AdminSectionId = typeof ALL_ADMIN_SECTIONS[number];

  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('overview');
  const [openAdminSections, setOpenAdminSections] = useState<AdminSectionId[]>([
    'clinic_uri', 'features', 'branding', 'social', 'users', 'surgeons', 'permissions', 'facilities', 'services', 'reviews'
  ]);

  const [featureUpdatingKey, setFeatureUpdatingKey] = useState<string | null>(null);
  const handleToggleActiveClinicFeature = async (featureKey: keyof ClinicFeatures) => {
    if (!activeClinic) return;
    try {
      setFeatureUpdatingKey(featureKey);
      const defaultFeats: ClinicFeatures = {
        appointments: true,
        billing: true,
        chatbot: true,
        supportSystem: true,
        dentistBreakdown: true,
        reminders: true,
        reviews: true,
        multiLocation: true,
        facilities: true,
        finances: true,
      };
      const current = activeClinic.features || defaultFeats;
      const updated: ClinicFeatures = {
        ...defaultFeats,
        ...current,
        [featureKey]: current[featureKey] === false ? true : false,
      };
      await updateClinic(activeClinic.id, { features: updated });
    } catch (err) {
      console.error("Failed to toggle clinic feature:", err);
    } finally {
      setFeatureUpdatingKey(null);
    }
  };

  const toggleAdminSection = (sectionId: AdminSectionId) => {
    setOpenAdminSections(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const expandAllAdminSections = () => {
    setOpenAdminSections([...ALL_ADMIN_SECTIONS]);
  };

  const collapseAllAdminSections = () => {
    setOpenAdminSections([]);
  };

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !serviceDescription.trim()) {
      setServiceError("Service name and description are required.");
      return;
    }
    setServiceLoading(true);
    setServiceError(null);
    try {
      await createService(
        serviceName,
        serviceDescription,
        serviceDuration,
        servicePrice,
        serviceShowPrice,
        serviceIsActive,
        serviceIcon
      );
      setShowAddServiceModal(false);
      setServiceName('');
      setServiceDescription('');
      setServiceDuration(30);
      setServicePrice(1000);
      setServiceShowPrice(true);
      setServiceIsActive(true);
      setServiceIcon('Sparkles');
      alert("Healthcare Service successfully added to clinic offerings!");
    } catch (err: any) {
      setServiceError(err.message || "Failed to create service");
    } finally {
      setServiceLoading(false);
    }
  };

  const handleEditServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForEdit) return;
    if (!serviceName.trim() || !serviceDescription.trim()) {
      setServiceError("Service name and description are required.");
      return;
    }
    setServiceLoading(true);
    setServiceError(null);
    try {
      await updateService(
        selectedServiceForEdit.id,
        serviceName,
        serviceDescription,
        serviceDuration,
        servicePrice,
        serviceShowPrice,
        serviceIsActive,
        serviceIcon
      );
      setShowEditServiceModal(false);
      setSelectedServiceForEdit(null);
      alert("Healthcare Service successfully updated!");
    } catch (err: any) {
      setServiceError(err.message || "Failed to update service");
    } finally {
      setServiceLoading(false);
    }
  };

  const handleAdminDeleteService = (srv: TreatmentService) => {
    triggerConfirm(
      "Delete Offered Service",
      `Are you sure you want to permanently delete '${srv.name}' from your clinic offerings?`,
      async () => {
        try {
          await deleteService(srv.id);
          alert(`Successfully deleted service '${srv.name}'.`);
        } catch (err: any) {
          alert("Failed to delete service: " + err.message);
        }
      },
      "Delete Service",
      "Cancel"
    );
  };

  // States for cross-origin safe delete confirmations inside iframes
  const [deleteConfirmUid, setDeleteConfirmUid] = useState<string | null>(null);
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Submit Booking Form Helper
  // ---------------------------------------------------------------------------
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDentistId || !bookTreatmentId || !bookDate || !bookTime) {
      alert("Please fill in all required fields.");
      return;
    }

    setBookingLoading(true);
    try {
      const selectedDentist = dentists.find(d => d.uid === bookDentistId) || dentists[0];
      const selectedTreatment = treatments.find(t => t.id === bookTreatmentId) || treatments[0];
      const selectedLocation = activeClinic?.locations?.find(l => l.id === bookLocationId) || activeClinic?.locations?.[0];
      
      if (!selectedDentist || !selectedTreatment) throw new Error("Invalid service or specialist selected");

      // Verify slot availability
      const slotCheck = isSlotBooked(appointments, bookDate, bookTime, selectedDentist.uid);
      if (slotCheck.isBooked) {
        throw new Error(`The ${bookTime} time slot for ${selectedDentist.displayName} on ${bookDate} is already booked. Please choose an available time slot.`);
      }

      const appointmentTime = `${bookDate}T${bookTime}:00`;

      let bookingPayload;
      if (userProfile?.role === 'patient') {
        if (bookForDependentId !== 'myself') {
          const dep = userProfile.dependents?.find(d => d.id === bookForDependentId);
          if (!dep) throw new Error("Selected family member profile not found");
          bookingPayload = {
            patientId: userProfile.uid,
            patientName: dep.name,
            patientPhone: dep.phone || userProfile.phone || '+91 98765 43210',
            patientEmail: dep.email || userProfile.email,
            dentistId: selectedDentist.uid,
            dentistName: selectedDentist.displayName,
            clinicId: activeClinic?.id,
            clinicName: activeClinic?.name,
            clinicSlug: activeClinic?.slug || activeSlug,
            locationId: selectedLocation?.id || activeClinic?.locations?.[0]?.id,
            locationName: selectedLocation?.name || activeClinic?.locations?.[0]?.name || 'Main Branch',
            dateTime: appointmentTime,
            status: 'pending' as AppointmentStatus,
            treatment: selectedTreatment.name,
            notes: bookNotes ? `${bookNotes} (Family Booking: ${dep.relationship} - ${dep.name})` : `(Family Booking: ${dep.relationship} - ${dep.name})`
          };
        } else {
          bookingPayload = {
            patientId: userProfile.uid,
            patientName: userProfile.displayName,
            patientPhone: userProfile.phone || '+91 98765 43210',
            patientEmail: userProfile.email,
            dentistId: selectedDentist.uid,
            dentistName: selectedDentist.displayName,
            clinicId: activeClinic?.id,
            clinicName: activeClinic?.name,
            clinicSlug: activeClinic?.slug || activeSlug,
            locationId: selectedLocation?.id || activeClinic?.locations?.[0]?.id,
            locationName: selectedLocation?.name || activeClinic?.locations?.[0]?.name || 'Main Branch',
            dateTime: appointmentTime,
            status: 'pending' as AppointmentStatus,
            treatment: selectedTreatment.name,
            notes: bookNotes
          };
        }
      } else {
        if (selectedPrimaryPatientId) {
          const primaryPat = users.find(u => u.uid === selectedPrimaryPatientId);
          if (!primaryPat) throw new Error("Selected registered patient profile not found");

          if (bookForDependentId !== 'myself') {
            const dep = primaryPat.dependents?.find(d => d.id === bookForDependentId);
            if (!dep) throw new Error("Selected family member profile not found");
            bookingPayload = {
              patientId: primaryPat.uid,
              patientName: dep.name,
              patientPhone: dep.phone || primaryPat.phone || '+91 98765 43210',
              patientEmail: dep.email || primaryPat.email,
              dentistId: selectedDentist.uid,
              dentistName: selectedDentist.displayName,
              clinicId: activeClinic?.id,
              clinicName: activeClinic?.name,
              clinicSlug: activeClinic?.slug || activeSlug,
              locationId: selectedLocation?.id || activeClinic?.locations?.[0]?.id,
              locationName: selectedLocation?.name || activeClinic?.locations?.[0]?.name || 'Main Branch',
              dateTime: appointmentTime,
              status: 'confirmed' as AppointmentStatus,
              treatment: selectedTreatment.name,
              notes: bookNotes ? `${bookNotes} (Family Booking: ${dep.relationship} - ${dep.name})` : `(Family Booking: ${dep.relationship} - ${dep.name})`
            };
          } else {
            bookingPayload = {
              patientId: primaryPat.uid,
              patientName: primaryPat.displayName,
              patientPhone: primaryPat.phone || '+91 98765 43210',
              patientEmail: primaryPat.email,
              dentistId: selectedDentist.uid,
              dentistName: selectedDentist.displayName,
              clinicId: activeClinic?.id,
              clinicName: activeClinic?.name,
              clinicSlug: activeClinic?.slug || activeSlug,
              locationId: selectedLocation?.id || activeClinic?.locations?.[0]?.id,
              locationName: selectedLocation?.name || activeClinic?.locations?.[0]?.name || 'Main Branch',
              dateTime: appointmentTime,
              status: 'confirmed' as AppointmentStatus,
              treatment: selectedTreatment.name,
              notes: bookNotes
            };
          }
        } else {
          if (!bookPatientName || !bookPatientEmail || !bookPatientPhone) {
            throw new Error("Patient credentials required for staff manual booking");
          }
          bookingPayload = {
            patientId: 'walk-in-patient',
            patientName: bookPatientName,
            patientPhone: bookPatientPhone,
            patientEmail: bookPatientEmail,
            dentistId: selectedDentist.uid,
            dentistName: selectedDentist.displayName,
            clinicId: activeClinic?.id,
            clinicName: activeClinic?.name,
            clinicSlug: activeClinic?.slug || activeSlug,
            locationId: selectedLocation?.id || activeClinic?.locations?.[0]?.id,
            locationName: selectedLocation?.name || activeClinic?.locations?.[0]?.name || 'Main Branch',
            dateTime: appointmentTime,
            status: 'confirmed' as AppointmentStatus,
            treatment: selectedTreatment.name,
            notes: bookNotes
          };
        }
      }

      await createAppointment(bookingPayload);
      setBookingSuccess(true);
      
      setBookTreatmentId('');
      setBookNotes('');
      setBookPatientName('');
      setBookPatientEmail('');
      setBookPatientPhone('');
      setBookForDependentId('myself');
      setSelectedPrimaryPatientId('');
      
      setTimeout(() => {
        setBookingSuccess(false);
        setShowBookingModal(false);
      }, 3000);
    } catch (err: any) {
      alert(err.message || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Automated email logs dispatch
  // ---------------------------------------------------------------------------
  const handleTriggerReminder = async (app: Appointment) => {
    setTriggeringReminderId(app.id);
    try {
      await triggerManualReminder(
        app.id, 
        app.patientEmail, 
        `Scheduled dental procedure ${app.treatment} with ${app.dentistName} on ${new Date(app.dateTime).toLocaleString()}`
      );
      alert(`Automated email reminder log successfully dispatched for ${app.patientEmail}!`);
    } catch (err) {
      alert("Failed to fire manual reminder log.");
    } finally {
      setTriggeringReminderId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Appointment Monitor Bill Management Handlers (Add, Edit, Delete, Receipt)
  // Synchronized in real-time with Billing & Receipts
  // ---------------------------------------------------------------------------
  const handleOpenAddBill = (app: Appointment) => {
    const existingB = bills.find(b => b.id === app.id || b.appointmentId === app.id) || null;
    const existingInv = invoices.find(inv => inv.appointmentId === app.id) || null;
    setAppointmentForBillAction(app);
    setExistingBillForAction(existingB);
    setExistingInvoiceForAction(existingInv);
    setShowAppointmentBillModal(true);
  };

  const handleOpenEditBill = (app: Appointment, bill: Bill | null, inv?: Invoice | null) => {
    setAppointmentForBillAction(app);
    setExistingBillForAction(bill || bills.find(b => b.id === app.id || b.appointmentId === app.id) || null);
    setExistingInvoiceForAction(inv || invoices.find(i => i.appointmentId === app.id) || null);
    setShowAppointmentBillModal(true);
  };

  const handleDeleteBillForAppointment = (app: Appointment, bill?: Bill | null, inv?: Invoice | null) => {
    const patientName = app.patientName;
    const amount = bill?.totalAmount || inv?.totalAmount || 0;
    triggerConfirm(
      'Delete Bill & Invoice',
      `Are you sure you want to permanently delete the bill for ${patientName} (${amount ? `₹${amount}` : 'Pending'})? This will remove the record from both the Appointment Monitor and Billing & Receipts.`,
      async () => {
        try {
          const promises: Promise<void>[] = [];
          
          // Delete from bills collection
          promises.push(deleteDoc(doc(db, 'bills', app.id)));
          if (bill?.id && bill.id !== app.id) {
            promises.push(deleteDoc(doc(db, 'bills', bill.id)));
          }

          // Delete from invoices collection
          const invoicesRef = collection(db, 'invoices');
          const qInv = query(invoicesRef, where('appointmentId', '==', app.id));
          const invSnap = await getDocs(qInv);
          invSnap.forEach((d) => {
            promises.push(deleteDoc(doc(db, 'invoices', d.id)));
          });
          if (inv?.id) {
            promises.push(deleteDoc(doc(db, 'invoices', inv.id)));
          }

          await Promise.all(promises);

          // Optimistically update local states immediately
          setBills(prev => prev.filter(b => b.id !== app.id && b.appointmentId !== app.id));
          setInvoices(prev => prev.filter(i => i.appointmentId !== app.id));
        } catch (err: any) {
          console.error('Error deleting bill:', err);
          alert('Failed to delete bill: ' + (err.message || 'Unknown error'));
        }
      },
      'Delete Bill',
      'Keep Bill'
    );
  };

  const handleViewReceipt = (app: Appointment, bill?: Bill | null, inv?: Invoice | null) => {
    const targetBill = bill || bills.find(b => b.id === app.id || b.appointmentId === app.id);
    const targetInvoice = inv || invoices.find(i => i.appointmentId === app.id);

    if (targetBill) {
      setViewedBillForReceipt(targetBill);
      setShowReceiptDetailModal(true);
    } else if (targetInvoice) {
      setViewedInvoiceForReceipt(targetInvoice);
      setShowInvoiceDetailModal(true);
    } else {
      handleOpenAddBill(app);
    }
  };

  // ---------------------------------------------------------------------------
  // Dentist Bill Drafting Mechanics
  // ---------------------------------------------------------------------------
  const handleOpenDraftBillModal = (app: Appointment) => {
    handleOpenAddBill(app);
  };

  const handleAddDraftBillItem = () => {
    if (!newBillItemName.trim()) {
      alert("Please provide an item name.");
      return;
    }
    const newItem: BillingItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: newBillItemName,
      type: newBillItemType,
      quantity: Math.max(1, newBillItemQty),
      unitPrice: Math.max(0, newBillItemPrice),
      total: Math.max(1, newBillItemQty) * Math.max(0, newBillItemPrice)
    };
    setDraftBillItems([...draftBillItems, newItem]);
    
    // Clear inputs
    setNewBillItemName('');
    setNewBillItemQty(1);
    setNewBillItemPrice(100);
  };

  const handleRemoveDraftBillItem = (id: string) => {
    setDraftBillItems(draftBillItems.filter(item => item.id !== id));
  };

  const handleSaveDraftBill = async () => {
    if (!selectedAppointmentForBill) return;
    if (draftBillItems.length === 0) {
      alert("Please add at least one item to save the bill.");
      return;
    }

    const subtotal = draftBillItems.reduce((acc, curr) => acc + curr.total, 0);
    const tax = Math.round(subtotal * 0.18); // standard 18% clinic VAT/service tax
    const totalAmount = subtotal + tax;

    try {
      // Save bill record using the Appointment ID to ensure 1-to-1 parity
      await setDoc(doc(db, 'bills', selectedAppointmentForBill.id), {
        appointmentId: selectedAppointmentForBill.id,
        patientId: selectedAppointmentForBill.patientId,
        patientName: selectedAppointmentForBill.patientName,
        patientEmail: selectedAppointmentForBill.patientEmail,
        dentistId: selectedAppointmentForBill.dentistId,
        dentistName: selectedAppointmentForBill.dentistName,
        treatmentName: selectedAppointmentForBill.treatment,
        items: draftBillItems,
        subtotal,
        tax,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      alert("Dental billing details successfully generated and routed to the Receptionist queue!");
      setShowDraftBillModal(false);
      setSelectedAppointmentForBill(null);
    } catch (err: any) {
      alert("Failed to draft bill record: " + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Receptionist Bill Collection Mechanics
  // ---------------------------------------------------------------------------
  const handleOpenCollectPaymentModal = (bill: Bill) => {
    setSelectedBillForCollection(bill);
    setSelectedPaymentMode('UPI');
    setShowCollectPaymentModal(true);
  };

  const handleConfirmCollection = async () => {
    if (!selectedBillForCollection) return;
    setCollectingPayment(true);
    try {
      const billRef = doc(db, 'bills', selectedBillForCollection.id);
      await updateDoc(billRef, {
        status: 'collected',
        paymentMode: selectedPaymentMode,
        paymentDate: new Date().toISOString(),
        collectedBy: userProfile?.displayName || 'Clinic Receptionist'
      });

      alert(`Payment of ₹${selectedBillForCollection.totalAmount} collected via ${selectedPaymentMode}! Receipt generated.`);
      setShowCollectPaymentModal(false);
      setSelectedBillForCollection(null);
    } catch (err: any) {
      alert("Failed to record payment collection: " + err.message);
    } finally {
      setCollectingPayment(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Unified Patients List (Registered & Walk-in Patients)
  // ---------------------------------------------------------------------------
  const combinedPatientsList = useMemo(() => {
    const registered = users.filter(u => u.role === 'patient').map(u => ({
      uid: u.uid,
      displayName: u.displayName,
      email: u.email,
      phone: u.phone,
      isRegistered: true,
      dependents: u.dependents || [],
      sourceUser: u
    }));

    const walkInsMap = new Map<string, typeof registered[0]>();

    appointments.forEach(appt => {
      if (appt.patientId === 'walk-in-patient') {
        const emailKey = (appt.patientEmail || '').trim().toLowerCase();
        const phoneKey = (appt.patientPhone || '').trim();
        const nameKey = (appt.patientName || '').trim().toLowerCase();
        
        const uniqueKey = emailKey || `${nameKey}_${phoneKey}`;
        if (!uniqueKey) return;

        const isRegistered = registered.some(r => 
          (emailKey && r.email && r.email.trim().toLowerCase() === emailKey) ||
          (phoneKey && r.phone && r.phone.trim() === phoneKey)
        );

        if (isRegistered) return;

        if (!walkInsMap.has(uniqueKey)) {
          walkInsMap.set(uniqueKey, {
            uid: `walkin_${uniqueKey}`,
            displayName: appt.patientName,
            email: appt.patientEmail,
            phone: appt.patientPhone,
            isRegistered: false,
            dependents: [],
            sourceUser: null as any
          });
        }
      }
    });

    const allPatients = [...registered, ...Array.from(walkInsMap.values())];

    return allPatients.filter(p => {
      if (patientFilter === 'registered' && !p.isRegistered) return false;
      if (patientFilter === 'walk-in' && p.isRegistered) return false;

      if (patientSearchQuery.trim()) {
        const queryLower = patientSearchQuery.toLowerCase();
        const matchName = p.displayName.toLowerCase().includes(queryLower);
        const matchEmail = (p.email || '').toLowerCase().includes(queryLower);
        const matchPhone = (p.phone || '').toLowerCase().includes(queryLower);
        return matchName || matchEmail || matchPhone;
      }

      return true;
    });
  }, [users, appointments, patientFilter, patientSearchQuery]);

  // ---------------------------------------------------------------------------
  // Patient Treatment Invoice Printing
  // ---------------------------------------------------------------------------
  const handlePrintInvoice = (invoice: Invoice) => {
    const invoiceClinic = (clinics || []).find(c => c.slug === invoice.clinicSlug || c.id === invoice.clinicSlug) || activeClinic;
    const logoToUse = invoiceClinic?.logoUrl || mainLogo;
    const clinicNameToUse = invoiceClinic?.name || APP_NAME;

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

    const invoiceStatusBadge = invoice.status === 'collected'
      ? `<span style="background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">Paid (${invoice.paymentMode || 'Cash'})</span>`
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
            .brand-name {
              font-size: 24px;
              font-weight: 800;
              color: #1e293b;
              letter-spacing: -0.5px;
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
                <div class="detail-val">Status: Verified Patient Account</div>
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
              </div>
            </div>

            <div class="footer-section">
              Care Beyond Smiles • Thank you for your visit to REVON!
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ---------------------------------------------------------------------------
  // Admin Update Role Mechanics
  // ---------------------------------------------------------------------------
  const handleUpdateUserRole = async (userId: string, targetRole: UserRole) => {
    if (userId === userProfile?.uid) {
      alert("You cannot demote or modify your own role.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { role: targetRole });
      alert("User role successfully updated in Firestore!");
    } catch (err: any) {
      alert("Failed to update user role: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === userProfile?.uid) {
      alert("You cannot delete your own admin account.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert("User profile successfully deleted from Firestore.");
      setDeleteConfirmUid(null);
    } catch (err: any) {
      alert("Failed to delete user profile: " + err.message);
    }
  };

  const handleAdminUpdateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    if (!editUserName.trim()) {
      setEditUserError("Name is required.");
      return;
    }

    triggerConfirm(
      'Confirm Profile Update',
      `Are you sure you want to update the profile details for user "${editUserName}"?`,
      async () => {
        setEditUserLoading(true);
        setEditUserError(null);
        try {
          const userRef = doc(db, 'users', selectedUserForEdit.uid);
          await updateDoc(userRef, {
            displayName: editUserName,
            email: editUserEmail,
            phone: editUserPhone,
            role: editUserRole
          });
          alert("User profile updated successfully!");
          setShowEditUserModal(false);
          setSelectedUserForEdit(null);
        } catch (err: any) {
          setEditUserError("Failed to update user profile: " + err.message);
        } finally {
          setEditUserLoading(false);
        }
      }
    );
  };

  // ---------------------------------------------------------------------------
  // Surgeon Administration Mechanics
  // ---------------------------------------------------------------------------
  const handleAdminCreateSurgeon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surgeonName.trim() || !surgeonSpecialty.trim() || !surgeonBio.trim() || !surgeonEmail.trim()) {
      setSurgeonError("Please fill in all required surgeon fields.");
      return;
    }
    setSurgeonLoading(true);
    setSurgeonError(null);
    try {
      await createSurgeon(
        surgeonName.trim(),
        surgeonSpecialty.trim(),
        surgeonBio.trim(),
        surgeonEmail.trim(),
        surgeonIsBoardCertified,
        surgeonIsActive,
        surgeonConsultationTiming.trim() || 'Mon - Fri: 09:00 AM - 05:00 PM',
        surgeonPhone.trim() || ''
      );
      alert(`Surgeon profile for ${surgeonName} created successfully!`);
      // Reset State
      setSurgeonName('');
      setSurgeonSpecialty('');
      setSurgeonBio('');
      setSurgeonEmail('');
      setSurgeonPhone('');
      setSurgeonIsBoardCertified(true);
      setSurgeonIsActive(true);
      setSurgeonConsultationTiming('Mon - Fri: 09:00 AM - 05:00 PM');
      setShowAddSurgeonModal(false);
    } catch (err: any) {
      setSurgeonError("Failed to add surgeon: " + err.message);
    } finally {
      setSurgeonLoading(false);
    }
  };

  const handleAdminUpdateSurgeon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurgeonForEdit) return;
    if (!surgeonName.trim() || !surgeonSpecialty.trim() || !surgeonBio.trim() || !surgeonEmail.trim()) {
      setSurgeonError("Please fill out all required fields.");
      return;
    }

    triggerConfirm(
      'Confirm Surgeon Update',
      `Are you sure you want to update the profile details for "${surgeonName}"?`,
      async () => {
        setSurgeonLoading(true);
        setSurgeonError(null);
        try {
          await updateSurgeon(
            selectedSurgeonForEdit.id,
            surgeonName.trim(),
            surgeonSpecialty.trim(),
            surgeonBio.trim(),
            surgeonEmail.trim(),
            surgeonIsBoardCertified,
            surgeonIsActive,
            surgeonConsultationTiming.trim() || 'Mon - Fri: 09:00 AM - 05:00 PM',
            surgeonPhone.trim() || ''
          );
          alert("Surgeon profile updated successfully!");
          setShowEditSurgeonModal(false);
          setSelectedSurgeonForEdit(null);
        } catch (err: any) {
          setSurgeonError("Failed to update surgeon profile: " + err.message);
        } finally {
          setSurgeonLoading(false);
        }
      }
    );
  };

  const handleAdminDeleteSurgeon = (surgeon: Surgeon) => {
    triggerConfirm(
      'Delete Surgeon Profile',
      `Are you sure you want to permanently delete the profile for ${surgeon.displayName}? This action cannot be undone.`,
      async () => {
        try {
          await deleteSurgeon(surgeon.id);
          alert("Surgeon profile deleted successfully!");
        } catch (err: any) {
          alert("Failed to delete surgeon: " + err.message);
        }
      }
    );
  };

  // ---------------------------------------------------------------------------
  // Admin Create New User Mechanics (utilizing secondary Firebase Auth)
  // ---------------------------------------------------------------------------
  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserName) {
      setAddUserError("Please fill out Name, Email and Password.");
      return;
    }
    setAddUserLoading(true);
    setAddUserError(null);

    try {
      // 1. Establish a separate temporary app context so the current admin user session is completely undisturbed
      let secondaryApp;
      try {
        secondaryApp = getApp('SecondaryApp');
      } catch (err) {
        secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
      }
      
      let secondaryAuth;
      try {
        secondaryAuth = initializeAuth(secondaryApp, {
          persistence: inMemoryPersistence
        });
      } catch (authError) {
        // If already initialized, fetch the existing instance
        secondaryAuth = getAuth(secondaryApp);
      }

      // 2. Register user inside secondary auth
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
      const newUid = userCred.user.uid;

      // 3. Log out secondary session immediately so it doesn't leak or conflict
      await secondarySignOut(secondaryAuth);

      // 4. Create Firestore document using the primary db instance
      await setDoc(doc(db, 'users', newUid), {
        uid: newUid,
        displayName: newUserName,
        email: newUserEmail,
        phone: newUserPhone || '+91 98765 00000',
        role: newUserRole,
        createdAt: new Date().toISOString(),
        clinicSlug: activeSlug
      });

      alert(`Account successfully created for ${newUserName} (${newUserRole})!`);
      
      // Reset state
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      setNewUserRole('dentist');
      setShowAddUserModal(false);
    } catch (err: any) {
      console.error(err);
      setAddUserError(err.message || "Failed to create user account.");
    } finally {
      setAddUserLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Admin Menu Permission Settings Updates
  // ---------------------------------------------------------------------------
  const handleTogglePermission = async (menuKey: keyof MenuPermissions, roleToToggle: UserRole) => {
    // Admin must always be in permissions to prevent locking out
    const updatedRoles = [...(permissions[menuKey] || [])];
    const index = updatedRoles.indexOf(roleToToggle);
    if (index > -1) {
      updatedRoles.splice(index, 1);
    } else {
      updatedRoles.push(roleToToggle);
    }

    try {
      const permRef = doc(db, 'settings', 'menu_permissions');
      await updateDoc(permRef, { [menuKey]: updatedRoles });
    } catch (err: any) {
      alert("Failed to adjust tab permissions: " + err.message);
    }
  };

  const handleUpdateSocialUrl = (id: string, url: string) => {
    const updated = editingHandles.map((handle) => (handle.id === id ? { ...handle, url } : handle));
    setEditingHandles(updated);
  };

  const handleUpdateSocialName = (id: string, name: string) => {
    const updated = editingHandles.map((handle) => (handle.id === id ? { ...handle, name } : handle));
    setEditingHandles(updated);
  };

  const handleToggleSocialActive = (id: string) => {
    const updated = editingHandles.map((handle) =>
      handle.id === id ? { ...handle, isActive: !handle.isActive } : handle
    );
    setEditingHandles(updated);
    // Persist toggle change to Firestore in real-time
    updateSocialHandles(updated).catch((e) => console.warn("Failed to auto-sync social toggle:", e));
  };

  const handleAddSocialHandle = (platform: SocialHandle['platform'], customName?: string, customUrl?: string) => {
    const platformNames: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
      twitter: 'X / Twitter',
      whatsapp: 'WhatsApp',
      link: 'Custom Link'
    };
    const name = customName?.trim() || platformNames[platform] || 'Social Link';
    const newHandle: SocialHandle = {
      id: `${platform}_${Date.now()}`,
      name,
      url: customUrl?.trim() || 'https://',
      isActive: true,
      platform
    };
    const updated = [...editingHandles, newHandle];
    setEditingHandles(updated);
    updateSocialHandles(updated).catch((e) => console.warn("Failed to auto-sync added social handle:", e));
  };

  const handleDeleteSocialHandle = (id: string) => {
    const updated = editingHandles.filter((h) => h.id !== id);
    setEditingHandles(updated);
    updateSocialHandles(updated).catch((e) => console.warn("Failed to auto-sync deleted social handle:", e));
  };

  const handleResetSocialHandles = () => {
    const defaultHandles: SocialHandle[] = [
      { id: 'facebook', name: 'Facebook', url: 'https://facebook.com', isActive: true, platform: 'facebook' },
      { id: 'whatsapp', name: 'WhatsApp', url: 'https://wa.me/919876543210', isActive: true, platform: 'whatsapp' },
      { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', isActive: true, platform: 'instagram' },
      { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', isActive: true, platform: 'linkedin' },
      { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', isActive: true, platform: 'youtube' }
    ];
    setEditingHandles(defaultHandles);
    updateSocialHandles(defaultHandles).catch((e) => console.warn("Failed to reset social handles:", e));
  };

  const handleSaveSocialHandles = async () => {
    setIsSavingHandles(true);
    setSaveHandlesSuccess(false);
    setSaveHandlesError(null);
    try {
      await updateSocialHandles(editingHandles);
      setSaveHandlesSuccess(true);
      setTimeout(() => setSaveHandlesSuccess(false), 3000);
    } catch (err: any) {
      setSaveHandlesError(err.message || "Failed to save social handles");
    } finally {
      setIsSavingHandles(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Filtering & Sorting mechanics for queue appointments
  // ---------------------------------------------------------------------------
  const filteredAppointments = appointments
    .filter((app) => {
      const queryLower = searchQuery.toLowerCase();
      const matchSearch = 
        app.patientName.toLowerCase().includes(queryLower) ||
        app.treatment.toLowerCase().includes(queryLower) ||
        app.patientEmail.toLowerCase().includes(queryLower) ||
        app.dentistName.toLowerCase().includes(queryLower);
      
      const matchStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchDentist = dentistFilter === 'all' || app.dentistId === dentistFilter;

      return matchSearch && matchStatus && matchDentist;
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'dateTime-asc':
          return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        case 'dateTime-desc':
          return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
        case 'patientName-asc':
          return a.patientName.localeCompare(b.patientName);
        case 'patientName-desc':
          return b.patientName.localeCompare(a.patientName);
        case 'treatment-asc':
          return a.treatment.localeCompare(b.treatment);
        case 'treatment-desc':
          return b.treatment.localeCompare(a.treatment);
        case 'dentistName-asc':
          return a.dentistName.localeCompare(b.dentistName);
        case 'dentistName-desc':
          return b.dentistName.localeCompare(a.dentistName);
        case 'status-asc':
          return a.status.localeCompare(b.status);
        case 'status-desc':
          return b.status.localeCompare(a.status);
        default:
          return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
      }
    });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Pending</span>;
      case 'confirmed': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">Confirmed</span>;
      case 'completed': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'cancelled': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">Cancelled</span>;
    }
  };

  return (
    <div id="dashboard-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 relative z-10">
          <span className="text-revon-teal text-xs font-bold uppercase tracking-wider font-mono">{APP_NAME} Workspace</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
            Hello, {userProfile?.displayName || 'User'}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            {userProfile?.role === 'patient' 
              ? 'Book an appointment, view detailed treatment break-ups, or check payment receipts.' 
              : 'Monitor active clinics, log equipment usage, collect payments, and manage user roles.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {userProfile?.role === 'patient' && (
            <button
              id="patient-leave-review-btn"
              onClick={() => {
                setPatientReviewTreatment('');
                setPatientReviewRating(5);
                setPatientReviewComment('');
                setPatientReviewError(null);
                setPatientReviewSuccess(false);
                setShowPatientReviewModal(true);
              }}
              className="flex items-center space-x-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-5 py-3 rounded-2xl font-bold text-sm transition-all flex-shrink-0 cursor-pointer shadow-sm"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>Leave Clinic Review</span>
            </button>
          )}
          {activeClinic?.features?.appointments !== false && (
            <button
              id="trigger-book-modal-btn"
              onClick={() => {
                if (dentists.length > 0) setBookDentistId(dentists[0].uid);
                if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                setShowBookingModal(true);
              }}
              className="flex items-center space-x-2 bg-revon-blue text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-opacity-90 shadow-md shadow-revon-blue/10 transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              <span>{userProfile?.role === 'patient' ? 'New Booking' : 'Walk-In Booking'}</span>
            </button>
          )}
        </div>
      </div>

      {appError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
          <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{appError}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. PATIENT DASHBOARD FLOW */}
      {/* ===================================================================== */}
      {userProfile?.role === 'patient' && (
        <div className="space-y-6">
          
          {/* Patient Sub Tab Selection */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar scroll-smooth pb-1">
            {activeClinic?.features?.appointments !== false && (
              <button
                onClick={() => handlePatientTabChange('appointments')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${
                  patientTab === 'appointments' ? 'border-revon-blue text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                My Appointments
              </button>
            )}
            {activeClinic?.features?.billing !== false && (
              <button
                onClick={() => handlePatientTabChange('billing')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${
                  patientTab === 'billing' ? 'border-revon-blue text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                My Bills & Receipts
              </button>
            )}
            <button
              onClick={() => handlePatientTabChange('dependents')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${
                patientTab === 'dependents' ? 'border-revon-blue text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Family & Dependents
            </button>
            {activeClinic?.features?.supportSystem !== false && (
              <button
                onClick={() => handlePatientTabChange('support')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${
                  patientTab === 'support' ? 'border-revon-blue text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Support & Announcements
              </button>
            )}
            {activeClinic?.features?.dentistBreakdown !== false && (
              <button
                id="patient-tab-surgeons"
                onClick={() => handlePatientTabChange('surgeons')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${
                  patientTab === 'surgeons' ? 'border-revon-blue text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Our Specialists
              </button>
            )}
          </div>

          {patientTab === 'appointments' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm gap-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2 font-display">
                  <Activity className="h-5 w-5 text-revon-blue" />
                  <span>My Scheduled Appointments</span>
                </h3>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setPatientAppointmentView('list')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                      patientAppointmentView === 'list'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>List View</span>
                  </button>
                  <button
                    onClick={() => setPatientAppointmentView('calendar')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                      patientAppointmentView === 'calendar'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Calendar View</span>
                  </button>
                  <button
                    id="patient-view-slots-btn"
                    onClick={() => setPatientAppointmentView('slots')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                      patientAppointmentView === 'slots'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Slot Availability</span>
                  </button>
                </div>
              </div>

              {patientAppointmentView === 'slots' ? (
                <DentistSlotBreakdownView
                  appointments={appointments}
                  dentists={dentists}
                  userRole={userProfile?.role}
                  onBookSlot={(dentistId, dateStr, timeStr) => {
                    setBookDentistId(dentistId);
                    setBookDate(dateStr);
                    setBookTime(timeStr);
                    if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                    setShowBookingModal(true);
                  }}
                  onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
                  onDelete={(id) => triggerConfirm('Delete Appointment', 'Are you sure you want to cancel and delete this appointment?', () => deleteAppointment(id))}
                  onTriggerReminder={(app) => handleTriggerReminder(app)}
                />
              ) : patientAppointmentView === 'calendar' ? (
                <AppointmentCalendarView
                  appointments={appointments}
                  bills={bills}
                  invoices={invoices}
                  userRole={userProfile?.role}
                  onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
                  onDelete={(id) => triggerConfirm('Delete Appointment', 'Are you sure you want to cancel and delete this appointment?', () => deleteAppointment(id))}
                  onTriggerReminder={(app) => handleTriggerReminder(app)}
                  onNewBookingForDate={(dateStr) => {
                    setBookDate(dateStr);
                    if (dentists.length > 0) setBookDentistId(dentists[0].uid);
                    if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                    setShowBookingModal(true);
                  }}
                />
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Active Appointments timeline (Left & center) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2 font-display">
                          <Activity className="h-5 w-5 text-revon-blue" />
                          <span>Real-Time Appointment Tracker</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-medium font-mono">Synced</span>
                      </div>

                  {appLoading ? (
                    <div className="text-center py-12 text-sm text-slate-400 font-medium">
                      <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-revon-blue" />
                      <span>Connecting...</span>
                    </div>
                  ) : myAppointments.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                      <Calendar className="h-12 w-12 mx-auto text-slate-300" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-700">No appointments scheduled</h4>
                        <p className="text-xs text-slate-400">Click "New Booking" to reserve your spot today.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6">
                        {myAppointments
                          .slice((patientAppointmentsPage - 1) * patientAppointmentsPageSize, patientAppointmentsPage * patientAppointmentsPageSize)
                          .map((app) => {
                          const matchingBill = bills.find(b => b.id === app.id);
                          const matchingInvoice = invoices.find(inv => inv.appointmentId === app.id);
                          return (
                            <div key={app.id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 hover:shadow-sm transition-all space-y-4 bg-white">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
                                <div>
                                  <span className="text-xs font-bold text-revon-blue bg-blue-50 px-2.5 py-1 rounded-full uppercase font-mono">
                                    {app.treatment}
                                  </span>
                                  <h4 className="font-bold text-base text-slate-900 mt-2 font-display">{app.dentistName}</h4>
                                  
                                  {/* Clinic & Branch Info */}
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                                      <Building2 className="h-3.5 w-3.5 text-revon-blue shrink-0" />
                                      <span className="font-semibold">{app.clinicName || (clinics.find(c => c.id === app.clinicId || c.slug === app.clinicSlug)?.name) || activeClinic?.name || 'Clinic'}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
                                      <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                      <span className="font-semibold">{app.locationName || activeClinic?.locations?.[0]?.name || 'Main Branch'}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-500 font-mono flex items-center justify-end space-x-1">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{new Date(app.dateTime).toLocaleString()}</span>
                                  </div>
                                  <div className="mt-1 flex items-center justify-end gap-2 flex-wrap">
                                    {matchingBill && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                        matchingBill.status === 'collected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {matchingBill.status === 'collected' ? 'Receipt Generated' : 'Billing Drafted'}
                                      </span>
                                    )}
                                    {matchingInvoice && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                        matchingInvoice.status === 'collected' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        Invoice: {matchingInvoice.invoiceNumber} ({matchingInvoice.status === 'collected' ? 'Paid' : 'Pending'})
                                      </span>
                                    )}
                                    {getStatusBadge(app.status)}
                                  </div>
                                </div>
                              </div>

                              {/* Micro Real-Time Progress Tracker */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                  <span className={app.status === 'pending' || app.status === 'confirmed' || app.status === 'completed' ? 'text-slate-900' : ''}>1. Booked</span>
                                  <span className={app.status === 'confirmed' || app.status === 'completed' ? 'text-slate-900' : ''}>2. Confirmed</span>
                                  <span className={app.status === 'completed' ? 'text-slate-900 font-bold' : ''}>3. Completed</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ${app.status === 'cancelled' ? 'bg-rose-400 w-full' : 'bg-teal-500'}`}
                                    style={{ 
                                      width: app.status === 'pending' ? '33%' : app.status === 'confirmed' ? '66%' : app.status === 'completed' ? '100%' : '100%' 
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {app.notes && (
                                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                                  <span className="font-bold block text-slate-700">Patient Notes:</span>
                                  <p className="mt-0.5">{app.notes}</p>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-2">
                                <div className="flex flex-wrap gap-2">
                                  {matchingBill && (
                                    <button
                                      onClick={() => {
                                        setViewedBillForReceipt(matchingBill);
                                        setShowReceiptDetailModal(true);
                                      }}
                                      className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1 cursor-pointer bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      <span>View Detailed Breakup (Gloves, Equipment, Consultation)</span>
                                    </button>
                                  )}

                                  {matchingInvoice && (
                                    <button
                                      onClick={() => {
                                        setViewedInvoiceForReceipt(matchingInvoice);
                                        setShowInvoiceDetailModal(true);
                                      }}
                                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                      <span>View Treatment Invoice ({matchingInvoice.invoiceNumber})</span>
                                    </button>
                                  )}

                                  {userProfile?.role === 'patient' && (app.status === 'completed' || app.status === 'confirmed') && (
                                    <button
                                      id={`review-app-${app.id}`}
                                      onClick={() => {
                                        setPatientReviewTreatment(app.treatment || '');
                                        setPatientReviewRating(5);
                                        setPatientReviewComment('');
                                        setPatientReviewError(null);
                                        setPatientReviewSuccess(false);
                                        setShowPatientReviewModal(true);
                                      }}
                                      className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                                    >
                                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                      <span>Rate & Review Visit</span>
                                    </button>
                                  )}

                                  {!matchingBill && !matchingInvoice && (
                                    <span className="text-[11px] text-slate-400 italic">No breakdown generated yet</span>
                                  )}
                                </div>

                                {app.status === 'pending' && (
                                  <button
                                    id={`cancel-btn-${app.id}`}
                                    onClick={() => triggerConfirm(
                                      'Cancel Appointment',
                                      'Are you sure you want to cancel this appointment?',
                                      () => updateAppointmentStatus(app.id, 'cancelled')
                                    )}
                                    className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 cursor-pointer"
                                  >
                                    Cancel Appointment
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                        <PaginationControls
                          currentPage={patientAppointmentsPage}
                          pageSize={patientAppointmentsPageSize}
                          totalItems={myAppointments.length}
                          onPageChange={(p) => setPatientAppointmentsPage(p)}
                          onPageSizeChange={(sz) => {
                            setPatientAppointmentsPageSize(sz);
                            setPatientAppointmentsPage(1);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Smart Automated Reminders received (Right side panel) */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2 mb-4 font-display">
                    <Mail className="h-5 w-5 text-revon-blue" />
                    <span>Automated Reminders</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Below are real-time simulation logs of active automated updates dispatched to your registered address:
                  </p>

                  <div className="space-y-4">
                    {reminderLogs
                      .filter((log) => log.patientEmail === userProfile.email)
                      .slice((patientRemindersPage - 1) * patientRemindersPageSize, patientRemindersPage * patientRemindersPageSize)
                      .map((log) => (
                        <div key={log.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-teal-600 font-mono">
                            <span className={log.status === 'failed' ? 'text-red-600' : 'text-teal-600'}>
                              {log.status === 'failed' ? 'EMAIL TRANSMISSION FAILED' : 'EMAIL SENT SUCCESS'}
                            </span>
                            <span>{new Date(log.sentAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-mono leading-relaxed">
                            {log.details || 'Your dental appointment status has been successfully updated.'}
                          </p>
                          {log.previewUrl && (
                            <div className="pt-1">
                              <a 
                                href={log.previewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center space-x-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-all border border-teal-100 shadow-sm active:scale-95"
                              >
                                <span>Open Real-time Email Preview ↗</span>
                              </a>
                            </div>
                          )}
                          <div className="text-[9px] text-slate-400">Recipient: {userProfile?.displayName || 'Patient'}</div>
                        </div>
                      ))}

                    {reminderLogs.filter((log) => log.patientEmail === userProfile.email).length === 0 && (
                      <div className="text-center py-8 text-xs text-gray-400">
                        <span>No automated reminders logged yet.</span>
                      </div>
                    )}

                    {reminderLogs.filter((log) => log.patientEmail === userProfile.email).length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <PaginationControls
                          currentPage={patientRemindersPage}
                          pageSize={patientRemindersPageSize}
                          totalItems={reminderLogs.filter((log) => log.patientEmail === userProfile.email).length}
                          onPageChange={(p) => setPatientRemindersPage(p)}
                          onPageSizeChange={(sz) => {
                            setPatientRemindersPageSize(sz);
                            setPatientRemindersPage(1);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
            </div>
          )}
          {patientTab === 'billing' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2 font-display">
                  <DollarSign className="h-5 w-5 text-revon-blue" />
                  <span>My Financial Records</span>
                </h3>
                
                {/* Sub-tabs selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setPatientBillingSubTab('invoices')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      patientBillingSubTab === 'invoices'
                        ? 'bg-white text-revon-blue shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Treatment Invoices ({invoices.length})
                  </button>
                  <button
                    onClick={() => setPatientBillingSubTab('bills')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      patientBillingSubTab === 'bills'
                        ? 'bg-white text-revon-blue shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Legacy Stock Bills ({bills.length})
                  </button>
                </div>
              </div>

              {patientBillingSubTab === 'invoices' ? (
                loadingInvoices ? (
                  <div className="text-center py-12 text-sm text-slate-400 font-medium">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-revon-blue" />
                    <span>Loading your treatment invoices...</span>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold">No treatment invoices found.</p>
                    <p className="text-xs mt-1">When the clinic issues formal itemized invoices for your treatments, they will appear here.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      {invoices
                        .slice((patientInvoicesPage - 1) * patientInvoicesPageSize, patientInvoicesPage * patientInvoicesPageSize)
                        .map((inv) => (
                        <div key={inv.id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all bg-white shadow-sm flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">INVOICE: {inv.invoiceNumber}</span>
                                <h4 className="font-bold text-slate-800 font-display mt-0.5">{inv.treatmentName}</h4>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono border ${
                                inv.status === 'collected' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {inv.status === 'collected' ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600">
                              <div>Clinician:</div>
                              <div className="text-right font-semibold text-slate-900">{inv.dentistName}</div>
                              <div>Date Issued:</div>
                              <div className="text-right font-semibold text-slate-900">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</div>
                              <div>Total Amount:</div>
                              <div className="text-right font-bold text-slate-900 text-sm">₹{inv.totalAmount.toLocaleString()}</div>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setViewedInvoiceForReceipt(inv);
                                setShowInvoiceDetailModal(true);
                              }}
                              className="text-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-revon-blue transition-all cursor-pointer"
                            >
                              Breakdown
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintInvoice(inv)}
                              className="text-center px-3 py-2 bg-revon-blue text-white rounded-xl text-xs font-bold hover:bg-revon-blue/90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Print
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-slate-100 mt-6">
                      <PaginationControls
                        currentPage={patientInvoicesPage}
                        pageSize={patientInvoicesPageSize}
                        totalItems={invoices.length}
                        onPageChange={(p) => setPatientInvoicesPage(p)}
                        onPageSizeChange={(sz) => {
                          setPatientInvoicesPageSize(sz);
                          setPatientInvoicesPage(1);
                        }}
                      />
                    </div>
                  </>
                )
              ) : (
                loadingBills ? (
                  <div className="text-center py-12 text-sm text-slate-400 font-medium font-sans">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-revon-blue" />
                    <span>Connecting to database...</span>
                  </div>
                ) : bills.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold">No treatment bills found.</p>
                    <p className="text-xs mt-1">Once your doctor completes the session and lists stocks/equipment used, bills will appear here.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      {bills
                        .slice((patientBillsPage - 1) * patientBillsPageSize, patientBillsPage * patientBillsPageSize)
                        .map((bill) => (
                        <div key={bill.id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all bg-white shadow-sm flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">BILL ID: {bill.id}</span>
                                <h4 className="font-bold text-slate-800 font-display mt-0.5">{bill.treatmentName}</h4>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase font-mono border ${
                                bill.status === 'collected' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {bill.status === 'collected' ? 'Paid' : 'Pending Payment'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600">
                              <div>Dentist:</div>
                              <div className="text-right font-semibold text-slate-900">{bill.dentistName}</div>
                              <div>Total Amount:</div>
                              <div className="text-right font-bold text-slate-900 text-sm">₹{bill.totalAmount}</div>
                              {bill.paymentMode && (
                                <>
                                  <div>Payment Mode:</div>
                                  <div className="text-right font-semibold text-teal-600 uppercase">{bill.paymentMode}</div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setViewedBillForReceipt(bill);
                                setShowReceiptDetailModal(true);
                              }}
                              className="w-full text-center px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-revon-blue transition-all cursor-pointer"
                            >
                              View Breakdown Receipt
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-slate-100 mt-6">
                      <PaginationControls
                        currentPage={patientBillsPage}
                        pageSize={patientBillsPageSize}
                        totalItems={bills.length}
                        onPageChange={(p) => setPatientBillsPage(p)}
                        onPageSizeChange={(sz) => {
                          setPatientBillsPageSize(sz);
                          setPatientBillsPage(1);
                        }}
                      />
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {patientTab === 'dependents' && (
            <div className="space-y-6 animate-fadeIn font-sans">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2 font-display">
                      <Users className="h-5 w-5 text-revon-blue" />
                      <span>My Family Members & Dependents</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Add children, spouse, or relatives to schedule and manage their dental health journeys under your primary account.</p>
                  </div>
                  <button
                    onClick={() => {
                      setDependentTargetPatientId(userProfile.uid);
                      setShowAddDependentModal(true);
                    }}
                    className="px-4 py-2 bg-revon-blue text-white rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all cursor-pointer flex items-center space-x-1 shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Family Member</span>
                  </button>
                </div>

                {!userProfile.dependents || userProfile.dependents.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                    <Users className="h-12 w-12 mx-auto text-slate-300" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-700">No family profiles added</h4>
                      <p className="text-xs text-slate-400">Add dependents like children or relatives to book appointments for them easily.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDependentTargetPatientId(userProfile.uid);
                        setShowAddDependentModal(true);
                      }}
                      className="px-5 py-2.5 bg-revon-blue text-white rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register First Family Member</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userProfile.dependents
                        .slice((patientDependentsPage - 1) * patientDependentsPageSize, patientDependentsPage * patientDependentsPageSize)
                        .map((dep) => {
                        const depApps = appointments.filter(a => a.patientName === dep.name);
                        return (
                          <div key={dep.id} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-xs hover:border-slate-200 hover:shadow-sm transition-all space-y-4 relative group">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-md font-mono">
                                  {dep.relationship}
                                </span>
                                <h4 className="font-bold text-slate-900 font-display text-base mt-1">{dep.name}</h4>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerConfirm(
                                      "Remove Family Member",
                                      `Are you sure you want to remove ${dep.name} (${dep.relationship}) from your family account?`,
                                      () => handleRemoveDependent(userProfile.uid, dep.id)
                                    );
                                  }}
                                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remove family member"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <div className="h-8 w-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                  {dep.name[0]}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-500 font-sans border-t border-slate-50 pt-3">
                              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 font-medium">
                                <Shield className="h-3 w-3 text-emerald-500" />
                                <span>Status: Verified Family Member</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-[11px]">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>Bookings: <strong>{depApps.length}</strong> scheduled</span>
                              </div>
                            </div>

                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => {
                                  setBookForDependentId(dep.id);
                                  setBookPatientName(dep.name);
                                  setBookPatientPhone(dep.phone || userProfile.phone || '');
                                  setBookPatientEmail(dep.email || userProfile.email || '');
                                  if (dentists.length > 0) setBookDentistId(dentists[0].uid);
                                  if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                                  setShowBookingModal(true);
                                }}
                                className="flex-1 text-center py-1.5 bg-blue-50 hover:bg-revon-blue hover:text-white transition-all text-xs font-bold text-revon-blue rounded-xl cursor-pointer"
                              >
                                Book Appointment
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-6 border-t border-slate-100 mt-6">
                      <PaginationControls
                        currentPage={patientDependentsPage}
                        pageSize={patientDependentsPageSize}
                        totalItems={userProfile.dependents.length}
                        onPageChange={(p) => setPatientDependentsPage(p)}
                        onPageSizeChange={(sz) => {
                          setPatientDependentsPageSize(sz);
                          setPatientDependentsPage(1);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {patientTab === 'support' && (
            <div className="animate-fadeIn">
              <SupportSystem />
            </div>
          )}

          {patientTab === 'surgeons' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                <div className="max-w-2xl mb-8">
                  <h3 className="font-bold text-slate-900 text-xl font-display flex items-center space-x-2">
                    <Award className="h-5.5 w-5.5 text-amber-500" />
                    <span>Meet Our Board-Certified Surgeons</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Our clinical practitioners are recognized specialists with elite medical qualifications, committed to precision care, pain-free procedures, and your lasting comfort.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {surgeons
                    .filter(doc => doc.isActive)
                    .slice((patientSurgeonsPage - 1) * patientSurgeonsPageSize, patientSurgeonsPage * patientSurgeonsPageSize)
                    .map((doc) => {
                    const nameParts = doc.displayName.split(' ');
                    const initials = nameParts.length > 1 
                      ? (nameParts[1]?.[0] || 'D') + (nameParts[2]?.[0] || '')
                      : doc.displayName.substring(0, 2).toUpperCase();
                    return (
                      <div key={doc.id} className="bg-slate-50/50 hover:bg-white rounded-2xl p-6 border border-slate-100 hover:border-revon-blue hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div className="h-12 w-12 bg-revon-blue/10 text-revon-blue rounded-full flex items-center justify-center text-md font-bold shadow-sm group-hover:scale-105 transition-transform">
                              {initials}
                            </div>
                            {doc.isBoardCertified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                <Award className="h-3 w-3 mr-1 text-amber-500" />
                                Board Certified
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold font-display text-slate-900">{doc.displayName}</h4>
                            <p className="text-[11px] text-revon-blue font-semibold">{doc.specialty}</p>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans">
                            {doc.bio}
                          </p>

                          {/* Consultation Timing Display */}
                          <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-2.5 mt-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consultation Hours</div>
                            <div className="text-xs font-semibold text-emerald-700 mt-0.5">{doc.consultationTiming || 'Mon - Fri: 09:00 AM - 05:00 PM'}</div>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                          <div className="text-[10px] text-slate-400 font-mono">
                            Status: <span className="text-emerald-600 font-medium font-sans">Available for Booking</span>
                          </div>
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                // Try to find a matching registered dentist in state
                                const matchedDentist = dentists.find(d => 
                                  d.displayName.toLowerCase().includes(doc.displayName.split(' ')[1]?.toLowerCase() || '')
                                );
                                if (matchedDentist) {
                                  setBookDentistId(matchedDentist.uid);
                                } else if (dentists.length > 0) {
                                  setBookDentistId(dentists[0].uid);
                                }
                                setBookForDependentId('myself');
                                setBookPatientName(userProfile?.displayName || '');
                                setBookPatientPhone(userProfile?.phone || '');
                                setBookPatientEmail(userProfile?.email || '');
                                if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                                setShowBookingModal(true);
                              }}
                              className="w-full text-center py-2 bg-revon-blue hover:bg-revon-blue-hover text-white transition-all text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Request Consultation
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <PaginationControls
                    currentPage={patientSurgeonsPage}
                    pageSize={patientSurgeonsPageSize}
                    totalItems={surgeons.filter(doc => doc.isActive).length}
                    onPageChange={(p) => setPatientSurgeonsPage(p)}
                    onPageSizeChange={(sz) => {
                      setPatientSurgeonsPageSize(sz);
                      setPatientSurgeonsPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. DENTIST & RECEPTIONIST WORKSPACE */}
      {/* ===================================================================== */}
      {userProfile && userProfile.role !== 'patient' && (
        <div className="space-y-6">
          
          {/* Clinic staff mini tab selector */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
            {/* 1. Executive Analytics & KPIs Tab (First Tab) */}
            {(permissions.finances?.includes(userProfile.role) || permissions.billing?.includes(userProfile.role) || isAdminOrSuper) && (
              <button
                id="staff-tab-analytics"
                onClick={() => handleStaffTabChange('analytics')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center space-x-1.5 ${
                  staffTab === 'analytics' ? 'border-revon-blue text-revon-blue dark:text-teal-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-revon-blue'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 text-revon-blue dark:text-teal-400" />
                <span>Analytics & KPIs</span>
              </button>
            )}
            {/* 2. Appointments Monitor */}
            {activeClinic?.features?.appointments !== false && (permissions.appointments?.includes(userProfile.role) || isAdminOrSuper) && (
              <button
                id="staff-tab-appointments"
                onClick={() => handleStaffTabChange('appointments')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                  staffTab === 'appointments' ? 'border-revon-blue text-slate-900 dark:text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Appointments Monitor
              </button>
            )}
            {activeClinic?.features?.reminders !== false && (permissions.reminders?.includes(userProfile.role) || isAdminOrSuper) && (
              <button
                id="staff-tab-reminders"
                onClick={() => handleStaffTabChange('reminders')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                  staffTab === 'reminders' ? 'border-revon-blue text-slate-900 dark:text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Automated Email Logs
              </button>
            )}
            {(permissions.patients?.includes(userProfile.role) || isAdminOrSuper) && (
              <button
                id="staff-tab-patients"
                onClick={() => handleStaffTabChange('patients')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                  staffTab === 'patients' ? 'border-revon-blue text-slate-900 dark:text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Patient Directory
              </button>
            )}
            {activeClinic?.features?.billing !== false && (permissions.billing?.includes(userProfile.role) || isAdminOrSuper) && (
              <button
                id="staff-tab-billing"
                onClick={() => handleStaffTabChange('billing')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center space-x-1 ${
                  staffTab === 'billing' ? 'border-revon-blue text-slate-900 dark:text-white font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5 text-revon-blue" />
                <span>Billing & Receipts</span>
              </button>
            )}
            {/* Finances & Expenses Tab */}
            {activeClinic?.features?.finances !== false && (permissions.finances?.includes(userProfile.role) || isAdminOrSuper) && (
              <button
                id="staff-tab-finances"
                onClick={() => handleStaffTabChange('finances')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center space-x-1.5 ${
                  staffTab === 'finances' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-emerald-500'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>Finances & Expenses</span>
              </button>
            )}
            {/* Patient Reviews Tab */}
            {activeClinic?.features?.reviews !== false && (permissions.reviews?.includes(userProfile.role) || isAdminOrSuper) && (
              <button
                id="staff-tab-reviews"
                onClick={() => handleStaffTabChange('reviews')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center space-x-1.5 ${
                  staffTab === 'reviews' ? 'border-amber-600 text-amber-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-amber-500'
                }`}
              >
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>Patient Reviews</span>
              </button>
            )}
            {isAdminOrSuper && (
              <button
                id="staff-tab-admin"
                onClick={() => handleStaffTabChange('admin')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center space-x-1 ${
                  staffTab === 'admin' ? 'border-amber-600 text-amber-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-amber-500'
                }`}
              >
                <Shield className="h-3.5 w-3.5 text-amber-500" />
                <span>Admin Portal</span>
              </button>
            )}
            {activeClinic?.features?.supportSystem !== false && (
              <button
                id="staff-tab-support"
                onClick={() => handleStaffTabChange('support')}
                className={`pb-4 px-3 sm:px-6 font-bold text-xs border-b-2 cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center space-x-1 ${
                  staffTab === 'support' ? 'border-teal-600 text-teal-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-teal-500'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-teal-500" />
                <span>Support & Notices</span>
              </button>
            )}
          </div>

          {/* TAB 0: EXECUTIVE ANALYTICS & KPIS PANEL (FIRST TAB) */}
          {staffTab === 'analytics' && (permissions.finances?.includes(userProfile.role) || permissions.billing?.includes(userProfile.role) || isAdminOrSuper) && (
            <div className="animate-fadeIn">
              <ExecutiveAnalyticsDashboard userProfile={userProfile} onNavigateTab={handleStaffTabChange} />
            </div>
          )}

          {/* TAB 1: APPOINTMENTS PANEL */}
          {staffTab === 'appointments' && activeClinic?.features?.appointments !== false && (permissions.appointments?.includes(userProfile.role) || userProfile.role === 'admin' || userProfile.role === 'super-admin' || userProfile.isSuperAdmin) && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Real-time Clinic Live Status & Doctor Availability Quick-Toggle Bar */}
              <ClinicLiveStatusBar />
              
              {/* Filter controls */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 grid md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center">
                    <Search className="h-3 w-3 mr-1 text-revon-blue" />
                    Search appointments
                  </label>
                  <input
                    id="staff-search-input"
                    type="text"
                    placeholder="Search name, treatment..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs focus:outline-none text-slate-800 bg-[#F8FAFC]"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center">
                    <Filter className="h-3 w-3 mr-1 text-revon-blue" />
                    Status
                  </label>
                  <select
                    id="staff-status-filter"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs focus:outline-none text-slate-800 bg-[#F8FAFC] cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center">
                    <User className="h-3 w-3 mr-1 text-revon-blue" />
                    Specialist dentist
                  </label>
                  <select
                    id="staff-dentist-filter"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs focus:outline-none text-slate-800 bg-[#F8FAFC] cursor-pointer"
                    value={dentistFilter}
                    onChange={(e) => { setDentistFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="all">All Specialists</option>
                    {dentists.map(d => (
                      <option key={d.uid} value={d.uid}>{d.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center">
                    <ListOrdered className="h-3 w-3 mr-1 text-revon-blue" />
                    Sorting
                  </label>
                  <select
                    id="staff-sort"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs focus:outline-none text-slate-800 bg-[#F8FAFC] cursor-pointer font-medium"
                    value={sortKey}
                    onChange={(e) => {
                      setSortKey(e.target.value as any);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="dateTime-desc">Scheduled Date (Newest First / Descending)</option>
                    <option value="dateTime-asc">Scheduled Date (Oldest First / Ascending)</option>
                    <option value="patientName-asc">Patient Name (A to Z)</option>
                    <option value="patientName-desc">Patient Name (Z to A)</option>
                    <option value="treatment-asc">Treatment (A to Z)</option>
                    <option value="dentistName-asc">Specialist Dentist (A to Z)</option>
                    <option value="status-asc">Status (Pending / Confirmed / Completed)</option>
                  </select>
                </div>
              </div>

              {/* Real-Time Queue Monitor */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/80">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-slate-900 text-sm font-display">Real-Time Patient Queues</h3>
                    <span className="text-[10px] font-bold text-revon-blue bg-blue-50 px-2.5 py-1 rounded-full uppercase font-mono">
                      Count: {filteredAppointments.length}
                    </span>
                  </div>

                  {/* View Mode Switcher: List vs Calendar vs Slot Availability */}
                  <div className="flex bg-slate-200 p-1 rounded-xl text-xs">
                    <button
                      id="view-mode-list-btn"
                      onClick={() => setStaffAppointmentView('list')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        staffAppointmentView === 'list'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                      <span>List View</span>
                    </button>
                    <button
                      id="view-mode-calendar-btn"
                      onClick={() => setStaffAppointmentView('calendar')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        staffAppointmentView === 'calendar'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Calendar View</span>
                    </button>
                    <button
                      id="view-mode-slots-btn"
                      onClick={() => setStaffAppointmentView('slots')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        staffAppointmentView === 'slots'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Slot Availability</span>
                    </button>
                  </div>
                </div>

                {staffAppointmentView === 'slots' ? (
                  <div className="p-4">
                    <DentistSlotBreakdownView
                      appointments={appointments}
                      dentists={dentists}
                      userRole={userProfile?.role}
                      onBookSlot={(dentistId, dateStr, timeStr) => {
                        setBookDentistId(dentistId);
                        setBookDate(dateStr);
                        setBookTime(timeStr);
                        if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                        setShowBookingModal(true);
                      }}
                      onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
                      onDelete={(id) => triggerConfirm('Delete Appointment', 'Are you sure you want to permanently delete this appointment?', () => deleteAppointment(id))}
                      onTriggerReminder={(app) => handleTriggerReminder(app)}
                    />
                  </div>
                ) : staffAppointmentView === 'calendar' ? (
                  <div className="p-4">
                    <AppointmentCalendarView
                      appointments={filteredAppointments}
                      bills={bills}
                      invoices={invoices}
                      userRole={userProfile?.role}
                      onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
                      onDelete={(id) => triggerConfirm(
                        'Delete Appointment',
                        'Are you sure you want to permanently delete this appointment? This action cannot be undone.',
                        () => deleteAppointment(id)
                      )}
                      onTriggerReminder={(app) => handleTriggerReminder(app)}
                      onDraftBill={(app) => handleOpenAddBill(app)}
                      onAddBill={(app) => handleOpenAddBill(app)}
                      onEditBill={(app, b, inv) => handleOpenEditBill(app, b, inv)}
                      onDeleteBill={(app, b, inv) => handleDeleteBillForAppointment(app, b, inv)}
                      onNewBookingForDate={(dateStr) => {
                        setBookDate(dateStr);
                        if (dentists.length > 0) setBookDentistId(dentists[0].uid);
                        if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                        setShowBookingModal(true);
                      }}
                    />
                  </div>
                ) : appLoading ? (
                  <div className="text-center py-20 text-slate-400">
                    <RefreshCw className="h-8 w-8 mx-auto animate-spin text-revon-blue mb-2" />
                    <span className="text-xs">Connecting to Firebase...</span>
                  </div>
                ) : paginatedAppointments.length === 0 ? (
                  <div className="text-center py-20 text-xs text-slate-400">
                    No matching appointments found.
                  </div>
                ) : (
                  <div>
                    {/* Interactive Column Headers with Clickable Sorting */}
                    <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-3 hidden md:grid grid-cols-4 gap-4 text-[11px] font-bold uppercase font-mono text-slate-600">
                      <button
                        onClick={() => handleColumnSort('patientName')}
                        className="flex items-center space-x-1 hover:text-revon-blue transition-colors text-left cursor-pointer group"
                        title="Click to sort by Patient Name"
                      >
                        <span>Patient Details</span>
                        {sortKey.startsWith('patientName') ? (
                          sortKey.endsWith('-asc') ? <ChevronUp className="h-3.5 w-3.5 text-revon-blue font-bold" /> : <ChevronDown className="h-3.5 w-3.5 text-revon-blue font-bold" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleColumnSort('treatment')}
                          className="flex items-center space-x-1 hover:text-revon-blue transition-colors cursor-pointer group"
                          title="Click to sort by Treatment"
                        >
                          <span>Treatment</span>
                          {sortKey.startsWith('treatment') ? (
                            sortKey.endsWith('-asc') ? <ChevronUp className="h-3.5 w-3.5 text-revon-blue font-bold" /> : <ChevronDown className="h-3.5 w-3.5 text-revon-blue font-bold" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                        <span>/</span>
                        <button
                          onClick={() => handleColumnSort('dentistName')}
                          className="flex items-center space-x-1 hover:text-revon-blue transition-colors cursor-pointer group"
                          title="Click to sort by Dentist"
                        >
                          <span>Dentist</span>
                          {sortKey.startsWith('dentistName') ? (
                            sortKey.endsWith('-asc') ? <ChevronUp className="h-3.5 w-3.5 text-revon-blue font-bold" /> : <ChevronDown className="h-3.5 w-3.5 text-revon-blue font-bold" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleColumnSort('dateTime')}
                          className="flex items-center space-x-1 hover:text-revon-blue transition-colors cursor-pointer group"
                          title="Click to sort by Scheduled Date"
                        >
                          <span>Scheduled Date</span>
                          {sortKey.startsWith('dateTime') ? (
                            sortKey.endsWith('-asc') ? <ChevronUp className="h-3.5 w-3.5 text-revon-blue font-bold" /> : <ChevronDown className="h-3.5 w-3.5 text-revon-blue font-bold" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                        <button
                          onClick={() => handleColumnSort('status')}
                          className="flex items-center space-x-1 hover:text-revon-blue transition-colors cursor-pointer group pr-2"
                          title="Click to sort by Status"
                        >
                          <span>Status</span>
                          {sortKey.startsWith('status') ? (
                            sortKey.endsWith('-asc') ? <ChevronUp className="h-3.5 w-3.5 text-revon-blue font-bold" /> : <ChevronDown className="h-3.5 w-3.5 text-revon-blue font-bold" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>

                      <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                    {paginatedAppointments.map((app) => {
                      const matchingBill = bills.find(b => b.id === app.id || b.appointmentId === app.id);
                      const matchingInvoice = invoices.find(inv => inv.appointmentId === app.id);
                      const hasBillOrInvoice = !!(matchingBill || matchingInvoice);
                      const isStaff = userProfile?.role === 'dentist' || userProfile?.role === 'admin' || userProfile?.role === 'super-admin' || userProfile?.role === 'receptionist' || userProfile?.isSuperAdmin;

                      return (
                        <div key={app.id} className="p-5 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors grid md:grid-cols-4 gap-4 items-center">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm font-display">{app.patientName}</h4>
                            <p className="text-[11px] text-slate-500 font-mono">{app.patientEmail}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{app.patientPhone}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-revon-blue dark:text-blue-300 px-2.5 py-0.5 rounded-full uppercase font-mono">
                              {app.treatment}
                            </span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{app.dentistName}</p>

                            {/* Clinic & Branch Info */}
                            <div className="flex flex-wrap items-center gap-1.5 my-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-200 font-mono text-[10px] border border-slate-200/60 dark:border-slate-700">
                                <Building2 className="h-3 w-3 text-revon-blue shrink-0" />
                                <span className="truncate max-w-[120px]">{app.clinicName || (clinics.find(c => c.id === app.clinicId || c.slug === app.clinicSlug)?.name) || activeClinic?.name || 'Clinic'}</span>
                              </span>
                              <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300 font-mono text-[10px] border border-amber-200/60 dark:border-amber-800/40">
                                <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[110px]">{app.locationName || activeClinic?.locations?.[0]?.name || 'Main Branch'}</span>
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center font-mono">
                              <Clock className="h-3 w-3 mr-1 text-slate-400" />
                              {new Date(app.dateTime).toLocaleString()}
                            </div>
                          </div>

                          <div className="text-left md:text-center space-y-2">
                            <div>{getStatusBadge(app.status)}</div>
                            
                            {/* Bill/Invoice status indicators with interactive preview */}
                            <div className="flex flex-col gap-1.5 items-start md:items-center justify-center">
                              {matchingBill && (
                                <button
                                  type="button"
                                  onClick={() => handleViewReceipt(app, matchingBill, matchingInvoice)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 font-mono ${
                                    matchingBill.status === 'collected' 
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                  }`}
                                  title="Click to view itemized breakdown receipt"
                                >
                                  <Receipt className="h-3 w-3 shrink-0" />
                                  <span>Bill: {matchingBill.status === 'collected' ? `₹${matchingBill.totalAmount} (Paid)` : `₹${matchingBill.totalAmount} (Pending)`}</span>
                                </button>
                              )}
                              
                              {matchingInvoice && (
                                <button
                                  type="button"
                                  onClick={() => handleViewReceipt(app, matchingBill, matchingInvoice)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 font-mono ${
                                    matchingInvoice.status === 'collected' 
                                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' 
                                      : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
                                  }`}
                                  title="Click to view formal invoice breakdown"
                                >
                                  <FileText className="h-3 w-3 shrink-0" />
                                  <span>Inv #{matchingInvoice.invoiceNumber}: ₹{matchingInvoice.totalAmount}</span>
                                </button>
                              )}

                              {!hasBillOrInvoice && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                  No Bill Generated
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Real-time actions trigger panel */}
                          <div className="flex flex-wrap gap-1.5 md:justify-end items-center">
                            {app.status === 'pending' && (
                              <button
                                id={`confirm-btn-${app.id}`}
                                onClick={() => triggerConfirm(
                                  'Confirm Appointment',
                                  `Are you sure you want to confirm the appointment for ${app.patientName}?`,
                                  () => updateAppointmentStatus(app.id, 'confirmed')
                                )}
                                className="text-[10px] font-bold bg-revon-blue text-white px-2.5 py-1.5 rounded-xl hover:bg-opacity-90 cursor-pointer shadow-sm shadow-revon-blue/10"
                              >
                                Confirm
                              </button>
                            )}
                            
                            {app.status === 'confirmed' && (
                              <button
                                id={`complete-btn-${app.id}`}
                                onClick={() => triggerConfirm(
                                  'Complete Appointment',
                                  `Mark appointment for ${app.patientName} as completed?`,
                                  () => updateAppointmentStatus(app.id, 'completed')
                                )}
                                className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl hover:bg-emerald-700 cursor-pointer shadow-sm shadow-emerald-100"
                              >
                                Done
                              </button>
                            )}

                            {/* Staff Bill Operations: Add / Edit / Delete */}
                            {isStaff && (
                              <>
                                {!hasBillOrInvoice ? (
                                  <button
                                    id={`add-bill-btn-${app.id}`}
                                    onClick={() => handleOpenAddBill(app)}
                                    className="text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1.5 rounded-xl cursor-pointer shadow-sm flex items-center space-x-1 transition-all"
                                    title="Add new Bill & Invoice for this appointment"
                                  >
                                    <Receipt className="h-3 w-3" />
                                    <span>+ Add Bill</span>
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      id={`edit-bill-btn-${app.id}`}
                                      onClick={() => handleOpenEditBill(app, matchingBill || null, matchingInvoice || null)}
                                      className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-xl cursor-pointer shadow-sm flex items-center space-x-1 transition-all"
                                      title="Edit Bill, Items, Payment status"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      <span>Edit Bill</span>
                                    </button>

                                    <button
                                      id={`delete-bill-btn-${app.id}`}
                                      onClick={() => handleDeleteBillForAppointment(app, matchingBill || null, matchingInvoice || null)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer transition-colors border border-rose-200 dark:border-rose-800/60"
                                      title="Delete Bill & Invoice for this appointment"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {app.status !== 'cancelled' && app.status !== 'completed' && (
                              <button
                                id={`cancel-btn-staff-${app.id}`}
                                onClick={() => triggerConfirm(
                                  'Cancel Appointment',
                                  `Are you sure you want to cancel the appointment for ${app.patientName}?`,
                                  () => updateAppointmentStatus(app.id, 'cancelled')
                                )}
                                className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2.5 py-1.5 rounded-xl hover:bg-rose-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                            
                            {/* Post-Op Care Instruction Dispatcher Button */}
                            {isStaff && (
                              <button
                                id={`post-op-btn-${app.id}`}
                                onClick={() => setSelectedPostOpAppointment(app)}
                                className="text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1.5 rounded-xl cursor-pointer shadow-xs flex items-center space-x-1 transition-all"
                                title="Dispatch procedure post-op care instructions via WhatsApp"
                              >
                                <MessageSquare className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Post-Op</span>
                              </button>
                            )}

                            <button
                              id={`reminder-btn-${app.id}`}
                              onClick={() => handleTriggerReminder(app)}
                              disabled={triggeringReminderId === app.id}
                              className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1.5 rounded-xl hover:bg-slate-100 cursor-pointer inline-flex items-center space-x-1 transition-all"
                              title="Resend Automated Email Log"
                            >
                              <Send className="h-3 w-3 text-slate-400" />
                              <span>{triggeringReminderId === app.id ? 'Sending...' : 'Remind'}</span>
                            </button>

                            <button
                              id={`delete-btn-${app.id}`}
                              onClick={() => triggerConfirm(
                                'Delete Appointment',
                                `Are you sure you want to permanently delete the appointment for ${app.patientName}? This action cannot be undone.`,
                                () => deleteAppointment(app.id)
                              )}
                              className="text-[10px] p-2 text-slate-400 hover:text-rose-600 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* Pagination Controls */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <PaginationControls
                    currentPage={currentPage}
                    pageSize={itemsPerPage}
                    totalItems={filteredAppointments.length}
                    onPageChange={(p) => setCurrentPage(p)}
                    onPageSizeChange={(sz) => {
                      setItemsPerPage(sz);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REMINDERS LOG VIEW */}
          {staffTab === 'reminders' && activeClinic?.features?.reminders !== false && (permissions.reminders?.includes(userProfile.role) || userProfile.role === 'admin' || userProfile.role === 'super-admin' || userProfile.isSuperAdmin) && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-fadeIn">
              <div className="p-6 border-b border-slate-100 bg-slate-50/80">
                <h3 className="font-bold text-slate-900 text-sm font-display">Automated Email Notification Archives</h3>
                <p className="text-xs text-slate-500 mt-1">Real-time simulation audit logs of email dispatches triggered by system events.</p>
              </div>

              {reminderLogs.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-400">
                  No notifications recorded.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Recipient Email</th>
                          <th className="p-4">Trigger Details</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Delivery</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {reminderLogs
                          .slice((staffRemindersPage - 1) * staffRemindersPageSize, staffRemindersPage * staffRemindersPageSize)
                          .map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-4 font-mono text-slate-400 whitespace-nowrap">{new Date(log.sentAt).toLocaleString()}</td>
                            <td className="p-4 font-bold text-slate-800 font-display">{log.patientEmail}</td>
                            <td className="p-4 text-slate-600 font-mono max-w-sm truncate" title={log.details}>{log.details}</td>
                            <td className="p-4"><span className="uppercase text-[9px] font-bold bg-blue-50 text-revon-blue px-2 py-0.5 rounded-full font-mono">{log.type}</span></td>
                            <td className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                <span className={`inline-flex items-center text-[10px] font-bold ${log.status === 'failed' ? 'text-red-700 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'} px-2 py-0.5 rounded border`}>
                                  {log.status === 'failed' ? 'FAILED' : 'SUCCESS'}
                                </span>
                                {log.previewUrl && (
                                  <a 
                                    href={log.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline whitespace-nowrap inline-flex items-center gap-1"
                                  >
                                    <span>View Mail ↗</span>
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <PaginationControls
                      currentPage={staffRemindersPage}
                      pageSize={staffRemindersPageSize}
                      totalItems={reminderLogs.length}
                      onPageChange={(p) => setStaffRemindersPage(p)}
                      onPageSizeChange={(sz) => {
                        setStaffRemindersPageSize(sz);
                        setStaffRemindersPage(1);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: PATIENTS DIRECTORY */}
          {staffTab === 'patients' && (permissions.patients?.includes(userProfile.role) || userProfile.role === 'admin' || userProfile.role === 'super-admin' || userProfile.isSuperAdmin) && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-fadeIn">
              <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">Patient Directory</h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time database of self-registered clinic patients, their family dependents, and walk-in booking patients.</p>
                </div>
                <button
                  onClick={() => {
                    const patients = users.filter(u => u.role === 'patient');
                    if (patients.length > 0) {
                      setDependentTargetPatientId(patients[0].uid);
                    }
                    setShowAddDependentModal(true);
                  }}
                  className="px-4 py-2 bg-revon-blue text-white rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all cursor-pointer flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register Family Dependent</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patients by name, email, phone..."
                    value={patientSearchQuery}
                    onChange={(e) => {
                      setPatientSearchQuery(e.target.value);
                      setStaffPatientsPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-revon-blue focus:border-revon-blue text-slate-800"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
                  <div className="flex bg-slate-100 p-0.5 rounded-lg w-full sm:w-auto justify-between">
                    <button
                      onClick={() => { setPatientFilter('all'); setStaffPatientsPage(1); }}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        patientFilter === 'all'
                          ? 'bg-white text-revon-blue shadow-xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => { setPatientFilter('registered'); setStaffPatientsPage(1); }}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        patientFilter === 'registered'
                          ? 'bg-white text-revon-blue shadow-xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Self Registered
                    </button>
                    <button
                      onClick={() => { setPatientFilter('walk-in'); setStaffPatientsPage(1); }}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        patientFilter === 'walk-in'
                          ? 'bg-white text-revon-blue shadow-xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Walk-Ins
                    </button>
                  </div>
                </div>
              </div>

              {combinedPatientsList.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-400">
                  No clinic patients found matching your search or filters.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                          <th className="p-4">Patient Name & Family Dependents</th>
                          <th className="p-4">Registration Status</th>
                          <th className="p-4">Contact Email</th>
                          <th className="p-4">Contact Phone</th>
                          <th className="p-4 text-right">Relationship Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {combinedPatientsList
                          .slice((staffPatientsPage - 1) * staffPatientsPageSize, staffPatientsPage * staffPatientsPageSize)
                          .map((p) => (
                        <tr key={p.uid} className="hover:bg-slate-50/20 transition-all align-top">
                          <td className="p-4 space-y-2">
                            <div className="font-bold text-slate-900 flex items-center space-x-2 font-display">
                              <div className="h-7 w-7 rounded-full bg-blue-50 text-revon-blue flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                {p.displayName ? p.displayName[0] : 'P'}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">{p.displayName}</span>
                                <span className="text-[10px] font-mono text-slate-400 font-normal">
                                  {p.isRegistered ? 'Primary Patient' : 'Walk-In Record'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Dependents sub list */}
                            {p.isRegistered && p.dependents && p.dependents.length > 0 && (
                              <div className="pl-9 space-y-1.5 animate-fadeIn">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Associated Dependents:</div>
                                <div className="grid sm:grid-cols-2 gap-2">
                                  {p.dependents.map((dep) => (
                                    <div key={dep.id} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                                      <div>
                                        <div className="font-bold text-slate-800 text-[11px] font-display">{dep.name}</div>
                                        <div className="text-[9px] text-slate-400 font-mono">Phone: {dep.phone || 'Inherited'}</div>
                                      </div>
                                      <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-100 px-1.5 py-0.5 rounded-md font-mono">
                                        {dep.relationship}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 pt-5">
                            {p.isRegistered ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider font-mono">
                                Self Registered
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider font-mono">
                                Walk-In Booking
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-slate-600 pt-5">{p.email || 'N/A'}</td>
                          <td className="p-4 text-slate-600 font-mono pt-5">{p.phone || 'No Phone Registered'}</td>
                          <td className="p-4 text-right pt-5">
                            <div className="flex justify-end gap-1.5">
                              {p.isRegistered ? (
                                <button
                                  onClick={() => {
                                    setDependentTargetPatientId(p.uid);
                                    setShowAddDependentModal(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl transition-all cursor-pointer text-[10px] flex items-center space-x-1"
                                  title="Add family relative under this primary account"
                                >
                                  <Plus className="h-3 w-3 text-slate-400" />
                                  <span>Add Dependent</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic px-2 py-1.5 select-none hidden sm:inline-block">
                                  No dependents for walk-ins
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedPrimaryPatientId(p.isRegistered ? p.uid : '');
                                  setBookForDependentId('myself');
                                  setBookPatientName(p.displayName);
                                  setBookPatientPhone(p.phone || '');
                                  setBookPatientEmail(p.email || '');
                                  if (dentists.length > 0) setBookDentistId(dentists[0].uid);
                                  if (treatments.length > 0) setBookTreatmentId(treatments[0].id);
                                  setShowBookingModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-blue-50 text-revon-blue hover:bg-revon-blue hover:text-white font-bold rounded-xl transition-all cursor-pointer text-[10px] flex items-center space-x-1"
                              >
                                <span>Book Visit</span>
                              </button>
                              {(userProfile.role === 'admin' || userProfile.role === 'super-admin' || userProfile.isSuperAdmin || permissions.patientHistory?.includes(userProfile.role)) && (
                                <button
                                  onClick={() => {
                                    setHistoryPatient(p);
                                    setShowHistoryModal(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold rounded-xl transition-all cursor-pointer text-[10px] flex items-center space-x-1"
                                  title="View complete clinical and billing history"
                                >
                                  <History className="h-3 w-3" />
                                  <span>History</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <PaginationControls
                    currentPage={staffPatientsPage}
                    pageSize={staffPatientsPageSize}
                    totalItems={combinedPatientsList.length}
                    onPageChange={(p) => setStaffPatientsPage(p)}
                    onPageSizeChange={(sz) => {
                      setStaffPatientsPageSize(sz);
                      setStaffPatientsPage(1);
                    }}
                  />
                </div>
              </>
            )}
            </div>
          )}

          {/* TAB 4: CLINIC BILLING & RECEIPTS WORKSPACE */}
          {staffTab === 'billing' && activeClinic?.features?.billing !== false && (permissions.billing?.includes(userProfile.role) || userProfile.role === 'admin' || userProfile.role === 'super-admin' || userProfile.isSuperAdmin) && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Workspace Header */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg font-display flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-revon-blue" />
                    <span>Clinic Billing & Receipts Workspace</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Manage new itemized treatment invoices (with A4 PDF options) or view standard billing logs.</p>
                </div>
                
                {/* Sub-tab Toggle Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setBillingSubTab('invoices')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      billingSubTab === 'invoices' 
                        ? 'bg-white text-revon-blue shadow-xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Treatment Invoices (New)
                  </button>
                  <button
                    onClick={() => setBillingSubTab('bills')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      billingSubTab === 'bills' 
                        ? 'bg-white text-revon-blue shadow-xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Legacy Stock Bills Queue
                  </button>
                  <button
                    onClick={() => handleStaffTabChange('finances')}
                    className="ml-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center space-x-1.5 border border-emerald-200"
                    title="Open Monthly Earnings & Expenses Dashboard"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Earnings & Expenses</span>
                  </button>
                </div>
              </div>

              {billingSubTab === 'invoices' ? (
                <Billing userProfile={userProfile} />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-6">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/80">
                    <h3 className="font-bold text-slate-900 text-sm font-display">Treatment Billing & Stock Management Queue</h3>
                    <p className="text-xs text-slate-500 mt-1">Pending payments and itemized receipts generated by clinicians during procedure sessions.</p>
                  </div>

                  {loadingBills ? (
                    <div className="text-center py-20 text-slate-400">
                      <RefreshCw className="h-8 w-8 mx-auto animate-spin text-revon-blue mb-2" />
                      <span className="text-xs font-semibold">Updating Billing Records...</span>
                    </div>
                  ) : bills.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-400">
                      No billing records generated in Firestore yet.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                              <th className="p-4">Appt/Bill ID</th>
                              <th className="p-4">Patient Details</th>
                              <th className="p-4">Doctor & Treatment</th>
                              <th className="p-4">Grand Total</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {bills
                              .slice((staffBillsPage - 1) * staffBillsPageSize, staffBillsPage * staffBillsPageSize)
                              .map((bill) => (
                              <tr key={bill.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="p-4 font-mono text-slate-400">{bill.id.substring(0, 8)}...</td>
                                <td className="p-4 font-semibold text-slate-900 font-display">
                                  <div>{bill.patientName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono font-normal">{bill.patientEmail}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-slate-800">{bill.treatmentName}</div>
                                  <div className="text-[10px] text-slate-400">By: {bill.dentistName}</div>
                                </td>
                                <td className="p-4 font-bold text-slate-900 font-mono">₹{bill.totalAmount}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                    bill.status === 'collected' 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {bill.status === 'collected' ? `Collected (${bill.paymentMode})` : 'Pending Receipt'}
                                  </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  {bill.status === 'pending' && (userProfile?.role === 'receptionist' || userProfile?.role === 'admin' || userProfile?.role === 'super-admin' || userProfile?.isSuperAdmin) && (
                                    <button
                                      onClick={() => handleOpenCollectPaymentModal(bill)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] shadow-sm cursor-pointer"
                                    >
                                      Collect Payment
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setViewedBillForReceipt(bill);
                                      setShowReceiptDetailModal(true);
                                    }}
                                    className="px-3 py-1.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-[10px] hover:bg-slate-50 cursor-pointer"
                                  >
                                    Breakdown Receipt
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <PaginationControls
                          currentPage={staffBillsPage}
                          pageSize={staffBillsPageSize}
                          totalItems={bills.length}
                          onPageChange={(p) => setStaffBillsPage(p)}
                          onPageSizeChange={(sz) => {
                            setStaffBillsPageSize(sz);
                            setStaffBillsPage(1);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 5: ADMIN PORTAL */}
          {staffTab === 'admin' && isAdminOrSuper && (
            <div className="space-y-4 animate-fadeIn">

              {/* Admin Portal Header Breadcrumb & Clinic Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-gradient-to-br from-teal-500/10 to-revon-blue/10 text-revon-blue dark:text-teal-400 rounded-xl border border-teal-200/60 dark:border-teal-800/60 shrink-0">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                        Clinic Administration Console
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/30">
                        {isSuperAdmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Organized management for {activeClinic?.name || 'Clinic'} across operational modules, identity, team privileges, and patient engagement
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={expandAllAdminSections}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
                    title="Expand all cards in view"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Expand All</span>
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllAdminSections}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
                    title="Collapse cards"
                  >
                    <Minimize2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Collapse All</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Responsive Layout: Vertical Left Sidebar + Main Content Cards */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Left Sidebar Navigation (Desktop) / Top Horizontal Rail (Mobile) */}
                <aside className="w-full md:w-64 shrink-0 space-y-3 md:sticky md:top-20 z-20">
                  <div className="p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 scrollbar-thin">
                    {[
                      {
                        id: 'overview' as const,
                        label: 'Overview',
                        subtitle: 'Modules & operations',
                        icon: Sliders,
                        count: 'Modules',
                      },
                      {
                        id: 'profile' as const,
                        label: 'Clinic Profile',
                        subtitle: 'Brand, logo & links',
                        icon: Building2,
                        count: isSuperAdmin ? '3 Sections' : '2 Sections',
                      },
                      {
                        id: 'team' as const,
                        label: 'Team & Access',
                        subtitle: 'Staff, surgeons & roles',
                        icon: Users,
                        count: '3 Sections',
                      },
                      {
                        id: 'services' as const,
                        label: 'Services & Care',
                        subtitle: 'Procedures & amenities',
                        icon: Stethoscope,
                        count: '2 Sections',
                      },
                      {
                        id: 'feedback' as const,
                        label: 'Patient Feedback',
                        subtitle: 'Reviews & testimonials',
                        icon: Star,
                        count: 'Reviews',
                      },
                    ].map((tab) => {
                      const isActive = adminSubTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAdminSubTab(tab.id)}
                          className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer whitespace-nowrap md:whitespace-normal group ${
                            isActive
                              ? 'bg-revon-blue text-white shadow-sm ring-2 ring-revon-blue/20'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-revon-blue dark:hover:text-teal-400 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-revon-blue'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate font-bold text-xs">{tab.label}</span>
                              <span className={`hidden md:block text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                                {tab.subtitle}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ml-2 shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 space-y-6">

                  {/* OVERVIEW SUB-TAB: Executive Banners & Operations Cards */}
                  {adminSubTab === 'overview' && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Festival Graphic Effects Promotion & Control Banner */}
                      <div className="p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shrink-0">
                            <PartyPopper className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-display flex items-center gap-2">
                              <span>Festival Decorative Graphic Effects</span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/30">
                                ACTIVE
                              </span>
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                              Configure seasonal holiday lighting, festive border garlands, logo ornaments (Santa cap, flickering diya, crescent) & greeting banners.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowFestivalModal(true)}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-2 shrink-0"
                        >
                          <PartyPopper className="h-4 w-4" />
                          <span>Configure Festival Decor</span>
                        </button>
                      </div>

                      {/* Monthly Finances & Expense Tracking Admin Banner */}
                      <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shrink-0">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-display flex items-center gap-2">
                              <span>Monthly Earnings & Expenses Accounting</span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30">
                                ACCOUNTING
                              </span>
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                              Configure monthly overhead targets for Clinic Rent, Staff Salaries, Consumable Items, and Other Expenses, or log itemized vouchers.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStaffTabChange('finances')}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-2 shrink-0"
                        >
                          <TrendingUp className="h-4 w-4" />
                          <span>Open Finances & Expenses</span>
                        </button>
                      </div>
                    </div>
                  )}

              {/* Card 1: Super Admin Clinic URI Management */}
              {adminSubTab === 'profile' && isSuperAdmin && (
                <div className="bg-white rounded-2xl border border-teal-200/80 overflow-hidden shadow-xs transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggleAdminSection('clinic_uri')}
                    className="w-full text-left p-5 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-700 rounded-xl border border-teal-300/80 flex-shrink-0">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base font-display">
                            Clinic Web URI & Database Identifier Management
                          </h3>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                            Super Admin
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Change clinic URI slug with real-time uniqueness validation and automated cascading updates across all database records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-teal-100/70 text-teal-800 rounded-full border border-teal-200">
                        /{activeClinic?.slug}
                      </span>
                      <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('clinic_uri') ? 'rotate-180 bg-teal-100 text-teal-700' : ''}`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </button>

                  {openAdminSections.includes('clinic_uri') && (
                    <div className="p-6 border-t border-slate-100 bg-white space-y-6 animate-fadeIn">
                      <div className="p-4 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-slate-50 rounded-2xl border border-teal-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                              <Globe className="h-4 w-4 text-teal-600" />
                              <span>Active Clinic: {activeClinic?.name}</span>
                            </h4>
                            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-teal-700">
                              /{activeClinic?.slug}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 max-w-xl">
                            Updating the URI slug will validate uniqueness in Firestore. Upon verification, it safely cascades across all database tables (Appointments, Patient accounts, Bills, Invoices, Finances, Reviews, and Settings).
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClinicForUri(activeClinic);
                            setShowClinicUriModal(true);
                          }}
                          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer flex items-center gap-2 shrink-0 transition-all"
                        >
                          <Globe className="h-4 w-4" />
                          <span>Update /{activeClinic?.slug} URI</span>
                        </button>
                      </div>

                      {/* Other Clinics in System Quick Picker */}
                      {clinics.length > 1 && (
                        <div className="space-y-3 pt-2">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Manage URI for Other Registered Clinics:
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {clinics.map((c) => (
                              <div
                                key={c.id}
                                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <h6 className="text-xs font-bold text-slate-800 truncate">{c.name}</h6>
                                  <p className="text-[11px] font-mono text-teal-600 font-bold truncate">/{c.slug}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClinicForUri(c);
                                    setShowClinicUriModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 text-[11px] font-bold rounded-lg border border-slate-200 hover:border-teal-200 transition-colors shrink-0 cursor-pointer"
                                >
                                  Edit URI
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Card 2: Clinic Modular Features & Capability Provisioning */}
              {adminSubTab === 'overview' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('features')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 text-teal-600 rounded-xl border border-teal-200/80 flex-shrink-0">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Clinic Feature Provisioning & Module Management</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Enable or disable modular features (Finances, Reviews, Chatbot, Multi-Branch, Reminders, and more)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                      {Object.values(activeClinic?.features || {
                        appointments: true,
                        billing: true,
                        chatbot: true,
                        supportSystem: true,
                        dentistBreakdown: true,
                        reminders: true,
                        reviews: true,
                        multiLocation: true,
                        facilities: true,
                        finances: true,
                      }).filter(v => v !== false).length} / 10 Enabled
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('features') ? 'rotate-180 bg-teal-100 text-teal-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('features') && (
                  <div className="p-6 border-t border-slate-100 bg-white space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-teal-50/80 via-emerald-50/60 to-slate-50 rounded-2xl border border-teal-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                          <Sliders className="h-4 w-4 text-teal-600" />
                          <span>Provisioning Features for {activeClinic?.name || 'Clinic'}</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Enable or disable modules in real-time. Disabling a feature removes it from both staff and patient navigation.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Live Sync Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {[
                        {
                          key: 'finances' as keyof ClinicFeatures,
                          label: 'Finances & Operational Expenses',
                          description: 'Monthly earnings tracking, operational expense vouchers, overhead targets, rent, consumables, and financial accounting dashboard.',
                          icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
                          category: 'Financial Operations',
                          highlight: true,
                        },
                        {
                          key: 'reviews' as keyof ClinicFeatures,
                          label: 'Patient Reviews & Ratings',
                          description: 'Public patient review submission, star rating wall on portfolio page, and administrative moderation.',
                          icon: <Star className="h-4 w-4 text-amber-500 fill-amber-500" />,
                          category: 'Patient Experience',
                          highlight: true,
                        },
                        {
                          key: 'appointments' as keyof ClinicFeatures,
                          label: 'Appointments & Scheduling',
                          description: 'Online booking engine, real-time doctor slots, patient check-in queue, and appointment status manager.',
                          icon: <Calendar className="h-4 w-4 text-teal-600" />,
                          category: 'Core Clinical',
                        },
                        {
                          key: 'billing' as keyof ClinicFeatures,
                          label: 'Billing & Invoicing',
                          description: 'Treatment & consultation invoice creation, printable PDF bills, and payment status collection.',
                          icon: <DollarSign className="h-4 w-4 text-sky-600" />,
                          category: 'Financial Operations',
                        },
                        {
                          key: 'chatbot' as keyof ClinicFeatures,
                          label: 'AI Medical Assistant',
                          description: 'Interactive AI chatbot for clinical FAQs, dental triage guidance, and instant conversational support.',
                          icon: <Sparkles className="h-4 w-4 text-purple-600" />,
                          category: 'Patient Experience',
                        },
                        {
                          key: 'supportSystem' as keyof ClinicFeatures,
                          label: 'Support Desk & Tickets',
                          description: 'Patient helpdesk inquiry submission, support tickets, and staff conversation threads.',
                          icon: <Mail className="h-4 w-4 text-indigo-600" />,
                          category: 'Patient Experience',
                        },
                        {
                          key: 'dentistBreakdown' as keyof ClinicFeatures,
                          label: 'Doctor Schedule Breakdown',
                          description: 'Individual doctor and surgeon availability breakdown, roster profiles, and time-slot overview.',
                          icon: <Users className="h-4 w-4 text-blue-600" />,
                          category: 'Staff Operations',
                        },
                        {
                          key: 'reminders' as keyof ClinicFeatures,
                          label: 'Automated Email Reminders',
                          description: 'Automated booking confirmations, reminder logs, and email dispatch status.',
                          icon: <Clock className="h-4 w-4 text-orange-600" />,
                          category: 'Patient Communication',
                        },
                        {
                          key: 'multiLocation' as keyof ClinicFeatures,
                          label: 'Multi-Branch Locations',
                          description: 'Multi-branch switcher, branch address directory, and branch-specific appointment bookings.',
                          icon: <MapPin className="h-4 w-4 text-rose-600" />,
                          category: 'Core Clinical',
                        },
                        {
                          key: 'facilities' as keyof ClinicFeatures,
                          label: 'Clinic Facilities & Amenities',
                          description: 'Medical infrastructure showcase, diagnostic labs, wheelchair accessibility, and amenities.',
                          icon: <Building2 className="h-4 w-4 text-teal-600" />,
                          category: 'Clinic Profile',
                        },
                      ].map((item) => {
                        const isEnabled = activeClinic?.features ? activeClinic.features[item.key] !== false : true;
                        const isUpdating = featureUpdatingKey === item.key;
                        return (
                          <div
                            key={item.key}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                              isEnabled
                                ? item.highlight
                                  ? 'bg-gradient-to-br from-emerald-50/40 to-teal-50/30 border-emerald-200/80 shadow-xs'
                                  : 'bg-white border-slate-200/80 shadow-xs'
                                : 'bg-slate-50/70 border-slate-200/60 opacity-80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl border flex-shrink-0 ${
                                  isEnabled ? 'bg-white border-slate-100 shadow-xs' : 'bg-slate-100 border-slate-200'
                                }`}>
                                  {item.icon}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="font-bold text-slate-900 text-sm">{item.label}</h5>
                                    {item.highlight && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                                        PROVISIONED
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleToggleActiveClinicFeature(item.key)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                  isEnabled
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                } ${isUpdating ? 'opacity-75 cursor-wait' : ''}`}
                              >
                                {isUpdating ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : isEnabled ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                              </button>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Card 3: Clinic Logo & Invoice Branding */}
              {adminSubTab === 'profile' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('branding')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100/80 flex-shrink-0">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Clinic Branding & Bill Logo Management</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Upload or configure official logo for clinic headers & printed billing invoices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                      Logo & Branding
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('branding') ? 'rotate-180 bg-teal-100 text-teal-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('branding') && (
                  <div className="p-6 border-t border-slate-100 bg-white space-y-8 animate-fadeIn">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-teal-50/70 via-sky-50/50 to-slate-50 rounded-2xl border border-teal-100/80">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-600" />
                          <span>Clinic Visual Assets & Branding Suite</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Manage official bill logo, homepage Premium Lobby banner, and clinical hygiene showcase photos.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={adminAllBrandingSaving}
                          onClick={handleSaveAllBrandingAssets}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {adminAllBrandingSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{adminAllBrandingSaving ? 'Saving All...' : 'Save All Visual Assets'}</span>
                        </button>
                        {adminAllBrandingSaved && (
                          <span className="text-xs font-bold text-teal-700 flex items-center gap-1 bg-teal-100/80 px-2.5 py-1 rounded-lg border border-teal-200 animate-fadeIn">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                            <span>Saved!</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Three Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* CARD 1: Clinic Logo & Printed Bill Header */}
                      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm font-display">1. Clinic Logo & Bills</h4>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                              {adminLogoUrl || activeClinic?.logoUrl ? 'Custom' : 'Default'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Appears on navbar headers, appointment slips, PDF invoices, and receipts.
                          </p>

                          {/* Logo Preview */}
                          <div className="w-full h-36 bg-white rounded-xl border border-slate-200 p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
                            <img
                              src={adminLogoUrl || activeClinic?.logoUrl || mainLogo}
                              alt="Clinic Logo Preview"
                              className="max-h-24 max-w-full object-contain"
                            />
                            <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-400 bg-white/90 px-1.5 rounded">
                              Preview
                            </div>
                          </div>

                          {/* Upload controls */}
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Upload File (PNG/JPG/SVG)
                              </label>
                              <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-teal-300 hover:border-teal-500 text-teal-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-teal-50/50 transition-colors shadow-2xs">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Choose Logo File...</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAdminLogoUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Or Image Direct URL
                              </label>
                              <input
                                type="text"
                                placeholder="https://domain.com/logo.png"
                                value={adminLogoUrl}
                                onChange={(e) => setAdminLogoUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          {(adminLogoUrl || activeClinic?.logoUrl) ? (
                            <button
                              type="button"
                              onClick={() => setAdminLogoUrl('')}
                              className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset default</span>
                            </button>
                          ) : <span className="text-[11px] text-slate-400">Default active</span>}

                          <button
                            type="button"
                            disabled={adminLogoSaving}
                            onClick={handleSaveAdminLogo}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {adminLogoSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>{adminLogoSaving ? 'Saving...' : 'Save Logo'}</span>
                          </button>
                        </div>
                      </div>

                      {/* CARD 2: Premium Lobby Showcase Image */}
                      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm font-display">2. Premium Lobby Image</h4>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                              {adminLobbyUrl || activeClinic?.lobbyImageUrl ? 'Custom' : 'Default'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Hero card on the Clinic Portfolio with the "PREMIUM LOBBY" badge.
                          </p>

                          {/* Lobby Preview with Badge */}
                          <div className="w-full h-36 bg-slate-900 rounded-xl border border-slate-200 relative overflow-hidden shadow-xs group">
                            <img
                              src={adminLobbyUrl || activeClinic?.lobbyImageUrl || clinicReceptionImg}
                              alt="Premium Lobby Preview"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-revon-blue shadow-xs font-mono">
                              <Sparkles className="h-2.5 w-2.5 mr-1 text-revon-teal animate-pulse" />
                              PREMIUM LOBBY
                            </span>
                          </div>

                          {/* Upload controls */}
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Upload File (PNG/JPG/WEBP)
                              </label>
                              <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-blue-300 hover:border-blue-500 text-blue-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-blue-50/50 transition-colors shadow-2xs">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Choose Lobby Photo...</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAdminLobbyUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Or Image Direct URL
                              </label>
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/photo-..."
                                value={adminLobbyUrl}
                                onChange={(e) => setAdminLobbyUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          {(adminLobbyUrl || activeClinic?.lobbyImageUrl) ? (
                            <button
                              type="button"
                              onClick={() => setAdminLobbyUrl('')}
                              className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset default</span>
                            </button>
                          ) : <span className="text-[11px] text-slate-400">Default active</span>}

                          <button
                            type="button"
                            disabled={adminLobbySaving}
                            onClick={handleSaveAdminLobby}
                            className="px-3.5 py-1.5 bg-revon-blue hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {adminLobbySaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>{adminLobbySaving ? 'Saving...' : 'Save Lobby'}</span>
                          </button>
                        </div>
                      </div>

                      {/* CARD 3: HYGIENIC & ULTRA-MODERN Treatment Room Showcase Image */}
                      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                <Shield className="w-4 h-4" />
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm font-display">3. Hygienic & Modern</h4>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                              {adminTreatmentRoomUrl || activeClinic?.treatmentRoomImageUrl ? 'Custom' : 'Default'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Clinical hygiene banner with the "HYGIENIC & ULTRA-MODERN" shield.
                          </p>

                          {/* Treatment Room Preview with Badge */}
                          <div className="w-full h-36 bg-slate-900 rounded-xl border border-slate-200 relative overflow-hidden shadow-xs group">
                            <img
                              src={adminTreatmentRoomUrl || activeClinic?.treatmentRoomImageUrl || clinicTreatmentRoomImg}
                              alt="Treatment Room Preview"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-revon-blue shadow-xs font-mono">
                              <Shield className="h-2.5 w-2.5 mr-1 text-revon-teal animate-pulse" />
                              HYGIENIC & ULTRA-MODERN
                            </span>
                          </div>

                          {/* Upload controls */}
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Upload File (PNG/JPG/WEBP)
                              </label>
                              <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-2xs">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Choose Facility Photo...</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAdminTreatmentRoomUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Or Image Direct URL
                              </label>
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/photo-..."
                                value={adminTreatmentRoomUrl}
                                onChange={(e) => setAdminTreatmentRoomUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          {(adminTreatmentRoomUrl || activeClinic?.treatmentRoomImageUrl) ? (
                            <button
                              type="button"
                              onClick={() => setAdminTreatmentRoomUrl('')}
                              className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset default</span>
                            </button>
                          ) : <span className="text-[11px] text-slate-400">Default active</span>}

                          <button
                            type="button"
                            disabled={adminTreatmentRoomSaving}
                            onClick={handleSaveAdminTreatmentRoom}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {adminTreatmentRoomSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>{adminTreatmentRoomSaving ? 'Saving...' : 'Save Hygiene'}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
              )}
              
              {/* Card 4: Clinic Facilities & Patient Amenities Management */}
              {adminSubTab === 'services' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('facilities')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100/80 flex-shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Clinic Facilities & Patient Amenities Management</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage available amenities (Wheelchair, Toilets, Diagnostic Lab, Dispensary, Valet, HEPA, etc.) with unique names
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    {activeClinic?.features?.facilities === false ? (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                        Feature Disabled by Devs
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                        Facilities & Amenities
                      </span>
                    )}
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('facilities') ? 'rotate-180 bg-teal-100 text-teal-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('facilities') && (
                  <div className="p-6 border-t border-slate-100 bg-white animate-fadeIn">
                    {activeClinic?.features?.facilities === false ? (
                      <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-200 flex items-start gap-3 text-xs">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Clinic Facilities Feature is Disabled</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            The developer team has currently disabled the Facilities & Amenities module for <strong>{activeClinic?.name}</strong>. It can be re-enabled from the Developer Portal & Feature Flags center.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <AdminFacilitiesManager />
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Card 5: Patient Reviews & Testimonials Moderation */}
              {adminSubTab === 'feedback' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggleAdminSection('reviews')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80 flex-shrink-0">
                      <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Patient Reviews & Testimonials Moderation</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage patient testimonials, approve public visibility, and publish doctor responses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                      Reviews & Moderation
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('reviews') ? 'rotate-180 bg-amber-100 text-amber-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('reviews') && (
                  <div className="p-6 border-t border-slate-100 bg-white animate-fadeIn">
                    <AdminReviewsManager onTriggerConfirm={triggerConfirm} />
                  </div>
                )}
              </div>
              )}
              
              {/* Card 6: Clinic Menu & Staff Access Permissions */}
              {adminSubTab === 'team' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('permissions')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80 flex-shrink-0">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Clinic Menu & Staff Access Permissions</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dynamically enable or restrict accessible functional tabs for other staff members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                      Access Control
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('permissions') ? 'rotate-180 bg-amber-100 text-amber-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('permissions') && (
                  <div className="p-6 border-t border-slate-100 bg-white space-y-6 animate-fadeIn">
                    {loadingPermissions ? (
                      <div className="py-6 text-center text-xs text-slate-400">Loading configurations...</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                              <th className="p-4">Interactive Menu / Tab</th>
                              <th className="p-4 text-center">Dentist Access</th>
                              <th className="p-4 text-center">Receptionist Access</th>
                              <th className="p-4 text-center text-amber-600">Admin Access (Default)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {/* Appointments Monitor Row */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 font-display">Appointments Monitor</td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.appointments?.includes('dentist')}
                                  onChange={() => handleTogglePermission('appointments', 'dentist')}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.appointments?.includes('receptionist')}
                                  onChange={() => handleTogglePermission('appointments', 'receptionist')}
                                />
                              </td>
                              <td className="p-4 text-center font-bold text-amber-600 font-mono">ENABLED</td>
                            </tr>
                            {/* Automated Email Logs Row */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 font-display">Automated Email Logs</td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.reminders?.includes('dentist')}
                                  onChange={() => handleTogglePermission('reminders', 'dentist')}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.reminders?.includes('receptionist')}
                                  onChange={() => handleTogglePermission('reminders', 'receptionist')}
                                />
                              </td>
                              <td className="p-4 text-center font-bold text-amber-600 font-mono">ENABLED</td>
                            </tr>
                            {/* Patient Directory Row */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 font-display">Patient Directory</td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.patients?.includes('dentist')}
                                  onChange={() => handleTogglePermission('patients', 'dentist')}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.patients?.includes('receptionist')}
                                  onChange={() => handleTogglePermission('patients', 'receptionist')}
                                />
                              </td>
                              <td className="p-4 text-center font-bold text-amber-600 font-mono">ENABLED</td>
                            </tr>
                            {/* Billing & Receipts Row */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 font-display">Billing & Receipts Workspace</td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.billing?.includes('dentist')}
                                  onChange={() => handleTogglePermission('billing', 'dentist')}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.billing?.includes('receptionist')}
                                  onChange={() => handleTogglePermission('billing', 'receptionist')}
                                />
                              </td>
                              <td className="p-4 text-center font-bold text-amber-600 font-mono">ENABLED</td>
                            </tr>
                            {/* Patient History Access Row */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 font-display">Patient Clinical History</td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.patientHistory?.includes('dentist')}
                                  onChange={() => handleTogglePermission('patientHistory', 'dentist')}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.patientHistory?.includes('receptionist')}
                                  onChange={() => handleTogglePermission('patientHistory', 'receptionist')}
                                />
                              </td>
                              <td className="p-4 text-center font-bold text-amber-600 font-mono">ENABLED</td>
                            </tr>
                            {/* Patient Reviews & Testimonials Row */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 font-display">Patient Reviews & Testimonials</td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.reviews?.includes('dentist') ?? true}
                                  onChange={() => handleTogglePermission('reviews', 'dentist')}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.reviews?.includes('receptionist') ?? true}
                                  onChange={() => handleTogglePermission('reviews', 'receptionist')}
                                />
                              </td>
                              <td className="p-4 text-center font-bold text-amber-600 font-mono">ENABLED</td>
                            </tr>
                            {/* Monthly Finances & Expenses Row */}
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900 font-display">Monthly Finances & Expenses</td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.finances?.includes('dentist') ?? true}
                                  onChange={() => handleTogglePermission('finances', 'dentist')}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                                  checked={permissions.finances?.includes('receptionist') ?? true}
                                  onChange={() => handleTogglePermission('finances', 'receptionist')}
                                />
                              </td>
                              <td className="p-4 text-center font-bold text-amber-600 font-mono">ENABLED</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Card 7: Clinic Portfolio Footer Social Handles */}
              {adminSubTab === 'profile' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('social')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-blue-50 text-revon-blue rounded-xl border border-blue-100/80 flex-shrink-0">
                      <Link className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Clinic Portfolio Footer Social Handles</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage active URLs and visibility states for social handles displayed on the clinic portfolio footer
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-blue-50 text-revon-blue rounded-full border border-blue-100">
                      Social Handles
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('social') ? 'rotate-180 bg-blue-100 text-revon-blue' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('social') && (
                  <div className="p-6 border-t border-slate-100 bg-white space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 font-display">
                          <Link className="h-4 w-4 text-revon-blue" />
                          <span>Social Handles Settings</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Configure footer links and icons displayed on the clinic landing page.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleResetSocialHandles}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          Reset Defaults
                        </button>
                      </div>
                    </div>

                    {/* Quick Add Platform Bar */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider mr-2">Add Handle:</span>
                        {(['facebook', 'instagram', 'linkedin', 'youtube', 'twitter', 'whatsapp', 'link'] as const).map((plat) => (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => {
                              if (plat === 'link') {
                                setShowAddCustomLinkInput((prev) => !prev);
                              } else {
                                handleAddSocialHandle(plat);
                              }
                            }}
                            className={`px-2.5 py-1 bg-white border rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 shadow-2xs ${
                              plat === 'link' && showAddCustomLinkInput
                                ? 'border-revon-blue text-revon-blue bg-revon-blue/5'
                                : 'border-slate-200 text-slate-700 hover:border-revon-blue hover:text-revon-blue'
                            }`}
                          >
                            <Plus className="h-3 w-3 text-revon-blue" />
                            <span className="capitalize">{plat === 'twitter' ? 'X / Twitter' : plat === 'link' ? 'Custom Link' : plat}</span>
                          </button>
                        ))}
                      </div>

                      {/* Inline Form to add Custom Link with custom name */}
                      {showAddCustomLinkInput && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-revon-blue/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Link className="h-3.5 w-3.5 text-revon-blue" />
                              <span className="text-xs font-bold text-slate-800">Add Custom Handle with Name</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddCustomLinkInput(false);
                                setNewCustomLinkName('');
                                setNewCustomLinkUrl('');
                              }}
                              className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Handle Name *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Threads, Yelp, Practo, Blog, TikTok"
                                value={newCustomLinkName}
                                onChange={(e) => setNewCustomLinkName(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-revon-blue bg-white"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                URL
                              </label>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={newCustomLinkUrl}
                                onChange={(e) => setNewCustomLinkUrl(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-revon-blue bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const finalName = newCustomLinkName.trim() || 'Custom Link';
                                handleAddSocialHandle('link', finalName, newCustomLinkUrl.trim() || 'https://');
                                setNewCustomLinkName('');
                                setNewCustomLinkUrl('');
                                setShowAddCustomLinkInput(false);
                              }}
                              className="px-3 py-1.5 bg-revon-blue text-white rounded-lg text-xs font-bold hover:bg-revon-blue/90 transition-all cursor-pointer shadow-2xs flex items-center space-x-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add {newCustomLinkName.trim() ? `"${newCustomLinkName.trim()}"` : 'Custom Link'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {editingHandles.map((handle) => (
                        <div key={handle.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-50 hover:bg-slate-50/40 transition-all">
                          <div className="flex items-center space-x-3 w-48 shrink-0">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                              {handle.platform === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                              {handle.platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                              {handle.platform === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-700" />}
                              {handle.platform === 'youtube' && <Youtube className="h-4 w-4 text-red-600" />}
                              {handle.platform === 'twitter' && <Twitter className="h-4 w-4 text-slate-800" />}
                              {handle.platform === 'whatsapp' && (
                                <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.59 1.978 14.122 1.95 11.487 1.95 6.05 1.95 1.623 6.316 1.621 11.745c-.001 1.751.467 3.461 1.353 5.004L1.997 22l5.41-1.411c.01-.005.021-.013.03-.021-.009.008-.019.016-.03.021zM17.13 14.19c-.282-.14-1.664-.813-1.921-.906-.257-.094-.444-.14-.63.14-.187.281-.724.906-.887 1.093-.163.188-.327.21-.609.07-.282-.14-1.19-.434-2.267-1.385-.838-.742-1.403-1.658-1.567-1.939-.163-.281-.017-.433.123-.573.127-.126.282-.327.422-.491.14-.164.188-.281.282-.468.094-.187.047-.351-.023-.491-.07-.14-.63-1.503-.864-2.065-.228-.548-.48-.474-.658-.482-.17-.008-.364-.01-.561-.01-.196 0-.518.073-.79.364-.271.291-1.033.999-1.033 2.435s1.056 2.824 1.205 3.012c.149.188 2.078 3.136 5.028 4.398.702.301 1.25.482 1.678.616.705.221 1.347.19 1.854.115.566-.084 1.664-.672 1.898-1.32.233-.647.233-1.203.163-1.32-.07-.115-.257-.188-.538-.327z" />
                                </svg>
                              )}
                              {handle.platform === 'link' && <Link className="h-4 w-4 text-slate-600" />}
                            </div>
                            {handle.platform === 'link' ? (
                              <input
                                type="text"
                                placeholder="Custom Handle Name"
                                value={handle.name}
                                onChange={(e) => handleUpdateSocialName(handle.id, e.target.value)}
                                className="w-full text-xs font-bold text-slate-800 font-display px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-revon-blue bg-white"
                                title="Edit Custom Handle Name"
                              />
                            ) : (
                              <span className="font-bold text-xs text-slate-800 font-display">{handle.name}</span>
                            )}
                          </div>

                          <div className="flex-1 w-full">
                            <input
                              type="url"
                              placeholder={`Enter URL for ${handle.name}`}
                              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-revon-blue bg-slate-50/50"
                              value={handle.url}
                              onChange={(e) => handleUpdateSocialUrl(handle.id, e.target.value)}
                            />
                          </div>

                          <div className="flex items-center space-x-4 shrink-0">
                            <div className="flex items-center space-x-2">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                Status
                              </label>
                              <button
                                type="button"
                                onClick={() => handleToggleSocialActive(handle.id)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${handle.isActive ? 'bg-revon-blue' : 'bg-slate-200'}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${handle.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                                />
                              </button>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono w-14 text-right ${handle.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {handle.isActive ? 'Active' : 'In-active'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSocialHandle(handle.id)}
                              title="Delete Handle"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 gap-4">
                      <div className="flex-1">
                        {saveHandlesSuccess && (
                          <p className="text-xs font-bold text-emerald-600 flex items-center space-x-1 font-display">
                            <CheckCircle className="h-4 w-4" />
                            <span>Social handles configuration updated successfully!</span>
                          </p>
                        )}
                        {saveHandlesError && (
                          <p className="text-xs font-bold text-rose-600 flex items-center space-x-1 font-display">
                            <XCircle className="h-4 w-4" />
                            <span>{saveHandlesError}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleSaveSocialHandles}
                        disabled={isSavingHandles}
                        className="flex items-center justify-center space-x-1.5 bg-revon-blue text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-revon-blue-dark cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      >
                        {isSavingHandles ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Save Social Handles</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Card 8: Clinic User Profiles Directory */}
              {adminSubTab === 'team' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('users')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/80 flex-shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Clinic User Profiles Directory</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        List all clinical practitioners, staff members, and patients. Modify roles or create new profiles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                      User Directory
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('users') ? 'rotate-180 bg-purple-100 text-purple-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('users') && (
                  <div className="p-6 border-t border-slate-100 bg-white space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 font-display">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span>Registered Users</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">List all clinical practitioners, staff members, and patients.</p>
                      </div>
                      <button
                        onClick={() => {
                          setAddUserError(null);
                          setShowAddUserModal(true);
                        }}
                        className="flex items-center space-x-1.5 bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-purple-700 cursor-pointer shadow-sm"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Create User Profile</span>
                      </button>
                    </div>

                    {loadingUsers ? (
                      <div className="py-6 text-center text-xs text-slate-400">Loading user list...</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                                <th className="p-4">User Identity</th>
                                <th className="p-4">Contact Detail</th>
                                <th className="p-4">Assigned Role</th>
                                <th className="p-4 text-right">Profile Control</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {users
                                .slice((adminUsersPage - 1) * adminUsersPageSize, adminUsersPage * adminUsersPageSize)
                                .map((u) => (
                                <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4">
                                    <div className="font-bold text-slate-900 font-display flex items-center space-x-2">
                                      <span className={`h-2 w-2 rounded-full ${
                                        u.role === 'super-admin' ? 'bg-purple-600' : u.role === 'admin' ? 'bg-amber-500' : u.role === 'dentist' ? 'bg-teal-500' : u.role === 'receptionist' ? 'bg-blue-500' : 'bg-slate-400'
                                      }`}></span>
                                      <span>{u.displayName}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono font-normal">UID: {u.uid.substring(0, 10)}...</span>
                                  </td>
                                  <td className="p-4 font-mono text-slate-600">
                                    <div>{u.email}</div>
                                    <div className="text-[10px] text-slate-400">{u.phone || 'No Phone'}</div>
                                  </td>
                                  <td className="p-4">
                                    {u.uid === userProfile?.uid ? (
                                      <span className="font-bold text-amber-600 uppercase font-mono tracking-wider bg-amber-50 px-2 py-1 rounded">
                                        {u.role} (YOU)
                                      </span>
                                    ) : (
                                      <select
                                        value={u.role}
                                        onChange={(e) => {
                                          const newRole = e.target.value as UserRole;
                                          triggerConfirm(
                                            'Change User Role',
                                            `Are you sure you want to change the role of ${u.displayName} to ${newRole.toUpperCase()}?`,
                                            () => handleUpdateUserRole(u.uid, newRole)
                                          );
                                        }}
                                        className="px-2 py-1 border border-slate-200 rounded-md focus:ring-1 focus:ring-revon-blue text-xs font-semibold cursor-pointer"
                                      >
                                        <option value="patient">Patient</option>
                                        <option value="dentist">Dentist</option>
                                        <option value="receptionist">Receptionist</option>
                                        <option value="admin">Admin</option>
                                        <option value="super-admin">Super Admin</option>
                                      </select>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        onClick={() => {
                                          setSelectedUserForEdit(u);
                                          setEditUserName(u.displayName || '');
                                          setEditUserEmail(u.email || '');
                                          setEditUserPhone(u.phone || '');
                                          setEditUserRole(u.role);
                                          setEditUserError(null);
                                          setShowEditUserModal(true);
                                        }}
                                        className="text-slate-400 hover:text-amber-600 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center"
                                        title="Edit User Profile"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      {u.uid !== userProfile?.uid && (
                                        <button
                                          onClick={() => triggerConfirm(
                                            'Delete User Profile',
                                            `Are you sure you want to permanently delete the profile for ${u.displayName}? This action is irreversible and cannot be undone.`,
                                            () => handleDeleteUser(u.uid)
                                          )}
                                          className="text-slate-400 hover:text-rose-600 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center"
                                          title="Delete User Record"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <PaginationControls
                            currentPage={adminUsersPage}
                            pageSize={adminUsersPageSize}
                            totalItems={users.length}
                            onPageChange={(p) => setAdminUsersPage(p)}
                            onPageSizeChange={(sz) => {
                              setAdminUsersPageSize(sz);
                              setAdminUsersPage(1);
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Card 9: Meet Our Board-Certified Surgeons Panel */}
              {adminSubTab === 'team' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('surgeons')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80 flex-shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Meet Our Board-Certified Surgeons Panel</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage specialist surgeon credentials, bio details, active status, consultation timings, and board certifications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                      Surgeon Panel
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('surgeons') ? 'rotate-180 bg-amber-100 text-amber-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('surgeons') && (
                  <div className="p-6 border-t border-slate-100 bg-white space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 font-display">
                          <Award className="h-4 w-4 text-amber-500" />
                          <span>Specialist Surgeons</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Configure consultation schedules, board certifications, and surgeon details.</p>
                      </div>
                      <button
                        onClick={() => {
                          setSurgeonName('');
                          setSurgeonSpecialty('');
                          setSurgeonBio('');
                          setSurgeonEmail('');
                          setSurgeonPhone('');
                          setSurgeonIsBoardCertified(true);
                          setSurgeonIsActive(true);
                          setSurgeonConsultationTiming('Mon - Fri: 09:00 AM - 05:00 PM');
                          setSurgeonError(null);
                          setShowAddSurgeonModal(true);
                        }}
                        className="flex items-center space-x-1.5 bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-700 cursor-pointer shadow-sm"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Create Surgeon Profile</span>
                      </button>
                    </div>

                    {!surgeons || surgeons.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No surgeons listed. Click the button above to add some!</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                                <th className="p-4">Surgeon Identity</th>
                                <th className="p-4">Contact Detail</th>
                                <th className="p-4">Consultation Timings</th>
                                <th className="p-4 text-center">Active Status</th>
                                <th className="p-4 text-center">Board Certified</th>
                                <th className="p-4 text-right">Profile Control</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {surgeons
                                .slice((adminSurgeonsPage - 1) * adminSurgeonsPageSize, adminSurgeonsPage * adminSurgeonsPageSize)
                                .map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4 max-w-xs">
                                    <div className="font-bold text-slate-900 font-display flex items-center space-x-2">
                                      <span className={`h-2 w-2 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} title={s.isActive ? 'Active' : 'Inactive'}></span>
                                      <span>{s.displayName}</span>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-semibold block">{s.specialty}</span>
                                    <p className="text-[10.5px] text-slate-400 line-clamp-2 mt-1">{s.bio}</p>
                                  </td>
                                  <td className="p-4 font-mono text-slate-600">
                                    <div>{s.email}</div>
                                    <div className="text-[10px] text-slate-400">{s.phone || 'No Phone'}</div>
                                  </td>
                                  <td className="p-4 font-mono text-slate-600 font-medium">
                                    {s.consultationTiming || 'Mon - Fri: 09:00 AM - 05:00 PM'}
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => {
                                        updateSurgeon(
                                          s.id,
                                          s.displayName,
                                          s.specialty,
                                          s.bio,
                                          s.email,
                                          s.isBoardCertified,
                                          !s.isActive,
                                          s.consultationTiming || 'Mon - Fri: 09:00 AM - 05:00 PM',
                                          s.phone
                                        ).then(() => {
                                          alert(`Successfully toggled Surgeon active status to ${!s.isActive ? 'ACTIVE' : 'INACTIVE'} for ${s.displayName}`);
                                        }).catch((err) => {
                                          alert("Failed to toggle status: " + err.message);
                                        });
                                      }}
                                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full cursor-pointer transition-colors ${
                                        s.isActive 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                      }`}
                                    >
                                      {s.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => {
                                        // Instantly toggle board certified flag
                                        updateSurgeon(
                                          s.id,
                                          s.displayName,
                                          s.specialty,
                                          s.bio,
                                          s.email,
                                          !s.isBoardCertified,
                                          s.isActive,
                                          s.consultationTiming || 'Mon - Fri: 09:00 AM - 05:00 PM',
                                          s.phone
                                        ).then(() => {
                                          alert(`Successfully toggled Board-Certified to ${!s.isBoardCertified ? 'ENABLED' : 'DISABLED'} for ${s.displayName}`);
                                        }).catch((err) => {
                                          alert("Failed to toggle status: " + err.message);
                                        });
                                      }}
                                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full cursor-pointer transition-colors ${
                                        s.isBoardCertified 
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' 
                                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                      }`}
                                    >
                                      {s.isBoardCertified ? 'Board-Certified' : 'General Surgeon'}
                                    </button>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        onClick={() => {
                                          setSelectedSurgeonForEdit(s);
                                          setSurgeonName(s.displayName);
                                          setSurgeonSpecialty(s.specialty);
                                          setSurgeonBio(s.bio);
                                          setSurgeonEmail(s.email);
                                          setSurgeonPhone(s.phone || '');
                                          setSurgeonIsBoardCertified(s.isBoardCertified);
                                          setSurgeonIsActive(s.isActive);
                                          setSurgeonConsultationTiming(s.consultationTiming || 'Mon - Fri: 09:00 AM - 05:00 PM');
                                          setSurgeonError(null);
                                          setShowEditSurgeonModal(true);
                                        }}
                                        className="text-slate-400 hover:text-amber-600 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center"
                                        title="Edit Surgeon Details"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleAdminDeleteSurgeon(s)}
                                        className="text-slate-400 hover:text-rose-600 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center"
                                        title="Delete Surgeon Profile"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <PaginationControls
                            currentPage={adminSurgeonsPage}
                            pageSize={adminSurgeonsPageSize}
                            totalItems={surgeons.length}
                            onPageChange={(p) => setAdminSurgeonsPage(p)}
                            onPageSizeChange={(sz) => {
                              setAdminSurgeonsPageSize(sz);
                              setAdminSurgeonsPage(1);
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Card 10: Offered Healthcare Services Management */}
              {adminSubTab === 'services' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleAdminSection('services')}
                  className="w-full text-left p-5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100/80 flex-shrink-0">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                        <span>Offered Healthcare Services Management</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage clinic services, estimated treatment times, prices, price visibility, and active status
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-100">
                      Services & Pricing
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 transition-transform duration-300 ${openAdminSections.includes('services') ? 'rotate-180 bg-sky-100 text-sky-700' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {openAdminSections.includes('services') && (
                  <div className="p-6 border-t border-slate-100 bg-white space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 font-display">
                          <Stethoscope className="h-4 w-4 text-sky-600" />
                          <span>Clinic Offered Services</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Manage procedures, pricing, and active listings.</p>
                      </div>
                      <button
                        onClick={() => {
                          setServiceName('');
                          setServiceDescription('');
                          setServiceDuration(30);
                          setServicePrice(1000);
                          setServiceShowPrice(true);
                          setServiceIsActive(true);
                          setServiceIcon('Sparkles');
                          setServiceError(null);
                          setShowAddServiceModal(true);
                        }}
                        className="flex items-center space-x-1.5 bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-sky-700 cursor-pointer shadow-sm transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Create Offered Service</span>
                      </button>
                    </div>

                    {!services || services.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No offered services listed. Click the button above to create one!</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                                <th className="p-4">Service Details</th>
                                <th className="p-4">Est. Treatment Time</th>
                                <th className="p-4">Price (₹)</th>
                                <th className="p-4 text-center">Price Visibility</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {services
                                .slice((adminServicesPage - 1) * adminServicesPageSize, adminServicesPage * adminServicesPageSize)
                                .map((srv) => (
                                <tr key={srv.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4 max-w-xs">
                                    <div className="font-bold text-slate-900 font-display flex items-center space-x-2">
                                      <span className={`h-2 w-2 rounded-full ${srv.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                      <span>{srv.name}</span>
                                    </div>
                                    <p className="text-[10.5px] text-slate-400 line-clamp-2 mt-1">{srv.description}</p>
                                  </td>
                                  <td className="p-4 font-mono text-slate-600 font-medium">
                                    {srv.durationMinutes} mins
                                  </td>
                                  <td className="p-4 font-mono font-bold text-slate-900">
                                    ₹{srv.price?.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => {
                                        updateService(
                                          srv.id,
                                          srv.name,
                                          srv.description,
                                          srv.durationMinutes,
                                          srv.price,
                                          !srv.showPrice,
                                          srv.isActive !== false,
                                          srv.icon || 'Sparkles'
                                        ).then(() => {
                                          alert(`Price visibility toggled to ${!srv.showPrice ? 'VISIBLE' : 'HIDDEN'} for ${srv.name}`);
                                        }).catch((err) => {
                                          alert("Failed to toggle price visibility: " + err.message);
                                        });
                                      }}
                                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full cursor-pointer transition-colors ${
                                        srv.showPrice !== false
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                      }`}
                                    >
                                      {srv.showPrice !== false ? 'Shown' : 'Hidden'}
                                    </button>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => {
                                        updateService(
                                          srv.id,
                                          srv.name,
                                          srv.description,
                                          srv.durationMinutes,
                                          srv.price,
                                          srv.showPrice !== false,
                                          !(srv.isActive !== false),
                                          srv.icon || 'Sparkles'
                                        ).then(() => {
                                          alert(`Service status toggled to ${srv.isActive === false ? 'ACTIVE' : 'INACTIVE'} for ${srv.name}`);
                                        }).catch((err) => {
                                          alert("Failed to toggle active status: " + err.message);
                                        });
                                      }}
                                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full cursor-pointer transition-colors ${
                                        srv.isActive !== false
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                      }`}
                                    >
                                      {srv.isActive !== false ? 'Active' : 'Inactive'}
                                    </button>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        onClick={() => {
                                          setSelectedServiceForEdit(srv);
                                          setServiceName(srv.name);
                                          setServiceDescription(srv.description);
                                          setServiceDuration(srv.durationMinutes);
                                          setServicePrice(srv.price);
                                          setServiceShowPrice(srv.showPrice !== false);
                                          setServiceIsActive(srv.isActive !== false);
                                          setServiceIcon(srv.icon || 'Sparkles');
                                          setServiceError(null);
                                          setShowEditServiceModal(true);
                                        }}
                                        className="text-slate-400 hover:text-revon-blue p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center"
                                        title="Edit Service Details"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleAdminDeleteService(srv)}
                                        className="text-slate-400 hover:text-rose-600 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors inline-flex items-center"
                                        title="Delete Service"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <PaginationControls
                            currentPage={adminServicesPage}
                            pageSize={adminServicesPageSize}
                            totalItems={services.length}
                            onPageChange={(p) => setAdminServicesPage(p)}
                            onPageSizeChange={(sz) => {
                              setAdminServicesPageSize(sz);
                              setAdminServicesPage(1);
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              )}

                </main>
              </div>
            </div>
          )}

          {staffTab === 'finances' && activeClinic?.features?.finances !== false && (permissions.finances?.includes(userProfile.role) || isAdminOrSuper) && (
            <div className="animate-fadeIn">
              <FinanceDashboard userProfile={userProfile} />
            </div>
          )}

          {staffTab === 'reviews' && activeClinic?.features?.reviews !== false && (permissions.reviews?.includes(userProfile.role) || isAdminOrSuper) && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs animate-fadeIn">
              <AdminReviewsManager onTriggerConfirm={triggerConfirm} />
            </div>
          )}

          {staffTab === 'support' && activeClinic?.features?.supportSystem !== false && (
            <div className="animate-fadeIn">
              <SupportSystem />
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* 2.5 PATIENT SUBMIT REVIEW MODAL */}
      {/* ===================================================================== */}
      {showPatientReviewModal && (
        <div id="patient-review-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-6 border border-slate-100 dark:border-slate-800 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">
                    Share Your Clinic Experience
                  </h3>
                  <p className="text-xs text-slate-400">Your feedback helps us deliver better dental care.</p>
                </div>
              </div>
              <button
                id="close-patient-review-modal"
                onClick={() => setShowPatientReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {patientReviewSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 p-6 rounded-2xl space-y-2 text-center border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-bold font-display text-base">Thank You for Your Feedback!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your review has been submitted successfully to {activeClinic?.name || 'our clinic'}.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePatientSubmitReview} className="space-y-4">
                {patientReviewError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    <span>{patientReviewError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                    Your Overall Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPatientReviewRating(star)}
                        className="p-1 cursor-pointer hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= patientReviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 ml-2">
                      {patientReviewRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                    Treatment / Procedure (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Teeth Whitening, Routine Checkup, Root Canal"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800"
                    value={patientReviewTreatment}
                    onChange={(e) => setPatientReviewTreatment(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                    Your Review / Comments *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about the consultation, pain-free care, clinic environment, or doctor's guidance..."
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800"
                    value={patientReviewComment}
                    onChange={(e) => setPatientReviewComment(e.target.value)}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPatientReviewModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={patientReviewSubmitting}
                    className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    {patientReviewSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. INTERACTIVE BOOKING MODAL */}
      {/* ===================================================================== */}
      {showBookingModal && (
        <div id="booking-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-xl text-slate-900 font-display">
                {userProfile?.role === 'patient' ? 'Reserve Appointment Spot' : 'Walk-In Booking Panel'}
              </h3>
              <button
                id="close-booking-modal"
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl space-y-2 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold font-display">Booking Processed Successfully!</h4>
                <p className="text-xs">Your appointment is scheduled. Automated verification emails have been logged.</p>
              </div>
            ) : (
              <form id="booking-wizard-form" onSubmit={handleBookAppointment} className="space-y-4">
                
                {userProfile?.role === 'patient' && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-600">Who is this appointment for?</label>
                      <button
                        type="button"
                        onClick={() => {
                          setDependentTargetPatientId(userProfile.uid);
                          setShowAddDependentModal(true);
                        }}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Register Family Member</span>
                      </button>
                    </div>
                    <select
                      id="book-dependent-select"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-white cursor-pointer focus:outline-none"
                      value={bookForDependentId}
                      onChange={(e) => setBookForDependentId(e.target.value)}
                    >
                      <option value="myself">Myself ({userProfile.displayName})</option>
                      {userProfile.dependents?.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.relationship})</option>
                      ))}
                    </select>
                  </div>
                )}

                {userProfile?.role !== 'patient' && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block font-mono">Patient Association</span>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Select Patient Profile</label>
                      <select
                        id="staff-patient-select"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-white cursor-pointer focus:outline-none"
                        value={selectedPrimaryPatientId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPrimaryPatientId(val);
                          setBookForDependentId('myself'); // reset dependent
                          if (val === 'walk-in' || val === '') {
                            setBookPatientName('');
                            setBookPatientEmail('');
                            setBookPatientPhone('');
                          } else {
                            const pDoc = users.find(u => u.uid === val);
                            if (pDoc) {
                              setBookPatientName(pDoc.displayName);
                              setBookPatientEmail(pDoc.email);
                              setBookPatientPhone(pDoc.phone || '');
                            }
                          }
                        }}
                      >
                        <option value="">-- Manual Walk-In (Guest) --</option>
                        {users.filter(u => u.role === 'patient').map(p => (
                          <option key={p.uid} value={p.uid}>{p.displayName} ({p.email})</option>
                        ))}
                      </select>
                    </div>

                    {selectedPrimaryPatientId && (
                      <div className="animate-fadeIn space-y-3">
                        {/* If the registered patient has dependents, allow booking for them */}
                        {(() => {
                          const primaryPat = users.find(u => u.uid === selectedPrimaryPatientId);
                          if (primaryPat && primaryPat.dependents && primaryPat.dependents.length > 0) {
                            return (
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Schedule Appointment For</label>
                                <select
                                  id="staff-dependent-select"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-white cursor-pointer focus:outline-none"
                                  value={bookForDependentId}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBookForDependentId(val);
                                    if (val === 'myself') {
                                      setBookPatientName(primaryPat.displayName);
                                      setBookPatientPhone(primaryPat.phone || '');
                                      setBookPatientEmail(primaryPat.email);
                                    } else {
                                      const dep = primaryPat.dependents?.find(d => d.id === val);
                                      if (dep) {
                                        setBookPatientName(dep.name);
                                        setBookPatientPhone(dep.phone || primaryPat.phone || '');
                                        setBookPatientEmail(dep.email || primaryPat.email);
                                      }
                                    }
                                  }}
                                >
                                  <option value="myself">Primary Patient ({primaryPat.displayName})</option>
                                  {primaryPat.dependents.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.relationship})</option>
                                  ))}
                                </select>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Button to add family member to this profile on the fly */}
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/60 text-xs">
                          <span className="text-[11px] text-slate-500">Need to book for their child/relative?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setDependentTargetPatientId(selectedPrimaryPatientId);
                              setShowAddDependentModal(true);
                            }}
                            className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 text-[10px] font-bold rounded-lg cursor-pointer flex items-center space-x-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Dependent</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {(!selectedPrimaryPatientId) && (
                      <div className="grid sm:grid-cols-2 gap-3 animate-fadeIn">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                          <input
                            id="book-patient-name"
                            type="text"
                            required
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-revon-blue focus:outline-none"
                            placeholder="e.g. Alice Cooper"
                            value={bookPatientName}
                            onChange={(e) => setBookPatientName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Contact Email</label>
                          <input
                            id="book-patient-email"
                            type="email"
                            required
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-revon-blue focus:outline-none"
                            placeholder="alice@gmail.com"
                            value={bookPatientEmail}
                            onChange={(e) => setBookPatientEmail(e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number</label>
                          <input
                            id="book-patient-phone"
                            type="tel"
                            required
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-revon-blue focus:outline-none"
                            placeholder="+91 98765 12345"
                            value={bookPatientPhone}
                            onChange={(e) => setBookPatientPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Select Clinic Branch / Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Select Clinic Branch / Center</span>
                    <span className="text-[10px] text-teal-600 font-mono font-bold">{activeClinic?.name}</span>
                  </label>
                  <select
                    id="book-location-select"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-[#F8FAFC] cursor-pointer"
                    value={bookLocationId}
                    onChange={(e) => {
                      setBookLocationId(e.target.value);
                      if (setActiveLocationId) setActiveLocationId(e.target.value);
                    }}
                  >
                    {activeClinic?.locations && activeClinic.locations.length > 0 ? (
                      activeClinic.locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} — {loc.address}, {loc.city} ({loc.workingHours})
                        </option>
                      ))
                    ) : (
                      <option value="primary">{activeClinic?.name || 'Main Medical Center'} Flagship Center</option>
                    )}
                  </select>

                  {/* Selected Branch Details Card */}
                  {(() => {
                    const selectedLoc = activeClinic?.locations?.find(l => l.id === bookLocationId) || activeClinic?.locations?.[0];
                    if (selectedLoc) {
                      return (
                        <div className="mt-1.5 p-2 bg-teal-50/60 border border-teal-100/80 rounded-xl flex items-center justify-between text-[11px] text-teal-800">
                          <div className="flex items-center space-x-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                            <span className="truncate font-medium">{selectedLoc.address}, {selectedLoc.city}</span>
                          </div>
                          <span className="text-[10px] font-mono text-teal-600 font-bold ml-2 flex-shrink-0">{selectedLoc.workingHours}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Medical Service</label>
                    <select
                      id="book-treatment-select"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-[#F8FAFC] cursor-pointer"
                      value={bookTreatmentId}
                      onChange={(e) => setBookTreatmentId(e.target.value)}
                    >
                      {treatments.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} (₹{t.price} — {t.durationMinutes} mins)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Medical Specialist</label>
                    <select
                      id="book-dentist-select"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-[#F8FAFC] cursor-pointer"
                      value={bookDentistId}
                      onChange={(e) => setBookDentistId(e.target.value)}
                    >
                      {dentists.map(d => (
                        <option key={d.uid} value={d.uid}>
                          {d.displayName} ({d.specialty || 'Consultant Specialist'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date</label>
                    <input
                      id="book-date-input"
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-[#F8FAFC]"
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                    />
                  </div>

                  {/* Interactive Visual Time Slot Selector */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Select Available Time Slot</label>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {STANDARD_TIME_SLOTS.filter(s => !isSlotBooked(appointments, bookDate, s.value, bookDentistId).isBooked).length} of 10 Available
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {STANDARD_TIME_SLOTS.map((s) => {
                        const slotInfo = isSlotBooked(appointments, bookDate, s.value, bookDentistId);
                        const isBooked = slotInfo.isBooked;
                        const isSelected = bookTime === s.value && !isBooked;
                        const app = slotInfo.appointment;

                        return (
                          <button
                            key={s.value}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setBookTime(s.value)}
                            className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer relative ${
                              isBooked
                                ? 'bg-rose-50 border-rose-200 text-rose-700 opacity-70 cursor-not-allowed select-none'
                                : isSelected
                                ? 'bg-revon-blue text-white border-revon-blue shadow-md ring-2 ring-blue-300 font-extrabold scale-[1.02]'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{s.label}</span>
                            </div>

                            <span className={`text-[8px] uppercase font-mono px-1.5 py-0.2 rounded ${
                              isBooked
                                ? 'bg-rose-200 text-rose-900 font-bold'
                                : isSelected
                                ? 'bg-white/20 text-white font-bold'
                                : 'bg-emerald-200 text-emerald-900 font-bold'
                            }`}>
                              {isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
                            </span>

                            {isBooked && userProfile?.role !== 'patient' && app && (
                              <span className="text-[8px] truncate max-w-[80px] text-rose-600 font-medium">
                                {app.patientName.split(' ')[0]}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Standard Dropdown fallback */}
                    <div className="mt-2">
                      <select
                        id="book-time-select"
                        required
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-[#F8FAFC] cursor-pointer"
                        value={bookTime}
                        onChange={(e) => setBookTime(e.target.value)}
                      >
                        {STANDARD_TIME_SLOTS.map((s) => {
                          const slotInfo = isSlotBooked(appointments, bookDate, s.value, bookDentistId);
                          const isBooked = slotInfo.isBooked;
                          const app = slotInfo.appointment;

                          return (
                            <option key={s.value} value={s.value} disabled={isBooked}>
                              {s.label} {isBooked ? (userProfile?.role !== 'patient' && app ? `(BOOKED - ${app.patientName})` : '(BOOKED - Unavailable)') : '(Available)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live Booking Confirmation Overview Card */}
                {(() => {
                  const sLoc = activeClinic?.locations?.find(l => l.id === bookLocationId) || activeClinic?.locations?.[0];
                  const sTreat = treatments.find(t => t.id === bookTreatmentId) || treatments[0];
                  const sDoc = dentists.find(d => d.uid === bookDentistId) || dentists[0];
                  
                  return (
                    <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2 text-xs shadow-md">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-teal-400 border-b border-slate-800 pb-1.5">
                        <span className="font-bold flex items-center gap-1"><Sparkles className="h-3 w-3 text-teal-400" /> Booking Overview</span>
                        <span className="text-emerald-400 font-bold">Instant Slot Hold</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Medical Service</span>
                          <span className="font-bold text-slate-100 truncate block">{sTreat?.name || 'Medical Consultation'}</span>
                          <span className="text-teal-300 font-semibold text-[10px]">₹{sTreat?.price || 0} • {sTreat?.durationMinutes || 30} mins</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Assigned Specialist</span>
                          <span className="font-bold text-slate-100 truncate block">{sDoc?.displayName || 'Board Certified Doctor'}</span>
                          <span className="text-slate-400 text-[10px] truncate block">{sDoc?.specialty || 'Medical Specialist'}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
                          <div className="truncate mr-2">
                            <span className="text-slate-400 text-[10px]">Branch: </span>
                            <span className="font-medium text-slate-200">{sLoc?.name || activeClinic?.name}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-slate-400 text-[10px]">Slot: </span>
                            <span className="font-mono font-bold text-teal-300">{bookDate} @ {bookTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Additional Notes</label>
                  <textarea
                    id="book-notes-input"
                    rows={2}
                    placeholder="Describe any symptoms, medical history, or schedule preferences..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-[#F8FAFC] focus:outline-none"
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                  <button
                    id="cancel-book-modal"
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-book-btn"
                    type="submit"
                    disabled={bookingLoading}
                    className="px-6 py-2 bg-revon-blue text-white text-xs font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 cursor-pointer shadow-md shadow-revon-blue/10"
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Reservation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. DENTIST DETAILED BILL DRAFTING MODAL */}
      {/* ===================================================================== */}
      {showDraftBillModal && selectedAppointmentForBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-display">Draft Treatment Billing & Inventory Stocks</h3>
                <p className="text-xs text-slate-400 mt-1">Include clinical fees, dental tools, and medical gloves/stocks used during the session.</p>
              </div>
              <button
                onClick={() => {
                  setShowDraftBillModal(false);
                  setSelectedAppointmentForBill(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Current Draft Items Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Current Bill Details</span>
              <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-150">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Purge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftBillItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800 font-display">{item.name}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-400 uppercase">{item.type}</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">₹{item.unitPrice}</td>
                        <td className="p-3 text-right font-mono font-bold">₹{item.total}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftBillItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Composer Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block font-mono">Compose stock or kit usage</span>
              
              <div className="grid sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sterile Latex Gloves (Box of 50)"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                    value={newBillItemName}
                    onChange={(e) => setNewBillItemName(e.target.value)}
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white cursor-pointer"
                    value={newBillItemType}
                    onChange={(e) => setNewBillItemType(e.target.value as any)}
                  >
                    <option value="consultation">Consultation Fee</option>
                    <option value="equipment">Dental Equipment Kit</option>
                    <option value="stock">Medical Stocks (Gloves, syringe)</option>
                    <option value="other">Other Treatments/Supplies</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none font-mono text-center"
                    value={newBillItemQty}
                    onChange={(e) => setNewBillItemQty(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none font-mono text-right"
                    value={newBillItemPrice}
                    onChange={(e) => setNewBillItemPrice(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddDraftBillItem}
                  className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add To Invoice List</span>
                </button>
              </div>
            </div>

            {/* running totals */}
            <div className="flex justify-between items-start font-mono text-xs text-right text-slate-600 border-t border-slate-100 pt-4">
              <div className="space-y-1 text-left">
                <div>Patient: <strong className="font-display font-bold text-slate-950">{selectedAppointmentForBill.patientName}</strong></div>
                <div>Treatment: <strong className="font-display font-bold text-slate-950">{selectedAppointmentForBill.treatment}</strong></div>
                <div>Clinic & Branch: <strong className="font-display font-bold text-slate-950">{selectedAppointmentForBill.clinicName || activeClinic?.name || 'Clinic'} — {selectedAppointmentForBill.locationName || activeClinic?.locations?.[0]?.name || 'Main Branch'}</strong></div>
              </div>
              <div className="space-y-1">
                <div>Subtotal: <strong>₹{draftBillItems.reduce((acc, curr) => acc + curr.total, 0)}</strong></div>
                <div>VAT & Service Surcharge (18%): <strong>₹{Math.round(draftBillItems.reduce((acc, curr) => acc + curr.total, 0) * 0.18)}</strong></div>
                <div className="text-sm font-bold text-slate-900 border-t border-slate-100 pt-1">
                  Grand Total: <span>₹{Math.round(draftBillItems.reduce((acc, curr) => acc + curr.total, 0) * 1.18)}</span>
                </div>
              </div>
            </div>

            {/* save buttons */}
            <div className="pt-4 border-t border-slate-150 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDraftBillModal(false);
                  setSelectedAppointmentForBill(null);
                }}
                className="px-4 py-2 bg-slate-150 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel Draft
              </button>
              <button
                type="button"
                onClick={handleSaveDraftBill}
                className="px-6 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 cursor-pointer shadow-md"
              >
                Save & Route to Reception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. RECEPTIONIST COLLECT PAYMENT MODAL */}
      {/* ===================================================================== */}
      {showCollectPaymentModal && selectedBillForCollection && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 font-display">Collect Patient Payment</h3>
              <button
                onClick={() => {
                  setShowCollectPaymentModal(false);
                  setSelectedBillForCollection(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">Invoice Summary</span>
                <div className="flex justify-between font-bold text-slate-800 text-sm font-display border-b border-slate-200 pb-2">
                  <span>{selectedBillForCollection.patientName}</span>
                  <span>₹{selectedBillForCollection.totalAmount}</span>
                </div>
                <div className="space-y-1 font-mono text-slate-600 pt-1">
                  <div>Doctor: {selectedBillForCollection.dentistName}</div>
                  <div>Procedure: {selectedBillForCollection.treatmentName}</div>
                  <div>Includes: {selectedBillForCollection.items?.length || 0} stocks, consults, tools itemized.</div>
                </div>
              </div>

              {/* Mode of payment dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Select Payment Mode</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-revon-blue text-xs text-slate-800 bg-[#F8FAFC] cursor-pointer font-bold uppercase tracking-wide"
                  value={selectedPaymentMode}
                  onChange={(e) => setSelectedPaymentMode(e.target.value as any)}
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="Cash">Cash Currency</option>
                  <option value="Card">Visa / Mastercard / Credit Card</option>
                  <option value="Other">Net Banking / Other Modes</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCollectPaymentModal(false);
                  setSelectedBillForCollection(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCollection}
                disabled={collectingPayment}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{collectingPayment ? 'Recording...' : 'Confirm Received'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CLINICAL PATIENT HISTORY MODAL */}
      {/* ===================================================================== */}
      {showHistoryModal && historyPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col border border-slate-100">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg uppercase shadow-xs">
                  {historyPatient.displayName ? historyPatient.displayName[0] : 'P'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-lg text-slate-900 font-display">{historyPatient.displayName}</h3>
                    <span className="text-[10px] uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold font-mono">
                      {historyPatient.isRegistered ? 'Registered Account' : 'Walk-In'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {historyPatient.email || 'No email'} • {historyPatient.phone || 'No phone'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistoryPatient(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1">
              
              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Appointments</div>
                  <div className="text-2xl font-extrabold text-slate-800 font-display mt-1">
                    {appointments.filter(app => app.patientEmail === historyPatient.email || app.patientId === historyPatient.uid || (historyPatient.phone && app.patientPhone === historyPatient.phone)).length}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Bills & Invoices</div>
                  <div className="text-2xl font-extrabold text-slate-800 font-display mt-1">
                    {
                      bills.filter(b => b.patientEmail === historyPatient.email || b.patientId === historyPatient.uid).length +
                      invoices.filter(inv => inv.patientEmail === historyPatient.email || inv.patientId === historyPatient.uid).length
                    }
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Registered Dependents</div>
                  <div className="text-2xl font-extrabold text-slate-800 font-display mt-1">
                    {historyPatient.dependents?.length || 0}
                  </div>
                </div>
              </div>

              {/* Dependents list if any */}
              {historyPatient.dependents && historyPatient.dependents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Family Dependents ({historyPatient.dependents.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {historyPatient.dependents.map((dep: any) => (
                      <div key={dep.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between items-center shadow-xs">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{dep.name}</div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Phone: {dep.phone || 'Inherited primary'}</p>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-md font-mono">
                          {dep.relationship}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatment & Appointments History List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Clinical Visits & Appointments</span>
                </h4>
                {(() => {
                  const filteredApps = appointments
                    .filter(app => app.patientEmail === historyPatient.email || app.patientId === historyPatient.uid || (historyPatient.phone && app.patientPhone === historyPatient.phone))
                    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

                  if (filteredApps.length === 0) {
                    return <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">No appointment records found for this patient.</div>;
                  }

                  return (
                    <div className="space-y-3">
                      {filteredApps.map((app) => (
                        <div key={app.id} className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200 transition-all shadow-xs space-y-3">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-sm font-display">{app.treatment}</div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">Dentist: Dr. {app.dentistName}</p>
                              
                              {/* Clinic & Branch Info */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-200 font-mono text-[10px] border border-slate-200/60 dark:border-slate-700">
                                  <Building2 className="h-3 w-3 text-revon-blue shrink-0" />
                                  <span>{app.clinicName || (clinics.find(c => c.id === app.clinicId || c.slug === app.clinicSlug)?.name) || activeClinic?.name || 'Clinic'}</span>
                                </span>
                                <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300 font-mono text-[10px] border border-amber-200/60 dark:border-amber-800/40">
                                  <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                                  <span>{app.locationName || activeClinic?.locations?.[0]?.name || 'Main Branch'}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>{new Date(app.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono ${
                                app.status === 'completed' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : app.status === 'confirmed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : app.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                          </div>
                          {app.notes && (
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                              <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1">Clinical Notes & Findings:</div>
                              {app.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Invoices & Financial Logs */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span>Financial Transactions & Receipts</span>
                </h4>
                {(() => {
                  const filteredInvoices = invoices.filter(inv => inv.patientEmail === historyPatient.email || inv.patientId === historyPatient.uid);
                  const filteredBills = bills.filter(b => b.patientEmail === historyPatient.email || b.patientId === historyPatient.uid);
                  
                  const combinedFinance = [
                    ...filteredInvoices.map(inv => ({ ...inv, financeType: 'Invoice' })),
                    ...filteredBills.map(b => ({ ...b, financeType: 'Bill' }))
                  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                  if (combinedFinance.length === 0) {
                    return <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">No financial transactions recorded.</div>;
                  }

                  return (
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 font-mono">
                            <th className="p-3">Reference Type</th>
                            <th className="p-3">Treatment / Item</th>
                            <th className="p-3">Created At</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3 text-right">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {combinedFinance.map((fin: any) => (
                            <tr key={fin.id} className="hover:bg-slate-50/20">
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md font-mono border ${
                                  fin.financeType === 'Invoice'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                  {fin.financeType}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-900">
                                {fin.treatmentName || fin.items?.map((item: any) => item.name).join(', ') || 'Dental Treatment'}
                              </td>
                              <td className="p-3 text-slate-400 font-mono">
                                {new Date(fin.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-bold font-mono text-slate-900">
                                ₹{fin.totalAmount}
                              </td>
                              <td className="p-3 text-right">
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md font-mono ${
                                  fin.status === 'collected'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {fin.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistoryPatient(null);
                }}
                className="px-5 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. GENERAL DETAILED BILL BREAKDOWN & RECEIPT MODAL */}
      {/* ===================================================================== */}
      {showReceiptDetailModal && viewedBillForReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-6 border border-slate-100">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">{APP_NAME}</span>
                <h3 className="font-extrabold text-xl text-slate-900 font-display">Itemized Dental Receipt</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Bill ID: {viewedBillForReceipt.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptDetailModal(false);
                  setViewedBillForReceipt(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-600 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block">PATIENT DETAILS</span>
                <strong className="text-slate-900 text-sm font-display block mt-0.5">{viewedBillForReceipt.patientName}</strong>
                <span className="text-[10px] text-emerald-600 font-medium">Verified Patient Account</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block">CLINICAL PROVIDER</span>
                <strong className="text-slate-900 text-sm font-display block mt-0.5">{viewedBillForReceipt.dentistName}</strong>
                <span>Treatment: {viewedBillForReceipt.treatmentName}</span>
              </div>
            </div>

            {/* Detailed Items Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Invoice Particulars (Gloves, Equipment, Consultation)</span>
              
              <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="p-2">Particular Name</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {viewedBillForReceipt.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="p-2 font-semibold text-slate-800 font-display">
                          <div>{item.name}</div>
                          <span className="text-[9px] text-slate-400 font-mono capitalize">({item.type})</span>
                        </td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{item.unitPrice}</td>
                        <td className="p-2 text-right font-mono font-bold">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs font-mono text-right text-slate-600 border border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <strong className="text-slate-950">₹{viewedBillForReceipt.subtotal}</strong>
              </div>
              <div className="flex justify-between">
                <span>VAT & Service Surcharge (18%):</span>
                <strong className="text-slate-950">₹{viewedBillForReceipt.tax}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-950">
                <span>Total Amount Paid:</span>
                <span className="text-teal-600">₹{viewedBillForReceipt.totalAmount}</span>
              </div>
            </div>

            {/* Verification Signature */}
            <div className="text-center font-mono text-[10px] text-slate-400 space-y-1">
              <div>Status: <span className={`uppercase font-bold ${viewedBillForReceipt.status === 'collected' ? 'text-emerald-600' : 'text-amber-500'}`}>{viewedBillForReceipt.status}</span></div>
              {viewedBillForReceipt.status === 'collected' && (
                <>
                  <div>Collected on: {new Date(viewedBillForReceipt.paymentDate || viewedBillForReceipt.createdAt).toLocaleString()}</div>
                  <div>Gateway Mode: <strong className="text-slate-900 uppercase">{viewedBillForReceipt.paymentMode}</strong></div>
                  <div>Verified By: {viewedBillForReceipt.collectedBy || 'Staff Receptionist'}</div>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setShowReceiptDetailModal(false);
                  setViewedBillForReceipt(null);
                }}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6.5 DETAILED TREATMENT INVOICE MODAL */}
      {/* ===================================================================== */}
      {showInvoiceDetailModal && viewedInvoiceForReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative space-y-6 border border-slate-100">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">{APP_NAME}</span>
                <h3 className="font-extrabold text-xl text-slate-900 font-display">Treatment Invoice</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Invoice Number: {viewedInvoiceForReceipt.invoiceNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowInvoiceDetailModal(false);
                  setViewedInvoiceForReceipt(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-600 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block">PATIENT DETAILS</span>
                <strong className="text-slate-900 text-sm font-display block mt-0.5">{viewedInvoiceForReceipt.patientName}</strong>
                <span className="text-[10px] text-emerald-600 font-medium">Verified Patient Account</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block">CLINICIAN PROVIDER</span>
                <strong className="text-slate-900 text-sm font-display block mt-0.5">{viewedInvoiceForReceipt.dentistName}</strong>
                <span>Treatment: {viewedInvoiceForReceipt.treatmentName}</span>
                <span className="block mt-1">
                  Status: <span className={`uppercase font-bold ${viewedInvoiceForReceipt.status === 'collected' ? 'text-emerald-600' : 'text-amber-500'}`}>{viewedInvoiceForReceipt.status === 'collected' ? 'Paid' : 'Pending'}</span>
                </span>
              </div>
            </div>

            {/* Detailed Items Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Invoice Particulars (Consultation, Procedures & Consumables)</span>
              
              <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2">Type</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {viewedInvoiceForReceipt.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="p-2 font-semibold text-slate-800 font-display">{item.name}</td>
                        <td className="p-2 text-slate-500 capitalize">{item.type}</td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold">₹{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs font-mono text-right text-slate-600 border border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <strong className="text-slate-950">₹{viewedInvoiceForReceipt.subtotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <strong className="text-slate-950">₹{viewedInvoiceForReceipt.tax.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-950">
                <span>Grand Total:</span>
                <span className="text-revon-blue">₹{viewedInvoiceForReceipt.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between gap-4">
              <button
                type="button"
                onClick={() => handlePrintInvoice(viewedInvoiceForReceipt)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInvoiceDetailModal(false);
                  setViewedInvoiceForReceipt(null);
                }}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. ADMIN REGISTER NEW USER PROFILE MODAL */}
      {/* ===================================================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-display">Create Clinic User Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Setup Login credentials & select role for the practitioner.</p>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {addUserError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleAdminCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rohan Dev"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rohan@revondental.in"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 XXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Assigned Account Role</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['dentist', 'receptionist', 'admin', 'super-admin', 'patient'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewUserRole(r)}
                      className={`py-2 text-center rounded-xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        newUserRole === r 
                          ? 'border-amber-500 bg-amber-50 text-amber-800' 
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 cursor-pointer shadow-md text-xs disabled:opacity-50"
                >
                  {addUserLoading ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADMIN EDIT USER PROFILE MODAL */}
      {/* ===================================================================== */}
      {showEditUserModal && selectedUserForEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-display">Edit Clinic User Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Modify details & update role for the clinician/patient.</p>
              </div>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setSelectedUserForEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {editUserError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{editUserError}</span>
              </div>
            )}

            <form onSubmit={handleAdminUpdateUserProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rohan Dev"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rohan@revondental.in"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 XXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Assigned Account Role</label>
                {selectedUserForEdit.uid === userProfile?.uid ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold border border-amber-100">
                    You cannot modify your own role.
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['dentist', 'receptionist', 'admin', 'super-admin', 'patient'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setEditUserRole(r)}
                        className={`py-2 text-center rounded-xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          editUserRole === r 
                            ? 'border-amber-500 bg-amber-50 text-amber-800' 
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setSelectedUserForEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 cursor-pointer shadow-md text-xs disabled:opacity-50"
                >
                  {editUserLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. REGISTER FAMILY MEMBER MODAL */}
      {/* ===================================================================== */}
      {showAddDependentModal && (
        <div id="add-dependent-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 font-display">
                Register Family Member
              </h3>
              <button
                onClick={() => setShowAddDependentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddDependentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Primary Patient</label>
                <select
                  className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-revon-blue ${
                    userProfile?.role === 'patient' ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-[#F8FAFC] text-slate-800 cursor-pointer'
                  }`}
                  value={dependentTargetPatientId}
                  onChange={(e) => setDependentTargetPatientId(e.target.value)}
                  disabled={userProfile?.role === 'patient'}
                >
                  <option value="">Select target patient...</option>
                  {userProfile?.uid && (
                    <option value={userProfile.uid}>{userProfile.displayName} ({userProfile.role === 'patient' ? 'YOU' : 'Current User'})</option>
                  )}
                  {users
                    .filter(u => u.uid !== userProfile?.uid)
                    .map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName} ({u.email || u.phone || u.role})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dependent Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Cooper"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={newDependentName}
                  onChange={(e) => setNewDependentName(e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Relationship</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800 cursor-pointer"
                    value={newDependentRelation}
                    onChange={(e) => setNewDependentRelation(e.target.value as any)}
                  >
                    <option value="Child">Child</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 XXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={newDependentPhone}
                    onChange={(e) => setNewDependentPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. liam@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={newDependentEmail}
                  onChange={(e) => setNewDependentEmail(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDependentModal(false);
                    setNewDependentName('');
                    setNewDependentPhone('');
                    setNewDependentEmail('');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-revon-blue text-white font-bold rounded-xl hover:bg-opacity-90 cursor-pointer shadow-md text-xs"
                >
                  Add Family Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. ADMIN REGISTER NEW SURGEON MODAL */}
      {/* ===================================================================== */}
      {showAddSurgeonModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-display">Create Surgeon Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Setup specialist surgeon credentials and toggle Board-Certified status.</p>
              </div>
              <button
                onClick={() => setShowAddSurgeonModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {surgeonError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{surgeonError}</span>
              </div>
            )}

            <form onSubmit={handleAdminCreateSurgeon} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={surgeonName}
                  onChange={(e) => setSurgeonName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Specialty</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Oral & Maxillofacial Surgeon"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={surgeonSpecialty}
                  onChange={(e) => setSurgeonSpecialty(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Bio Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Pioneering painless surgical extractions, dental implants, and jaw reconstruction with clinical excellence..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800 resize-none"
                  value={surgeonBio}
                  onChange={(e) => setSurgeonBio(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane.doe@revondental.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={surgeonEmail}
                    onChange={(e) => setSurgeonEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 XXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={surgeonPhone}
                    onChange={(e) => setSurgeonPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Board-Certified Surgeon Status</strong>
                  <span className="text-[10px] text-slate-400">Board-certified surgeons appear in the "Meet Our Board-Certified Surgeons" landing portfolio.</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  checked={surgeonIsBoardCertified}
                  onChange={(e) => setSurgeonIsBoardCertified(e.target.checked)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Consultation Timing</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon - Fri: 09:00 AM - 05:00 PM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={surgeonConsultationTiming}
                  onChange={(e) => setSurgeonConsultationTiming(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Active Status</strong>
                  <span className="text-[10px] text-slate-400">Inactive surgeons are hidden from patients' view.</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  checked={surgeonIsActive}
                  onChange={(e) => setSurgeonIsActive(e.target.checked)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddSurgeonModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={surgeonLoading}
                  className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 cursor-pointer shadow-md text-xs disabled:opacity-50"
                >
                  {surgeonLoading ? 'Adding...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. ADMIN EDIT SURGEON PROFILE MODAL */}
      {/* ===================================================================== */}
      {showEditSurgeonModal && selectedSurgeonForEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-display">Edit Surgeon Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Modify surgeon details and toggle Board-Certified status.</p>
              </div>
              <button
                onClick={() => {
                  setShowEditSurgeonModal(false);
                  setSelectedSurgeonForEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {surgeonError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{surgeonError}</span>
              </div>
            )}

            <form onSubmit={handleAdminUpdateSurgeon} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={surgeonName}
                  onChange={(e) => setSurgeonName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Specialty</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Oral & Maxillofacial Surgeon"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={surgeonSpecialty}
                  onChange={(e) => setSurgeonSpecialty(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Bio Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Pioneering painless surgical extractions, dental implants..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800 resize-none"
                  value={surgeonBio}
                  onChange={(e) => setSurgeonBio(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane.doe@revondental.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={surgeonEmail}
                    onChange={(e) => setSurgeonEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 XXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={surgeonPhone}
                    onChange={(e) => setSurgeonPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Board-Certified Surgeon Status</strong>
                  <span className="text-[10px] text-slate-400">Board-certified surgeons appear in the "Meet Our Board-Certified Surgeons" landing portfolio.</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  checked={surgeonIsBoardCertified}
                  onChange={(e) => setSurgeonIsBoardCertified(e.target.checked)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Consultation Timing</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon - Fri: 09:00 AM - 05:00 PM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={surgeonConsultationTiming}
                  onChange={(e) => setSurgeonConsultationTiming(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Active Status</strong>
                  <span className="text-[10px] text-slate-400">Inactive surgeons are hidden from patients' view.</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  checked={surgeonIsActive}
                  onChange={(e) => setSurgeonIsActive(e.target.checked)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSurgeonModal(false);
                    setSelectedSurgeonForEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={surgeonLoading}
                  className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 cursor-pointer shadow-md text-xs disabled:opacity-50"
                >
                  {surgeonLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. ADMIN CREATE OFFERED SERVICE MODAL */}
      {/* ===================================================================== */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-display">Create Offered Service</h3>
                <p className="text-xs text-slate-400 mt-1">Add a new specialist healthcare treatment to clinic offerings.</p>
              </div>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {serviceError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{serviceError}</span>
              </div>
            )}

            <form onSubmit={handleAddServiceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Service Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiac Evaluation & Screening"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Advanced non-invasive cardiac evaluation including ECG analysis, blood pressure profiling, and specialist consult..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800 resize-none"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Est. Treatment Time (Mins)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={360}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="1500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Service Icon</label>
                <select
                  value={serviceIcon}
                  onChange={(e) => setServiceIcon(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                >
                  <option value="Sparkles">Sparkles (General Consult)</option>
                  <option value="Activity">Activity (Cardiac / Vital Check)</option>
                  <option value="Shield">Shield (Orthopedic / Protection)</option>
                  <option value="Smile">Smile (Dermatology / Wellness)</option>
                  <option value="Layers">Layers (Pediatric / Multi-specialty)</option>
                  <option value="Flame">Flame (Surgical / Advanced Care)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Show Price on Portfolio</strong>
                  <span className="text-[10px] text-slate-400">If unchecked, price is hidden and replaced with "Price on Consultation".</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                  checked={serviceShowPrice}
                  onChange={(e) => setServiceShowPrice(e.target.checked)}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Active Status</strong>
                  <span className="text-[10px] text-slate-400">Inactive services are hidden from public portfolio visitors.</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  checked={serviceIsActive}
                  onChange={(e) => setServiceIsActive(e.target.checked)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceLoading}
                  className="px-6 py-2 bg-revon-blue text-white font-bold rounded-xl hover:bg-sky-600 cursor-pointer shadow-md text-xs disabled:opacity-50"
                >
                  {serviceLoading ? 'Creating...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 11. ADMIN EDIT OFFERED SERVICE MODAL */}
      {/* ===================================================================== */}
      {showEditServiceModal && selectedServiceForEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-display">Edit Offered Service</h3>
                <p className="text-xs text-slate-400 mt-1">Modify healthcare service details, pricing, and visibility settings.</p>
              </div>
              <button
                onClick={() => {
                  setShowEditServiceModal(false);
                  setSelectedServiceForEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {serviceError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{serviceError}</span>
              </div>
            )}

            <form onSubmit={handleEditServiceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Service Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiac Evaluation & Screening"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Advanced non-invasive cardiac evaluation including ECG analysis..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800 resize-none"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Est. Treatment Time (Mins)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={360}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="1500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Service Icon</label>
                <select
                  value={serviceIcon}
                  onChange={(e) => setServiceIcon(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-revon-blue text-xs text-slate-800"
                >
                  <option value="Sparkles">Sparkles (General Consult)</option>
                  <option value="Activity">Activity (Cardiac / Vital Check)</option>
                  <option value="Shield">Shield (Orthopedic / Protection)</option>
                  <option value="Smile">Smile (Dermatology / Wellness)</option>
                  <option value="Layers">Layers (Pediatric / Multi-specialty)</option>
                  <option value="Flame">Flame (Surgical / Advanced Care)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Show Price on Portfolio</strong>
                  <span className="text-[10px] text-slate-400">If unchecked, price is hidden and replaced with "Price on Consultation".</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-revon-blue focus:ring-revon-blue cursor-pointer"
                  checked={serviceShowPrice}
                  onChange={(e) => setServiceShowPrice(e.target.checked)}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-display block">Active Status</strong>
                  <span className="text-[10px] text-slate-400">Inactive services are hidden from public portfolio visitors.</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  checked={serviceIsActive}
                  onChange={(e) => setServiceIsActive(e.target.checked)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditServiceModal(false);
                    setSelectedServiceForEdit(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceLoading}
                  className="px-6 py-2 bg-revon-blue text-white font-bold rounded-xl hover:bg-sky-600 cursor-pointer shadow-md text-xs disabled:opacity-50"
                >
                  {serviceLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Signature Footer */}
      <div className="pt-8 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
        <div>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</div>
        <ZFCreationsBrand lightMode={true} />
      </div>

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

      {/* Festival Decor Modal for Admin & Super-Admin */}
      <FestivalDecorModal 
        isOpen={showFestivalModal} 
        onClose={() => setShowFestivalModal(false)} 
      />

      {/* Appointment Monitor Add / Edit / Delete Bill Modal */}
      <AppointmentBillModal
        isOpen={showAppointmentBillModal}
        onClose={() => {
          setShowAppointmentBillModal(false);
          setAppointmentForBillAction(null);
          setExistingBillForAction(null);
          setExistingInvoiceForAction(null);
        }}
        appointment={appointmentForBillAction}
        existingBill={existingBillForAction}
        existingInvoice={existingInvoiceForAction}
        treatments={treatments}
        activeClinic={activeClinic}
        onBillSaved={(savedBill, savedInvoice) => {
          setBills(prev => {
            const idx = prev.findIndex(b => b.id === savedBill.id || b.appointmentId === savedBill.appointmentId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedBill;
              return copy;
            }
            return [savedBill, ...prev];
          });
          setInvoices(prev => {
            const idx = prev.findIndex(i => i.id === savedInvoice.id || i.appointmentId === savedInvoice.appointmentId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedInvoice;
              return copy;
            }
            return [savedInvoice, ...prev];
          });
        }}
        onBillDeleted={(appId) => {
          setBills(prev => prev.filter(b => b.id !== appId && b.appointmentId !== appId));
          setInvoices(prev => prev.filter(i => i.appointmentId !== appId));
        }}
      />

      {/* Super User Clinic URI Update Modal */}
      <UpdateClinicUriModal
        isOpen={showClinicUriModal}
        onClose={() => {
          setShowClinicUriModal(false);
          setSelectedClinicForUri(null);
        }}
        clinic={selectedClinicForUri || activeClinic}
      />

      {/* Post-Op Care Instruction Dispatcher Modal */}
      <PostOpCareModal
        isOpen={!!selectedPostOpAppointment}
        onClose={() => setSelectedPostOpAppointment(null)}
        appointment={selectedPostOpAppointment}
      />
    </div>
  );
}
