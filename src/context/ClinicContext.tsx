import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Clinic, ClinicLocation, ClinicFeatures, SocialHandle, ClinicFacility, ClinicGoogleReview, ClinicGoogleConfig } from '../types';
import { DEFAULT_FACILITIES } from '../data/defaultFacilities';
import { updateClinicUriCascading, ClinicUriUpdateStats } from '../services/clinicUriService';
import { 
  CLINIC_YOUTUBE_VIDEOS, 
  CLINIC_GOOGLE_CONFIGS, 
  getClinicYouTubeVideos, 
  getClinicGoogleConfig,
  sanitizeClinicYouTubeVideos,
  DEFAULT_GOOGLE_BUSINESS_PROFILE_ID,
  buildGoogleReviewUrls
} from '../data/clinicMediaData';
import { sanitizeFirestoreData } from '../utils/firestoreUtils';

export const DEFAULT_CLINICS: Clinic[] = [
  {
    id: 'clinic-revon-dental',
    slug: 'revon-dental',
    name: 'Revon Multi-Specialty Medical Center',
    tagline: 'Advanced Specialist Care & Digital Health Management',
    description: 'Premier multi-specialty healthcare center providing board-certified specialist consultations, general medicine, cardiac screening, surgical procedures, and automated real-time appointment tracking.',
    phone: '+91 98765 43210',
    email: 'care@revondental.in',
    website: 'https://revondental.in',
    facilities: DEFAULT_FACILITIES,
    youtubeChannelUrl: 'https://www.youtube.com/@RevonMultiSpecialty',
    youtubeVideos: CLINIC_YOUTUBE_VIDEOS['revon-dental'],
    googleConfig: CLINIC_GOOGLE_CONFIGS['revon-dental'],
    features: {
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
    },
    locations: [
      {
        id: 'loc-indiranagar',
        name: 'Indiranagar Specialist Flagship',
        address: '100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        phone: '+91 80 2525 1100',
        email: 'indiranagar@revondental.in',
        workingHours: 'Mon - Sat: 09:00 AM - 08:00 PM',
        isPrimary: true,
      },
      {
        id: 'loc-koramangala',
        name: 'Koramangala Medical Hub',
        address: '80 Feet Road, 4th Block, Koramangala',
        city: 'Bengaluru',
        phone: '+91 80 4112 2200',
        email: 'koramangala@revondental.in',
        workingHours: 'Mon - Sat: 10:00 AM - 07:00 PM',
      },
      {
        id: 'loc-mgroad',
        name: 'MG Road Multi-Specialty Center',
        address: 'Trinity Circle, MG Road',
        city: 'Bengaluru',
        phone: '+91 80 6789 3300',
        email: 'mgroad@revondental.in',
        workingHours: 'Mon - Sun: 09:00 AM - 09:00 PM',
      }
    ],
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'clinic-smilecare',
    slug: 'smilecare',
    name: 'SmileCare Specialist Dental & Orthodontic Clinic',
    tagline: 'Specialized Dentistry, Oral Surgery & Facial Orthopedics',
    description: 'Specialist dental and oral surgery center focusing on advanced diagnostics, 3D intraoral scanning, aesthetic restorations, and gentle pediatric dental care.',
    phone: '+91 91234 56789',
    email: 'hello@smilecare.in',
    website: 'https://smilecare.in',
    facilities: DEFAULT_FACILITIES,
    youtubeChannelUrl: 'https://www.youtube.com/@SmileCareSpecialistDental',
    youtubeVideos: CLINIC_YOUTUBE_VIDEOS['smilecare'],
    googleConfig: CLINIC_GOOGLE_CONFIGS['smilecare'],
    features: {
      appointments: true,
      billing: false,
      chatbot: true,
      supportSystem: true,
      dentistBreakdown: true,
      reminders: true,
      reviews: true,
      multiLocation: true,
      facilities: true,
      finances: true,
    },
    locations: [
      {
        id: 'loc-whitefield',
        name: 'Whitefield Specialist Branch',
        address: 'ITPL Main Road, Whitefield',
        city: 'Bengaluru',
        phone: '+91 80 8888 9900',
        email: 'whitefield@smilecare.in',
        workingHours: 'Mon - Fri: 09:30 AM - 06:30 PM',
        isPrimary: true,
      },
      {
        id: 'loc-hsr',
        name: 'HSR Layout Specialist Studio',
        address: '27th Main Road, HSR Layout',
        city: 'Bengaluru',
        phone: '+91 80 7777 6600',
        email: 'hsr@smilecare.in',
        workingHours: 'Mon - Sat: 10:00 AM - 08:00 PM',
      }
    ],
    createdAt: new Date('2026-02-10T00:00:00Z').toISOString()
  },
  {
    id: 'clinic-apex-studio',
    slug: 'apex-studio',
    name: 'Apex Cardiology & Specialist Care Studio',
    tagline: 'Bespoke Multi-Specialty Consultations & Diagnostics',
    description: 'Bespoke medical clinic offering specialized diagnostic evaluations, cardiac checkups, dermatology, and digital health monitoring.',
    phone: '+91 99887 76655',
    email: 'contact@apexstudio.in',
    website: 'https://apexstudio.in',
    facilities: DEFAULT_FACILITIES,
    youtubeChannelUrl: 'https://www.youtube.com/@ApexDiagnosticCare',
    youtubeVideos: CLINIC_YOUTUBE_VIDEOS['apex-studio'],
    googleConfig: CLINIC_GOOGLE_CONFIGS['apex-studio'],
    features: {
      appointments: true,
      billing: true,
      chatbot: false,
      supportSystem: false,
      dentistBreakdown: true,
      reminders: true,
      reviews: true,
      multiLocation: false,
      facilities: true,
      finances: true,
    },
    locations: [
      {
        id: 'loc-jayanagar',
        name: 'Jayanagar Specialist Studio',
        address: '11th Main Road, Jayanagar 4th Block',
        city: 'Bengaluru',
        phone: '+91 80 3344 5566',
        email: 'jayanagar@apexstudio.in',
        workingHours: 'Mon - Sat: 10:00 AM - 07:30 PM',
        isPrimary: true,
      }
    ],
    createdAt: new Date('2026-03-15T00:00:00Z').toISOString()
  }
];

