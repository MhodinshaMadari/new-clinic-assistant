import React from 'react';
import { 
  Accessibility, 
  Bath, 
  FlaskConical, 
  Pill, 
  Car, 
  Coffee, 
  Wifi, 
  Wind, 
  Zap, 
  CreditCard, 
  ShieldCheck, 
  HeartPulse, 
  Baby, 
  Clock, 
  Sparkles, 
  Microscope,
  Stethoscope,
  Armchair,
  CheckCircle2,
  HelpCircle,
  Activity,
  PhoneCall
} from 'lucide-react';
import { ClinicFacility } from '../types';

export const FACILITY_CATEGORIES = [
  'Accessibility',
  'Sanitation & Hygiene',
  'Diagnostics & Lab',
  'Pharmacy & Dispensary',
  'Patient Comfort',
  'Emergency & Safety',
  'General'
] as const;

export const AVAILABLE_FACILITY_ICONS = [
  { id: 'Accessibility', label: 'Wheelchair / Accessibility', icon: Accessibility },
  { id: 'Bath', label: 'Restrooms & Toilets', icon: Bath },
  { id: 'FlaskConical', label: 'Diagnostic Lab', icon: FlaskConical },
  { id: 'Microscope', label: 'Microscopy / Pathology', icon: Microscope },
  { id: 'Pill', label: 'Pharmacy & Dispensary', icon: Pill },
  { id: 'HeartPulse', label: 'Cardiac & Clinical Care', icon: HeartPulse },
  { id: 'Car', label: 'Parking & Valet', icon: Car },
  { id: 'Coffee', label: 'Lounge & Refreshments', icon: Coffee },
  { id: 'Armchair', label: 'Ergonomic Seating', icon: Armchair },
  { id: 'Wifi', label: 'High-Speed Wi-Fi', icon: Wifi },
  { id: 'Wind', label: 'HEPA Air Purifier / Clean Room', icon: Wind },
  { id: 'Zap', label: 'Emergency Power & Oxygen', icon: Zap },
  { id: 'CreditCard', label: 'Cashless & Insurance Desk', icon: CreditCard },
  { id: 'Baby', label: 'Pediatric & Baby Care', icon: Baby },
  { id: 'ShieldCheck', label: 'Sterilized & Bio-Safe', icon: ShieldCheck },
  { id: 'Stethoscope', label: 'Doctor Consultation', icon: Stethoscope },
  { id: 'Sparkles', label: 'Premium Amenities', icon: Sparkles },
  { id: 'Clock', label: '24/7 Availability', icon: Clock },
  { id: 'Activity', label: 'Patient Monitoring', icon: Activity },
  { id: 'PhoneCall', label: 'Emergency Helpdesk', icon: PhoneCall },
];

export const DEFAULT_FACILITIES: ClinicFacility[] = [
  {
    id: 'fac-wheelchair-01',
    name: 'Wheelchair Accessible Ramps & Elevators',
    category: 'Accessibility',
    icon: 'Accessibility',
    description: 'Step-free entrance ramp, dedicated wide elevators, and complimentary wheelchairs for elderly & mobility-assisted patients.',
    badge: '100% Barrier-Free',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-toilets-02',
    name: 'Hygienic & Sanitized Restrooms',
    category: 'Sanitation & Hygiene',
    icon: 'Bath',
    description: 'Continuously sanitized, touchless sensor restrooms equipped with elderly grab rails and infant diaper changing counters.',
    badge: 'Touchless & Sanitized',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-lab-03',
    name: 'Diagnostic Pathology & 3D Imaging Lab',
    category: 'Diagnostics & Lab',
    icon: 'FlaskConical',
    description: 'Advanced in-house pathology, 3D CBCT digital oral imaging, rapid blood diagnostics, and instant electronic report delivery.',
    badge: 'Same-Day Digital Reports',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-dispensary-04',
    name: 'In-House Pharmacy & Dispensary',
    category: 'Pharmacy & Dispensary',
    icon: 'Pill',
    description: 'Comprehensive dispensary stocking doctor-prescribed medications, oral therapeutics, antiseptic mouthwashes, and post-surgery kits.',
    badge: 'Verified & Stocked',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-parking-05',
    name: 'Patient Parking & Valet Assistance',
    category: 'Patient Comfort',
    icon: 'Car',
    description: 'Dedicated reserved patient parking bays with complimentary drop-off and valet assistance right at the main clinic reception gate.',
    badge: 'Free Valet Service',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-lounge-06',
    name: 'Executive Waiting Lounge & Refreshments',
    category: 'Patient Comfort',
    icon: 'Coffee',
    description: 'Climate-controlled lounge with ergonomic seating, complimentary hot & cold beverages, reading pods, and pediatric play corner.',
    badge: 'Complimentary Drinks',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-wifi-07',
    name: 'High-Speed Fiber Wi-Fi',
    category: 'Patient Comfort',
    icon: 'Wifi',
    description: 'Ultra-fast, secure patient and visitor Wi-Fi connection across all consultation suites and waiting lounges.',
    badge: 'Free High-Speed',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-hepa-08',
    name: 'Hospital-Grade HEPA & UV Air Sterilization',
    category: 'Sanitation & Hygiene',
    icon: 'Wind',
    description: 'Multi-stage medical air filtration, negative pressure isolation rooms, and continuous UV sterilization for complete clinical safety.',
    badge: 'Medical-Grade Purity',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-power-09',
    name: '24/7 Power Backup & Emergency Oxygen Manifold',
    category: 'Emergency & Safety',
    icon: 'Zap',
    description: 'Zero-downtime uninterrupted power backup systems and emergency piped medical oxygen for patient safety during procedures.',
    badge: '24/7 Redundant Grid',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'fac-tpa-10',
    name: 'Cashless Insurance & Digital TPA Desk',
    category: 'General',
    icon: 'CreditCard',
    description: 'Direct empanelment with leading medical insurance providers for instantaneous pre-authorizations and seamless cashless claims.',
    badge: 'All Major Insurers',
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

export interface FacilityIconProps {
  iconName?: string;
  className?: string;
}

export const FacilityIcon: React.FC<FacilityIconProps> = ({ iconName, className = 'w-5 h-5' }) => {
  switch (iconName) {
    case 'Accessibility': return <Accessibility className={className} />;
    case 'Bath': return <Bath className={className} />;
    case 'FlaskConical': return <FlaskConical className={className} />;
    case 'Microscope': return <Microscope className={className} />;
    case 'Pill': return <Pill className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'Car': return <Car className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    case 'Armchair': return <Armchair className={className} />;
    case 'Wifi': return <Wifi className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Baby': return <Baby className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Stethoscope': return <Stethoscope className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'PhoneCall': return <PhoneCall className={className} />;
    default: return <Sparkles className={className} />;
  }
};
