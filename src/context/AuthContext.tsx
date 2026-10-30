import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  User as FirebaseUser,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, phone: string, role?: UserRole, clinicSlug?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isRegisteringRef = useRef(false);

  // Fetch or create user profile in Firestore
  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      const adminEmails = [
        'modinshaali786@gmail.com',
        'mhodinshamadari@gmail.com',
        'admin@revondental.in',
        'admin@gmail.com'
      ];

      const snapData = userSnap.exists() ? userSnap.data() : null;
      const isSuperAdminUser = Boolean(
        (firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase())) ||
        snapData?.role === 'super-admin' ||
        snapData?.isSuperAdmin === true
      );

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        let needsUpdate = false;
        const updates: Partial<UserProfile> = {};

        if (isSuperAdminUser && data.role !== 'super-admin') {
          updates.role = 'super-admin';
          data.role = 'super-admin';
          needsUpdate = true;
        }

        if (isSuperAdminUser && !data.isSuperAdmin) {
          updates.isSuperAdmin = true;
          data.isSuperAdmin = true;
          needsUpdate = true;
        }

        // If user profile does not have a clinicSlug, assign the current active clinic slug
        if (!data.clinicSlug) {
          let activeSlug = 'revon-dental';
          try {
            const pathSlug = window.location.pathname.split('/').filter(Boolean)[0];
            if (pathSlug && pathSlug !== 'login' && pathSlug !== 'register' && pathSlug !== 'dev-portal') {
              activeSlug = pathSlug;
            } else {
              const stored = localStorage.getItem('revon_active_clinic_slug');
              if (stored) activeSlug = stored;
            }
          } catch (e) {}
          updates.clinicSlug = activeSlug;
          data.clinicSlug = activeSlug;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(userRef, updates);
        }
        return data;
      } else {
        const role: UserRole = isSuperAdminUser ? 'super-admin' : 'patient';
        let activeSlug = 'revon-dental';
        try {
          const pathSlug = window.location.pathname.split('/').filter(Boolean)[0];
          if (pathSlug && pathSlug !== 'login' && pathSlug !== 'register' && pathSlug !== 'dev-portal') {
            activeSlug = pathSlug;
          } else {
            const stored = localStorage.getItem('revon_active_clinic_slug');
            if (stored) activeSlug = stored;
          }
        } catch (e) {}

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || (isSuperAdminUser ? 'Super Admin / Developer' : 'New Patient'),
          email: firebaseUser.email || '',
          role: role,
          phone: firebaseUser.phoneNumber || '',
          createdAt: new Date().toISOString(),
          isSuperAdmin: isSuperAdminUser,
          clinicSlug: activeSlug
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        if (!isRegisteringRef.current) {
          const profile = await fetchUserProfile(firebaseUser);
          setUserProfile(profile);

          const userRef = doc(db, 'users', firebaseUser.uid);
          unsubProfile = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as UserProfile);
            }
          }, (err) => {
            console.error("User profile real-time snapshot error:", err);
          });
        }
      } else {
        setUserProfile(null);
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const mapAuthError = (err: any): Error => {
    if (!err) return new Error("An unknown error occurred.");
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return new Error("Incorrect email address or password. Please verify your credentials and try again.");
      case 'auth/invalid-email':
        return new Error("Please enter a valid email address.");
      case 'auth/email-already-in-use':
        return new Error("This email address is already registered. Please sign in instead.");
      case 'auth/weak-password':
        return new Error("The password is too weak. It must be at least 6 characters long.");
      case 'auth/too-many-requests':
        return new Error("This account has been temporarily locked due to multiple failed login attempts. You can immediately reset your password or try again later.");
      case 'auth/user-disabled':
        return new Error("This user account has been disabled. Please contact the administrator.");
      case 'auth/operation-not-allowed':
        return new Error("Email/Password Sign-In is currently disabled in your Firebase configuration. Please enable it in the Firebase console.");
      default:
        return new Error(err.message || "An unexpected error occurred during authentication.");
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoading(false);
      throw mapAuthError(err);
    }
  };

  const registerWithEmail = async (
    email: string, 
    password: string, 
    displayName: string, 
    phone: string,
    role: UserRole = 'patient',
    clinicSlug?: string
  ) => {
    setLoading(true);
    isRegisteringRef.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      // Update firebase user profile displayName
      await firebaseUpdateProfile(credential.user, { displayName });
      
      let targetSlug = clinicSlug;
      if (!targetSlug) {
        try {
          const pathSlug = window.location.pathname.split('/').filter(Boolean)[0];
          if (pathSlug && pathSlug !== 'login' && pathSlug !== 'register' && pathSlug !== 'dev-portal') {
            targetSlug = pathSlug;
          } else {
            const stored = localStorage.getItem('revon_active_clinic_slug');
            if (stored) targetSlug = stored;
          }
        } catch (e) {}
      }
      if (!targetSlug) targetSlug = 'revon-dental';

      // Create user profile document in firestore
      const newProfile: UserProfile = {
        uid: credential.user.uid,
        displayName,
        email,
        role,
        phone,
        createdAt: new Date().toISOString(),
        clinicSlug: targetSlug
      };
      
      await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      setUserProfile(newProfile);
    } catch (err: any) {
      throw mapAuthError(err);
    } finally {
      isRegisteringRef.current = false;
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await fetchUserProfile(result.user);
        setUserProfile(profile);
      }
    } catch (err: any) {
      setLoading(false);
      throw mapAuthError(err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      throw mapAuthError(err);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setLoading(false);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("No authenticated user");
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data);
    
    // Update local state
    if (userProfile) {
      setUserProfile({ ...userProfile, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signOut,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      resetPassword,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
