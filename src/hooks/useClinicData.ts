import { useState, useEffect } from 'react';
import { APP_NAME, getClinicUrl } from '../config/appConfig';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { UserProfile, TreatmentService, Review, ReminderLog, Surgeon, SocialHandle } from '../types';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { sanitizeFirestoreData } from '../utils/firestoreUtils';
import QRCode from 'qrcode';
// @ts-ignore
import mainLogo from '../assets/images/main_logo_1783512166748.jpg';
// @ts-ignore
import dentistMaleLead from '../assets/images/dentist_male_lead_1784288724374.jpg';
// @ts-ignore
import dentistFemaleSurgeon from '../assets/images/dentist_female_surgeon_1784288736448.jpg';
// @ts-ignore
import dentistMaleOrthodontist from '../assets/images/dentist_male_orthodontist_1784288751809.jpg';

// Helper functions to load images and convert to base64
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

const generateQRCodeWithLogo = async (text: string, logoUrl: string): Promise<string> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    
    // Draw the QR code onto the canvas
    await QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 180,
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
        const logoSize = 42; // Center size
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        
        // Draw white square behind logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
        
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

export const STATIC_SURGEONS: Surgeon[] = [
  {
    id: 's1',
    displayName: 'Dr. Mohammad Tohid Kaginalli',
    specialty: 'Lead Oral & Maxillofacial Surgeon',
    bio: 'Pioneering minimally invasive surgical extractions, reconstructive procedures, and jaw surgery with over 12 years of clinical excellence.',
    email: 'tohid.kaginalli@revondental.in',
    phone: '+91 98765 43210',
    isBoardCertified: true,
    isActive: true,
    consultationTiming: 'Mon - Wed: 10:00 AM - 01:00 PM',
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    avatarUrl: dentistMaleLead
  },
  {
    id: 's2',
    displayName: 'Dr. Ananya Rao',
    specialty: 'Board-Certified Consultant Cardiologist',
    bio: 'Specializing in preventive cardiology, echocardiography, hypertension management, and advanced cardiovascular diagnostics.',
    email: 'ananya.rao@revondental.in',
    phone: '+91 98765 43211',
    isBoardCertified: true,
    isActive: true,
    consultationTiming: 'Tue - Thu: 02:00 PM - 05:00 PM',
    createdAt: new Date('2026-01-02T00:00:00Z').toISOString(),
    avatarUrl: dentistFemaleSurgeon
  },
  {
    id: 's3',
    displayName: 'Dr. Rajesh Kumar',
    specialty: 'Senior Consultant Orthopedic Specialist',
    bio: 'Dedicated to joint care, sports injury rehabilitation, pediatric orthopedic growth evaluation, and non-surgical alignment therapies.',
    email: 'rajesh.kumar@revondental.in',
    phone: '+91 98765 43212',
    isBoardCertified: false,
    isActive: true,
    consultationTiming: 'Fri - Sat: 09:00 AM - 12:00 PM',
    createdAt: new Date('2026-01-03T00:00:00Z').toISOString(),
    avatarUrl: dentistMaleOrthodontist
  }
];

export const TREATMENTS: TreatmentService[] = [
  {
    id: 't1',
    name: 'General Medical Specialist Consultation',
    description: 'Comprehensive physical examination, vital signs check, medical history review, and personalized care plan.',
    durationMinutes: 30,
    price: 1000,
    icon: 'Sparkles',
    isActive: true,
    showPrice: true
  },
  {
    id: 't2',
    name: 'Cardiac Evaluation & Screening',
    description: 'Advanced non-invasive cardiac evaluation including ECG analysis, blood pressure profiling, and specialist consult.',
    durationMinutes: 45,
    price: 3500,
    icon: 'Activity',
    isActive: true,
    showPrice: true
  },
  {
    id: 't3',
    name: 'Orthopedic & Joint Assessment',
    description: 'Targeted muscular and joint Mobility examination, pain management strategy, and posture evaluation.',
    durationMinutes: 40,
    price: 1500,
    icon: 'Shield',
    isActive: true,
    showPrice: true
  },
  {
    id: 't4',
    name: 'Dermatological & Skin Therapy',
    description: 'Specialist skin checkup, allergy screening, acne treatment, and customized laser therapy consultation.',
    durationMinutes: 45,
    price: 2500,
    icon: 'Smile',
    isActive: true,
    showPrice: true
  },
  {
    id: 't5',
    name: 'Pediatric & Family Wellness Check',
    description: 'Comprehensive child development screening, immunization review, and preventative family medical care.',
    durationMinutes: 30,
    price: 1200,
    icon: 'Layers',
    isActive: true,
    showPrice: true
  },
  {
    id: 't6',
    name: 'Specialist Surgical & Dental Consult',
    description: 'Pre-operative diagnostic consultation, minor surgical procedure review, or specialized oral procedure.',
    durationMinutes: 60,
    price: 4000,
    icon: 'Flame',
    isActive: true,
    showPrice: true
  }
];

