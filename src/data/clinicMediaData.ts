import { ClinicYouTubeVideo, ClinicGoogleConfig } from '../types';

export const CLINIC_YOUTUBE_VIDEOS: Record<string, ClinicYouTubeVideo[]> = {
  'revon-dental': [
    {
      id: 'revon-v1',
      title: 'Virtual Walkthrough: Modern Sterilization, Operatory & Patient Lounge',
      youtubeId: 'o0_A1nFjCyg',
      category: 'tour',
      duration: '3:45',
      description: 'Take a virtual walk inside our flagship Indiranagar center. Explore our Class-B autoclaves, German dental suites, and contactless check-in reception.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'revon-v2',
      title: 'Painless Laser Dentistry & Digital Smile Makeovers Explained',
      youtubeId: '6wfbYg4ZceY',
      category: 'procedure',
      duration: '4:20',
      description: 'Dr. Ayesha Khan explains how painless water-laser technology and 3D digital smile design make dental treatments quick, comfortable, and stitch-free.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'revon-v3',
      title: "Patient Story: Arun's Full-Mouth Dental Implant Transformation",
      youtubeId: 'jNQXAC9IVRw',
      category: 'testimonial',
      duration: '2:50',
      description: 'Arun shares his journey of reclaiming his chewing ability and confidence with same-day guided implants at Revon Multi-Specialty.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'revon-v4',
      title: 'Specialist Briefing: Infection Control & Patient Safety Standards',
      youtubeId: 'kJQP7kiw5Fk',
      category: 'doctor',
      duration: '3:10',
      description: 'Our lead clinical director reviews hospital-grade 7-step sterilization protocols implemented across all Revon operational branches.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
    }
  ],
  'smilecare': [
    {
      id: 'smile-v1',
      title: 'SmileCare 3D Intraoral Scanning & Digital Lab Tour',
      youtubeId: 'o0_A1nFjCyg',
      category: 'tour',
      duration: '3:15',
      description: 'Experience our zero-impression digital workflow with AI-driven intraoral scanners that create high-precision 3D models of your teeth in under 60 seconds.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'smile-v2',
      title: 'Clear Aligners vs Traditional Braces: What Every Patient Must Know',
      youtubeId: '6wfbYg4ZceY',
      category: 'procedure',
      duration: '5:02',
      description: 'Our orthodontic specialist breaks down treatment timelines, comfort comparisons, and virtual simulation milestones for invisible aligners.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'smile-v3',
      title: "Kids Dental Care: Fear-Free Pediatric Visits at SmileCare",
      youtubeId: 'jNQXAC9IVRw',
      category: 'testimonial',
      duration: '2:30',
      description: 'See how our cheerful pediatric dentist and sensory-friendly children operatory turn routine dental cleanings into fun experiences.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80'
    }
  ],
  'apex-studio': [
    {
      id: 'apex-v1',
      title: 'Apex Diagnostic Studio: Cardiac Screening & Advanced Ultrasound',
      youtubeId: 'o0_A1nFjCyg',
      category: 'tour',
      duration: '4:10',
      description: 'Walk through our quiet diagnostic suites equipped with digital 2D Echocardiography, Stress Testing, and high-resolution laboratory equipment.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'apex-v2',
      title: 'Understanding Your Comprehensive Health Panel: Doctor Consultation',
      youtubeId: '6wfbYg4ZceY',
      category: 'doctor',
      duration: '3:55',
      description: 'Our senior consultant explains how regular preventive diagnostics catch cardiovascular and metabolic changes years before symptoms appear.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80'
    }
  ]
};

export const DEFAULT_GOOGLE_BUSINESS_PROFILE_ID = '1293814119993852207';
export const DEFAULT_ELFSIGHT_APP_ID = '9fd444a6-3e6e-4605-89b6-b141a3f5b4fa';

/**
 * Extracts a clean Elfsight App ID (UUID) from raw snippet, div tag, or ID string.
 */
export function extractElfsightAppId(rawInput: string): string {
  if (!rawInput) return DEFAULT_ELFSIGHT_APP_ID;
  const trimmed = rawInput.trim();
  const classMatch = trimmed.match(/elfsight-app-([a-f0-9\-]+)/i);
  if (classMatch && classMatch[1]) return classMatch[1];
  const uuidMatch = trimmed.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (uuidMatch && uuidMatch[1]) return uuidMatch[1];
  return trimmed || DEFAULT_ELFSIGHT_APP_ID;
}

