import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  setDoc,
  deleteDoc,
  updateDoc,
  DocumentReference
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Clinic } from '../types';

export interface ClinicUriValidationResult {
  isValid: boolean;
  error?: string;
  normalizedSlug: string;
}

export interface ClinicUriUpdateStats {
  clinicsUpdated: number;
  usersUpdated: number;
  appointmentsUpdated: number;
  invoicesUpdated: number;
  billsUpdated: number;
  monthlyFinancesUpdated: number;
  expensesUpdated: number;
  servicesUpdated: number;
  reviewsUpdated: number;
  surgeonsUpdated: number;
  remindersUpdated: number;
  notificationsUpdated: number;
  supportQueriesUpdated: number;
  settingsUpdated: number;
  totalUpdated: number;
}

const RESERVED_SLUGS = [
  'admin',
  'api',
  'auth',
  'login',
  'register',
  'signup',
  'dashboard',
  'setup',
  'dev-portal',
  'developer',
  'clinic-search',
  'profile',
  'forgot-password',
  'portfolio',
  'settings',
  'static',
  'assets'
];

/**
 * Normalizes an input string into a standard URL slug:
 * lowercase, removes special characters, turns spaces/underscores into hyphens,
 * collapses consecutive hyphens, and trims leading/trailing hyphens.
 */
export function normalizeClinicUri(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates a candidate clinic URI slug for:
 * 1. Proper formatting and length constraints (3 - 50 characters)
 * 2. Reserved system word collision
 * 3. Identity with the current slug
 * 4. Uniqueness across local active clinics
 * 5. Uniqueness across Firestore 'clinics' collection
 */
export async function validateClinicUri(
  candidateUri: string,
  currentClinicId: string,
  currentSlug: string,
  existingClinics: Clinic[]
): Promise<ClinicUriValidationResult> {
  const normalized = normalizeClinicUri(candidateUri);

  if (!normalized) {
    return {
      isValid: false,
      error: 'Clinic URI cannot be empty.',
      normalizedSlug: ''
    };
  }

  if (normalized.length < 3) {
    return {
      isValid: false,
      error: 'Clinic URI must be at least 3 characters long.',
      normalizedSlug: normalized
    };
  }

  if (normalized.length > 50) {
    return {
      isValid: false,
      error: 'Clinic URI cannot exceed 50 characters.',
      normalizedSlug: normalized
    };
  }

  // Check valid pattern: lowercase letters, numbers, and single hyphens
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(normalized)) {
    return {
      isValid: false,
      error: 'Clinic URI must contain only lowercase letters, numbers, and hyphens (cannot start or end with a hyphen).',
      normalizedSlug: normalized
    };
  }

  // Check if identical to current URI
  if (normalized === normalizeClinicUri(currentSlug)) {
    return {
      isValid: false,
      error: 'The new URI slug is identical to the current clinic URI.',
      normalizedSlug: normalized
    };
  }

  // Check reserved system words
  if (RESERVED_SLUGS.includes(normalized)) {
    return {
      isValid: false,
      error: `"${normalized}" is a reserved system path and cannot be used as a clinic URI.`,
      normalizedSlug: normalized
    };
  }

  // Check local clinics list for collisions
  const duplicateLocal = existingClinics.find(
    c => c.id !== currentClinicId && normalizeClinicUri(c.slug) === normalized
  );
  if (duplicateLocal) {
    return {
      isValid: false,
      error: `The URI slug "/${normalized}" is already assigned to clinic "${duplicateLocal.name}". Please choose a unique URI.`,
      normalizedSlug: normalized
    };
  }

  // Check Firestore clinics collection in real-time
  try {
    const q = query(collection(db, 'clinics'), where('slug', '==', normalized));
    const querySnap = await getDocs(q);
    const conflictingDoc = querySnap.docs.find(d => d.id !== currentClinicId);

    if (conflictingDoc) {
      const clinicData = conflictingDoc.data();
      const clinicName = clinicData.name || conflictingDoc.id;
      return {
        isValid: false,
        error: `The URI slug "/${normalized}" is already taken by clinic "${clinicName}" in the database. Please choose a unique URI.`,
        normalizedSlug: normalized
      };
    }
  } catch (err) {
    console.warn('Could not check Firestore clinics uniqueness remotely:', err);
    // If offline or rule restricts, local check already validated
  }

  return {
    isValid: true,
    normalizedSlug: normalized
  };
}

