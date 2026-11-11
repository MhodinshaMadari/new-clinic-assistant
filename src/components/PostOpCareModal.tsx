import React, { useState } from 'react';
import { Appointment } from '../types';
import { useClinic } from '../context/ClinicContext';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Printer, 
  MessageSquare, 
  Stethoscope, 
  Calendar, 
  Phone, 
  Clock, 
  FileText, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface PostOpCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

interface ProcedureCareGuide {
  id: string;
  name: string;
  category: string;
  keyPoints: string[];
  dietAdvice: string;
  hygieneAdvice: string;
  emergencyAlert: string;
}

const PROCEDURE_CARE_GUIDES: ProcedureCareGuide[] = [
  {
    id: 'extraction',
    name: 'Tooth Extraction & Oral Surgery',
    category: 'Surgery',
    keyPoints: [
      'Keep firm, continuous pressure on the cotton/gauze pack for 45 minutes. Do not chew on the pack.',
      'Do NOT spit, rinse vigorously, or drink through a straw for 24 hours to prevent dry socket.',
      'Apply an ice pack to the cheek outside the extraction area (15 mins on, 15 mins off) to reduce swelling.',
      'Strictly avoid smoking, tobacco, and alcohol for at least 72 hours.',
      'Take prescribed pain medications and antibiotics on schedule with food.'
    ],
    dietAdvice: 'Soft, cold or room-temperature diet for 24 hours (ice cream, yogurt, smoothies, pudding, lukewarm soup). Avoid hot, crunchy, spicy, or seed-containing foods.',
    hygieneAdvice: 'After 24 hours, gently rinse your mouth with warm salt water (1/2 tsp salt in 1 cup warm water) 3-4 times a day after meals. Brush other teeth gently, avoiding the extraction socket.',
    emergencyAlert: 'Excessive bleeding that does not stop after 2 hours of gauze pressure, severe throbbing pain after day 3, or high fever.'
  },
  {
    id: 'rct',
    name: 'Root Canal Treatment (RCT)',
    category: 'Endodontics',
    keyPoints: [
      'Mild tenderness or soreness when biting is normal for 2-4 days as tissue around the tooth root heals.',
      'Avoid chewing hard or sticky foods on the treated side until the permanent crown/cap is placed.',
      'A temporary filling has been placed. If a tiny piece chips off, that is normal; if it falls out completely, call us.',
      'Complete the entire antibiotic course prescribed even if symptoms completely disappear.'
    ],
    dietAdvice: 'Chew predominantly on the opposite side. Avoid biting hard foods (nuts, ice, hard crusts, bones) on the treated tooth to prevent tooth fracture.',
    hygieneAdvice: 'Continue regular gentle brushing and flossing around the tooth. Floss gently by sliding the floss out sideways rather than snapping it upwards.',
    emergencyAlert: 'Visible swelling of the cheek or jaw, severe uncontrolled throbbing pain, or allergic reactions (rash, hives) to prescribed antibiotics.'
  },
  {
    id: 'filling',
    name: 'Dental Fillings & Restorations',
    category: 'Restorative',
    keyPoints: [
      'If local anesthesia was administered, refrain from eating or drinking hot liquids until numbness wears off completely (2-3 hours) to prevent biting your lips or tongue.',
      'Composite tooth-colored fillings are fully hardened immediately; you may resume normal function once numbness is gone.',
      'Mild sensitivity to cold drinks or pressure is common for a few days and should progressively decline.'
    ],
    dietAdvice: 'Eat soft foods until local anesthesia numbness wears off. Avoid extremely hot or ice-cold beverages for the first 24 hours if sensitive.',
    hygieneAdvice: 'Brush twice daily and floss normally. Excellent oral hygiene prevents recurrent decay around restoration margins.',
    emergencyAlert: 'If your bite feels high or uneven when your back teeth come together, contact us for a quick 2-minute bite adjustment.'
  },
  {
    id: 'implants',
    name: 'Dental Implants & Bone Grafting',
    category: 'Implantology',
    keyPoints: [
      'Apply an external ice pack over the implant site for the first 24 hours in 15-minute intervals.',
      'Do not touch, poke, or explore the surgical site with your tongue, fingers, or toothpicks.',
      'Avoid vigorous physical exertion, heavy lifting, or workouts for 48 hours to minimize bleeding and pressure.',
      'Sleep with your head elevated on 2 pillows tonight to keep swelling minimal.'
    ],
    dietAdvice: 'Nutritious liquid and very soft room-temperature diet for 48 hours. Never chew hard foods over the implant site.',
    hygieneAdvice: 'Do not brush directly over the surgical stitches for the first 3 days. Begin gentle warm salt water or prescribed chlorhexidine rinses after 24 hours.',
    emergencyAlert: 'Persistent pulsatile bleeding, loosening of the healing abutment, or numbness persisting beyond 12 hours.'
  },
  {
    id: 'whitening',
    name: 'Teeth Whitening & Bleaching',
    category: 'Cosmetic',
    keyPoints: [
      'Strictly adhere to the "White Diet" for the next 48 hours while your enamel pores are open and receptive to pigments.',
      'Avoid dark-colored foods & drinks: coffee, black tea, turmeric, dark curries, red wine, soy sauce, cola, dark berries, tomato sauce, and tobacco.',
      'Transient mild tooth sensitivity or zingers can occur for 24-48 hours and will naturally subside.'
    ],
    dietAdvice: 'Recommended foods: milk, water, plain yogurt, white rice, steamed chicken, white fish, potatoes, cauliflower, bananas, and clear broths.',
    hygieneAdvice: 'Use the prescribed potassium nitrate sensitivity toothpaste. Avoid abrasive whitening toothpastes for 1 week.',
    emergencyAlert: 'Severe shooting sensitivity or painful white chemical burns on the gums.'
  },
  {
    id: 'scaling',
    name: 'Deep Cleaning & Scaling / Root Planing',
    category: 'Periodontics',
    keyPoints: [
      'Gums may feel slightly sore, tender, or mildly sensitive to cold liquids for 24-48 hours.',
      'Mild pink saliva when spitting tonight is common and harmless.',
      'Do not skip brushing; keeping teeth free of plaque is essential for gum re-attachment and healing.'
    ],
    dietAdvice: 'Avoid very hot, spicy, acidic (citrus/vinegar), or sharp crunchy foods (chips) for 24 hours.',
    hygieneAdvice: 'Rinse with warm salt water (1/2 tsp salt in 1 cup warm water) 3 times daily starting tonight. Use an extra-soft toothbrush with gentle circular motions at the gumline.',
    emergencyAlert: 'Continuous bright red bleeding that persists beyond 6 hours.'
  },
  {
    id: 'braces',
    name: 'Orthodontics & Aligners Adjustment',
    category: 'Orthodontics',
    keyPoints: [
      'Dull aching or tooth tightness is normal for 2-3 days following wire tightening or aligner tray changes.',
      'Apply orthodontic relief wax directly over any bracket, wire, or hook that irritates your inner cheek or tongue.',
      'Aligner users: wear trays for a minimum of 22 hours per day; only remove to eat, drink non-water liquids, and brush.'
    ],
    dietAdvice: 'Soft diet for the next 48 hours (pasta, soft rice, mashed potatoes, soups, eggs). Avoid sticky candies, popcorn kernels, chewing gum, and biting into whole apples or raw carrots.',
    hygieneAdvice: 'Use interdental brushes under the archwires after every meal. Clean aligner trays daily with cool water and gentle liquid soap.',
    emergencyAlert: 'A snapped archwire poking into the cheek that cannot be stabilized with wax, or loose brackets.'
  },
  {
    id: 'general',
    name: 'General Dental Procedure & Care',
    category: 'General',
    keyPoints: [
      'Follow your dental practitioner\'s specific instructions regarding medication and care.',
      'Maintain diligent oral hygiene by gently brushing twice a day.',
      'Stay well-hydrated and rest adequately.'
    ],
    dietAdvice: 'Eat soft, balanced, room-temperature meals. Avoid extremes of temperature.',
    hygieneAdvice: 'Brush twice daily and rinse gently with water after all meals.',
    emergencyAlert: 'Severe pain, swelling, or unexpected symptoms.'
  }
];

