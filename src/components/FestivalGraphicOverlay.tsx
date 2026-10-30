import React, { useState, useEffect, useMemo } from 'react';
import { useFestival } from '../context/FestivalContext';
import { Sparkles, X, Eye, EyeOff, Moon, Sun, Gift, Heart, Volume2, Share2, Copy, Check, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  symbol?: string;
  color?: string;
}

export function FestivalGraphicOverlay() {
  const { festivalConfig } = useFestival();
  const [userDismissedBanner, setUserDismissedBanner] = useState(false);
  const [particlesHidden, setParticlesHidden] = useState(false);
  const [showGreetingModal, setShowGreetingModal] = useState(false);
  const [copiedGreeting, setCopiedGreeting] = useState(false);

  // Reset user dismissed state if festival type changes
  useEffect(() => {
    setUserDismissedBanner(false);
  }, [festivalConfig.festivalType, festivalConfig.bannerMessage]);

  const { enabled, festivalType, bannerMessage, particleType, particleIntensity, showGarland, showBanner, primaryColor, title } = festivalConfig;

  // Copy greeting to clipboard
  const handleCopyGreeting = () => {
    const textToCopy = `${title}\n\n${bannerMessage}\n\n- Best wishes from your Healthcare & Clinical Care Team!`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedGreeting(true);
    setTimeout(() => setCopiedGreeting(false), 2500);
  };

  // Generate dynamic particles based on particleType & intensity
  const particleCount = useMemo(() => {
    if (particleIntensity === 'low') return 18;
    if (particleIntensity === 'high') return 50;
    return 30; // medium
  }, [particleIntensity]);

  const particleSymbols = useMemo(() => {
    switch (particleType) {
      case 'moons':
        return ['🌙', '✨', '⭐', '🌟', '🌙', '💫', '🕌'];
      case 'diyas':
        return ['🪔', '✨', '🌟', '🕯️', '🪔', '💥', '💛'];
      case 'snow':
        return ['❄️', '❅', '❆', '✨', '❄️', '⚪'];
      case 'confetti':
        return ['🎉', '✨', '🎨', '🎊', '⭐', '💖', '💛'];
      case 'fireworks':
        return ['🎆', '🎇', '✨', '💥', '🥂', '🍾', '⭐'];
      case 'stars':
        return ['✨', '⭐', '🌟', '💫', '✦', '✧'];
      case 'flowers':
        return ['🌸', '🌺', '🌼', '✨', '🌷', '🏵️'];
      default:
        return ['✨', '⭐', '🌟'];
    }
  }, [particleType]);

  const colors = useMemo(() => {
    switch (festivalType) {
      case 'eid':
        return ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#60a5fa'];
      case 'diwali':
        return ['#f59e0b', '#fbbf24', '#ef4444', '#f97316', '#eab308'];
      case 'christmas':
        return ['#ef4444', '#10b981', '#38bdf8', '#f87171', '#fbbf24'];
      case 'holi':
        return ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
      case 'newyear':
        return ['#0284c7', '#38bdf8', '#f59e0b', '#e0e7ff', '#fbbf24'];
      case 'independence':
        return ['#f97316', '#ffffff', '#10b981', '#1e40af'];
      default:
        return [primaryColor || '#0d9488', '#f59e0b', '#38bdf8'];
    }
  }, [festivalType, primaryColor]);

  const particles: Particle[] = useMemo(() => {
    if (!enabled) return [];
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // %
      y: Math.random() * 100, // %
      size: Math.random() * 14 + 10, // px
      speed: Math.random() * 15 + 10, // animation duration seconds
      opacity: Math.random() * 0.7 + 0.2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 40,
      symbol: particleSymbols[i % particleSymbols.length],
      color: colors[i % colors.length]
    }));
  }, [enabled, particleCount, particleSymbols, colors]);

  if (!enabled) return null;

  return (
    <div className="relative z-40 select-none">
      {/* ========================================================= */}
      {/* 1. CORNER FIXED GRAPHIC ORNAMENTS (NON-FALLDOWN GRAPHICS) */}
      {/* ========================================================= */}

      {/* TOP-RIGHT CORNER GRAPHIC EMBLEM */}
      <div className="fixed top-16 right-3 sm:right-6 pointer-events-none z-30 opacity-90 hover:opacity-100 transition-opacity">
        {festivalType === 'eid' && (
          <motion.div 
            initial={{ scale: 0, rotate: -30 }} 
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center space-x-1 bg-gradient-to-br from-emerald-950/90 via-teal-900/90 to-slate-900/90 p-2.5 rounded-2xl border border-amber-400/40 shadow-xl backdrop-blur-md"
          >
            <div className="relative">
              <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">🌙</span>
              <span className="absolute -bottom-1 -right-1 text-xs animate-ping">✨</span>
            </div>
            <div className="pr-1 hidden sm:block">
              <span className="block text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">Eid Mubarak</span>
              <span className="text-[9px] text-teal-200/80">Peace & Blessings</span>
            </div>
          </motion.div>
        )}

        {festivalType === 'diwali' && (
          <motion.div 
            initial={{ scale: 0, y: -20 }} 
            animate={{ scale: 1, y: 0 }}
            className="flex items-center space-x-2 bg-gradient-to-br from-amber-950/90 via-orange-900/90 to-slate-900/90 p-2.5 rounded-2xl border border-amber-400/50 shadow-xl backdrop-blur-md"
          >
            <div className="relative">
              <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-pulse">🪔</span>
            </div>
            <div className="pr-1 hidden sm:block">
              <span className="block text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">Happy Diwali</span>
              <span className="text-[9px] text-amber-200/80">Festival of Lights</span>
            </div>
          </motion.div>
        )}

        {festivalType === 'christmas' && (
          <motion.div 
            initial={{ scale: 0, y: -20 }} 
            animate={{ scale: 1, y: 0 }}
            className="flex items-center space-x-2 bg-gradient-to-br from-red-950/90 via-slate-900/90 to-emerald-950/90 p-2.5 rounded-2xl border border-red-500/40 shadow-xl backdrop-blur-md"
          >
            <div className="relative">
              <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">🎄</span>
              <span className="absolute -top-1 -right-1 text-xs">🎁</span>
            </div>
            <div className="pr-1 hidden sm:block">
              <span className="block text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest">Merry Xmas</span>
              <span className="text-[9px] text-red-200/80">Joyful Holidays</span>
            </div>
          </motion.div>
        )}

        {festivalType === 'holi' && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="flex items-center space-x-2 bg-gradient-to-br from-purple-950/90 via-pink-900/90 to-slate-900/90 p-2.5 rounded-2xl border border-pink-400/40 shadow-xl backdrop-blur-md"
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">🎨</span>
            <div className="pr-1 hidden sm:block">
              <span className="block text-[10px] font-mono font-bold text-pink-300 uppercase tracking-widest">Happy Holi</span>
              <span className="text-[9px] text-purple-200/80">Festival of Colors</span>
            </div>
          </motion.div>
        )}

        {festivalType === 'newyear' && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="flex items-center space-x-2 bg-gradient-to-br from-sky-950/90 via-blue-900/90 to-slate-900/90 p-2.5 rounded-2xl border border-sky-400/40 shadow-xl backdrop-blur-md"
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">🎆</span>
            <div className="pr-1 hidden sm:block">
              <span className="block text-[10px] font-mono font-bold text-sky-300 uppercase tracking-widest">Happy New Year</span>
              <span className="text-[9px] text-sky-200/80">Cheers to Wellness</span>
            </div>
          </motion.div>
        )}

        {festivalType === 'independence' && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="flex items-center space-x-2 bg-gradient-to-br from-orange-950/90 via-slate-900/90 to-emerald-950/90 p-2.5 rounded-2xl border border-orange-400/40 shadow-xl backdrop-blur-md"
          >
            <span className="text-3xl sm:text-4xl">🇮🇳</span>
            <div className="pr-1 hidden sm:block">
              <span className="block text-[10px] font-mono font-bold text-orange-300 uppercase tracking-widest">Independence Day</span>
              <span className="text-[9px] text-emerald-200/80">Freedom & Health</span>
            </div>
          </motion.div>
        )}

        {festivalType === 'custom' && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="flex items-center space-x-2 bg-gradient-to-br from-teal-950/90 via-slate-900/90 to-slate-950/90 p-2.5 rounded-2xl border border-teal-400/40 shadow-xl backdrop-blur-md"
          >
            <span className="text-3xl sm:text-4xl">✨</span>
            <div className="pr-1 hidden sm:block">
              <span className="block text-[10px] font-mono font-bold text-teal-300 uppercase tracking-widest">{title}</span>
              <span className="text-[9px] text-teal-200/80">Celebration Mode</span>
            </div>
          </motion.div>
        )}
      </div>



      {/* ========================================================= */}
      {/* 2. TOP FESTIVAL GARLAND / HEADER DECORATION */}
      {/* ========================================================= */}
      {showGarland && (
        <div className="fixed top-0 left-0 right-0 h-10 sm:h-12 pointer-events-none z-50 flex items-center justify-between px-2 sm:px-6 overflow-hidden">
          {/* Subtle Ambient Glow Mesh */}
          <div 
            className="absolute inset-0 opacity-20 dark:opacity-30 blur-md transition-colors duration-700"
            style={{ backgroundColor: primaryColor }}
          />
          
          {/* Decorative Hanging Items for EID */}
          {festivalType === 'eid' && (
            <div className="w-full flex justify-between items-start pt-0 text-amber-400 drop-shadow-md">
              <div className="flex space-x-6 sm:space-x-12 animate-pulse">
                <span>🌙</span>
                <span className="text-xs sm:text-sm">🏮</span>
                <span className="hidden xs:inline">✨</span>
                <span className="text-xs">⭐</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-950/80 via-teal-900/80 to-emerald-950/80 px-4 py-1 rounded-b-2xl border-b border-x border-emerald-500/40 text-emerald-200 text-[11px] font-bold tracking-wider font-display shadow-lg">
                <span>🕌</span>
                <span className="uppercase tracking-widest">{title}</span>
                <span>🌙</span>
              </div>
              <div className="flex space-x-6 sm:space-x-12 animate-pulse">
                <span className="text-xs">⭐</span>
                <span className="hidden xs:inline">✨</span>
                <span className="text-xs sm:text-sm">🏮</span>
                <span>🌙</span>
              </div>
            </div>
          )}

          {/* Decorative Hanging Items for DIWALI */}
          {festivalType === 'diwali' && (
            <div className="w-full flex justify-between items-start pt-0 text-amber-500 drop-shadow-md">
              <div className="flex space-x-6 sm:space-x-10 animate-bounce">
                <span>🪔</span>
                <span className="text-xs sm:text-sm">✨</span>
                <span className="hidden xs:inline">🪔</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-950/90 via-orange-950/90 to-amber-950/90 px-4 py-1 rounded-b-2xl border-b border-x border-amber-500/50 text-amber-200 text-[11px] font-bold tracking-wider font-display shadow-lg">
                <span>🪔</span>
                <span className="uppercase tracking-widest text-amber-300">{title}</span>
                <span>✨</span>
              </div>
              <div className="flex space-x-6 sm:space-x-10 animate-bounce">
                <span className="hidden xs:inline">🪔</span>
                <span className="text-xs sm:text-sm">✨</span>
                <span>🪔</span>
              </div>
            </div>
          )}

          {/* Decorative Hanging Items for CHRISTMAS */}
          {festivalType === 'christmas' && (
            <div className="w-full flex justify-between items-start pt-0 text-red-400 drop-shadow-md">
              <div className="flex space-x-6 sm:space-x-10">
                <span>🎄</span>
                <span>🔔</span>
                <span className="hidden xs:inline">❄️</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-red-950/90 via-emerald-950/90 to-red-950/90 px-4 py-1 rounded-b-2xl border-b border-x border-red-500/40 text-red-100 text-[11px] font-bold tracking-wider font-display shadow-lg">
                <span>🎁</span>
                <span className="uppercase tracking-widest text-emerald-300">{title}</span>
                <span>❄️</span>
              </div>
              <div className="flex space-x-6 sm:space-x-10">
                <span className="hidden xs:inline">❄️</span>
                <span>🔔</span>
                <span>🎄</span>
              </div>
            </div>
          )}

          {/* Decorative Garland for HOLI / NEW YEAR / OTHERS */}
          {festivalType !== 'eid' && festivalType !== 'diwali' && festivalType !== 'christmas' && (
            <div className="w-full flex justify-between items-start pt-0 text-teal-400 drop-shadow-md">
              <div className="flex space-x-6 sm:space-x-10 animate-pulse">
                <span>✨</span>
                <span>🎉</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/90 px-4 py-1 rounded-b-2xl border-b border-x border-teal-500/40 text-teal-200 text-[11px] font-bold tracking-wider font-display shadow-lg">
                <span>🌟</span>
                <span className="uppercase tracking-widest">{title}</span>
                <span>✨</span>
              </div>
              <div className="flex space-x-6 sm:space-x-10 animate-pulse">
                <span>🎉</span>
                <span>✨</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. FLOATING ANNOUNCEMENT BANNER */}
      {/* ========================================================= */}
      {showBanner && !userDismissedBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-950 dark:to-slate-900 border border-amber-500/40 dark:border-amber-400/30 shadow-2xl text-white relative overflow-hidden backdrop-blur-md"
          >
            {/* Ambient Background Accent Glow */}
            <div 
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl"
              style={{ backgroundColor: primaryColor }}
            />
            
            <div className="flex items-start space-x-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shrink-0">
                {festivalType === 'eid' ? '🌙' : festivalType === 'diwali' ? '🪔' : festivalType === 'christmas' ? '🎄' : festivalType === 'holi' ? '🎨' : '✨'}
              </div>

              <div className="flex-1 pr-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 uppercase tracking-wider">
                    Festive Greeting
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-display">
                    {title}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1.5 leading-relaxed font-medium">
                  {bannerMessage}
                </p>

                <div className="mt-2.5 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowGreetingModal(true)}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Open Festive Greeting Card</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUserDismissedBanner(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Dismiss Festive Banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PARTICLE OVERLAY CANVAS ANIMATION */}
      {/* ========================================================= */}
      {!particlesHidden && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-30">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: `${p.x}vw`,
                y: `-5vh`,
                opacity: 0,
                rotate: p.rotation
              }}
              animate={{
                y: [`-5vh`, `105vh`],
                opacity: [0, p.opacity, p.opacity, 0],
                rotate: p.rotation + 360,
                x: [`${p.x}vw`, `${p.x + (p.id % 2 === 0 ? 5 : -5)}vw`, `${p.x}vw`]
              }}
              transition={{
                duration: p.speed,
                repeat: Infinity,
                ease: 'linear',
                delay: (p.id % 5) * 1.5
              }}
              style={{
                position: 'absolute',
                fontSize: `${p.size}px`,
                color: p.color,
                filter: festivalType === 'diwali' ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' : 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))'
              }}
            >
              {p.symbol}
            </motion.div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. FLOATING TOGGLE FOR PARTICLES */}
      {/* ========================================================= */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-auto hidden sm:block">
        <button
          type="button"
          onClick={() => setParticlesHidden(!particlesHidden)}
          className="px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white text-[10px] font-bold font-mono border border-slate-700/80 shadow-lg backdrop-blur-md cursor-pointer flex items-center space-x-1.5 transition-all"
          title={particlesHidden ? "Show Festival Particles" : "Hide Festival Particles"}
        >
          {particlesHidden ? <Eye className="h-3 w-3 text-emerald-400" /> : <EyeOff className="h-3 w-3 text-amber-400" />}
          <span>{particlesHidden ? "Show Festivities" : "Hide Festivities"}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 6. INTERACTIVE FESTIVE GREETING CARD MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showGreetingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-amber-400/40 shadow-2xl relative overflow-hidden"
            >
              {/* Background Graphic Accents */}
              <div 
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
                style={{ backgroundColor: primaryColor }}
              />

              <button
                type="button"
                onClick={() => setShowGreetingModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-4 relative z-10">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 text-4xl shadow-xl animate-bounce">
                  {festivalType === 'eid' ? '🌙' : festivalType === 'diwali' ? '🪔' : festivalType === 'christmas' ? '🎄' : festivalType === 'holi' ? '🎨' : '✨'}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/60 inline-block">
                    Official Festival Greeting
                  </span>
                  <h3 className="text-2xl font-black font-display text-white mt-2">
                    {title}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-teal-800/40 text-slate-200 text-sm leading-relaxed font-medium">
                  "{bannerMessage}"
                </div>

                <div className="pt-2 text-xs text-teal-300/80 font-mono">
                  Wishing you & your family good health, prosperity, and radiant smiles!
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyGreeting}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedGreeting ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedGreeting ? "Greeting Copied!" : "Share Festival Message"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGreetingModal(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    Close Card
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