/**
 * Extracts a clean Profile ID, Place ID, or CID from raw user input (including Google Maps URLs).
 */
export function extractGoogleBusinessProfileId(rawInput: string): string {
  if (!rawInput) return DEFAULT_GOOGLE_BUSINESS_PROFILE_ID;
  const input = rawInput.trim();

  // If it's a URL, extract CID or placeid
  if (input.includes('cid=')) {
    const match = input.match(/[?&]cid=([0-9]+)/);
    if (match && match[1]) return match[1];
  }
  if (input.includes('placeid=') || input.includes('place_id=')) {
    const match = input.match(/[?&]place_?id=([^&]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }
  if (input.includes('/place/')) {
    const match = input.match(/\/place\/([^\/@?]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }

  // Clean trailing punctuation or slashes
  return input.replace(/[\/\s]+$/, '');
}

/**
 * Builds canonical Google Business URLs from a Profile ID, CID, Place ID, or Google Maps URL.
 */
export function buildGoogleReviewUrls(profileIdOrPlaceId: string, clinicName?: string) {
  const cleanId = extractGoogleBusinessProfileId(profileIdOrPlaceId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID);
  const isNumeric = /^\d+$/.test(cleanId);
  const isPlaceId = cleanId.startsWith('ChIJ');

  const writeReviewUrl = `https://search.google.com/local/writereview?placeid=${cleanId}`;
  const googleMapsUrl = isNumeric
    ? `https://maps.google.com/?cid=${cleanId}`
    : isPlaceId
      ? `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${cleanId}`
      : `https://maps.google.com/?q=${encodeURIComponent(clinicName || 'Clinic')}`;

  return {
    businessProfileId: cleanId,
    placeId: cleanId,
    writeReviewUrl,
    googleMapsUrl,
    reviewsUrl: `https://search.google.com/local/reviews?placeid=${cleanId}`
  };
}

export const CLINIC_GOOGLE_CONFIGS: Record<string, ClinicGoogleConfig> = {
  'revon-dental': {
    placeId: '1293814119993852207',
    businessProfileId: '1293814119993852207',
    rating: 4.9,
    totalReviews: 384,
    googleMapsUrl: 'https://maps.google.com/?cid=1293814119993852207',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=1293814119993852207',
    elfsightAppId: DEFAULT_ELFSIGHT_APP_ID,
    reviews: [
      {
        id: 'g-revon-1',
        clinicSlug: 'revon-dental',
        authorName: 'Vikramaditya Sengupta',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '2 weeks ago',
        text: 'Absolute gold standard in dental and medical care in Indiranagar! The clinic looks more like a luxury boutique lounge than a traditional hospital. I had a molar root canal done with their rotary microscope system—zero pain throughout the procedure. Dr. Ayesha and the nursing team explained each step before touching a tool. Highly recommend booking via their digital portal!',
        treatmentTag: 'Microscopic Root Canal',
        clinicResponse: 'Thank you Vikramaditya! Patient comfort and pain-free treatments are our primary commitment. We are thrilled to hear your root canal went seamlessly.'
      },
      {
        id: 'g-revon-2',
        clinicSlug: 'revon-dental',
        authorName: 'Pooja Narayanan',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '1 month ago',
        text: 'The scheduling accuracy here is phenomenal. In Bengaluru, medical clinics usually keep you waiting 45 minutes past your slot. At Revon, I walked in at 10:15 AM and was in the dental suite by 10:20 AM. Superb sterilization hygiene, digital X-rays shown on an iPad instantly, and very fair transparent billing.',
        treatmentTag: 'Full Oral Hygiene & Scaling',
        clinicResponse: 'Thank you for acknowledging our strict on-time appointment scheduling, Pooja! We value your time.'
      },
      {
        id: 'g-revon-3',
        clinicSlug: 'revon-dental',
        authorName: 'Rohan Deshmukh',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '2 months ago',
        text: 'Got dental implants placed for my father who is 68. We were quite nervous about the surgical phase, but the surgical team used computer-guided navigation. Minimal swelling and he was eating soft food the very next day. Five stars all the way for Revon Dental!',
        treatmentTag: 'Guided Dental Implant',
        clinicResponse: 'We are delighted your father had a smooth recovery! Warm wishes to him from the entire Revon surgical team.'
      },
      {
        id: 'g-revon-4',
        clinicSlug: 'revon-dental',
        authorName: 'Ananya Roy Choudhury',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '3 months ago',
        text: 'Had an emergency chipped front tooth on a Sunday evening. Revon was responsive, their on-call dentist bonded it with composite veneer so seamlessly that you cannot tell which tooth was chipped. Aesthetic craftsmanship is top tier.',
        treatmentTag: 'Cosmetic Composite Bonding',
        clinicResponse: 'Glad we could assist during your emergency Ananya. Keep that radiant smile shining!'
      }
    ]
  },
  'smilecare': {
    placeId: 'ChIJ74_smilecare_whitefield_blr',
    rating: 4.9,
    totalReviews: 295,
    googleMapsUrl: 'https://maps.google.com/?q=SmileCare+Specialist+Dental+Clinic+Whitefield+Bengaluru',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ74_smilecare_whitefield_blr',
    reviews: [
      {
        id: 'g-smile-1',
        clinicSlug: 'smilecare',
        authorName: 'Kavita Menon',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '3 weeks ago',
        text: 'Completed my 11-month clear aligner journey at SmileCare Whitefield. The 3D video simulation they showed me on day 1 predicted the final result with 99% accuracy! Staff is very gentle and always sent WhatsApp appointment reminders.',
        treatmentTag: 'Invisible Clear Aligners',
        clinicResponse: 'Congratulations on completing your aligner treatment Kavita! Your transformed smile looks marvelous.'
      },
      {
        id: 'g-smile-2',
        clinicSlug: 'smilecare',
        authorName: 'Deepak Joshi',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '1 month ago',
        text: 'My 6-year-old daughter was terrified of dental visits until we met the pediatric doctor here. They have a cartoon screen on the ceiling and gave her a cute dental hygiene certificate. No tears, just smiles!',
        treatmentTag: 'Pediatric Preventive Care',
        clinicResponse: 'Thank you Deepak! Making dental visits an enjoyable experience for young children is our greatest joy.'
      },
      {
        id: 'g-smile-3',
        clinicSlug: 'smilecare',
        authorName: 'Meera Krishnaswamy',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '2 months ago',
        text: 'Laser teeth whitening here took 45 minutes and lifted shades significantly without making my teeth sensitive. Very modern clinic setup with spotless operatory hygiene.',
        treatmentTag: 'In-Office Laser Whitening',
        clinicResponse: 'Thank you Meera! We are glad you enjoyed the fast, comfortable whitening treatment.'
      }
    ]
  },
  'apex-studio': {
    placeId: 'ChIJ74_apex_jayanagar_blr',
    rating: 4.8,
    totalReviews: 218,
    googleMapsUrl: 'https://maps.google.com/?q=Apex+Cardiology+Care+Studio+Jayanagar+Bengaluru',
    writeReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ74_apex_jayanagar_blr',
    reviews: [
      {
        id: 'g-apex-1',
        clinicSlug: 'apex-studio',
        authorName: 'Suresh Kumar Hegde',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '2 weeks ago',
        text: 'Outstanding diagnostic experience for my annual master cardiac checkup. The cardiologist sat with me for 25 minutes reviewing my ECG and Echo results patiently, advising practical lifestyle adjustments rather than rushing to prescribe unnecessary medications.',
        treatmentTag: 'Comprehensive Cardiac Health Panel',
        clinicResponse: 'Thank you Mr. Hegde! Preventive, lifestyle-focused care is at the heart of our practice.'
      },
      {
        id: 'g-apex-2',
        clinicSlug: 'apex-studio',
        authorName: 'Shalini Murthy',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '1 month ago',
        text: 'Clean, quiet, and highly professional clinical studio in Jayanagar 4th Block. Blood draws were completely painless, and diagnostic reports were delivered securely on the patient portal the exact same afternoon.',
        treatmentTag: 'Preventive Health Diagnostics',
        clinicResponse: 'We appreciate your review Shalini. Fast digital reporting ensures no anxiety for patients.'
      }
    ]
  }
};

/**
 * Helper to fetch or generate clinic-specific YouTube videos.
 */
export function getClinicYouTubeVideos(clinicSlug?: string, clinicName?: string): ClinicYouTubeVideo[] {
  const slug = (clinicSlug || 'revon-dental').toLowerCase();
  if (CLINIC_YOUTUBE_VIDEOS[slug]) {
    return CLINIC_YOUTUBE_VIDEOS[slug];
  }

  // Fallback for custom or newly registered clinics
  const displayName = clinicName || 'Our Clinic';
  return [
    {
      id: `${slug}-v1`,
      title: `${displayName}: Virtual Tour & Modern Facilities`,
      youtubeId: 'o0_A1nFjCyg',
      category: 'tour',
      duration: '3:30',
      description: `Step inside ${displayName}. Explore our dedicated treatment suites, advanced medical technology, and patient amenities.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: `${slug}-v2`,
      title: `Specialist Care & Treatment Standards at ${displayName}`,
      youtubeId: '6wfbYg4ZceY',
      category: 'procedure',
      duration: '4:15',
      description: `Learn how our clinical specialists deliver precision diagnosis and compassionate treatment using contemporary healthcare methods.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: `${slug}-v3`,
      title: `Patient Experience & Success Story at ${displayName}`,
      youtubeId: 'jNQXAC9IVRw',
      category: 'testimonial',
      duration: '2:45',
      description: `Hear firsthand from patients who experienced our gentle care, swift appointments, and personalized medical attention.`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
    }
  ];
}

/**
 * Helper to fetch or generate clinic-specific Google Reviews & Ratings.
 */
export function getClinicGoogleConfig(clinicSlug?: string, clinicName?: string): ClinicGoogleConfig {
  const slug = (clinicSlug || 'revon-dental').toLowerCase();
  if (CLINIC_GOOGLE_CONFIGS[slug]) {
    return CLINIC_GOOGLE_CONFIGS[slug];
  }

  const displayName = clinicName || 'Specialist Clinic';
  const generated = buildGoogleReviewUrls(DEFAULT_GOOGLE_BUSINESS_PROFILE_ID, displayName);
  return {
    placeId: generated.placeId,
    businessProfileId: generated.businessProfileId,
    rating: 4.9,
    totalReviews: 245,
    googleMapsUrl: generated.googleMapsUrl,
    writeReviewUrl: generated.writeReviewUrl,
    elfsightAppId: DEFAULT_ELFSIGHT_APP_ID,
    reviews: [
      {
        id: `g-${slug}-1`,
        clinicSlug: slug,
        authorName: 'Priya Sundaram',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '2 weeks ago',
        text: `Remarkable medical care and genuine empathy at ${displayName}. The doctors took their time to explain diagnosis thoroughly and ensured maximum comfort throughout. The clinic is pristine and very well managed.`,
        treatmentTag: 'Comprehensive Specialist Care',
        clinicResponse: `Thank you Priya! We are truly glad to have made your visit seamless and reassuring.`
      },
      {
        id: `g-${slug}-2`,
        clinicSlug: slug,
        authorName: 'Anand R. Verma',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        relativeTimeDescription: '1 month ago',
        text: `Very organized clinic with zero waiting time when you book ahead. Transparent billing, modern equipment, and highly courteous staff. Highly recommended!`,
        treatmentTag: 'Preventive Consultation',
        clinicResponse: `Thank you Anand! Keeping appointments strictly on time is our core principle.`
      }
    ]
  };
}

// Robust helper to extract YouTube Video ID from any YouTube URL format (shorts, standard, embed, youtu.be, live) or raw ID
export function extractYouTubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // If it's already an 11-character alphanumeric/hyphen/underscore string
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Support shorts, watch, embed, v, live, youtu.be
  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Generic fallback: find any 11 chars following = or /
  const fallback = trimmed.match(/(?:[\/=])([a-zA-Z0-9_-]{11})(?:[?&#\s]|$)/);
  if (fallback && fallback[1]) {
    return fallback[1];
  }

  return trimmed;
}

// Sanitize a list of clinic YouTube videos to ensure valid IDs and valid thumbnails
export function sanitizeClinicYouTubeVideos(videos: ClinicYouTubeVideo[]): ClinicYouTubeVideo[] {
  if (!Array.isArray(videos)) return [];
  return videos.map(v => {
    const cleanId = extractYouTubeId(v.youtubeId || (v as any).youtubeUrl || '');
    const cleanThumb = (v.thumbnailUrl && !v.thumbnailUrl.includes('https://img.youtube.com/vi/http'))
      ? v.thumbnailUrl
      : (cleanId ? `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg` : '');
    return {
      ...v,
      youtubeId: cleanId,
      thumbnailUrl: cleanThumb
    };
  });
}
