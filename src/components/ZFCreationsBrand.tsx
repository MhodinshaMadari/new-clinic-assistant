import React from 'react';

interface ZFCreationsBrandProps {
  className?: string;
  lightMode?: boolean;
}

export function ZFCreationsBrand({ className = '', lightMode = false }: ZFCreationsBrandProps) {
  return (
    <div id="zf-creations-brand-tag" className={`inline-flex items-center space-x-2 text-xs select-none ${lightMode ? 'text-slate-500' : 'text-slate-400'} ${className}`}>
      <span className="font-semibold tracking-wide">crafted by</span>
      <span className="relative inline-flex items-center px-3 py-1 rounded-xl bg-slate-950 border border-slate-800/80 shadow-md shadow-black/40 overflow-hidden group">
        {/* Diagonal striped texture background */}
        <span className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#000,#000_2px,transparent_2px,transparent_8px)] mix-blend-overlay"></span>
        {/* Pulsing glow highlight circle */}
        <span className="absolute -inset-4 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25)_0,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
        {/* Shimmer sweep effect */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></span>
        
        {/* Highly polished gradient text */}
        <span className="relative z-10 font-mono font-extrabold uppercase tracking-wider text-[11px] bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          ZF Creations
        </span>
      </span>
    </div>
  );
}
