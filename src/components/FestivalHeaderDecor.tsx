import React from 'react';
import { useFestival } from '../context/FestivalContext';
import { FestivalType } from '../types';

/**
 * ---------------------------------------------------------------------------
 * SVG Festival Ornaments for Logo
 * ---------------------------------------------------------------------------
 */

// 1. Christmas: Santa Cap resting on the logo
export function SantaHatOverlay({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute -top-3.5 -right-3 z-20 pointer-events-none select-none filter drop-shadow-md ${className}`}
      title="Merry Christmas!"
    >
      <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main Red Cap Body tilted to the right */}
        <path 
          d="M22 68 C 22 68, 25 32, 60 22 C 72 18, 85 24, 88 36 C 89 42, 85 50, 78 52 C 70 54, 75 42, 62 34 C 45 25, 34 45, 30 68 Z" 
          fill="#dc2626" 
        />
        {/* Shadow Fold on Red Cap */}
        <path 
          d="M32 68 C 30 52, 42 35, 60 28 C 52 38, 38 52, 34 68 Z" 
          fill="#b91c1c" 
          opacity="0.6" 
        />
        {/* White Fur Trim at Base */}
        <rect 
          x="14" 
          y="64" 
          width="44" 
          height="14" 
          rx="7" 
          fill="#ffffff" 
          stroke="#e2e8f0" 
          strokeWidth="1.5" 
        />
        {/* Fur texture dots */}
        <circle cx="22" cy="71" r="2" fill="#cbd5e1" opacity="0.4" />
        <circle cx="36" cy="71" r="2" fill="#cbd5e1" opacity="0.4" />
        <circle cx="50" cy="71" r="2" fill="#cbd5e1" opacity="0.4" />
        {/* Fluffy White Pompom Ball at Cap Tip */}
        <circle 
          cx="86" 
          cy="42" 
          r="9" 
          fill="#ffffff" 
          stroke="#e2e8f0" 
          strokeWidth="1.5" 
          className="animate-pulse"
        />
        <circle cx="86" cy="42" r="5" fill="#f1f5f9" />
      </svg>
    </div>
  );
}

// 2. Diwali: Ornate Clay Diya (Oil Lamp) with animated flickering flame
export function DiyaLogoAccent({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute -bottom-2 -left-2.5 z-20 pointer-events-none select-none filter drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] ${className}`}
      title="Shubh Deepavali!"
    >
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Diya Clay Base */}
        <path 
          d="M10 58 C 12 78, 35 90, 60 90 C 85 90, 92 74, 95 58 C 75 66, 30 66, 10 58 Z" 
          fill="#b45309" 
          stroke="#78350f" 
          strokeWidth="2" 
        />
        {/* Diya Golden Rim Pattern */}
        <path 
          d="M12 59 C 30 67, 72 67, 92 59" 
          stroke="#fbbf24" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        {/* Diya Body Highlights */}
        <circle cx="35" cy="74" r="2.5" fill="#fef08a" />
        <circle cx="50" cy="78" r="3" fill="#fde047" />
        <circle cx="65" cy="74" r="2.5" fill="#fef08a" />

        {/* Animated Flickering Flame */}
        <g className="animate-[flicker_1.2s_infinite_alternate] origin-bottom" style={{ transformOrigin: '55px 58px' }}>
          {/* Flame Ambient Halo */}
          <circle cx="55" cy="40" r="22" fill="url(#flameGlow)" opacity="0.8" />
          {/* Outer Orange Flame */}
          <path 
            d="M55 12 C 42 28, 40 45, 46 54 C 48 57, 62 57, 64 54 C 70 45, 68 28, 55 12 Z" 
            fill="#f97316" 
          />
          {/* Inner Golden-Yellow Core */}
          <path 
            d="M55 22 C 48 33, 47 46, 50 52 C 52 54, 58 54, 60 52 C 63 46, 62 33, 55 22 Z" 
            fill="#fef08a" 
          />
          {/* Bright White Heart */}
          <ellipse cx="55" cy="46" rx="3.5" ry="5.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

