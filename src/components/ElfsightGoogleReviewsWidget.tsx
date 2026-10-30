import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { GoogleLogoIcon } from './ClinicGoogleReviewsSection';
import { DEFAULT_ELFSIGHT_APP_ID } from '../data/clinicMediaData';

interface ElfsightGoogleReviewsWidgetProps {
  appId?: string;
  embedWidgetUrl?: string;
  clinicName?: string;
  googleMapsUrl?: string;
  writeReviewUrl?: string;
  className?: string;
}

export function ElfsightGoogleReviewsWidget({
  appId = DEFAULT_ELFSIGHT_APP_ID,
  embedWidgetUrl,
  clinicName = 'Revon Multi-Specialty Dental Clinic',
  googleMapsUrl = 'https://maps.google.com/?cid=1293814119993852207',
  writeReviewUrl = 'https://search.google.com/local/writereview?placeid=1293814119993852207',
  className = ''
}: ElfsightGoogleReviewsWidgetProps) {
  const activeAppId = appId?.trim() || DEFAULT_ELFSIGHT_APP_ID;
  const [loadKey, setLoadKey] = useState(0);

  const iframeSrc = embedWidgetUrl || `/elfsight-reviews-frame.html?appId=${encodeURIComponent(activeAppId)}`;

  return (
    <div className={`w-full bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4 ${className}`}>
      {/* Top Source Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shadow-xs">
            <GoogleLogoIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white font-display">
                Google Place Reviews
              </span>
              <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Live Google Feed</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Synced directly from the official Google Business Profile for {clinicName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setLoadKey(k => k + 1)}
            title="Reload Google review widget"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>

          <a
            href={writeReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <span>Write Review</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Widget Container - Isolated Iframe to prevent styled-components collisions */}
      <div className="w-full relative min-h-[480px] rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
        <iframe
          key={`elfsight-frame-${activeAppId}-${loadKey}`}
          src={iframeSrc}
          title={`${clinicName} Google Place Reviews`}
          className="w-full h-[600px] min-h-[480px] border-0 rounded-2xl bg-transparent"
          loading="lazy"
          allowFullScreen
        />
      </div>

      {/* Footer reassurance */}
      <div className="pt-2 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          Reviews are submitted by verified patients on Google Maps • Real-time Elfsight integration
        </p>
      </div>
    </div>
  );
}