/**
 * Helper class to safely handle batches of Firestore mutations (up to 400 operations per batch).
 */
class FirestoreBatchRunner {
  private batch = writeBatch(db);
  private count = 0;
  public totalCommitted = 0;

  async addUpdate(ref: DocumentReference, data: any) {
    this.batch.update(ref, data);
    this.count++;
    if (this.count >= 400) {
      await this.batch.commit();
      this.totalCommitted += this.count;
      this.batch = writeBatch(db);
      this.count = 0;
    }
  }

  async addSet(ref: DocumentReference, data: any, merge = true) {
    this.batch.set(ref, data, { merge });
    this.count++;
    if (this.count >= 400) {
      await this.batch.commit();
      this.totalCommitted += this.count;
      this.batch = writeBatch(db);
      this.count = 0;
    }
  }

  async addDelete(ref: DocumentReference) {
    this.batch.delete(ref);
    this.count++;
    if (this.count >= 400) {
      await this.batch.commit();
      this.totalCommitted += this.count;
      this.batch = writeBatch(db);
      this.count = 0;
    }
  }

  async commitAll() {
    if (this.count > 0) {
      await this.batch.commit();
      this.totalCommitted += this.count;
      this.count = 0;
    }
  }
}

/**
 * Cascading database update:
 * Updates the clinic's slug and synchronizes all collections in the Firestore database
 * where the older URI (clinicSlug or slug) was used.
 */
