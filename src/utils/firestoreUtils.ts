import type { ClinicLiveStatus, DoctorAvailability } from '../types';

/**
 * Recursively cleans and removes all `undefined` fields from an object,
 * array, or nested structure. Firestore's setDoc and updateDoc throw
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 * if any property or sub-property is undefined.
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === undefined) {
    return undefined as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Preserve native Dates
  if (data instanceof Date) {
    return data;
  }

  // Preserve Firestore FieldValue or Timestamp instances if present
  if ((data as any).toMillis || (data as any).constructor?.name === 'FieldValue') {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeFirestoreData(value);
    }
  }
  return cleaned as T;
}

export const FIRESTORE_QUOTA_UPGRADE_URL =
  'https://console.firebase.google.com/project/gpslocationfortravellers/firestore/databases/ai-studio-dentalclinicsche-a8e7add1-2304-43a4-bdbd-fb178b060b74/data?openUpgradeDialog=true';
export const FIRESTORE_PRICING_URL = 'https://firebase.google.com/pricing#cloud-firestore';

const QUOTA_PAUSE_DATE_KEY = 'revon_firestore_quota_paused_pt_date';
const QUOTA_EVENT_NAME = 'revon:firestore-quota-changed';
let memoryPausedPtDate: string | null = null;

/**
 * Returns today's calendar date in America/Los_Angeles (Pacific Time),
 * matching Firestore Spark free-tier daily quota resets (midnight PT).
 */
function getCurrentPacificDateKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function notifyQuotaListeners(): void {
  try {
    window.dispatchEvent(new CustomEvent(QUOTA_EVENT_NAME));
  } catch {}
}

export function subscribeQuotaStatus(callback: (exhausted: boolean) => void): () => void {
  const handler = () => callback(isFirestoreQuotaExhausted());
  window.addEventListener(QUOTA_EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(QUOTA_EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

export function isQuotaExhaustedError(err: unknown): boolean {
  if (!err) return false;
  const code = (err as any)?.code;
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota limit exceeded') ||
    msg.includes('quota exceeded') ||
    msg.includes('free daily write units') ||
    msg.includes('free-tier daily write quota')
  );
}

export function markFirestoreQuotaExhausted(): void {
  const todayPt = getCurrentPacificDateKey();
  memoryPausedPtDate = todayPt;
  try {
    localStorage.setItem(QUOTA_PAUSE_DATE_KEY, todayPt);
  } catch {}
  notifyQuotaListeners();
}

export function clearFirestoreQuotaExhausted(): void {
  memoryPausedPtDate = null;
  try {
    localStorage.removeItem(QUOTA_PAUSE_DATE_KEY);
    // Clean up legacy key if present
    localStorage.removeItem('revon_firestore_quota_paused_until');
  } catch {}
  notifyQuotaListeners();
}

export function isFirestoreQuotaExhausted(): boolean {
  const todayPt = getCurrentPacificDateKey();
  if (memoryPausedPtDate === todayPt) return true;
  if (memoryPausedPtDate && memoryPausedPtDate !== todayPt) {
    memoryPausedPtDate = null;
  }
  try {
    const storedDate = localStorage.getItem(QUOTA_PAUSE_DATE_KEY);
    if (storedDate === todayPt) {
      memoryPausedPtDate = storedDate;
      return true;
    }
    if (storedDate) {
      localStorage.removeItem(QUOTA_PAUSE_DATE_KEY);
    }
  } catch {}
  return false;
}

export function getQuotaErrorMessage(err: unknown, fallback = 'Database operation failed'): string {
  if (isQuotaExhaustedError(err)) {
    return 'Firestore free-tier daily write quota has been reached for today. Reads remain active, and writes are paused until the daily reset (midnight PT).';
  }
  return (err as any)?.message || fallback;
}

/**
 * Prevents background/startup Firestore writes from hanging indefinitely when
 * the Firestore SDK enters backoff retry mode due to quota exhaustion or offline state.
 */
export async function runWithWriteTimeout(promise: Promise<unknown>, timeoutMs = 4500): Promise<boolean> {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      promise.then(() => true),
      new Promise<false>((resolve) => {
        timerId = setTimeout(() => resolve(false), timeoutMs);
      })
    ]);
    if (!result) {
      markFirestoreQuotaExhausted();
    }
    return result;
  } catch (err) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
    }
    throw err;
  } finally {
    if (timerId !== undefined) clearTimeout(timerId);
  }
}

/**
 * Executes a user-initiated Firestore write safely:
 * - Short-circuits immediately when today's quota is already exhausted so the SDK
 *   does not queue doomed retries and spam maximum backoff errors.
 * - Times out cleanly if the SDK enters backoff retry on resource-exhausted.
 */
export async function executeFirestoreWrite<T>(
  writeFn: () => Promise<T>,
  timeoutMs = 5000
): Promise<T> {
  if (isFirestoreQuotaExhausted()) {
    throw new Error(getQuotaErrorMessage('resource-exhausted'));
  }

  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeoutSentinel = Symbol('write-timeout');

  try {
    const result = await Promise.race([
      writeFn(),
      new Promise<typeof timeoutSentinel>((resolve) => {
        timerId = setTimeout(() => resolve(timeoutSentinel), timeoutMs);
      })
    ]);

    if (result === timeoutSentinel) {
      markFirestoreQuotaExhausted();
      throw new Error(getQuotaErrorMessage('resource-exhausted'));
    }

    return result as T;
  } catch (err) {
    if (isQuotaExhaustedError(err)) {
      markFirestoreQuotaExhausted();
      throw new Error(getQuotaErrorMessage(err));
    }
    throw err;
  } finally {
    if (timerId !== undefined) clearTimeout(timerId);
  }
}

/**
 * Resolves the effective live clinic & doctor status at read time.
 * Any scheduled window with autoRevert !== false whose endTime has already passed
 * is evaluated as reverted to open/available without needing background Firestore writes.
 */
export function resolveEffectiveLiveStatus(
  rawLiveStatus?: ClinicLiveStatus | null,
  nowMs: number = Date.now()
): ClinicLiveStatus {
  const base: ClinicLiveStatus = rawLiveStatus
    ? { ...rawLiveStatus }
    : {
        isOpen: true,
        statusMode: 'open',
        customNote: 'Walk-ins & scheduled appointments welcome',
        expectedResumeTime: '',
        doctorAvailability: {}
      };

  if (base.scheduledSlot?.endTime) {
    const endMs = Date.parse(base.scheduledSlot.endTime);
    if (!isNaN(endMs) && nowMs >= endMs && base.scheduledSlot.autoRevert !== false) {
      base.statusMode = 'open';
      base.isOpen = true;
      base.customNote = 'Scheduled window completed. Clinic is open.';
      base.expectedResumeTime = '';
      base.scheduledUntil = '';
      base.scheduledSlot = null;
    }
  }

  if (base.doctorAvailability) {
    const nextDoctors: Record<string, DoctorAvailability> = {};
    for (const [docId, docItem] of Object.entries(base.doctorAvailability)) {
      if (docItem?.scheduledSlot?.endTime) {
        const docEndMs = Date.parse(docItem.scheduledSlot.endTime);
        if (!isNaN(docEndMs) && nowMs >= docEndMs && docItem.scheduledSlot.autoRevert !== false) {
          nextDoctors[docId] = {
            ...docItem,
            status: 'available',
            statusNote: 'Scheduled procedure completed',
            scheduledUntil: '',
            scheduledSlot: null
          };
          continue;
        }
      }
      nextDoctors[docId] = docItem;
    }
    base.doctorAvailability = nextDoctors;
  }

  return base;
}
