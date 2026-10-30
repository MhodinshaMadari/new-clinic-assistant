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
