import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle, 
  ExternalLink, 
  MessageSquarePlus, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight,
  QrCode,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { Clinic, Review } from '../types';
import { getClinicGoogleConfig, DEFAULT_GOOGLE_BUSINESS_PROFILE_ID, DEFAULT_ELFSIGHT_APP_ID } from '../data/clinicMediaData';
import { ElfsightGoogleReviewsWidget } from './ElfsightGoogleReviewsWidget';

interface ClinicGoogleReviewsSectionProps {
  clinic: Clinic | null;
  clinicReviews: Review[]; // In-clinic patient reviews from Firestore
  onWriteReviewClick?: () => void;
  canWriteReview?: boolean;
}

export function GoogleLogoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>
  );
}

export function ClinicGoogleReviewsSection({
  clinic,
  clinicReviews,
  onWriteReviewClick,
  canWriteReview = true
}: ClinicGoogleReviewsSectionProps) {
  const clinicSlug = clinic?.slug || 'revon-dental';
  const clinicName = clinic?.name || 'Our Clinic';

  const defaultConfig = getClinicGoogleConfig(clinicSlug, clinicName);
  const googleConfig = React.useMemo(() => {
    if (!clinic?.googleConfig) return defaultConfig;
    const pid = clinic.googleConfig.businessProfileId || clinic.googleConfig.placeId || defaultConfig.businessProfileId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID;
    return {
      businessProfileId: pid,
      placeId: clinic.googleConfig.placeId || pid,
      rating: clinic.googleConfig.rating ?? defaultConfig.rating,
      totalReviews: clinic.googleConfig.totalReviews ?? defaultConfig.totalReviews,
      writeReviewUrl: clinic.googleConfig.writeReviewUrl || defaultConfig.writeReviewUrl,
      googleMapsUrl: clinic.googleConfig.googleMapsUrl || defaultConfig.googleMapsUrl,
      embedWidgetUrl: clinic.googleConfig.embedWidgetUrl || '',
      elfsightAppId: clinic.googleConfig.elfsightAppId || defaultConfig.elfsightAppId || DEFAULT_ELFSIGHT_APP_ID,
      reviews: (clinic.googleConfig.reviews && clinic.googleConfig.reviews.length > 0)
        ? clinic.googleConfig.reviews
        : defaultConfig.reviews
    };
  }, [clinic?.googleConfig, clinicSlug, clinicName]);

  const [activeTab, setActiveTab] = useState<'google' | 'portal'>('google');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (googleConfig.writeReviewUrl) {
      QRCode.toDataURL(googleConfig.writeReviewUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.warn('QR code generation failed:', err));
    }
  }, [googleConfig.writeReviewUrl]);

  // Reset page when clinic changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [clinicSlug]);

  // Normalize in-clinic reviews
  const publishedClinicReviews = clinicReviews.filter(r => r.isPublished !== false);

  // Combined item format for rendering
  type UnifiedReview = {
    id: string;
    source: 'google' | 'portal';
    authorName: string;
    avatarUrl?: string;
    rating: number;
    text: string;
    date: string;
    treatmentTag?: string;
    response?: string;
    responseAuthor?: string;
  };

  const portalUnifiedReviews: UnifiedReview[] = publishedClinicReviews.map(pr => ({
    id: pr.id,
    source: 'portal',
    authorName: pr.patientName,
    rating: pr.rating,
    text: pr.comment,
    date: new Date(pr.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    treatmentTag: pr.treatmentName,
    response: pr.adminReply,
    responseAuthor: pr.adminReplyBy || 'Clinical Team'
  }));

  const displayedReviews = portalUnifiedReviews;
  const pageSize = 3;
  const totalSlides = Math.ceil(displayedReviews.length / pageSize) || 1;
  const safePage = Math.min(currentPage, Math.max(0, totalSlides - 1));
  const pageReviews = displayedReviews.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="space-y-8">
      {/* Google Rating Showcase Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid md:grid-cols-12 gap-6 items-center">
          {/* Rating overview */}
          <div className="md:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
              <GoogleLogoIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                  {googleConfig.rating.toFixed(1)}
                </span>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${
                        i < Math.floor(googleConfig.rating) 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-amber-400 fill-amber-400 opacity-60'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Official Google Rating for <span className="font-bold text-slate-900 dark:text-white">{clinicName}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Over {googleConfig.totalReviews}+ verified Google reviews</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  <span>ID: {googleConfig.businessProfileId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Direct CTA Buttons */}
          <div className="md:col-span-5 flex flex-wrap sm:flex-nowrap items-center justify-start md:justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap shadow-2xs"
              title="Scan QR code with phone camera to review"
            >
              <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>QR Code</span>
            </button>

            <a
              href={googleConfig.writeReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <GoogleLogoIcon className="h-4 w-4" />
              <span>Review on Google</span>
              <ExternalLink className="h-3 w-3 opacity-75" />
            </a>

            <a
              href={googleConfig.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
            >
              <span>View Map</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs & Source Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Source Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-start">
          <button
            type="button"
            onClick={() => { setActiveTab('google'); setCurrentPage(0); }}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GoogleLogoIcon className="h-4 w-4" />
            <span>Google Place Reviews</span>
            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              Live Feed
            </span>
          </button>

          {publishedClinicReviews.length > 0 && (
            <button
              type="button"
              onClick={() => { setActiveTab('portal'); setCurrentPage(0); }}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'portal'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>In-Clinic Patient Feedback ({publishedClinicReviews.length})</span>
            </button>
          )}
        </div>

        {/* Carousel pagination arrows for In-Clinic reviews */}
        {activeTab === 'portal' && totalSlides > 1 && (
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {safePage + 1} / {totalSlides}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={safePage === 0}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalSlides - 1, prev + 1))}
              disabled={safePage >= totalSlides - 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Reviews Display: Live Iframe Widget Alone OR In-Clinic Portal Reviews */}
      {activeTab === 'google' ? (
        <ElfsightGoogleReviewsWidget
          appId={googleConfig.elfsightAppId || DEFAULT_ELFSIGHT_APP_ID}
          embedWidgetUrl={googleConfig.embedWidgetUrl}
          clinicName={clinicName}
          googleMapsUrl={googleConfig.googleMapsUrl}
          writeReviewUrl={googleConfig.writeReviewUrl}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pageReviews.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6">
            No in-clinic portal reviews submitted yet. Book an appointment to leave direct clinical feedback!
          </div>
        ) : (
          pageReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-revon-blue/40 dark:hover:border-teal-500/40 transition-all group"
            >
              <div className="space-y-3.5">
                {/* Card top: Stars and Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < rev.rating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-200 dark:text-slate-700'
                        }`} 
                      />
                    ))}
                  </div>

                  <div className="inline-flex items-center space-x-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono">
                    <CheckCircle className="h-3 w-3" />
                    <span>Verified Patient</span>
                  </div>
                </div>

                {/* Treatment tag if any */}
                {rev.treatmentTag && (
                  <div className="inline-block text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-0.5 rounded-md">
                    {rev.treatmentTag}
                  </div>
                )}

                {/* Review Comment */}
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                  "{rev.text}"
                </p>

                {/* Clinic Response */}
                {rev.response && (
                  <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border-l-2 border-teal-500 space-y-1 text-xs">
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider font-mono">
                      <span>Response from {rev.responseAuthor}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] italic leading-relaxed">
                      "{rev.response}"
                    </p>
                  </div>
                )}
              </div>

              {/* Author info footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  {rev.avatarUrl ? (
                    <img
                      src={rev.avatarUrl}
                      alt={rev.authorName}
                      className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-revon-blue/10 dark:bg-teal-950 text-revon-blue dark:text-teal-300 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {rev.authorName ? rev.authorName[0] : 'P'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{rev.authorName}</span>
                      <CheckCircle className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono">
                      {rev.date}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}

      {/* Direct Google Review QR Code Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative space-y-4"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <GoogleLogoIcon className="h-7 w-7" />
              </div>

              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                  Review {clinicName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Point your phone camera at this QR code to write a verified review directly on Google.
                </p>
              </div>

              <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`Google Review QR code for ${clinicName}`}
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Generating QR code...
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-400">
                  Google Business Profile ID: #{googleConfig.businessProfileId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID}
                </div>
                <a
                  href={googleConfig.writeReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                >
                  <span>Open Direct Review Link</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
