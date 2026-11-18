import { UserProfile, UserRole } from '../types';

export const PRACTITIONER_ROLES: ReadonlyArray<UserRole> = ['dentist', 'doctor', 'specialist', 'director'];

/**
 * Returns true if the given role represents a clinical doctor / dentist / specialist / medical director.
 */
export function isPractitionerRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return (
    normalized === 'dentist' ||
    normalized === 'doctor' ||
    normalized === 'specialist' ||
    normalized === 'director'
  );
}

/**
 * Returns true if the given role has Clinic Admin privileges (admin, director, or super-admin).
 * Note: 'director' combines full clinical practitioner + clinic admin capabilities without elevating to cross-clinic super-admin.
 */
export function isAdminRole(role?: string | null, isSuperAdminFlag?: boolean): boolean {
  if (isSuperAdminFlag) return true;
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return (
    normalized === 'admin' ||
    normalized === 'director' ||
    normalized === 'super-admin' ||
    normalized === 'superadmin'
  );
}

/**
 * Strictly checks whether a Firestore record belongs to the target clinic.
 * Records missing both a matching `clinicSlug` and matching `clinicId` are excluded.
 */
export function matchesClinicScope(
  record: { clinicSlug?: string; clinicId?: string } | null | undefined,
  clinicSlug?: string,
  clinicId?: string
): boolean {
  if (!record) return false;
  const targetSlug = clinicSlug?.trim();
  const targetId = clinicId?.trim();

  if (targetSlug && record.clinicSlug && record.clinicSlug.trim() === targetSlug) {
    return true;
  }
  if (targetId && record.clinicId && record.clinicId.trim() === targetId) {
    return true;
  }
  return false;
}

/**
 * Normalizes clinician display names for resilient matching within the same clinic.
 */
export function normalizeDoctorName(name?: string | null): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Finds a registered clinic practitioner matching either UID or normalized display name.
 * Never returns doctors outside the passed clinic-registered roster.
 */
export function findRegisteredDoctorMatch(
  doctors: UserProfile[],
  dentistId?: string,
  dentistName?: string
): UserProfile | undefined {
  if (!doctors || doctors.length === 0) return undefined;

  if (dentistId) {
    const byId = doctors.find((d) => d.uid === dentistId);
    if (byId) return byId;
  }

  const normalizedTarget = normalizeDoctorName(dentistName);
  if (normalizedTarget) {
    const byName = doctors.find(
      (d) => normalizeDoctorName(d.displayName) === normalizedTarget
    );
    if (byName) return byName;
  }

  return undefined;
}

/**
 * Filters a list of users strictly down to registered clinical practitioners
 * belonging to the specified clinic, deduplicated by UID and sorted alphabetically.
 */
export function filterClinicRegisteredDoctors(
  users: UserProfile[],
  clinicSlug?: string,
  clinicId?: string
): UserProfile[] {
  const seen = new Set<string>();
  const result: UserProfile[] = [];

  for (const u of users) {
    if (!isPractitionerRole(u.role)) continue;
    if (!matchesClinicScope(u, clinicSlug, clinicId)) continue;
    const uid = u.uid || (u as { id?: string }).id || '';
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    result.push({ ...u, uid });
  }

  return result.sort((a, b) =>
    (a.displayName || '').localeCompare(b.displayName || '')
  );
}

/**
 * Returns a human-readable default specialty/role label when explicit specialty is absent.
 */
export function getDefaultPractitionerSpecialty(role?: UserRole | string): string {
  switch ((role || '').toLowerCase()) {
    case 'director':
      return 'Medical Director & Attending Physician';
    case 'doctor':
      return 'Attending Physician';
    case 'specialist':
      return 'Clinical Specialist';
    case 'dentist':
    default:
      return 'Dental Practitioner';
  }
}