export const STATIC_DENTISTS: UserProfile[] = [
  {
    uid: 'dentist-dr-tohid',
    displayName: 'Dr. Mohammad Tohid Kaginalli',
    email: 'tohid.kaginalli@revondental.in',
    role: 'dentist',
    phone: '+91 98765 43210'
  },
  {
    uid: 'dentist-dr-ananya',
    displayName: 'Dr. Ananya Rao',
    email: 'ananya.rao@revondental.in',
    role: 'dentist',
    phone: '+91 98765 43211'
  },
  {
    uid: 'dentist-dr-rajesh',
    displayName: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@revondental.in',
    role: 'dentist',
    phone: '+91 98765 43212'
  }
];

export const STATIC_REVIEWS: Review[] = [
  {
    id: 'r1',
    patientName: 'Aarav Sharma',
    rating: 5,
    comment: 'Absolutely amazing! Dr. Mohammad Tohid Kaginalli made me feel so comfortable during my wisdom tooth removal. The pain-free technology is real!',
    createdAt: '2026-06-28T14:30:00Z'
  },
  {
    id: 'r2',
    patientName: 'Priya Patel',
    rating: 5,
    comment: 'The whitening service is stellar! My teeth look beautiful and natural. The staff are polite, and the clinic is incredibly clean.',
    createdAt: '2026-07-02T09:15:00Z'
  },
  {
    id: 'r3',
    patientName: 'Vikram Singh',
    rating: 5,
    comment: 'Highly recommend this clinic. The scheduling system was smooth, real-time tracking showed my spot, and I received automated email reminders!',
    createdAt: '2026-07-05T11:00:00Z'
  }
];

export const DEFAULT_SOCIAL_HANDLES: SocialHandle[] = [
  { id: 'facebook', name: 'Facebook', url: 'https://facebook.com', isActive: true, platform: 'facebook' },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://wa.me/919876543210', isActive: true, platform: 'whatsapp' },
  { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', isActive: true, platform: 'instagram' },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', isActive: false, platform: 'linkedin' },
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', isActive: false, platform: 'youtube' }
];