// 3. Eid: Golden Crescent Moon (Hilal) & Star crowning the logo
export function EidCrescentAccent({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute -top-3.5 -right-2.5 z-20 pointer-events-none select-none filter drop-shadow-[0_0_6px_rgba(251,191,36,0.85)] ${className}`}
      title="Eid Mubarak!"
    >
      <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Crescent Moon */}
        <path 
          d="M72 16 C 50 16, 32 34, 32 58 C 32 82, 52 100, 76 98 C 54 94, 46 72, 48 56 C 50 38, 62 24, 72 16 Z" 
          fill="#fbbf24" 
          stroke="#f59e0b" 
          strokeWidth="2" 
        />
        {/* Shimmering Star */}
        <g className="animate-[spin_10s_linear_infinite]">
          <path 
            d="M78 30 L80 38 L88 40 L80 42 L78 50 L76 42 L68 40 L76 38 Z" 
            fill="#fef08a" 
            stroke="#fbbf24" 
            strokeWidth="1.2" 
          />
        </g>
      </svg>
    </div>
  );
}

// 4. Holi: Radiant Multi-Color Splash behind the logo
export function HoliSplashAccent({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute -inset-2 -z-10 pointer-events-none select-none opacity-85 filter drop-shadow-sm ${className}`}
      title="Happy Holi!"
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Saffron / Orange splash */}
        <circle cx="20" cy="22" r="9" fill="#f97316" />
        <circle cx="12" cy="32" r="4.5" fill="#f97316" />
        {/* Magenta / Pink splash */}
        <circle cx="82" cy="18" r="10" fill="#ec4899" />
        <circle cx="90" cy="30" r="5" fill="#ec4899" />
        {/* Purple splash */}
        <circle cx="85" cy="76" r="8.5" fill="#8b5cf6" />
        <circle cx="76" cy="88" r="5" fill="#8b5cf6" />
        {/* Cyan / Teal splash */}
        <circle cx="18" cy="80" r="8" fill="#06b6d4" />
        <circle cx="10" cy="70" r="4.5" fill="#06b6d4" />
        {/* Golden yellow splashes */}
        <circle cx="50" cy="8" r="5.5" fill="#eab308" />
        <circle cx="54" cy="92" r="5.5" fill="#10b981" />
      </svg>
    </div>
  );
}

// 5. New Year: Golden Celebration Hat with Starbursts
export function NewYearHatAccent({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute -top-3.5 -right-2.5 z-20 pointer-events-none select-none filter drop-shadow-[0_0_6px_rgba(56,189,248,0.7)] ${className}`}
      title="Happy New Year!"
    >
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Party Cone Hat */}
        <path d="M50 10 L20 78 L80 78 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
        {/* Gold Stripes */}
        <path d="M42 30 L58 30 L64 45 L36 45 Z" fill="#fbbf24" />
        <path d="M30 60 L70 60 L76 72 L24 72 Z" fill="#fbbf24" />
        {/* Pompom on Top */}
        <circle cx="50" cy="10" r="7" fill="#fbbf24" className="animate-pulse" />
        {/* Sparkles */}
        <circle cx="15" cy="35" r="3" fill="#fef08a" />
        <circle cx="85" cy="40" r="3" fill="#fef08a" />
      </svg>
    </div>
  );
}

// 6. Independence / Republic Day: Tricolor Ribbon Rosette
export function TricolorBadgeAccent({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute -bottom-2 -right-2 z-20 pointer-events-none select-none filter drop-shadow-sm ${className}`}
      title="Happy Independence Day!"
    >
      <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Saffron Top Ribbon */}
        <circle cx="50" cy="50" r="36" stroke="#f97316" strokeWidth="12" strokeDasharray="56.5 169.5" strokeDashoffset="0" />
        {/* White Middle Ribbon */}
        <circle cx="50" cy="50" r="36" stroke="#ffffff" strokeWidth="12" strokeDasharray="56.5 169.5" strokeDashoffset="-56.5" />
        {/* Green Bottom Ribbon */}
        <circle cx="50" cy="50" r="36" stroke="#10b981" strokeWidth="12" strokeDasharray="56.5 169.5" strokeDashoffset="-113" />
        {/* Navy Chakra Center */}
        <circle cx="50" cy="50" r="16" fill="#1e3a8a" />
        <circle cx="50" cy="50" r="6" fill="#ffffff" />
      </svg>
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Container Wrapper for Logo: injects active festival ornament
 * ---------------------------------------------------------------------------
 */
