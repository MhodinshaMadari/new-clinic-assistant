export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Clinic Assistant';

export function getAppBaseUrl(): string {
  const envUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
}

export function getClinicUrl(clinicSlug?: string): string {
  const baseUrl = getAppBaseUrl();
  const slug = clinicSlug ? clinicSlug.trim() : '';
  return slug ? `${baseUrl}/${slug}` : baseUrl;
}

