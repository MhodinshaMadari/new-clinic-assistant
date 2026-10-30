import React from 'react';
import { APP_NAME } from '../config/appConfig';
// @ts-ignore
import mainLogo from '../assets/images/clinic_assistant_logo_1785493263769.jpg';

interface RevonLogoProps {
  className?: string;
  size?: number;
  customSrc?: string;
  hideText?: boolean;
  taglineClassName?: string;
  lightMode?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export function RevonLogo({ 
  className = '', 
  size = 48, 
  customSrc,
  hideText = false, 
  taglineClassName = 'text-slate-500',
  lightMode = true,
  layout = 'horizontal'
}: RevonLogoProps) {
  // Using custom clinic logo if uploaded, or default logo
  const logoSrc = customSrc || mainLogo;
  const logoImg = (
    <img
      src={logoSrc}
      alt={APP_NAME}
      style={{ height: `${size}px`, width: `${size}px` }}
      className="object-cover rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700/60 block shrink-0"
      referrerPolicy="no-referrer"
    />
  );

  return (
    <div className={`inline-flex items-center ${className}`}>
      {logoImg}
    </div>
  );
}
