export type UserRole = 'patient' | 'dentist' | 'doctor' | 'specialist' | 'receptionist' | 'admin' | 'super-admin';

export interface Dependent {
  id: string;
  name: string;
  relationship: 'Child' | 'Spouse' | 'Parent' | 'Sibling' | 'Relative' | 'Other';
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  phone?: string;
  specialty?: string;
  createdAt?: string;
  dependents?: Dependent[];
  emailRemindersEnabled?: boolean;
  clinicSlug?: string;
  clinicId?: string;
  isSuperAdmin?: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  dentistId: string;
  dentistName: string;
  dateTime: string; // ISO string
  status: AppointmentStatus;
  treatment: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  clinicId?: string;
  clinicName?: string;
  clinicSlug?: string;
  locationId?: string;
  locationName?: string;
}

export interface Review {
  id: string;
  patientName: string;
  patientEmail?: string;
  rating: number;
  comment: string;
  createdAt: string;
  clinicSlug?: string;
  isPublished?: boolean;
  isVerifiedPatient?: boolean;
  adminReply?: string;
  adminReplyAt?: string;
  adminReplyBy?: string;
  treatmentName?: string;
}

export interface ReminderLog {
  id: string;
  appointmentId: string;
  patientEmail: string;
  sentAt: string;
  type: 'email' | 'sms';
  status: 'sent' | 'failed' | 'disabled';
  details?: string;
  previewUrl?: string | null;
  clinicSlug?: string;
}

export interface TreatmentService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  icon: string;
  isActive?: boolean;
  showPrice?: boolean;
  clinicSlug?: string;
  createdAt?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'Other';
  paymentDate: string;
  notes?: string;
  collectedBy?: string;
  transactionRef?: string;
}

export type BillPaymentStatus = 'pending' | 'partially_paid' | 'collected';

