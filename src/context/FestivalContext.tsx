import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FestivalConfig, FestivalType, ParticleType, ParticleIntensity } from '../types';

export const FESTIVAL_PRESETS: Record<FestivalType, Omit<FestivalConfig, 'updatedAt' | 'updatedBy'>> = {
  eid: {
    enabled: true,
    festivalType: 'eid',
    title: 'Eid Mubarak Celebration 🌙',
    bannerMessage: 'Wishing you and your loved ones a blissful, happy, and prosperous Eid Mubarak! 🌙✨',
    particleType: 'moons',
    particleIntensity: 'medium',
    showGarland: true,
    showBanner: true,
    primaryColor: '#0d9488',
  },
  diwali: {
    enabled: true,
    festivalType: 'diwali',
    title: 'Happy Diwali / Deepavali 🪔',
    bannerMessage: 'May the divine festival of lights illuminate your life with health, happiness, and prosperity! 🪔✨',
    particleType: 'diyas',
    particleIntensity: 'medium',
    showGarland: true,
    showBanner: true,
    primaryColor: '#d97706',
  },
  christmas: {
    enabled: true,
    festivalType: 'christmas',
    title: 'Merry Christmas & Happy Holidays 🎄',
    bannerMessage: 'Wishing you peace, joy, and healthy smiles this festive holiday season! 🎄❄️',
    particleType: 'snow',
    particleIntensity: 'medium',
    showGarland: true,
    showBanner: true,
    primaryColor: '#dc2626',
  },
  holi: {
    enabled: true,
    festivalType: 'holi',
    title: 'Happy Holi Festival of Colors 🎨',
    bannerMessage: 'May your life be filled with vibrant colors of happiness, good health, and joy! 🎨✨',
    particleType: 'confetti',
    particleIntensity: 'medium',
    showGarland: true,
    showBanner: true,
    primaryColor: '#8b5cf6',
  },
  newyear: {
    enabled: true,
    festivalType: 'newyear',
    title: 'Happy New Year Celebration 🎆',
    bannerMessage: 'Wishing you a sparkling, joyful, and healthy Happy New Year ahead! 🎆🥂',
    particleType: 'fireworks',
    particleIntensity: 'high',
    showGarland: true,
    showBanner: true,
    primaryColor: '#0284c7',
  },
  independence: {
    enabled: true,
    festivalType: 'independence',
    title: 'Happy Independence Day 🇮🇳',
    bannerMessage: 'Celebrating freedom, unity, and progress! Happy Independence Day! 🇮🇳✨',
    particleType: 'confetti',
    particleIntensity: 'medium',
    showGarland: true,
    showBanner: true,
    primaryColor: '#ea580c',
  },
  custom: {
    enabled: true,
    festivalType: 'custom',
    title: 'Special Celebration ✨',
    bannerMessage: 'Welcome to our clinic celebration! Wishing you wellness & happiness. ✨',
    particleType: 'stars',
    particleIntensity: 'medium',
    showGarland: true,
    showBanner: true,
    primaryColor: '#0d9488',
  }
};

export const DEFAULT_FESTIVAL_CONFIG: FestivalConfig = {
  enabled: false,
  festivalType: 'eid',
  title: 'Eid Mubarak Celebration 🌙',
  bannerMessage: 'Wishing you and your loved ones a blissful, happy, and prosperous Eid Mubarak! 🌙✨',
  particleType: 'moons',
  particleIntensity: 'medium',
  showGarland: true,
  showBanner: true,
  primaryColor: '#0d9488',
  updatedAt: new Date().toISOString()
};

interface FestivalContextType {
  festivalConfig: FestivalConfig;
  updateFestivalConfig: (newConfig: Partial<FestivalConfig>, updatedByEmail?: string) => Promise<void>;
  applyPreset: (presetType: FestivalType, updatedByEmail?: string) => Promise<void>;
  toggleFestival: (enabled: boolean, updatedByEmail?: string) => Promise<void>;
  loading: boolean;
}

const FestivalContext = createContext<FestivalContextType | undefined>(undefined);

export function FestivalProvider({ children }: { children: ReactNode }) {
  const [festivalConfig, setFestivalConfig] = useState<FestivalConfig>(DEFAULT_FESTIVAL_CONFIG);
  const [loading, setLoading] = useState(true);

  // Listen to Firestore real-time settings/festival
  useEffect(() => {
    const docRef = doc(db, 'settings', 'festival');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as FestivalConfig;
        setFestivalConfig(data);
      } else {
        setFestivalConfig(DEFAULT_FESTIVAL_CONFIG);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore festival settings read failed, using default:", err);
      // Fallback to local storage if firestore error
      try {
        const saved = localStorage.getItem('revon_festival_config');
        if (saved) {
          setFestivalConfig(JSON.parse(saved));
        }
      } catch (e) {}
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateFestivalConfig = async (newConfig: Partial<FestivalConfig>, updatedByEmail?: string) => {
    const updated: FestivalConfig = {
      ...festivalConfig,
      ...newConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByEmail || 'Admin'
    };
    
    setFestivalConfig(updated);
    try {
      localStorage.setItem('revon_festival_config', JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'festival'), updated, { merge: true });
    } catch (err) {
      console.warn("Failed to persist festival config to Firestore:", err);
    }
  };

  const applyPreset = async (presetType: FestivalType, updatedByEmail?: string) => {
    const preset = FESTIVAL_PRESETS[presetType];
    await updateFestivalConfig({
      ...preset,
      enabled: true
    }, updatedByEmail);
  };

  const toggleFestival = async (enabled: boolean, updatedByEmail?: string) => {
    await updateFestivalConfig({ enabled }, updatedByEmail);
  };

  return (
    <FestivalContext.Provider value={{
      festivalConfig,
      updateFestivalConfig,
      applyPreset,
      toggleFestival,
      loading
    }}>
      {children}
    </FestivalContext.Provider>
  );
}

export function useFestival() {
  const context = useContext(FestivalContext);
  if (!context) {
    throw new Error('useFestival must be used within a FestivalProvider');
  }
  return context;
}