interface ClinicContextType {
  clinics: Clinic[];
  activeClinic: Clinic;
  activeLocationId: string | null;
  socialHandles: SocialHandle[];
  setActiveLocationId: (locId: string | null) => void;
  selectClinicBySlug: (slug: string) => void;
  createClinic: (clinicData: Omit<Clinic, 'id' | 'createdAt'>) => Promise<string>;
  updateClinic: (id: string, updates: Partial<Clinic>) => Promise<void>;
  updateClinicUri: (clinicId: string, oldSlug: string, newSlug: string, onProgress?: (step: string, percent: number) => void) => Promise<ClinicUriUpdateStats>;
  toggleClinicStatus: (id: string, disabledState?: boolean) => Promise<void>;
  deleteClinic: (id: string) => Promise<void>;
  fetchAndSyncGoogleReviews: (clinicId: string, profileId?: string) => Promise<{
    success: boolean;
    reviews: ClinicGoogleReview[];
    rating: number;
    totalReviews: number;
    message?: string;
  }>;
  loading: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeClinicSlug, setActiveClinicSlug] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('revon_active_clinic_slug');
      if (saved) return saved;
    } catch (e) {}
    return 'revon-dental';
  });
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Seed default clinics into Firestore if empty & associate legacy data with Revon Advance Dental Care
  useEffect(() => {
    const seedAndAssociateData = async () => {
      try {
        const seededKey = 'revon_clinics_seeded_v2';
        if (localStorage.getItem(seededKey)) return;

        const snap = await getDocs(collection(db, 'clinics'));
        if (snap.empty) {
          console.log("Seeding initial clinics into Firestore...");
          for (const c of DEFAULT_CLINICS) {
            await setDoc(doc(db, 'clinics', c.id), c);
          }
        }

        // Auto-associate legacy records with 'revon-dental'
        const collectionsToMigrate = [
          'appointments',
          'bills',
          'invoices',
          'users',
          'surgeons',
          'reviews',
          'support_queries',
          'notifications',
          'reminder_logs'
        ];

        for (const colName of collectionsToMigrate) {
          try {
            const colSnap = await getDocs(collection(db, colName));
            for (const docSnap of colSnap.docs) {
              const data = docSnap.data();
              if (!data.clinicSlug) {
                await updateDoc(doc(db, colName, docSnap.id), {
                  clinicSlug: 'revon-dental',
                  clinicId: 'c1'
                });
              }
            }
          } catch (colErr) {
            console.warn(`Collection migration skipped for ${colName}:`, colErr);
          }
        }

        // Auto-sync Google Business Profile ID 1293814119993852207 into Firestore clinics
        try {
          const googleSyncKey = 'revon_google_profile_1293814119993852207_v2';
          if (!localStorage.getItem(googleSyncKey)) {
            const clinicDocsSnap = await getDocs(collection(db, 'clinics'));
            for (const cDoc of clinicDocsSnap.docs) {
              const cData = cDoc.data() as Partial<Clinic>;
              const curPid = cData.googleConfig?.businessProfileId || cData.googleConfig?.placeId;
              if (!curPid || curPid.startsWith('ChIJ74_revon') || curPid.startsWith('ChIJ_')) {
                const gen = buildGoogleReviewUrls(DEFAULT_GOOGLE_BUSINESS_PROFILE_ID, cData.name);
                await updateDoc(doc(db, 'clinics', cDoc.id), sanitizeFirestoreData({
                  'googleConfig.businessProfileId': DEFAULT_GOOGLE_BUSINESS_PROFILE_ID,
                  'googleConfig.placeId': DEFAULT_GOOGLE_BUSINESS_PROFILE_ID,
                  'googleConfig.writeReviewUrl': gen.writeReviewUrl,
                  'googleConfig.googleMapsUrl': gen.googleMapsUrl
                }));
              }
            }
            localStorage.setItem(googleSyncKey, 'true');
          }
        } catch (syncErr) {
          console.warn("Google Business Profile sync bypassed:", syncErr);
        }

        localStorage.setItem(seededKey, 'true');
      } catch (err) {
        console.warn("Clinic seeding & migration bypassed:", err);
      }
    };

    seedAndAssociateData();
  }, []);

  // Listen to clinics real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clinics'), (snapshot) => {
      const list: Clinic[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Clinic);
      });

      if (list.length === 0) {
        setClinics(DEFAULT_CLINICS);
      } else {
        // Enrich clinics with media if missing
        const enriched = list.map((c) => {
          const fallbackGoogle = getClinicGoogleConfig(c.slug, c.name);
          const fallbackVideos = getClinicYouTubeVideos(c.slug, c.name);
          const defaultChannel = c.slug === 'revon-dental'
            ? 'https://www.youtube.com/@RevonMultiSpecialty'
            : c.slug === 'smilecare'
            ? 'https://www.youtube.com/@SmileCareSpecialistDental'
            : `https://www.youtube.com/@${c.slug}`;

          const rawVideos = (c.youtubeVideos && Array.isArray(c.youtubeVideos) && c.youtubeVideos.length > 0)
            ? c.youtubeVideos
            : fallbackVideos;
          const cleanVideos = sanitizeClinicYouTubeVideos(rawVideos);

          const rawGoogle = c.googleConfig || fallbackGoogle;
          const mergedReviews = (rawGoogle.reviews && Array.isArray(rawGoogle.reviews) && rawGoogle.reviews.length > 0)
            ? rawGoogle.reviews
            : fallbackGoogle.reviews;
          const currentPid = rawGoogle.businessProfileId || rawGoogle.placeId;
          const effectiveProfileId = (!currentPid || currentPid === 'ChIJ74_revon_demo_place_id')
            ? DEFAULT_GOOGLE_BUSINESS_PROFILE_ID
            : currentPid;
          const autoUrls = buildGoogleReviewUrls(effectiveProfileId, c.name);

          return {
            ...c,
            youtubeVideos: cleanVideos,
            youtubeChannelUrl: c.youtubeChannelUrl || defaultChannel,
            googleConfig: {
              ...fallbackGoogle,
              ...rawGoogle,
              businessProfileId: rawGoogle.businessProfileId || effectiveProfileId,
              placeId: rawGoogle.placeId || effectiveProfileId,
              reviews: mergedReviews,
              writeReviewUrl: (rawGoogle.writeReviewUrl && !rawGoogle.writeReviewUrl.includes('ChIJ74_revon'))
                ? rawGoogle.writeReviewUrl
                : autoUrls.writeReviewUrl,
              googleMapsUrl: (rawGoogle.googleMapsUrl && !rawGoogle.googleMapsUrl.includes('Revon+Multi-Specialty+Medical+Center'))
                ? rawGoogle.googleMapsUrl
                : autoUrls.googleMapsUrl,
              rating: rawGoogle.rating ?? fallbackGoogle.rating,
              totalReviews: rawGoogle.totalReviews ?? fallbackGoogle.totalReviews
            }
          };
        });
        // Sort by name
        enriched.sort((a, b) => a.name.localeCompare(b.name));
        setClinics(enriched);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Failed to listen to clinics, using static fallback:", err);
      setClinics(DEFAULT_CLINICS);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Read URL path to extract clinic slug if present
  useEffect(() => {
    const parseSlugFromUrl = () => {
      const pathname = window.location.pathname;
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0 && parts[0] !== 'dev-portal' && parts[0] !== 'login' && parts[0] !== 'register') {
        const potentialSlug = parts[0];
        setActiveClinicSlug(potentialSlug);
      }
    };

    parseSlugFromUrl();
    window.addEventListener('popstate', parseSlugFromUrl);
    return () => window.removeEventListener('popstate', parseSlugFromUrl);
  }, []);

  // Derived active clinic enriched with active socialHandles and default facilities fallback
  const baseActiveClinic = clinics.find(c => c.slug === activeClinicSlug) || clinics[0] || DEFAULT_CLINICS[0];
  const rawActiveClinic = useMemo(() => {
    if (!baseActiveClinic) return DEFAULT_CLINICS[0];

    const fallbackGoogle = getClinicGoogleConfig(baseActiveClinic.slug, baseActiveClinic.name);
    const fallbackVideos = getClinicYouTubeVideos(baseActiveClinic.slug, baseActiveClinic.name);
    const defaultChannel = baseActiveClinic.slug === 'revon-dental'
      ? 'https://www.youtube.com/@RevonMultiSpecialty'
      : baseActiveClinic.slug === 'smilecare'
      ? 'https://www.youtube.com/@SmileCareSpecialistDental'
      : `https://www.youtube.com/@${baseActiveClinic.slug}`;

    const rawVideos = (baseActiveClinic.youtubeVideos && Array.isArray(baseActiveClinic.youtubeVideos) && baseActiveClinic.youtubeVideos.length > 0)
      ? baseActiveClinic.youtubeVideos
      : fallbackVideos;
    const cleanVideos = sanitizeClinicYouTubeVideos(rawVideos);

    const rawGoogle = baseActiveClinic.googleConfig || fallbackGoogle;
    const mergedReviews = (rawGoogle.reviews && Array.isArray(rawGoogle.reviews) && rawGoogle.reviews.length > 0)
      ? rawGoogle.reviews
      : fallbackGoogle.reviews;
    const currentPid = rawGoogle.businessProfileId || rawGoogle.placeId;
    const effectiveProfileId = (!currentPid || currentPid === 'ChIJ74_revon_demo_place_id')
      ? DEFAULT_GOOGLE_BUSINESS_PROFILE_ID
      : currentPid;
    const autoUrls = buildGoogleReviewUrls(effectiveProfileId, baseActiveClinic.name);

    return {
      ...baseActiveClinic,
      youtubeVideos: cleanVideos,
      youtubeChannelUrl: baseActiveClinic.youtubeChannelUrl || defaultChannel,
      googleConfig: {
        ...fallbackGoogle,
        ...rawGoogle,
        businessProfileId: rawGoogle.businessProfileId || effectiveProfileId,
        placeId: rawGoogle.placeId || effectiveProfileId,
        reviews: mergedReviews,
        writeReviewUrl: (rawGoogle.writeReviewUrl && !rawGoogle.writeReviewUrl.includes('ChIJ74_revon'))
          ? rawGoogle.writeReviewUrl
          : autoUrls.writeReviewUrl,
        googleMapsUrl: (rawGoogle.googleMapsUrl && !rawGoogle.googleMapsUrl.includes('Revon+Multi-Specialty+Medical+Center'))
          ? rawGoogle.googleMapsUrl
          : autoUrls.googleMapsUrl,
        rating: rawGoogle.rating ?? fallbackGoogle.rating,
        totalReviews: rawGoogle.totalReviews ?? fallbackGoogle.totalReviews
      },
      features: {
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
        ...(baseActiveClinic.features || {}),
      },
      facilities: (baseActiveClinic.facilities && baseActiveClinic.facilities.length > 0)
        ? baseActiveClinic.facilities
        : DEFAULT_FACILITIES
    };
  }, [baseActiveClinic]);

  // Real-time listener for clinic social handles (returns only active social media links)
  useEffect(() => {
    const handleDocId = `social_handles_${activeClinicSlug}`;
    const unsub = onSnapshot(doc(db, 'settings', handleDocId), (docSnap) => {
      let handlesList: SocialHandle[] = [];

      if (docSnap.exists() && docSnap.data() && Array.isArray(docSnap.data().handles) && docSnap.data().handles.length > 0) {
        handlesList = docSnap.data().handles;
      } else if (rawActiveClinic && Array.isArray(rawActiveClinic.socialHandles) && rawActiveClinic.socialHandles.length > 0) {
        handlesList = rawActiveClinic.socialHandles;
      } else {
        handlesList = [
          { id: 'facebook', name: 'Facebook', url: 'https://facebook.com', isActive: true, platform: 'facebook' },
          { id: 'whatsapp', name: 'WhatsApp', url: 'https://wa.me/919876543210', isActive: true, platform: 'whatsapp' },
          { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', isActive: true, platform: 'instagram' },
          { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', isActive: false, platform: 'linkedin' },
          { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', isActive: false, platform: 'youtube' }
        ];
      }

      // Filter to return ONLY active social media links
      const activeOnly = handlesList.filter((h: SocialHandle) => h && (h.isActive === true || (h.isActive as any) === 'true'));
      setSocialHandles(activeOnly);
    }, (err) => {
      console.warn("Failed to listen to social handles in ClinicProvider:", err);
      const fallbackList: SocialHandle[] = (rawActiveClinic && Array.isArray(rawActiveClinic.socialHandles) && rawActiveClinic.socialHandles.length > 0)
        ? rawActiveClinic.socialHandles
        : [
            { id: 'facebook', name: 'Facebook', url: 'https://facebook.com', isActive: true, platform: 'facebook' },
            { id: 'whatsapp', name: 'WhatsApp', url: 'https://wa.me/919876543210', isActive: true, platform: 'whatsapp' },
            { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', isActive: true, platform: 'instagram' }
          ];
      setSocialHandles(fallbackList.filter((h: SocialHandle) => h && (h.isActive === true || (h.isActive as any) === 'true')));
    });

    return unsub;
  }, [activeClinicSlug, rawActiveClinic?.socialHandles]);

  const activeClinic = useMemo(() => {
    return {
      ...rawActiveClinic,
      socialHandles: socialHandles
    };
  }, [rawActiveClinic, socialHandles]);

  // Sync default location when active clinic changes
  useEffect(() => {
    if (activeClinic && activeClinic.locations && activeClinic.locations.length > 0) {
      if (!activeLocationId || !activeClinic.locations.some(l => l.id === activeLocationId)) {
        const primaryLoc = activeClinic.locations.find(l => l.isPrimary) || activeClinic.locations[0];
        setActiveLocationId(primaryLoc.id);
      }
    } else {
      setActiveLocationId(null);
    }
  }, [activeClinic, activeLocationId]);

  const selectClinicBySlug = (slug: string) => {
    setActiveClinicSlug(slug);
    try {
      localStorage.setItem('revon_active_clinic_slug', slug);
    } catch (e) {}
  };

  const createClinic = async (clinicData: Omit<Clinic, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const id = `clinic-${Date.now()}`;
      const now = new Date().toISOString();
      const newClinic: Clinic = {
        ...clinicData,
        id,
        createdAt: now
      };

      setClinics(prev => [...prev.filter(c => c.id !== id), newClinic]);
      await setDoc(doc(db, 'clinics', id), sanitizeFirestoreData(newClinic));
      setActiveClinicSlug(newClinic.slug);
      return id;
    } catch (err) {
      console.error("Failed to create clinic:", err);
      throw err;
    }
  };

  const updateClinic = async (id: string, updates: Partial<Clinic>): Promise<void> => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      setClinics(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
      await setDoc(doc(db, 'clinics', id), sanitizeFirestoreData(updatedData), { merge: true });
    } catch (err) {
      console.error("Failed to update clinic:", err);
      throw err;
    }
  };

  const toggleClinicStatus = async (id: string, disabledState?: boolean): Promise<void> => {
    try {
      const target = clinics.find(c => c.id === id);
      if (!target) return;
      const currentIsDisabled = target.status === 'disabled' || target.isDisabled === true;
      const newIsDisabled = disabledState !== undefined ? disabledState : !currentIsDisabled;
      const newStatus = newIsDisabled ? 'disabled' : 'active';

      const updates = {
        status: newStatus as 'active' | 'disabled',
        isDisabled: newIsDisabled,
        updatedAt: new Date().toISOString()
      };

      setClinics(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      await setDoc(doc(db, 'clinics', id), sanitizeFirestoreData(updates), { merge: true });
    } catch (err) {
      console.error("Failed to toggle clinic status:", err);
      throw err;
    }
  };

  const updateClinicUri = async (
    clinicId: string,
    oldSlug: string,
    newSlug: string,
    onProgress?: (step: string, percent: number) => void
  ): Promise<ClinicUriUpdateStats> => {
    try {
      const stats = await updateClinicUriCascading(clinicId, oldSlug, newSlug, onProgress);

      const now = new Date().toISOString();
      setClinics(prev =>
        prev.map(c => (c.id === clinicId || c.slug === oldSlug ? { ...c, slug: newSlug, updatedAt: now } : c))
      );

      if (activeClinicSlug === oldSlug) {
        setActiveClinicSlug(newSlug);
        try {
          localStorage.setItem('revon_active_clinic_slug', newSlug);
        } catch (e) {}

        try {
          const currentPath = window.location.pathname;
          if (currentPath.startsWith(`/${oldSlug}`)) {
            const restPath = currentPath.replace(`/${oldSlug}`, `/${newSlug}`);
            window.history.replaceState({}, '', restPath);
          }
        } catch (e) {}
      }

      return stats;
    } catch (err) {
      console.error("Failed to update clinic URI cascading:", err);
      throw err;
    }
  };

  const deleteClinic = async (id: string): Promise<void> => {
    try {
      setClinics(prev => prev.filter(c => c.id !== id));
      await deleteDoc(doc(db, 'clinics', id));
    } catch (err) {
      console.error("Failed to delete clinic:", err);
      throw err;
    }
  };

  const fetchAndSyncGoogleReviews = async (
    clinicId: string,
    profileId?: string
  ): Promise<{
    success: boolean;
    reviews: ClinicGoogleReview[];
    rating: number;
    totalReviews: number;
    message?: string;
  }> => {
    try {
      const target = clinics.find(c => c.id === clinicId || c.slug === clinicId) || activeClinic;
      if (!target) {
        throw new Error('Target clinic could not be resolved.');
      }

      const cleanProfileId = (
        profileId ||
        target.googleConfig?.businessProfileId ||
        target.googleConfig?.placeId ||
        DEFAULT_GOOGLE_BUSINESS_PROFILE_ID
      ).trim();

      const response = await fetch('/api/fetch-google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: cleanProfileId,
          clinicName: target.name,
          clinicSlug: target.slug,
          clinicAddress: target.locations?.[0]?.address || 'Bengaluru, India'
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reviews from Google');
      }

      const urls = buildGoogleReviewUrls(cleanProfileId, target.name);
      const incomingReviews = Array.isArray(data.reviews) ? data.reviews : [];

      const updatedConfig: ClinicGoogleConfig = {
        rating: Number(data.rating) || 4.9,
        totalReviews: Number(data.totalReviews) || Math.max(120, incomingReviews.length * 30),
        businessProfileId: cleanProfileId,
        placeId: cleanProfileId,
        googleMapsUrl: urls.googleMapsUrl,
        writeReviewUrl: urls.writeReviewUrl,
        reviews: incomingReviews
      };

      await updateClinic(target.id, {
        googleConfig: updatedConfig
      });

      return {
        success: true,
        reviews: incomingReviews,
        rating: updatedConfig.rating,
        totalReviews: updatedConfig.totalReviews,
        message: data.message || `Successfully fetched ${incomingReviews.length} reviews from Google.`
      };
    } catch (err: any) {
      console.error('Failed to fetch and sync Google reviews:', err);
      throw err;
    }
  };

  return (
    <ClinicContext.Provider
      value={{
        clinics,
        activeClinic,
        activeLocationId,
        socialHandles,
        setActiveLocationId,
        selectClinicBySlug,
        createClinic,
        updateClinic,
        updateClinicUri,
        toggleClinicStatus,
        deleteClinic,
        fetchAndSyncGoogleReviews,
        loading
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