export interface BillingItem {
  id: string;
  name: string;
  type: 'consultation' | 'equipment' | 'stock' | 'other';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Bill {
  id: string;
  clinicSlug?: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  dentistId: string;
  dentistName: string;
  treatmentName: string;
  items: BillingItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'partially_paid' | 'collected';
  paidAmount?: number;
  remainingAmount?: number;
  payments?: PaymentRecord[];
  paymentMode?: 'UPI' | 'Cash' | 'Card' | 'Other';
  paymentDate?: string;
  collectedBy?: string;
  createdAt: string;
}

export interface MenuPermissions {
  appointments: UserRole[];
  reminders: UserRole[];
  patients: UserRole[];
  billing: UserRole[];
  patientHistory?: UserRole[];
  reviews?: UserRole[];
  finances?: UserRole[];
}

export type ExpenseCategory = 'rent' | 'salary' | 'consumable' | 'other';

export interface MonthlyFinance {
  id: string; // e.g. revon-dental_2026_09
  clinicSlug: string;
  year: number;
  month: number; // 1-12
  monthKey: string; // YYYY-MM e.g. "2026-09"
  monthLabel?: string; // e.g. "September 2026"
  clinicRent: number; // Total monthly rent for clinic premises
  staffSalary: number; // Total monthly staff payroll (doctors, assistants, reception)
  consumableItems: number; // Dental consumables, supplies, kits
  otherExpenses: number; // Utilities, maintenance, sanitation, marketing, etc.
  totalBudgetedExpenses: number; // Sum of the 4 expense categories
  voucherTargetAmount?: number; // Target monthly expense ceiling specifically for Itemized Expense Vouchers
  otherRevenue?: number; // Optional miscellaneous clinic earnings/rebates
  otherRevenueNotes?: string;
  notes?: string;
  setBy?: string;
  setByRole?: string;
  setAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  clinicSlug: string;
  monthKey: string; // YYYY-MM e.g. "2026-09"
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  vendor?: string;
  paymentMode?: 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Card' | 'Other';
  receiptNumber?: string;
  paidStatus: 'paid' | 'pending';
  voucherType?: 'paid' | 'collected'; // 'paid' (expense outflow) | 'collected' (direct collection inflow)
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ExpenseVoucher = Expense;
export type VoucherType = 'paid' | 'collected';

export interface InvoiceItem {
  id: string;
  name: string;
  type: 'equipment' | 'consumable' | 'consultation' | 'other';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  clinicSlug?: string;
  invoiceNumber: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  dentistId: string;
  dentistName: string;
  treatmentName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'partially_paid' | 'collected';
  paidAmount?: number;
  remainingAmount?: number;
  payments?: PaymentRecord[];
  paymentMode?: 'UPI' | 'Cash' | 'Card' | 'Other';
  paymentDate?: string;
  collectedBy?: string;
  createdAt: string;
}

export interface Surgeon {
  id: string;
  displayName: string;
  specialty: string;
  bio: string;
  email: string;
  phone?: string;
  isBoardCertified: boolean;
  isActive: boolean;
  consultationTiming: string;
  createdAt: string;
  avatarUrl?: string;
  clinicSlug?: string;
}

export interface ClinicNotification {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  createdBy: string;
  clinicSlug?: string;
}

export interface SupportQuery {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'pending' | 'replied';
  createdAt: string; // ISO string
  clinicSlug?: string;
}

export interface QueryReply {
  id: string;
  queryId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string; // ISO string
}

export interface SocialHandle {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'whatsapp' | 'twitter' | 'link';
}

export interface ClinicLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  workingHours: string;
  isPrimary?: boolean;
}

export interface ClinicFeatures {
  appointments: boolean;
  billing: boolean;
  chatbot: boolean;
  supportSystem: boolean;
  dentistBreakdown: boolean;
  reminders: boolean;
  reviews: boolean;
  multiLocation: boolean;
  facilities: boolean;
  finances: boolean;
}

export interface ClinicFacility {
  id: string;
  name: string; // Unique by name (case-insensitive)
  description: string;
  category?: 'Accessibility' | 'Sanitation & Hygiene' | 'Diagnostics & Lab' | 'Pharmacy & Dispensary' | 'Patient Comfort' | 'Emergency & Safety' | 'General';
  icon: string; // e.g. 'Accessibility', 'Bath', 'FlaskConical', 'Pill', 'Car', 'Coffee', 'Wifi', 'Wind', 'CreditCard', 'Zap', 'ShieldCheck'
  badge?: string; // e.g. '100% Accessible', 'In-House Lab', '24/7 Available'
  isEnabled: boolean; // toggle to show/hide on portfolio
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicYouTubeVideo {
  id: string;
  title: string;
  youtubeId: string;
  youtubeUrl?: string;
  category: 'tour' | 'procedure' | 'testimonial' | 'doctor' | 'general';
  duration?: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface ClinicGoogleReview {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  time?: string;
  treatmentTag?: string;
  clinicResponse?: string;
  clinicSlug: string;
}

export interface ClinicGoogleConfig {
  placeId?: string;
  businessProfileId?: string;
  rating: number;
  totalReviews: number;
  googleMapsUrl: string;
  writeReviewUrl: string;
  embedWidgetUrl?: string;
  elfsightAppId?: string;
  reviews: ClinicGoogleReview[];
}

export interface Clinic {
  id: string;
  slug: string; // e.g. "revon-dental"
  name: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  lobbyImageUrl?: string;
  treatmentRoomImageUrl?: string;
  phone: string;
  email: string;
  website?: string;
  status?: 'active' | 'disabled';
  isDisabled?: boolean;
  features: ClinicFeatures;
  locations: ClinicLocation[];
  facilities?: ClinicFacility[];
  socialHandles?: SocialHandle[];
  youtubeChannelUrl?: string;
  youtubeVideos?: ClinicYouTubeVideo[];
  googleConfig?: ClinicGoogleConfig;
  liveStatus?: ClinicLiveStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export type DoctorAvailabilityStatus = 'available' | 'in_surgery' | 'on_break' | 'out_of_clinic';

export interface ScheduledStatusSlot {
  status: DoctorAvailabilityStatus;
  startTime: string;
  endTime: string;
  reason?: string;
  autoRevert?: boolean;
}

export interface DoctorAvailability {
  dentistId: string;
  dentistName: string;
  status: DoctorAvailabilityStatus;
  statusNote?: string;
  chairRoom?: string;
  scheduledUntil?: string;
  scheduledSlot?: ScheduledStatusSlot;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ScheduledClinicSlot {
  statusMode: 'open' | 'closed' | 'lunch_break' | 'emergency_only';
  startTime: string;
  endTime: string;
  note?: string;
  autoRevert?: boolean;
}

export interface ClinicLiveStatus {
  isOpen: boolean;
  statusMode: 'open' | 'closed' | 'lunch_break' | 'emergency_only';
  customNote?: string;
  expectedResumeTime?: string;
  scheduledUntil?: string;
  scheduledSlot?: ScheduledClinicSlot;
  updatedAt?: string;
  updatedBy?: string;
  doctorAvailability?: Record<string, DoctorAvailability>;
}

export type FestivalType = 'eid' | 'diwali' | 'christmas' | 'holi' | 'newyear' | 'independence' | 'custom';
export type ParticleType = 'moons' | 'diyas' | 'snow' | 'confetti' | 'fireworks' | 'stars' | 'flowers';
export type ParticleIntensity = 'low' | 'medium' | 'high';

export interface FestivalConfig {
  id?: string;
  enabled: boolean;
  festivalType: FestivalType;
  title: string;
  bannerMessage: string;
  particleType: ParticleType;
  particleIntensity: ParticleIntensity;
  showGarland: boolean;
  showBanner: boolean;
  primaryColor: string;
  updatedAt?: string;
  updatedBy?: string;
  clinicSlug?: string;
}