export function FestivalLogoWrapper({ children }: { children: React.ReactNode }) {
  const { festivalConfig } = useFestival();

  if (!festivalConfig.enabled) {
    return <>{children}</>;
  }

  const { festivalType } = festivalConfig;

  return (
    <div className="relative inline-flex items-center justify-center">
      {festivalType === 'christmas' && <SantaHatOverlay />}
      {festivalType === 'diwali' && <DiyaLogoAccent />}
      {festivalType === 'eid' && <EidCrescentAccent />}
      {festivalType === 'holi' && <HoliSplashAccent />}
      {festivalType === 'newyear' && <NewYearHatAccent />}
      {festivalType === 'independence' && <TricolorBadgeAccent />}
      {children}
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Clinic Name Companion Ornament (beside the clinic text)
 * ---------------------------------------------------------------------------
 */
export function FestivalTitleCompanion() {
  const { festivalConfig } = useFestival();

  if (!festivalConfig.enabled) {
    return null;
  }

  const { festivalType } = festivalConfig;

  switch (festivalType) {
    case 'christmas':
      return (
        <span 
          className="inline-flex items-center ml-1.5 text-xs select-none animate-[bounce_2.5s_infinite]"
          title="Merry Christmas"
        >
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">❄️</span>
          <span className="text-rose-500 text-[11px] font-black -ml-0.5">✨</span>
        </span>
      );

    case 'diwali':
      return (
        <span 
          className="inline-flex items-center ml-1.5 space-x-1 select-none"
          title="Happy Diwali"
        >
          <span className="inline-block animate-[flicker_0.9s_infinite_alternate] text-amber-500 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.9)] text-xs">
            🪔
          </span>
          <span className="text-yellow-400 text-[10px] animate-pulse">✨</span>
        </span>
      );

    case 'eid':
      return (
        <span 
          className="inline-flex items-center ml-1.5 select-none text-emerald-600 dark:text-emerald-400"
          title="Eid Mubarak"
        >
          <span className="text-amber-400 text-xs">🌙</span>
          <span className="text-emerald-500 text-[10px] font-bold">✨</span>
        </span>
      );

    case 'holi':
      return (
        <span 
          className="inline-flex items-center ml-1.5 select-none text-xs"
          title="Happy Holi"
        >
          <span className="text-pink-500 font-black animate-pulse">🎨</span>
          <span className="text-amber-400 text-[10px] font-bold">✨</span>
        </span>
      );

    case 'newyear':
      return (
        <span 
          className="inline-flex items-center ml-1.5 select-none text-xs text-sky-400"
          title="Happy New Year"
        >
          <span className="animate-[spin_6s_linear_infinite]">🎆</span>
          <span className="text-amber-300 text-[10px]">✨</span>
        </span>
      );

    case 'independence':
      return (
        <span 
          className="inline-flex items-center ml-1.5 select-none text-xs"
          title="Happy Independence Day"
        >
          <span className="text-orange-500 font-bold">🇮🇳</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center ml-1.5 text-xs text-amber-400 animate-pulse">
          ✨
        </span>
      );
  }
}

/**
 * ---------------------------------------------------------------------------
 * Animated Festival Lights & Decorative Border for Navbar
 * Runs seamlessly along the bottom edge of the header bar
 * ---------------------------------------------------------------------------
 */
export function FestivalNavbarBorder() {
  const { festivalConfig } = useFestival();

  if (!festivalConfig.enabled) {
    return null;
  }

  const { festivalType } = festivalConfig;

  // 1. Diwali: Vibrant glowing fairy lights & marigold toran border
  if (festivalType === 'diwali') {
    return (
      <div className="w-full relative h-3 bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 overflow-hidden border-t border-amber-500/40 select-none">
        {/* Repeating glowing lights garland */}
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {Array.from({ length: 24 }).map((_, i) => {
            const isGolden = i % 2 === 0;
            const isRed = i % 4 === 1;
            return (
              <div 
                key={i} 
                className="flex flex-col items-center justify-center -mt-0.5"
                style={{
                  animationName: 'pulseGlow',
                  animationDuration: `${0.8 + (i % 5) * 0.25}s`,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDirection: 'alternate',
                  animationDelay: `${(i % 6) * 0.15}s`
                }}
              >
                {/* Tiny Wire knot */}
                <div className="w-0.5 h-1 bg-amber-800 dark:bg-amber-600" />
                {/* Glowing Bulb */}
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isRed 
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.95)]' 
                      : isGolden 
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.95)]' 
                      : 'bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.95)]'
                  }`} 
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Christmas: Pine & Mistletoe Garland with twinkling holiday bulbs
  if (festivalType === 'christmas') {
    return (
      <div className="w-full relative h-3 bg-gradient-to-r from-emerald-900/30 via-red-900/30 to-emerald-900/30 overflow-hidden border-t border-emerald-500/40 select-none">
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {Array.from({ length: 24 }).map((_, i) => {
            const colors = ['bg-rose-500', 'bg-emerald-400', 'bg-amber-300', 'bg-sky-400'];
            const shadowColors = [
              'shadow-[0_0_8px_rgba(244,63,94,0.9)]',
              'shadow-[0_0_8px_rgba(52,211,153,0.9)]',
              'shadow-[0_0_8px_rgba(252,211,77,0.9)]',
              'shadow-[0_0_8px_rgba(56,189,248,0.9)]'
            ];
            const colorIdx = i % 4;
            return (
              <div 
                key={i} 
                className="flex flex-col items-center justify-center -mt-0.5"
                style={{
                  animationName: 'pulseGlow',
                  animationDuration: `${0.9 + (i % 4) * 0.3}s`,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDirection: 'alternate',
                  animationDelay: `${(i % 5) * 0.2}s`
                }}
              >
                <div className="w-0.5 h-1 bg-emerald-950 dark:bg-emerald-800" />
                <div className={`w-2 h-2 rounded-full ${colors[colorIdx]} ${shadowColors[colorIdx]}`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Eid: Golden & Emerald Arabesque Islamic Ribbon
  if (festivalType === 'eid') {
    return (
      <div className="w-full relative h-2.5 bg-gradient-to-r from-emerald-600/30 via-amber-500/40 to-emerald-600/30 border-t border-emerald-500/50 overflow-hidden select-none">
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <span 
              key={i}
              className="text-[9px] text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]"
              style={{
                animationName: 'pulseGlow',
                animationDuration: '1.4s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationDelay: `${(i % 4) * 0.3}s`
              }}
            >
              ✦
            </span>
          ))}
        </div>
      </div>
    );
  }

  // 4. Holi: Multi-hue festive rainbow sparkle bar
  if (festivalType === 'holi') {
    return (
      <div className="w-full h-2.5 bg-gradient-to-r from-pink-500 via-amber-400 via-emerald-400 via-sky-400 to-purple-500 opacity-90 animate-pulse select-none" />
    );
  }

  // 5. New Year: Golden Sparkle & Royal Blue Ribbon
  if (festivalType === 'newyear') {
    return (
      <div className="w-full relative h-2.5 bg-gradient-to-r from-sky-600/30 via-amber-500/40 to-sky-600/30 border-t border-sky-400/50 select-none overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {Array.from({ length: 22 }).map((_, i) => (
            <span 
              key={i}
              className="text-[8px] text-yellow-300 filter drop-shadow-[0_0_4px_rgba(253,224,71,0.9)]"
              style={{
                animationName: 'pulse',
                animationDuration: '2s',
                animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
                animationIterationCount: 'infinite',
                animationDelay: `${(i % 5) * 0.18}s`
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    );
  }

  // 6. Independence: Tricolor saffron, white and green line
  if (festivalType === 'independence') {
    return (
      <div className="w-full h-2 flex select-none">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-emerald-600" />
      </div>
    );
  }

  // Default Custom Celebration
  return (
    <div className="w-full h-2 bg-gradient-to-r from-teal-500 via-amber-400 to-teal-500 animate-pulse" />
  );
}

/**
 * ---------------------------------------------------------------------------
 * Corner Ornaments for the 4-Border Page Frame
 * ---------------------------------------------------------------------------
 */
function FrameCorner({ position, festivalType }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; festivalType: string }) {
  const posClasses = {
    'top-left': 'top-1 left-1',
    'top-right': 'top-1 right-1',
    'bottom-left': 'bottom-1 left-1',
    'bottom-right': 'bottom-1 right-1'
  }[position];

  if (festivalType === 'diwali') {
    return (
      <div className={`absolute ${posClasses} z-40 pointer-events-none select-none filter drop-shadow-[0_0_8px_rgba(245,158,11,0.95)]`}>
        <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 60 C 15 80, 40 90, 60 90 C 80 90, 88 80, 90 60 C 70 67, 30 67, 12 60 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <path d="M14 61 C 32 68, 70 68, 88 61" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="76" r="3" fill="#fde047" />
          <g className="animate-[flicker_1s_infinite_alternate]" style={{ transformOrigin: '52px 60px' }}>
            <ellipse cx="52" cy="42" rx="14" ry="18" fill="#f59e0b" opacity="0.85" />
            <ellipse cx="52" cy="44" rx="8" ry="12" fill="#fef08a" />
            <circle cx="52" cy="48" r="4" fill="#ffffff" />
          </g>
        </svg>
      </div>
    );
  }

  if (festivalType === 'christmas') {
    return (
      <div className={`absolute ${posClasses} z-40 pointer-events-none select-none filter drop-shadow-sm`}>
        <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Holly Leaves */}
          <path d="M25 45 C 10 25, 45 15, 50 35 C 55 15, 90 25, 75 45 C 90 65, 55 75, 50 55 C 45 75, 10 65, 25 45 Z" fill="#15803d" stroke="#166534" strokeWidth="2" />
          {/* Red Berries */}
          <circle cx="44" cy="46" r="8" fill="#dc2626" />
          <circle cx="56" cy="46" r="8" fill="#ef4444" />
          <circle cx="50" cy="56" r="8" fill="#b91c1c" />
          <circle cx="43" cy="44" r="2.5" fill="#fecaca" />
          <circle cx="55" cy="44" r="2.5" fill="#fecaca" />
        </svg>
      </div>
    );
  }

  if (festivalType === 'eid') {
    return (
      <div className={`absolute ${posClasses} z-40 pointer-events-none select-none filter drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]`}>
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M68 18 C 48 18, 34 34, 34 56 C 34 78, 52 94, 74 92 C 54 88, 46 68, 48 54 C 50 38, 60 26, 68 18 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <polygon points="74,32 76,38 82,40 76,42 74,48 72,42 66,40 72,38" fill="#fef08a" />
        </svg>
      </div>
    );
  }

  if (festivalType === 'holi') {
    return (
      <div className={`absolute ${posClasses} z-40 pointer-events-none select-none`}>
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="35" r="16" fill="#ec4899" opacity="0.8" />
          <circle cx="65" cy="40" r="14" fill="#f59e0b" opacity="0.8" />
          <circle cx="45" cy="65" r="15" fill="#8b5cf6" opacity="0.8" />
          <circle cx="50" cy="50" r="10" fill="#06b6d4" />
        </svg>
      </div>
    );
  }

  if (festivalType === 'newyear') {
    return (
      <div className={`absolute ${posClasses} z-40 pointer-events-none select-none filter drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]`}>
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,10 58,38 88,40 64,56 72,85 50,68 28,85 36,56 12,40 42,38" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="50" cy="50" r="7" fill="#ffffff" className="animate-ping" />
        </svg>
      </div>
    );
  }

  if (festivalType === 'independence') {
    return (
      <div className={`absolute ${posClasses} z-40 pointer-events-none select-none`}>
        <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="32" fill="#ffffff" stroke="#f97316" strokeWidth="8" />
          <circle cx="50" cy="50" r="20" fill="#10b981" />
          <circle cx="50" cy="50" r="10" fill="#1e3a8a" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`absolute ${posClasses} z-40 pointer-events-none select-none text-amber-400 text-sm animate-pulse`}>
      ✦
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Full 4-Border Festival Frame for the Page Layout
 * Frames all four edges (top, bottom, left, right) and scrolls naturally with page
 * ---------------------------------------------------------------------------
 */
export function FestivalPageFrame() {
  const { festivalConfig } = useFestival();

  if (!festivalConfig.enabled) {
    return null;
  }

  const { festivalType } = festivalConfig;

  // 1. DIWALI: Golden Fairy Lights & Garlands on all 4 borders
  if (festivalType === 'diwali') {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden" aria-hidden="true">
        {/* Top Border */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-600/30 via-orange-500/40 to-amber-600/30 border-b border-amber-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diwali-top-pattern" width="36" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="4" x2="36" y2="4" stroke="rgba(180, 83, 9, 0.6)" strokeWidth="1.5" />
                <rect x="16" y="2" width="4" height="3" fill="#78350f" rx="1" />
                <circle cx="18" cy="7" r="3.5" fill="#fbbf24" filter="drop-shadow(0 0 5px rgba(251,191,36,0.95))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diwali-top-pattern)" />
          </svg>
        </div>

        {/* Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-600/30 via-orange-500/40 to-amber-600/30 border-t border-amber-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diwali-bottom-pattern" width="36" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="8" x2="36" y2="8" stroke="rgba(180, 83, 9, 0.6)" strokeWidth="1.5" />
                <rect x="16" y="7" width="4" height="3" fill="#78350f" rx="1" />
                <circle cx="18" cy="5" r="3.5" fill="#f59e0b" filter="drop-shadow(0 0 5px rgba(245,158,11,0.95))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diwali-bottom-pattern)" />
          </svg>
        </div>

        {/* Left Border */}
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-b from-amber-600/30 via-orange-500/40 to-amber-600/30 border-r border-amber-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diwali-left-pattern" width="12" height="36" patternUnits="userSpaceOnUse">
                <line x1="4" y1="0" x2="4" y2="36" stroke="rgba(180, 83, 9, 0.6)" strokeWidth="1.5" />
                <rect x="2" y="16" width="3" height="4" fill="#78350f" rx="1" />
                <circle cx="7" cy="18" r="3.5" fill="#fbbf24" filter="drop-shadow(0 0 5px rgba(251,191,36,0.95))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diwali-left-pattern)" />
          </svg>
        </div>

        {/* Right Border */}
        <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-b from-amber-600/30 via-orange-500/40 to-amber-600/30 border-l border-amber-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diwali-right-pattern" width="12" height="36" patternUnits="userSpaceOnUse">
                <line x1="8" y1="0" x2="8" y2="36" stroke="rgba(180, 83, 9, 0.6)" strokeWidth="1.5" />
                <rect x="7" y="16" width="3" height="4" fill="#78350f" rx="1" />
                <circle cx="5" cy="18" r="3.5" fill="#f59e0b" filter="drop-shadow(0 0 5px rgba(245,158,11,0.95))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diwali-right-pattern)" />
          </svg>
        </div>

        {/* 4 Corner Ornaments */}
        <FrameCorner position="top-left" festivalType="diwali" />
        <FrameCorner position="top-right" festivalType="diwali" />
        <FrameCorner position="bottom-left" festivalType="diwali" />
        <FrameCorner position="bottom-right" festivalType="diwali" />
      </div>
    );
  }

  // 2. CHRISTMAS: Pine Needle Garland & Holiday Lights on all 4 borders
  if (festivalType === 'christmas') {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden" aria-hidden="true">
        {/* Top Border */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-950/40 via-red-950/40 to-emerald-950/40 border-b border-emerald-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="xmas-top-pattern" width="40" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="4" x2="40" y2="4" stroke="rgba(21, 128, 61, 0.7)" strokeWidth="2" />
                <circle cx="10" cy="7" r="3" fill="#ef4444" filter="drop-shadow(0 0 4px rgba(239,68,68,0.9))" />
                <circle cx="30" cy="7" r="3" fill="#10b981" filter="drop-shadow(0 0 4px rgba(16,185,129,0.9))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#xmas-top-pattern)" />
          </svg>
        </div>

        {/* Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-950/40 via-red-950/40 to-emerald-950/40 border-t border-emerald-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="xmas-bottom-pattern" width="40" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="8" x2="40" y2="8" stroke="rgba(21, 128, 61, 0.7)" strokeWidth="2" />
                <circle cx="10" cy="5" r="3" fill="#fbbf24" filter="drop-shadow(0 0 4px rgba(251,191,36,0.9))" />
                <circle cx="30" cy="5" r="3" fill="#38bdf8" filter="drop-shadow(0 0 4px rgba(56,189,248,0.9))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#xmas-bottom-pattern)" />
          </svg>
        </div>

        {/* Left Border */}
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-b from-emerald-950/40 via-red-950/40 to-emerald-950/40 border-r border-emerald-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="xmas-left-pattern" width="12" height="40" patternUnits="userSpaceOnUse">
                <line x1="4" y1="0" x2="4" y2="40" stroke="rgba(21, 128, 61, 0.7)" strokeWidth="2" />
                <circle cx="7" cy="10" r="3" fill="#ef4444" filter="drop-shadow(0 0 4px rgba(239,68,68,0.9))" />
                <circle cx="7" cy="30" r="3" fill="#fbbf24" filter="drop-shadow(0 0 4px rgba(251,191,36,0.9))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#xmas-left-pattern)" />
          </svg>
        </div>

        {/* Right Border */}
        <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-b from-emerald-950/40 via-red-950/40 to-emerald-950/40 border-l border-emerald-500/40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="xmas-right-pattern" width="12" height="40" patternUnits="userSpaceOnUse">
                <line x1="8" y1="0" x2="8" y2="40" stroke="rgba(21, 128, 61, 0.7)" strokeWidth="2" />
                <circle cx="5" cy="10" r="3" fill="#10b981" filter="drop-shadow(0 0 4px rgba(16,185,129,0.9))" />
                <circle cx="5" cy="30" r="3" fill="#38bdf8" filter="drop-shadow(0 0 4px rgba(56,189,248,0.9))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#xmas-right-pattern)" />
          </svg>
        </div>

        {/* 4 Corner Ornaments */}
        <FrameCorner position="top-left" festivalType="christmas" />
        <FrameCorner position="top-right" festivalType="christmas" />
        <FrameCorner position="bottom-left" festivalType="christmas" />
        <FrameCorner position="bottom-right" festivalType="christmas" />
      </div>
    );
  }

  // 3. EID: Emerald & Golden Arabesque Star Ribbon on all 4 borders
  if (festivalType === 'eid') {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden" aria-hidden="true">
        {/* Top & Bottom */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-600/30 via-amber-500/40 to-emerald-600/30 border-b border-emerald-500/50" />
        <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-600/30 via-amber-500/40 to-emerald-600/30 border-t border-emerald-500/50" />
        {/* Left & Right */}
        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b from-emerald-600/30 via-amber-500/40 to-emerald-600/30 border-r border-emerald-500/50" />
        <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-b from-emerald-600/30 via-amber-500/40 to-emerald-600/30 border-l border-emerald-500/50" />

        {/* 4 Corner Ornaments */}
        <FrameCorner position="top-left" festivalType="eid" />
        <FrameCorner position="top-right" festivalType="eid" />
        <FrameCorner position="bottom-left" festivalType="eid" />
        <FrameCorner position="bottom-right" festivalType="eid" />
      </div>
    );
  }

  // 4. HOLI: Multi-color Rainbow Gradient Ribbon on all 4 borders
  if (festivalType === 'holi') {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-pink-500 via-amber-400 via-emerald-400 via-sky-400 to-purple-500 opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-r from-purple-500 via-sky-400 via-emerald-400 via-amber-400 to-pink-500 opacity-80" />
        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b from-pink-500 via-amber-400 via-emerald-400 to-purple-500 opacity-80" />
        <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-b from-purple-500 via-emerald-400 via-amber-400 to-pink-500 opacity-80" />

        {/* 4 Corner Ornaments */}
        <FrameCorner position="top-left" festivalType="holi" />
        <FrameCorner position="top-right" festivalType="holi" />
        <FrameCorner position="bottom-left" festivalType="holi" />
        <FrameCorner position="bottom-right" festivalType="holi" />
      </div>
    );
  }

  // 5. NEW YEAR: Starburst Celebration Ribbon on all 4 borders
  if (festivalType === 'newyear') {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-sky-600/40 via-amber-400/50 to-sky-600/40 border-b border-sky-400/50" />
        <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-r from-sky-600/40 via-amber-400/50 to-sky-600/40 border-t border-sky-400/50" />
        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b from-sky-600/40 via-amber-400/50 to-sky-600/40 border-r border-sky-400/50" />
        <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-b from-sky-600/40 via-amber-400/50 to-sky-600/40 border-l border-sky-400/50" />

        {/* 4 Corner Ornaments */}
        <FrameCorner position="top-left" festivalType="newyear" />
        <FrameCorner position="top-right" festivalType="newyear" />
        <FrameCorner position="bottom-left" festivalType="newyear" />
        <FrameCorner position="bottom-right" festivalType="newyear" />
      </div>
    );
  }

  // 6. INDEPENDENCE DAY: Tricolor on all 4 borders
  if (festivalType === 'independence') {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="flex-1 bg-orange-500" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-emerald-600" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2 flex">
          <div className="flex-1 bg-emerald-600" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-orange-500" />
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-orange-500 via-white to-emerald-600" />
        <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-orange-500 via-white to-emerald-600" />

        {/* 4 Corner Ornaments */}
        <FrameCorner position="top-left" festivalType="independence" />
        <FrameCorner position="top-right" festivalType="independence" />
        <FrameCorner position="bottom-left" festivalType="independence" />
        <FrameCorner position="bottom-right" festivalType="independence" />
      </div>
    );
  }

  // Default Custom
  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden border-4 border-amber-400/40" aria-hidden="true" />
  );
}

