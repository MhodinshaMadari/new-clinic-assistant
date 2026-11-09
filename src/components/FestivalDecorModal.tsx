import React, { useState } from 'react';
import { useFestival, FESTIVAL_PRESETS } from '../context/FestivalContext';
import { useAuth } from '../context/AuthContext';
import { FestivalType, ParticleType, ParticleIntensity } from '../types';
import { 
  Sparkles, 
  X, 
  Check, 
  RotateCcw, 
  Sliders, 
  PartyPopper, 
  Eye, 
  ShieldCheck, 
  Save,
  Moon,
  Sun,
  Flame,
  Snowflake,
  Palette,
  Flag,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { RevonLogo } from './RevonLogo';
import { 
  SantaHatOverlay, 
  DiyaLogoAccent, 
  EidCrescentAccent, 
  HoliSplashAccent, 
  NewYearHatAccent, 
  TricolorBadgeAccent 
} from './FestivalHeaderDecor';

interface FestivalDecorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FestivalDecorModal({ isOpen, onClose }: FestivalDecorModalProps) {
  const { festivalConfig, updateFestivalConfig, applyPreset, toggleFestival } = useFestival();
  const { userProfile } = useAuth();

  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin);
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super-admin';

  // Local form state
  const [formData, setFormData] = useState(festivalConfig);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(festivalConfig);
      setSuccessMsg(null);
    }
  }, [isOpen, festivalConfig]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetKey: FestivalType) => {
    const preset = FESTIVAL_PRESETS[presetKey];
    setFormData({
      ...formData,
      ...preset,
      enabled: true
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await updateFestivalConfig(formData, userProfile?.email);
      setSuccessMsg("Festival decorative effects updated successfully!");
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to update festival settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-teal-800/40 relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <PartyPopper className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg font-display tracking-wide text-white">
                  Festival Decorative Effects Manager
                </h3>
                {isSuperAdmin && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full">
                    Super-Admin Access
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-200/80 font-medium mt-0.5">
                Configure seasonal themes, festive graphic overlays & greeting banners for Eid, Diwali, Christmas, etc.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Master Enable/Disable Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 cursor-pointer">
                <span>Enable Festival Decorations Across App</span>
                {formData.enabled ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                    ACTIVE NOW
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                    DISABLED
                  </span>
                )}
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When turned on, header lights, logo ornaments (Santa cap, flickering diya, crescent), and greeting banners appear across the clinic.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  formData.enabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* LIVE PREVIEW OF HEADER ORNAMENT & LIGHTS */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-white space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Header & Logo Preview</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {formData.enabled ? 'Decor Active' : 'Decor Inactive'}
              </span>
            </div>

            {/* Mock Header Navigation Snippet */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative inline-flex items-center justify-center">
                  {formData.festivalType === 'christmas' && <SantaHatOverlay />}
                  {formData.festivalType === 'diwali' && <DiyaLogoAccent />}
                  {formData.festivalType === 'eid' && <EidCrescentAccent />}
                  {formData.festivalType === 'holi' && <HoliSplashAccent />}
                  {formData.festivalType === 'newyear' && <NewYearHatAccent />}
                  {formData.festivalType === 'independence' && <TricolorBadgeAccent />}
                  <RevonLogo size={36} />
                </div>
                <div>
                  <div className="font-black text-sm text-white flex items-center">
                    <span>Revon Healthcare</span>
                    {formData.festivalType === 'christmas' && <span className="ml-1 text-xs">❄️✨</span>}
                    {formData.festivalType === 'diwali' && <span className="ml-1 text-xs animate-pulse">🪔✨</span>}
                    {formData.festivalType === 'eid' && <span className="ml-1 text-xs text-amber-400">🌙✨</span>}
                    {formData.festivalType === 'holi' && <span className="ml-1 text-xs">🎨✨</span>}
                    {formData.festivalType === 'newyear' && <span className="ml-1 text-xs">🎆✨</span>}
                    {formData.festivalType === 'independence' && <span className="ml-1 text-xs">🇮🇳</span>}
                  </div>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest block">/revon-dental</span>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
                {formData.festivalType === 'christmas' && '🎅 Santa Cap on Logo + Holiday Border'}
                {formData.festivalType === 'diwali' && '🪔 Flickering Diya + Fairy Lights Border'}
                {formData.festivalType === 'eid' && '🌙 Crescent Moon + Golden Star Border'}
                {formData.festivalType === 'holi' && '🎨 Gulal Color Splash + Rainbow Ribbon'}
                {formData.festivalType === 'newyear' && '🎆 Celebration Hat + Starburst Border'}
                {formData.festivalType === 'independence' && '🇮🇳 Tricolor Badge + Tricolor Border'}
                {formData.festivalType === 'custom' && '✨ Golden Sparkle Crown + Ambient Glow'}
              </div>
            </div>
          </div>

          {/* FESTIVAL PRESETS SELECTOR */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5 font-mono">
              Quick Festival Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('eid')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  formData.festivalType === 'eid'
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🌙</span>
                <div>
                  <strong className="block text-xs font-bold font-display">Eid Mubarak</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Moons & Lanterns</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('diwali')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  formData.festivalType === 'diwali'
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🪔</span>
                <div>
                  <strong className="block text-xs font-bold font-display">Diwali</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Diyas & Lights</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('christmas')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  formData.festivalType === 'christmas'
                    ? 'border-red-500 bg-red-50/80 dark:bg-red-950/60 text-red-900 dark:text-red-100 ring-2 ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🎄</span>
                <div>
                  <strong className="block text-xs font-bold font-display">Christmas</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Snow & Holidays</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('holi')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  formData.festivalType === 'holi'
                    ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🎨</span>
                <div>
                  <strong className="block text-xs font-bold font-display">Holi</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Color Confetti</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('newyear')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  formData.festivalType === 'newyear'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🎆</span>
                <div>
                  <strong className="block text-xs font-bold font-display">New Year</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Fireworks</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('independence')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  formData.festivalType === 'independence'
                    ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/60 text-orange-900 dark:text-orange-100 ring-2 ring-orange-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🇮🇳</span>
                <div>
                  <strong className="block text-xs font-bold font-display">National Day</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Tricolor Flag</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('custom')}
                className={`col-span-2 p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                  formData.festivalType === 'custom'
                    ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">✨</span>
                <div>
                  <strong className="block text-xs font-bold font-display">Custom Festival Event</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Customize title, icons & banner text</span>
                </div>
              </button>
            </div>
          </div>

          {/* FESTIVAL DETAILS FORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Festival Event Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Eid Mubarak Celebration 🌙"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Active Logo Ornament & Border Theme
              </label>
              <div className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium">
                {formData.festivalType === 'christmas' && '🎅 Santa Cap on Logo + Holiday Border'}
                {formData.festivalType === 'diwali' && '🪔 Flickering Diya + Fairy Lights Border'}
                {formData.festivalType === 'eid' && '🌙 Crescent Moon + Golden Star Border'}
                {formData.festivalType === 'holi' && '🎨 Gulal Color Splash + Rainbow Ribbon'}
                {formData.festivalType === 'newyear' && '🎆 Celebration Hat + Starburst Border'}
                {formData.festivalType === 'independence' && '🇮🇳 Tricolor Badge + Tricolor Border'}
                {formData.festivalType === 'custom' && '✨ Golden Sparkle Crown + Ambient Glow'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Festive Announcement Banner Greeting Message
            </label>
            <textarea
              rows={2}
              value={formData.bannerMessage}
              onChange={(e) => setFormData({ ...formData, bannerMessage: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
              placeholder="Enter greeting text to display in the festive banner..."
              required
            />
          </div>

          {/* ADDITIONAL GRAPHIC DISPLAY SETTINGS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Animation & Glow Intensity
              </label>
              <select
                value={formData.particleIntensity}
                onChange={(e) => setFormData({ ...formData, particleIntensity: e.target.value as ParticleIntensity })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="low">Subtle (Gentle Glow)</option>
                <option value="medium">Standard (Vibrant Flicker)</option>
                <option value="high">High Festive Pulsing</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="showGarlandCheck"
                checked={formData.showGarland}
                onChange={(e) => setFormData({ ...formData, showGarland: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="showGarlandCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Show Header Garland Banner
              </label>
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="showBannerCheck"
                checked={formData.showBanner}
                onChange={(e) => setFormData({ ...formData, showBanner: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="showBannerCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Show Floating Greeting Badge
              </label>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSelectPreset('eid')}
              className="px-3.5 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Eid Preset</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-teal-600/25 cursor-pointer transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save & Publish Festivities'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