export function PostOpCareModal({ isOpen, onClose, appointment }: PostOpCareModalProps) {
  const { activeClinic } = useClinic();
  const [selectedGuideId, setSelectedGuideId] = useState<string>(() => {
    if (!appointment?.treatment) return 'extraction';
    const t = appointment.treatment.toLowerCase();
    if (t.includes('extract') || t.includes('surgery') || t.includes('wisdom')) return 'extraction';
    if (t.includes('root') || t.includes('rct') || t.includes('canal') || t.includes('pulp')) return 'rct';
    if (t.includes('fill') || t.includes('restor') || t.includes('cavity')) return 'filling';
    if (t.includes('implant')) return 'implants';
    if (t.includes('whiten') || t.includes('bleach')) return 'whitening';
    if (t.includes('clean') || t.includes('scale') || t.includes('polishing')) return 'scaling';
    if (t.includes('brace') || t.includes('ortho') || t.includes('aligner')) return 'braces';
    return 'extraction';
  });

  const [customMedicationNote, setCustomMedicationNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentWhatsApp, setSentWhatsApp] = useState(false);

  if (!isOpen || !appointment) return null;

  const currentGuide = PROCEDURE_CARE_GUIDES.find(g => g.id === selectedGuideId) || PROCEDURE_CARE_GUIDES[0];
  const clinicName = activeClinic?.name || 'Revon Advance Dental Care';
  const clinicPhone = activeClinic?.phone || '+91 98765 43210';

  // Build formatted text message for WhatsApp and clipboard
  const generateMessageText = () => {
    let msg = `🦷 *${clinicName} - Post-Treatment Care Instructions*\n\n`;
    msg += `Dear *${appointment.patientName}*,\n`;
    msg += `Thank you for visiting us today for your *${appointment.treatment || currentGuide.name}* with *${appointment.dentistName || 'our dental team'}*.\n\n`;
    msg += `📋 *ESSENTIAL POST-OPERATIVE CARE GUIDELINES:*\n`;
    currentGuide.keyPoints.forEach((point, i) => {
      msg += `• ${point}\n`;
    });
    msg += `\n🍲 *DIET & NUTRITION ADVICE:*\n${currentGuide.dietAdvice}\n`;
    msg += `\n🪥 *ORAL HYGIENE & RINSING:*\n${currentGuide.hygieneAdvice}\n`;

    if (customMedicationNote.trim()) {
      msg += `\n💊 *PRESCRIBED MEDICATIONS & NOTES:*\n${customMedicationNote.trim()}\n`;
    }

    if (followUpDate.trim()) {
      msg += `\n📅 *NEXT SCHEDULED FOLLOW-UP / REVIEW:*\n${followUpDate.trim()}\n`;
    }

    msg += `\n⚠️ *WHEN TO CALL US IMMEDIATELY:*\n${currentGuide.emergencyAlert}\n`;
    msg += `\nFor any questions or urgent assistance, please call our clinic front desk at *${clinicPhone}*.\n\n`;
    msg += `Wishing you a swift, comfortable, and painless recovery!\n`;
    msg += `- *Clinical Care Team, ${clinicName}*`;

    return msg;
  };

  const handleCopyText = async () => {
    try {
      const text = generateMessageText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSendWhatsApp = () => {
    const text = generateMessageText();
    // Clean phone number (remove non-digits, ensure country code)
    let phone = (appointment.patientPhone || '').replace(/[^0-9]/g, '');
    if (phone.length === 10) {
      phone = '91' + phone; // Default to India country code if 10 digits
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSentWhatsApp(true);
    setTimeout(() => setSentWhatsApp(false), 3000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-white dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-display text-slate-900 dark:text-white truncate">
                  Post-Op Care Instruction Dispatcher
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                  WhatsApp Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Send tailored recovery care guides to <strong className="text-slate-700 dark:text-slate-200">{appointment.patientName}</strong> ({appointment.patientPhone})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Patient & Procedure Quick Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{appointment.patientName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone</span>
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400 truncate block mt-0.5">{appointment.patientPhone}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Doctor</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{appointment.dentistName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Procedure</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{appointment.treatment}</span>
            </div>
          </div>

          {/* Procedure Care Template Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Select Procedure Clinical Care Template:</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">Auto-detected from treatment</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PROCEDURE_CARE_GUIDES.map(guide => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setSelectedGuideId(guide.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedGuideId === guide.id
                      ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-500 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300'
                  }`}
                >
                  <span className="font-bold text-[11px] line-clamp-1">{guide.name}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-mono">{guide.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Care Guidelines Preview Box */}
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-800/40 border border-teal-100 dark:border-teal-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{currentGuide.name} Care Guidelines</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-semibold">
                Clinical Standard
              </span>
            </div>

            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 pl-4 list-disc">
              {currentGuide.keyPoints.map((point, idx) => (
                <li key={idx} className="leading-relaxed">{point}</li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-100/70 dark:border-teal-900/40">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] mb-0.5">🥗 Diet Advice:</span>
                <p className="text-slate-600 dark:text-slate-400 leading-snug">{currentGuide.dietAdvice}</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] mb-0.5">🪥 Hygiene & Rinses:</span>
                <p className="text-slate-600 dark:text-slate-400 leading-snug">{currentGuide.hygieneAdvice}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-teal-100/70 dark:border-teal-900/40 text-amber-700 dark:text-amber-300 flex items-start gap-1.5 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span><strong>When to Call:</strong> {currentGuide.emergencyAlert}</span>
            </div>
          </div>

          {/* Optional Medication & Follow-up customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Custom Medications / Dosage Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={customMedicationNote}
                onChange={(e) => setCustomMedicationNote(e.target.value)}
                placeholder="e.g., Amoxicillin 500mg (1 cap thrice daily after meals x 5 days)..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Next Follow-Up / Suture Removal Date (Optional)
              </label>
              <input
                type="text"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                placeholder="e.g., Friday, Nov 14 at 11:30 AM (Suture removal)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Instructions'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintSlip}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              title="Print care slip"
            >
              <Printer className="h-4 w-4" />
              <span>Print Slip</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{sentWhatsApp ? 'WhatsApp Opened!' : 'Send via WhatsApp'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