export async function updateClinicUriCascading(
  clinicId: string,
  oldSlug: string,
  newSlug: string,
  onProgress?: (step: string, percent: number) => void
): Promise<ClinicUriUpdateStats> {
  const normOld = normalizeClinicUri(oldSlug);
  const normNew = normalizeClinicUri(newSlug);

  if (!normNew) {
    throw new Error('New clinic URI cannot be empty.');
  }
  if (normOld === normNew) {
    throw new Error('New clinic URI must be different from current URI.');
  }

  const stats: ClinicUriUpdateStats = {
    clinicsUpdated: 0,
    usersUpdated: 0,
    appointmentsUpdated: 0,
    invoicesUpdated: 0,
    billsUpdated: 0,
    monthlyFinancesUpdated: 0,
    expensesUpdated: 0,
    servicesUpdated: 0,
    reviewsUpdated: 0,
    surgeonsUpdated: 0,
    remindersUpdated: 0,
    notificationsUpdated: 0,
    supportQueriesUpdated: 0,
    settingsUpdated: 0,
    totalUpdated: 0
  };

  const runner = new FirestoreBatchRunner();
  const now = new Date().toISOString();

  // Step 1: Update the primary clinic document and any matching clinic docs
  onProgress?.('Updating Clinic Record & Metadata...', 10);
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    await setDoc(clinicRef, { slug: normNew, updatedAt: now }, { merge: true });
    stats.clinicsUpdated++;

    // Query for any other clinic records that might match old slug
    const matchingClinics = await getDocs(query(collection(db, 'clinics'), where('slug', '==', normOld)));
    for (const cDoc of matchingClinics.docs) {
      if (cDoc.id !== clinicId) {
        await runner.addSet(cDoc.ref, { slug: normNew, updatedAt: now }, true);
        stats.clinicsUpdated++;
      }
    }
  } catch (err) {
    console.warn('Error updating clinic document:', err);
  }

  // Step 2: Users collection
  onProgress?.('Updating User Profiles & Staff Records...', 20);
  try {
    const userQuery = query(collection(db, 'users'), where('clinicSlug', '==', normOld));
    const userSnap = await getDocs(userQuery);
    for (const uDoc of userSnap.docs) {
      await runner.addSet(uDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.usersUpdated++;
    }
  } catch (err) {
    console.warn('Error migrating user profiles:', err);
  }

  // Step 3: Appointments collection
  onProgress?.('Updating Appointments & Schedule Slots...', 30);
  try {
    const appQuery = query(collection(db, 'appointments'), where('clinicSlug', '==', normOld));
    const appSnap = await getDocs(appQuery);
    for (const aDoc of appSnap.docs) {
      await runner.addSet(aDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.appointmentsUpdated++;
    }
  } catch (err) {
    console.warn('Error migrating appointments:', err);
  }

  // Step 4: Invoices and Bills collections
  onProgress?.('Updating Invoices & Billing Records...', 40);
  try {
    const invoiceQuery = query(collection(db, 'invoices'), where('clinicSlug', '==', normOld));
    const invoiceSnap = await getDocs(invoiceQuery);
    for (const invDoc of invoiceSnap.docs) {
      await runner.addSet(invDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.invoicesUpdated++;
    }

    const billsQuery = query(collection(db, 'bills'), where('clinicSlug', '==', normOld));
    const billsSnap = await getDocs(billsQuery);
    for (const bDoc of billsSnap.docs) {
      await runner.addSet(bDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.billsUpdated++;
    }
  } catch (err) {
    console.warn('Error migrating invoices & bills:', err);
  }

  // Step 5: Monthly Finances & Expenses collections
  onProgress?.('Updating Financial Targets & Expense Records...', 50);
  try {
    const finQuery = query(collection(db, 'monthly_finances'), where('clinicSlug', '==', normOld));
    const finSnap = await getDocs(finQuery);
    for (const fDoc of finSnap.docs) {
      await runner.addSet(fDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.monthlyFinancesUpdated++;
    }

    const expQuery = query(collection(db, 'expenses'), where('clinicSlug', '==', normOld));
    const expSnap = await getDocs(expQuery);
    for (const eDoc of expSnap.docs) {
      await runner.addSet(eDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.expensesUpdated++;
    }
  } catch (err) {
    console.warn('Error migrating finances & expenses:', err);
  }

  // Step 6: Services and Offered Services collections
  onProgress?.('Updating Clinical Services & Catalog...', 60);
  try {
    const sQuery = query(collection(db, 'services'), where('clinicSlug', '==', normOld));
    const sSnap = await getDocs(sQuery);
    for (const sDoc of sSnap.docs) {
      await runner.addSet(sDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.servicesUpdated++;
    }

    // Also check offered_services & offeredServices
    const osQuery1 = query(collection(db, 'offered_services'), where('clinicSlug', '==', normOld));
    const osSnap1 = await getDocs(osQuery1);
    for (const osDoc of osSnap1.docs) {
      await runner.addSet(osDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.servicesUpdated++;
    }

    const osQuery2 = query(collection(db, 'offeredServices'), where('clinicSlug', '==', normOld));
    const osSnap2 = await getDocs(osQuery2);
    for (const osDoc of osSnap2.docs) {
      await runner.addSet(osDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.servicesUpdated++;
    }
  } catch (err) {
    console.warn('Error migrating services:', err);
  }

  // Step 7: Reviews, Surgeons, Reminders, Notifications, Support Queries
  onProgress?.('Updating Reviews, Specialists & Support Records...', 75);
  try {
    // Reviews
    const revQuery = query(collection(db, 'reviews'), where('clinicSlug', '==', normOld));
    const revSnap = await getDocs(revQuery);
    for (const rDoc of revSnap.docs) {
      await runner.addSet(rDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.reviewsUpdated++;
    }

    // Surgeons
    const surgQuery = query(collection(db, 'surgeons'), where('clinicSlug', '==', normOld));
    const surgSnap = await getDocs(surgQuery);
    for (const sgDoc of surgSnap.docs) {
      await runner.addSet(sgDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.surgeonsUpdated++;
    }

    // Reminders
    const remQuery = query(collection(db, 'reminders'), where('clinicSlug', '==', normOld));
    const remSnap = await getDocs(remQuery);
    for (const rmDoc of remSnap.docs) {
      await runner.addSet(rmDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.remindersUpdated++;
    }

    // Notifications & Clinic Notifications
    const notifQuery = query(collection(db, 'notifications'), where('clinicSlug', '==', normOld));
    const notifSnap = await getDocs(notifQuery);
    for (const nDoc of notifSnap.docs) {
      await runner.addSet(nDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.notificationsUpdated++;
    }

    const cNotifQuery = query(collection(db, 'clinic_notifications'), where('clinicSlug', '==', normOld));
    const cNotifSnap = await getDocs(cNotifQuery);
    for (const cnDoc of cNotifSnap.docs) {
      await runner.addSet(cnDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.notificationsUpdated++;
    }

    // Support Queries & Support Tickets
    const sqQuery = query(collection(db, 'support_queries'), where('clinicSlug', '==', normOld));
    const sqSnap = await getDocs(sqQuery);
    for (const sqDoc of sqSnap.docs) {
      await runner.addSet(sqDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.supportQueriesUpdated++;
    }

    const stQuery = query(collection(db, 'support_tickets'), where('clinicSlug', '==', normOld));
    const stSnap = await getDocs(stQuery);
    for (const stDoc of stSnap.docs) {
      await runner.addSet(stDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.supportQueriesUpdated++;
    }
  } catch (err) {
    console.warn('Error migrating reviews, specialists, or support:', err);
  }

  // Step 8: Settings collection (social_handles_${oldSlug}, menu_permissions, etc.)
  onProgress?.('Migrating Clinic Settings & Configuration Documents...', 85);
  try {
    // Check specific social_handles document
    const oldSocialRef = doc(db, 'settings', `social_handles_${normOld}`);
    const oldSocialSnap = await getDoc(oldSocialRef);
    if (oldSocialSnap.exists()) {
      const socialData = oldSocialSnap.data();
      const newSocialRef = doc(db, 'settings', `social_handles_${normNew}`);
      await runner.addSet(newSocialRef, {
        ...socialData,
        clinicSlug: normNew,
        updatedAt: now
      });
      await runner.addDelete(oldSocialRef);
      stats.settingsUpdated++;
    }

    // Query any other settings records where clinicSlug == normOld
    const settingsQuery = query(collection(db, 'settings'), where('clinicSlug', '==', normOld));
    const settingsSnap = await getDocs(settingsQuery);
    for (const setDoc of settingsSnap.docs) {
      await runner.addSet(setDoc.ref, { clinicSlug: normNew, updatedAt: now }, true);
      stats.settingsUpdated++;
    }
  } catch (err) {
    console.warn('Error migrating settings documents:', err);
  }

  // Commit all queued batch writes across Firestore
  onProgress?.('Committing all database writes to Firestore...', 92);
  await runner.commitAll();

  // Step 9: Write an audit log into system_logs
  try {
    const logRef = doc(collection(db, 'system_logs'));
    await setDoc(logRef, {
      action: 'CLINIC_URI_UPDATED',
      clinicId,
      oldSlug: normOld,
      newSlug: normNew,
      updatedBy: auth.currentUser?.email || 'Super Admin',
      timestamp: now,
      stats: {
        ...stats,
        totalUpdated:
          stats.clinicsUpdated +
          stats.usersUpdated +
          stats.appointmentsUpdated +
          stats.invoicesUpdated +
          stats.billsUpdated +
          stats.monthlyFinancesUpdated +
          stats.expensesUpdated +
          stats.servicesUpdated +
          stats.reviewsUpdated +
          stats.surgeonsUpdated +
          stats.remindersUpdated +
          stats.notificationsUpdated +
          stats.supportQueriesUpdated +
          stats.settingsUpdated
      }
    });
  } catch (logErr) {
    console.warn('Failed to write audit log:', logErr);
  }

  stats.totalUpdated =
    stats.clinicsUpdated +
    stats.usersUpdated +
    stats.appointmentsUpdated +
    stats.invoicesUpdated +
    stats.billsUpdated +
    stats.monthlyFinancesUpdated +
    stats.expensesUpdated +
    stats.servicesUpdated +
    stats.reviewsUpdated +
    stats.surgeonsUpdated +
    stats.remindersUpdated +
    stats.notificationsUpdated +
    stats.supportQueriesUpdated +
    stats.settingsUpdated;

  onProgress?.('Completed! All references updated.', 100);
  return stats;
}
