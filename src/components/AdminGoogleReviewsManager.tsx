import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  ExternalLink, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  MessageSquare,
  Globe,
  MapPin,
  Sparkles,
  RefreshCw,
  X,
  QrCode,
  Download,
  Copy,
  Printer,
  ShieldCheck,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { useClinic } from '../context/ClinicContext';
import { ClinicGoogleConfig } from '../types';
import { 
  getClinicGoogleConfig, 
  DEFAULT_GOOGLE_BUSINESS_PROFILE_ID, 
  DEFAULT_ELFSIGHT_APP_ID,
  extractElfsightAppId,
  buildGoogleReviewUrls,
  extractGoogleBusinessProfileId
} from '../data/clinicMediaData';
import { GoogleLogoIcon } from './ClinicGoogleReviewsSection';
import { ElfsightGoogleReviewsWidget } from './ElfsightGoogleReviewsWidget';

export function AdminGoogleReviewsManager() {
  const { activeClinic, clinics, selectClinicBySlug, updateClinic, fetchAndSyncGoogleReviews } = useClinic();

  // Selected clinic profile
  const [selectedClinicId, setSelectedClinicId] = useState<string>(activeClinic?.id || clinics[0]?.id || 'clinic-revon-dental');

  // Keep selectedClinicId synced with activeClinic on initial load or active clinic switch
  useEffect(() => {
    if (activeClinic?.id && activeClinic.id !== selectedClinicId) {
      setSelectedClinicId(activeClinic.id);
    }
  }, [activeClinic?.id]);

  const currentClinic = clinics.find(c => c.id === selectedClinicId) || activeClinic || clinics[0];
  const clinicSlug = currentClinic?.slug || 'revon-dental';
  const clinicName = currentClinic?.name || 'Clinic';

  // Base configuration loaded from current clinic or default presets
  const defaultConfig = getClinicGoogleConfig(clinicSlug, clinicName);
  const initialConfig: ClinicGoogleConfig = currentClinic?.googleConfig
    ? {
        ...defaultConfig,
        ...currentClinic.googleConfig,
        reviews: (currentClinic.googleConfig.reviews && currentClinic.googleConfig.reviews.length > 0)
          ? currentClinic.googleConfig.reviews
          : defaultConfig.reviews
      }
    : defaultConfig;

  // Form states
  const [businessProfileId, setBusinessProfileId] = useState(initialConfig.businessProfileId || initialConfig.placeId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID);
  const [writeReviewUrl, setWriteReviewUrl] = useState(initialConfig.writeReviewUrl || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialConfig.googleMapsUrl || '');
  const [embedWidgetUrl, setEmbedWidgetUrl] = useState(initialConfig.embedWidgetUrl || '');
  const [elfsightAppId, setElfsightAppId] = useState(initialConfig.elfsightAppId || DEFAULT_ELFSIGHT_APP_ID);
  const [placeId, setPlaceId] = useState(initialConfig.placeId || '');
  const [rating, setRating] = useState<number>(initialConfig.rating || 4.9);
  const [totalReviews, setTotalReviews] = useState<number>(initialConfig.totalReviews || 150);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);

  // Generate QR Code dynamically whenever writeReviewUrl changes
  useEffect(() => {
    const targetUrl = writeReviewUrl.trim() || `https://search.google.com/local/writereview?placeid=${businessProfileId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID}`;
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR code generation error:', err));
  }, [writeReviewUrl, businessProfileId]);

  // Update when selected clinic changes
  useEffect(() => {
    if (currentClinic) {
      const def = getClinicGoogleConfig(currentClinic.slug, currentClinic.name);
      const cfg = currentClinic.googleConfig
        ? {
            ...def,
            ...currentClinic.googleConfig
          }
        : def;
      
      const curPid = cfg.businessProfileId || cfg.placeId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID;
      setBusinessProfileId(curPid);
      setWriteReviewUrl(cfg.writeReviewUrl || '');
      setGoogleMapsUrl(cfg.googleMapsUrl || '');
      setEmbedWidgetUrl(cfg.embedWidgetUrl || '');
      setElfsightAppId(cfg.elfsightAppId || DEFAULT_ELFSIGHT_APP_ID);
      setPlaceId(cfg.placeId || curPid);
      setRating(cfg.rating || 4.9);
      setTotalReviews(cfg.totalReviews || 150);
    }
  }, [selectedClinicId]);

  const handleApplyProfileId = (idToUse?: string) => {
    const rawTarget = idToUse || businessProfileId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID;
    const targetId = extractGoogleBusinessProfileId(rawTarget);
    if (!targetId) return;
    const generated = buildGoogleReviewUrls(targetId, clinicName);
    setBusinessProfileId(targetId);
    setPlaceId(targetId);
    setWriteReviewUrl(generated.writeReviewUrl);
    setGoogleMapsUrl(generated.googleMapsUrl);
    showBanner(`Successfully applied Google Business Profile ID (${targetId}) and generated direct URLs.`, 'success');
  };

  const handleFetchReviewsFromGoogle = async (idToUse?: string) => {
    const rawTarget = idToUse || businessProfileId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID;
    const targetId = extractGoogleBusinessProfileId(rawTarget);
    if (!targetId) {
      showBanner('Please provide a valid Google Business Profile ID, CID, or Maps URL.', 'error');
      return;
    }

    setIsFetchingGoogle(true);
    try {
      showBanner(`Contacting Google services for Business Profile ID ${targetId}...`, 'info');
      const result = await fetchAndSyncGoogleReviews(selectedClinicId, targetId);

      setRating(result.rating);
      setTotalReviews(result.totalReviews);
      setBusinessProfileId(targetId);
      setPlaceId(targetId);

      const generated = buildGoogleReviewUrls(targetId, clinicName);
      setWriteReviewUrl(generated.writeReviewUrl);
      setGoogleMapsUrl(generated.googleMapsUrl);

      showBanner(
        `Successfully synchronized Google profile stats (${targetId})! Rating: ${result.rating}★ across ${result.totalReviews} reviews.`,
        'success'
      );
    } catch (err: any) {
      console.error('Error fetching Google reviews:', err);
      showBanner(err.message || 'Failed to fetch reviews from Google Business Profile.', 'error');
    } finally {
      setIsFetchingGoogle(false);
    }
  };

  const handleCopyProfileId = () => {
    if (!businessProfileId) return;
    navigator.clipboard.writeText(businessProfileId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `Google-Review-QR-${clinicSlug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showBanner('Google Review QR Code downloaded! Ready to print for patient reception.', 'success');
  };

  const handlePrintQrCode = () => {
    if (!qrCodeDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Review ${clinicName} on Google</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; color: #0f172a; }
            .card { max-width: 480px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 24px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            h1 { font-size: 24px; margin-bottom: 8px; font-weight: 800; }
            p { font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.5; }
            img { width: 240px; height: 240px; border-radius: 12px; border: 1px solid #cbd5e1; }
            .badge { display: inline-block; background: #f1f5f9; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 20px; color: #334155; }
            .stars { color: #f59e0b; font-size: 20px; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Google Verified Business #${businessProfileId}</div>
            <h1>We Value Your Feedback!</h1>
            <div class="stars">★★★★★</div>
            <p>Scan this QR code with your smartphone camera to leave a verified review on Google for <strong>${clinicName}</strong>.</p>
            <img src="${qrCodeDataUrl}" alt="Google Review QR Code" />
            <p style="margin-top: 24px; font-size: 12px;">Thank you for helping us provide world-class specialist healthcare.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage(null);
    }, 4000);
  };

  const handleRestoreDefaults = () => {
    if (confirm(`Reset to default recommended Google configuration for ${clinicName}?`)) {
      const def = getClinicGoogleConfig(clinicSlug, clinicName);
      setWriteReviewUrl(def.writeReviewUrl);
      setGoogleMapsUrl(def.googleMapsUrl);
      setEmbedWidgetUrl(def.embedWidgetUrl || '');
      setElfsightAppId(def.elfsightAppId || DEFAULT_ELFSIGHT_APP_ID);
      setPlaceId(def.placeId || '');
      setRating(def.rating);
      setTotalReviews(def.totalReviews);
      showBanner(`Restored clinic Google reviews preset for ${clinicName}. Click "Save Google Settings" to apply.`, 'success');
    }
  };

  const handleSaveAllGoogleConfig = async () => {
    if (!currentClinic) return;
    setIsSaving(true);
    setBannerMessage(null);

    const cleanProfileId = (businessProfileId || placeId || DEFAULT_GOOGLE_BUSINESS_PROFILE_ID).trim();
    const cleanPlaceId = (placeId || cleanProfileId).trim();
    const cleanElfsightId = extractElfsightAppId(elfsightAppId) || DEFAULT_ELFSIGHT_APP_ID;
    const updatedConfig: ClinicGoogleConfig = {
      rating: Number(rating) || 4.9,
      totalReviews: Number(totalReviews) || 100,
      businessProfileId: cleanProfileId,
      placeId: cleanPlaceId,
      googleMapsUrl: googleMapsUrl.trim() || `https://maps.google.com/?cid=${cleanProfileId}`,
      writeReviewUrl: writeReviewUrl.trim() || `https://search.google.com/local/writereview?placeid=${cleanProfileId}`,
      embedWidgetUrl: embedWidgetUrl.trim(),
      elfsightAppId: cleanElfsightId,
      reviews: currentClinic.googleConfig?.reviews || []
    };

    try {
      await updateClinic(currentClinic.id, {
        googleConfig: updatedConfig
      });
      showBanner(`Google Business (Profile ID: ${cleanProfileId}) & Review settings successfully saved and published for ${clinicName}!`, 'success');
    } catch (err: any) {
      console.error('Error saving Google config:', err);
      showBanner(err.message || 'Failed to save Google configuration.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {bannerMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn ${
          bannerMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : bannerMessage.type === 'info'
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : bannerMessage.type === 'info' ? (
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-50/70 via-slate-50 to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 rounded-3xl border border-blue-100 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 shrink-0">
            <GoogleLogoIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                Google Business Profile & Review URLs
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                PORTFOLIO INTEGRATION
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect your official Google Business reviews link, Google Maps location, and verified rating badge for <strong className="text-slate-700 dark:text-slate-200">{clinicName}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => handleFetchReviewsFromGoogle()}
            disabled={isFetchingGoogle}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
            title="Fetch and synchronize live reviews from Google"
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingGoogle ? 'animate-spin' : ''}`} />
            <span>{isFetchingGoogle ? 'Syncing...' : 'Fetch from Google Profile'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            title="Load clinic defaults"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllGoogleConfig}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Google Settings'}</span>
          </button>
        </div>
      </div>

      {/* Clinic Profile Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Selected Profile:
          </span>
          <select
            value={selectedClinicId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedClinicId(newId);
              const found = clinics.find(c => c.id === newId);
              if (found) selectClinicBySlug(found.slug);
            }}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            {clinics.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} (/{c.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            Preview live:
          </span>
          <a
            href={`/${clinicSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <span>/{clinicSlug} Landing Page</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Google Business Profile ID & Quick Synchronization Card */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 p-5 sm:p-6 rounded-3xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
              <GoogleLogoIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white font-display">
                  Google Business Profile Integration
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Google Business Account ID for automated review collection, rating sync, and maps routing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => handleFetchReviewsFromGoogle('1293814119993852207')}
              disabled={isFetchingGoogle}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Fetch Reviews from Google for Profile ID 1293814119993852207"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetchingGoogle ? 'animate-spin' : ''}`} />
              <span>Fetch Reviews for 1293814119993852207</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyProfileId('1293814119993852207')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              title="Apply Business Profile ID 1293814119993852207"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Use ID: 1293814119993852207</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Google Business Profile ID / CID
              </label>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text"
                  value={businessProfileId}
                  onChange={(e) => setBusinessProfileId(e.target.value)}
                  placeholder="e.g. 1293814119993852207"
                  className="flex-1 min-w-[180px] px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCopyProfileId}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
                  title="Copy Profile ID"
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFetchReviewsFromGoogle(businessProfileId)}
                  disabled={isFetchingGoogle}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors shrink-0 disabled:opacity-50"
                  title="Fetch and synchronize live customer reviews from Google"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isFetchingGoogle ? 'animate-spin' : ''}`} />
                  <span>{isFetchingGoogle ? 'Fetching...' : 'Fetch Reviews from Google'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyProfileId(businessProfileId)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate URLs</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Entering your ID generates your Google "Write a Review" link (<code className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">https://search.google.com/local/writereview?placeid={businessProfileId || '1293814119993852207'}</code>) and Google Maps profile URL.
              </p>

              <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-blue-50/70 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900 dark:text-blue-200">How Live Reviews Work:</strong> Direct live fetching from Google requires an active Google Cloud Places API key. Without an API key connected, clicking "Fetch" models realistic demo reviews for your clinic. You can also click <em>"+ Add Google Review"</em> below to paste your clinic's actual patient reviews anytime!
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">Active Link Destination:</span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-xs sm:max-w-md">
                  {writeReviewUrl || 'Not configured'}
                </span>
              </div>
              {writeReviewUrl && (
                <a
                  href={writeReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs"
                >
                  <span>Open Review Prompt</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Review QR Code Card */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Patient Direct Review QR Code</span>
            </div>

            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Google Review QR Code"
                className="h-28 w-28 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white shadow-xs"
              />
            ) : (
              <div className="h-28 w-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs">
                Generating...
              </div>
            )}

            <div className="flex items-center gap-1.5 w-full">
              <button
                type="button"
                onClick={handleDownloadQrCode}
                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                title="Download QR PNG"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={handlePrintQrCode}
                className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                title="Print clinic reception sign"
              >
                <Printer className="h-3 w-3" />
                <span>Print Sign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-start space-x-3 text-xs">
        <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-700 dark:text-slate-300">
          <div className="font-bold text-slate-900 dark:text-amber-200">
            How to get your direct Google Review Link:
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
            <li>Search for your clinic name on Google (or open your <strong>Google Business Profile</strong> manager).</li>
            <li>Click the <strong>"Ask for reviews"</strong> or <strong>"Get more reviews"</strong> button.</li>
            <li>Copy the short review URL (usually looks like <code className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[11px]">https://g.page/r/.../review</code> or <code className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[11px]">https://search.google.com/local/writereview?placeid=...</code>).</li>
            <li>Paste it into the <strong>Google "Write a Review" Direct URL</strong> field below!</li>
          </ol>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Google Direct Write Review URL */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <GoogleLogoIcon className="h-3.5 w-3.5" />
              <span>Google "Write a Review" Direct URL *</span>
            </label>
            {writeReviewUrl && (
              <a
                href={writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>Test Link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <input
            type="url"
            value={writeReviewUrl}
            onChange={(e) => setWriteReviewUrl(e.target.value)}
            placeholder="https://search.google.com/local/writereview?placeid=ChIJ..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-[11px] text-slate-400">
            Clicking "Review Us on Google" on your landing page opens this direct review dialogue for patients.
          </p>
        </div>

        {/* Google Maps Profile URL */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>Google Maps Profile / Location URL *</span>
            </label>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>Test Link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <input
            type="url"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            placeholder="https://maps.google.com/?q=Revon+Dental+Indiranagar"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-[11px] text-slate-400">
            Link to your clinic's business pin on Google Maps.
          </p>
        </div>

        {/* Elfsight Google Reviews Live Widget (Iframe / Embed) */}
        <div className="bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-6 rounded-3xl border border-blue-200/80 dark:border-blue-900/50 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <GoogleLogoIcon className="h-5 w-5 fill-white" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <span>Google Place Review Widget (Live Iframe Embed)</span>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Renders your authentic Google Maps reviews directly inside an interactive iframe widget.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 px-2.5 py-1 rounded-xl">
                Elfsight CDN Enabled
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Elfsight Widget App ID or HTML Snippet *</span>
                {elfsightAppId && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ID: {extractElfsightAppId(elfsightAppId)}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={elfsightAppId}
                onChange={(e) => setElfsightAppId(e.target.value)}
                placeholder="9fd444a6-3e6e-4605-89b6-b141a3f5b4fa or paste Elfsight snippet"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                You can paste the raw UUID (e.g. <code>{DEFAULT_ELFSIGHT_APP_ID}</code>) or the full <code>&lt;div class="elfsight-app-..."&gt;</code> tag.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Custom Iframe Embed URL (Optional Fallback)</span>
                {embedWidgetUrl && (
                  <a
                    href={embedWidgetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Test URL</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </label>
              <input
                type="url"
                value={embedWidgetUrl}
                onChange={(e) => setEmbedWidgetUrl(e.target.value)}
                placeholder="https://... (Optional alternative iframe embed URL)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Leave empty to use the Elfsight Google Reviews widget.
              </p>
            </div>
          </div>

          {/* Live Preview Inside Admin */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span>Live Reviews Widget Preview:</span>
              <span className="text-[11px] font-mono text-slate-400">This exact widget is shown on your website</span>
            </div>
            <ElfsightGoogleReviewsWidget
              appId={extractElfsightAppId(elfsightAppId)}
              embedWidgetUrl={embedWidgetUrl}
              clinicName={clinicName}
              googleMapsUrl={googleMapsUrl}
              writeReviewUrl={writeReviewUrl}
            />
          </div>
        </div>

        {/* Google Rating */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Google Average Star Rating (1.0 - 5.0) *</span>
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              value={rating}
              onChange={(e) => setRating(parseFloat(e.target.value) || 5.0)}
              className="w-32 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Displayed on the Google Rating badge across your website and reviews page.
          </p>
        </div>

        {/* Total Reviews Count & Place ID */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
            <span>Total Verified Google Reviews Count *</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                value={totalReviews}
                onChange={(e) => setTotalReviews(parseInt(e.target.value, 10) || 0)}
                placeholder="240"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Count (e.g. 245)</span>
            </div>
            <div>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="ChIJ_revon_blr (Optional)"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Place ID (Optional)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