export function useClinicData() {
  const { activeClinic } = useClinic();
  const { userProfile } = useAuth();
  const activeSlug = activeClinic?.slug || 'revon-dental';
  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin);

  const [dentists, setDentists] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>([]);
  const [services, setServices] = useState<TreatmentService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch doctors and medical specialists filtered by clinic
    const fetchDentists = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list: UserProfile[] = [];
        snap.forEach((doc) => {
          const u = doc.data() as UserProfile;
          if (u.role === 'dentist' || u.role === 'doctor' || u.role === 'specialist') {
            const itemSlug = u.clinicSlug || 'revon-dental';
            if (itemSlug === activeSlug) {
              list.push(u);
            }
          }
        });
        
        if (list.length === 0) {
          setDentists(STATIC_DENTISTS);
        } else {
          setDentists(list);
        }
      } catch (err) {
        console.warn("Failed to query custom doctors & specialists, using defaults:", err);
        setDentists(STATIC_DENTISTS);
      }
    };

    // 2. Fetch reviews filtered by clinic
    const unsubscribeReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const list: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Review;
        const itemSlug = data.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push({ id: doc.id, ...data });
        }
      });
      if (list.length === 0) {
        setReviews(STATIC_REVIEWS);
      } else {
        setReviews(list);
      }
    }, (err) => {
      console.warn("Reviews listener failed, using defaults:", err);
      setReviews(STATIC_REVIEWS);
    });

    // 3. Fetch automated reminders logs filtered by clinic
    let unsubscribeReminders: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeReminders) {
        unsubscribeReminders();
        unsubscribeReminders = null;
      }

      if (firebaseUser) {
        const qReminders = query(collection(db, 'reminders'), orderBy('sentAt', 'desc'));
        unsubscribeReminders = onSnapshot(qReminders, (snapshot) => {
          const list: ReminderLog[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as ReminderLog;
            const itemSlug = data.clinicSlug || 'revon-dental';
            if (itemSlug === activeSlug) {
              list.push({ id: doc.id, ...data });
            }
          });
          setReminderLogs(list);
          setLoading(false);
        }, (err) => {
          console.warn("Reminders listener failed:", err);
          setLoading(false);
        });
      } else {
        setReminderLogs([]);
        setLoading(false);
      }
    });

    // 4. Fetch surgeons in real-time filtered by clinic
    const unsubscribeSurgeons = onSnapshot(collection(db, 'surgeons'), (snapshot) => {
      const list: Surgeon[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Surgeon;
        const itemSlug = data.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push({ 
            id: doc.id,
            displayName: data.displayName || '',
            specialty: data.specialty || '',
            bio: data.bio || '',
            email: data.email || '',
            phone: data.phone || '',
            isBoardCertified: data.isBoardCertified === true,
            isActive: data.isActive !== false,
            consultationTiming: data.consultationTiming || 'Mon - Fri: 09:00 AM - 05:00 PM',
            createdAt: data.createdAt || new Date().toISOString(),
            clinicSlug: data.clinicSlug || activeSlug
          } as Surgeon);
        }
      });
      if (list.length === 0) {
        setSurgeons(STATIC_SURGEONS);
      } else {
        list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setSurgeons(list);
      }
    }, (err) => {
      console.warn("Surgeons listener failed, using defaults:", err);
      setSurgeons(STATIC_SURGEONS);
    });

    // 5. Fetch social handles in real-time specific to clinic
    const handleDocId = `social_handles_${activeSlug}`;
    const unsubscribeSocial = onSnapshot(doc(db, 'settings', handleDocId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.handles) && data.handles.length > 0) {
          setSocialHandles(data.handles);
        } else {
          setSocialHandles(DEFAULT_SOCIAL_HANDLES);
        }
      } else {
        // Auto-seed document to Firestore if missing so real-time updates are anchored
        setDoc(doc(db, 'settings', handleDocId), {
          handles: DEFAULT_SOCIAL_HANDLES,
          updatedAt: new Date().toISOString(),
          clinicSlug: activeSlug
        }, { merge: true }).catch((e) => console.warn("Auto-seed social handles error:", e));

        setSocialHandles(DEFAULT_SOCIAL_HANDLES);
      }
    }, (err) => {
      console.warn("Social handles listener failed, using defaults:", err);
      setSocialHandles(DEFAULT_SOCIAL_HANDLES);
    });

    // 6. Fetch offered services in real-time filtered by clinic
    const unsubscribeServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      const list: TreatmentService[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as TreatmentService;
        const itemSlug = data.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push({
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            durationMinutes: Number(data.durationMinutes) || 30,
            price: Number(data.price) || 0,
            icon: data.icon || 'Sparkles',
            isActive: data.isActive !== false,
            showPrice: data.showPrice !== false,
            clinicSlug: itemSlug,
            createdAt: data.createdAt || new Date().toISOString()
          });
        }
      });

      if (list.length === 0) {
        setServices(TREATMENTS.map(t => ({ ...t, clinicSlug: activeSlug })));
      } else {
        list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setServices(list);
      }
    }, (err) => {
      console.warn("Services listener failed, using defaults:", err);
      setServices(TREATMENTS.map(t => ({ ...t, clinicSlug: activeSlug })));
    });

    fetchDentists();

    return () => {
      unsubscribeReviews();
      unsubscribeSurgeons();
      unsubscribeSocial();
      unsubscribeServices();
      if (unsubscribeReminders) {
        (unsubscribeReminders as () => void)();
      }
      unsubscribeAuth();
    };
  }, [activeSlug, isSuperAdmin]);

  const createReview = async (
    patientName: string,
    rating: number,
    comment: string,
    extras?: {
      patientEmail?: string;
      patientId?: string;
      treatmentName?: string;
      isPublished?: boolean;
      isVerifiedPatient?: boolean;
      adminReply?: string;
      adminReplyBy?: string;
    }
  ) => {
    // Adding reviews should be added by only Patients
    if (userProfile && userProfile.role !== 'patient') {
      throw new Error('Reviews can only be added by registered patients.');
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        patientName: patientName.trim(),
        rating: Math.max(1, Math.min(5, Number(rating) || 5)),
        comment: comment.trim(),
        patientId: extras?.patientId || userProfile?.uid || '',
        patientEmail: extras?.patientEmail?.trim() || userProfile?.email || '',
        treatmentName: extras?.treatmentName?.trim() || '',
        isPublished: extras?.isPublished !== false,
        isVerifiedPatient: extras?.isVerifiedPatient ?? true,
        adminReply: extras?.adminReply?.trim() || '',
        adminReplyAt: extras?.adminReply ? new Date().toISOString() : '',
        adminReplyBy: extras?.adminReplyBy || '',
        clinicSlug: activeSlug,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to add review:", err);
      throw err;
    }
  };

  const updateReview = async (id: string, updates: Partial<Review>) => {
    try {
      const existing = reviews.find(r => r.id === id);
      const reviewRef = doc(db, 'reviews', id);
      const dataToSave: any = {
        patientName: existing?.patientName || 'Anonymous Patient',
        rating: existing?.rating || 5,
        comment: existing?.comment || '',
        isPublished: existing?.isPublished !== false,
        createdAt: existing?.createdAt || new Date().toISOString(),
        ...(existing || {}),
        ...updates,
        clinicSlug: activeSlug,
        updatedAt: new Date().toISOString()
      };
      delete dataToSave.id;
      await setDoc(reviewRef, sanitizeFirestoreData(dataToSave), { merge: true });
    } catch (err) {
      console.error("Failed to update review:", err);
      throw err;
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const reviewRef = doc(db, 'reviews', id);
      await deleteDoc(reviewRef);
    } catch (err) {
      console.error("Failed to delete review:", err);
      throw err;
    }
  };

  const replyToReview = async (id: string, adminReply: string, adminName: string) => {
    try {
      const existing = reviews.find(r => r.id === id);
      const reviewRef = doc(db, 'reviews', id);
      const dataToSave: any = {
        patientName: existing?.patientName || 'Anonymous Patient',
        rating: existing?.rating || 5,
        comment: existing?.comment || '',
        isPublished: existing?.isPublished !== false,
        createdAt: existing?.createdAt || new Date().toISOString(),
        ...(existing || {}),
        adminReply: adminReply.trim(),
        adminReplyAt: adminReply.trim() ? new Date().toISOString() : '',
        adminReplyBy: adminName,
        clinicSlug: activeSlug,
        updatedAt: new Date().toISOString()
      };
      delete dataToSave.id;
      await setDoc(reviewRef, sanitizeFirestoreData(dataToSave), { merge: true });
    } catch (err) {
      console.error("Failed to reply to review:", err);
      throw err;
    }
  };

  const toggleReviewVisibility = async (id: string, currentPublishedState: boolean = true) => {
    try {
      const existing = reviews.find(r => r.id === id);
      const reviewRef = doc(db, 'reviews', id);
      const dataToSave: any = {
        patientName: existing?.patientName || 'Anonymous Patient',
        rating: existing?.rating || 5,
        comment: existing?.comment || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
        ...(existing || {}),
        isPublished: !currentPublishedState,
        clinicSlug: activeSlug,
        updatedAt: new Date().toISOString()
      };
      delete dataToSave.id;
      await setDoc(reviewRef, sanitizeFirestoreData(dataToSave), { merge: true });
    } catch (err) {
      console.error("Failed to toggle review visibility:", err);
      throw err;
    }
  };

  const triggerManualReminder = async (appointmentId: string, email: string, details: string) => {
    try {
      let previewUrl = null;
      let emailStatus = 'sent';

      // Check if patient email preferences allow email reminders
      let isEmailRemindersEnabled = true;
      try {
        const qUser = query(collection(db, 'users'), where('email', '==', email));
        const userSnap = await getDocs(qUser);
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          if (userData?.emailRemindersEnabled === false) {
            isEmailRemindersEnabled = false;
          }
        }
      } catch (checkErr) {
        console.warn("Could not check user email reminders preference:", checkErr);
      }

      if (isEmailRemindersEnabled) {
        try {
          let qrBase64 = '';
          try {
            const targetSlug = activeSlug || 'revon-dental';
            const appUrl = getClinicUrl(targetSlug);
            qrBase64 = await generateQRCodeWithLogo(appUrl, mainLogo);
          } catch (qrErr) {
            console.warn("Failed to generate QR Code for email:", qrErr);
          }

          const emailHtml = `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background: linear-gradient(135deg, #042f2e, #0f766e); padding: 24px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.025em; letter-spacing: 0.05em;">${APP_NAME.toUpperCase()}</h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #ccfbf1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Painless Care with Surgical Precision</p>
              </div>
              <div style="padding: 24px; background-color: #fafaf9; color: #1c1917;">
                <h3 style="margin-top: 0; font-size: 18px; font-weight: 700; color: #0f766e;">Clinical Alert / Reminder</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #44403c;">You have received a direct update from our clinic staff regarding your dental program:</p>
                <div style="background-color: white; border-left: 4px solid #0d9488; border-radius: 4px; padding: 16px; margin: 20px 0; font-style: italic; color: #1c1917; font-size: 14px; line-height: 1.5; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);">
                  "${details}"
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #44403c; margin-bottom: 0;">Please access your patient portal dashboard to trace your current appointments, view clinical prescriptions, and complete treatment billing.</p>
              </div>
              <div style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-family: system-ui, sans-serif;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="vertical-align: middle; width: 64px;">
                      <img src="${qrBase64}" width="60" height="60" alt="Patient Portal QR" style="display: block; border-radius: 6px; border: 1px solid #cbd5e1;" />
                    </td>
                    <td style="vertical-align: middle; padding-left: 12px; text-align: left;">
                      <strong style="color: #0f172a; font-size: 11px; display: block;">${APP_NAME.toUpperCase()} PATIENT PORTAL</strong>
                      <p style="margin: 2px 0 0 0; font-size: 10px; line-height: 1.3; color: #64748b;">
                        Scan to sign in, track appointments, and view treatments.
                      </p>
                    </td>
                    <td style="vertical-align: middle; text-align: right; padding-left: 12px;">
                      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                        Dedicated Patient Care Unit • Bengaluru
                      </p>
                      <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">
                        Sent in real-time by ${APP_NAME} Hub
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        crafted by ZF CREATIONS
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          `;

          const emailRes = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              subject: `Alert: Clinic Notification from ${APP_NAME}`,
              html: emailHtml,
              text: `Clinic Notification from ${APP_NAME}: ${details}`
            })
          });

          if (emailRes.ok) {
            const emailData = await emailRes.json();
            previewUrl = emailData.previewUrl;
          }
        } catch (err) {
          console.warn("Failed to dispatch real-time manual email via server api:", err);
          emailStatus = 'failed';
        }
      }

      await addDoc(collection(db, 'reminders'), {
        appointmentId,
        patientEmail: email,
        sentAt: new Date().toISOString(),
        type: 'email',
        status: isEmailRemindersEnabled ? emailStatus : 'disabled',
        previewUrl,
        details: isEmailRemindersEnabled 
          ? `Manual Clinic Reminder: ${details}`
          : `Manual email suppressed: Patient has disabled email reminders in settings`
      });
    } catch (err) {
      console.error("Failed to trigger reminder:", err);
      throw err;
    }
  };

  const createSurgeon = async (
    displayName: string,
    specialty: string,
    bio: string,
    email: string,
    isBoardCertified: boolean,
    isActive: boolean,
    consultationTiming: string,
    phone?: string
  ) => {
    try {
      await addDoc(collection(db, 'surgeons'), {
        displayName,
        specialty,
        bio,
        email,
        phone: phone || '',
        isBoardCertified,
        isActive,
        consultationTiming,
        clinicSlug: activeSlug,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to add surgeon:", err);
      throw err;
    }
  };

  const updateSurgeon = async (
    id: string,
    displayName: string,
    specialty: string,
    bio: string,
    email: string,
    isBoardCertified: boolean,
    isActive: boolean,
    consultationTiming: string,
    phone?: string
  ) => {
    try {
      const surgeonRef = doc(db, 'surgeons', id);
      await setDoc(surgeonRef, {
        displayName,
        specialty,
        bio,
        email,
        isBoardCertified,
        isActive,
        consultationTiming,
        phone: phone || '',
        clinicSlug: activeSlug
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update surgeon:", err);
      throw err;
    }
  };

  const deleteSurgeon = async (id: string) => {
    try {
      const surgeonRef = doc(db, 'surgeons', id);
      await deleteDoc(surgeonRef);
    } catch (err) {
      console.error("Failed to delete surgeon:", err);
      throw err;
    }
  };

  const updateSocialHandles = async (updatedHandles: SocialHandle[]) => {
    try {
      const cleanHandles = sanitizeFirestoreData(updatedHandles);
      const handleDocId = `social_handles_${activeSlug}`;
      
      // 1. Save to settings collection for clinic slug
      await setDoc(doc(db, 'settings', handleDocId), {
        handles: cleanHandles,
        updatedAt: new Date().toISOString(),
        clinicSlug: activeSlug
      }, { merge: true });

      // 2. Save to global settings fallback
      await setDoc(doc(db, 'settings', 'social_handles'), {
        handles: cleanHandles,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Update clinic document directly in 'clinics' collection
      if (activeClinic?.id) {
        try {
          await setDoc(doc(db, 'clinics', activeClinic.id), {
            socialHandles: cleanHandles,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (idErr) {
          console.warn("Direct update by clinic.id failed:", idErr);
        }
      }

      // 4. Update clinic document by slug query
      try {
        const clinicQuery = query(collection(db, 'clinics'), where('slug', '==', activeSlug));
        const clinicSnap = await getDocs(clinicQuery);
        clinicSnap.forEach((cDoc) => {
          setDoc(cDoc.ref, {
            socialHandles: cleanHandles,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch((e) => console.warn("Failed to update clinic doc by slug query:", e));
        });
      } catch (cErr) {
        console.warn("Could not sync socialHandles directly to clinic doc by query:", cErr);
      }

      setSocialHandles(updatedHandles);
    } catch (err) {
      console.error("Failed to update social handles in Firestore:", err);
      throw err;
    }
  };

  const createService = async (
    name: string,
    description: string,
    durationMinutes: number,
    price: number,
    showPrice: boolean,
    isActive: boolean,
    icon: string
  ) => {
    try {
      await addDoc(collection(db, 'services'), {
        name,
        description,
        durationMinutes: Number(durationMinutes) || 30,
        price: Number(price) || 0,
        showPrice: Boolean(showPrice),
        isActive: Boolean(isActive),
        icon: icon || 'Sparkles',
        clinicSlug: activeSlug,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to create offered service:", err);
      throw err;
    }
  };

  const updateService = async (
    id: string,
    name: string,
    description: string,
    durationMinutes: number,
    price: number,
    showPrice: boolean,
    isActive: boolean,
    icon: string
  ) => {
    try {
      const serviceRef = doc(db, 'services', id);
      await setDoc(serviceRef, {
        name,
        description,
        durationMinutes: Number(durationMinutes) || 30,
        price: Number(price) || 0,
        showPrice: Boolean(showPrice),
        isActive: Boolean(isActive),
        icon: icon || 'Sparkles',
        clinicSlug: activeSlug
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update offered service:", err);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const serviceRef = doc(db, 'services', id);
      await deleteDoc(serviceRef);
    } catch (err) {
      console.error("Failed to delete offered service:", err);
      throw err;
    }
  };

  return {
    dentists,
    treatments: services.length > 0 ? services : TREATMENTS,
    services,
    reviews,
    reminderLogs,
    surgeons,
    socialHandles,
    loading,
    createReview,
    updateReview,
    deleteReview,
    replyToReview,
    toggleReviewVisibility,
    triggerManualReminder,
    createSurgeon,
    updateSurgeon,
    deleteSurgeon,
    updateSocialHandles,
    createService,
    updateService,
    deleteService
  };
}
