import React, { useState, useEffect, useMemo } from 'react';
import { 
  Youtube, 
  Play, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Film, 
  Clock, 
  RefreshCw,
  X,
  Sparkles,
  Eye
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { ClinicYouTubeVideo } from '../types';
import { 
  getClinicYouTubeVideos, 
  extractYouTubeId, 
  sanitizeClinicYouTubeVideos 
} from '../data/clinicMediaData';

export { extractYouTubeId };

export function AdminYouTubeManager() {
  const { activeClinic, clinics, selectClinicBySlug, updateClinic } = useClinic();
  
  // Local clinic selection state allowing managing any clinic profile
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

  // Base list of videos for current clinic
  const initialVideos: ClinicYouTubeVideo[] = useMemo(() => {
    const raw = (currentClinic?.youtubeVideos && currentClinic.youtubeVideos.length > 0)
      ? currentClinic.youtubeVideos
      : getClinicYouTubeVideos(clinicSlug, clinicName);
    return sanitizeClinicYouTubeVideos(raw);
  }, [currentClinic?.youtubeVideos, clinicSlug, clinicName]);

  const initialChannelUrl = currentClinic?.youtubeChannelUrl 
    || currentClinic?.socialHandles?.find(s => s.platform === 'youtube')?.url 
    || `https://www.youtube.com/results?search_query=${encodeURIComponent(clinicName + ' clinic')}`;

  const [channelUrl, setChannelUrl] = useState(initialChannelUrl);
  const [videos, setVideos] = useState<ClinicYouTubeVideo[]>(initialVideos);

  // Sync state only when switching selected clinic ID
  useEffect(() => {
    if (currentClinic) {
      const v = (currentClinic.youtubeVideos && currentClinic.youtubeVideos.length > 0)
        ? currentClinic.youtubeVideos
        : getClinicYouTubeVideos(currentClinic.slug, currentClinic.name);
      setVideos(sanitizeClinicYouTubeVideos(v));

      const ch = currentClinic.youtubeChannelUrl 
        || currentClinic.socialHandles?.find(s => s.platform === 'youtube')?.url 
        || `https://www.youtube.com/results?search_query=${encodeURIComponent(currentClinic.name + ' clinic')}`;
      setChannelUrl(ch);
    }
  }, [selectedClinicId]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ClinicYouTubeVideo | null>(null);
  const [videoInputUrl, setVideoInputUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState<'tour' | 'procedure' | 'testimonial' | 'doctor' | 'general'>('tour');
  const [videoDuration, setVideoDuration] = useState('3:00');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Video Preview Modal
  const [previewingVideo, setPreviewingVideo] = useState<ClinicYouTubeVideo | null>(null);

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage(null);
    }, 4000);
  };

  const detectedYouTubeId = useMemo(() => {
    return extractYouTubeId(videoInputUrl);
  }, [videoInputUrl]);

  const handleOpenAddVideoModal = () => {
    setEditingVideo(null);
    setVideoInputUrl('');
    setVideoTitle('');
    setVideoCategory('tour');
    setVideoDuration('3:00');
    setVideoDescription('');
    setVideoThumbnailUrl('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditVideoModal = (v: ClinicYouTubeVideo) => {
    setEditingVideo(v);
    setVideoInputUrl(v.youtubeUrl || `https://www.youtube.com/watch?v=v.youtubeId`);
    setVideoTitle(v.title);
    setVideoCategory(v.category);
    setVideoDuration(v.duration || '3:00');
    setVideoDescription(v.description || '');
    setVideoThumbnailUrl(v.thumbnailUrl || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveVideoModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractYouTubeId(videoInputUrl);
    if (!cleanId) {
      setModalError('Please enter a valid YouTube Video URL or Video ID.');
      return;
    }
    if (!videoTitle.trim()) {
      setModalError('Video title is required.');
      return;
    }

    const resolvedThumbnail = videoThumbnailUrl.trim() || `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;

    if (editingVideo) {
      // Update existing
      setVideos(prev => prev.map(v => v.id === editingVideo.id ? {
        ...v,
        title: videoTitle.trim(),
        youtubeId: cleanId,
        youtubeUrl: videoInputUrl.trim().startsWith('http') ? videoInputUrl.trim() : `https://www.youtube.com/watch?v=${cleanId}`,
        category: videoCategory,
        duration: videoDuration.trim() || '3:00',
        description: videoDescription.trim(),
        thumbnailUrl: resolvedThumbnail
      } : v));
    } else {
      // Create new video
      const newVideo: ClinicYouTubeVideo = {
        id: `yt-vid-${Date.now()}`,
        title: videoTitle.trim(),
        youtubeId: cleanId,
        youtubeUrl: videoInputUrl.trim().startsWith('http') ? videoInputUrl.trim() : `https://www.youtube.com/watch?v=${cleanId}`,
        category: videoCategory,
        duration: videoDuration.trim() || '3:00',
        description: videoDescription.trim(),
        thumbnailUrl: resolvedThumbnail
      };
      setVideos(prev => [...prev, newVideo]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteVideo = (id: string) => {
    if (confirm('Are you sure you want to remove this video from your showcase?')) {
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm(`Reset to default recommended videos for ${clinicName}?`)) {
      const def = getClinicYouTubeVideos(clinicSlug, clinicName);
      setVideos(sanitizeClinicYouTubeVideos(def));
      showBanner(`Restored clinic YouTube playlist defaults for ${clinicName}. Click "Save YouTube Settings" to apply.`, 'success');
    }
  };

  const handleSaveAll = async () => {
    if (!currentClinic) return;
    setIsSaving(true);
    setBannerMessage(null);

    try {
      const sanitized = sanitizeClinicYouTubeVideos(videos);

      // Also update social handles if youtube platform exists, or keep in sync
      const currentHandles = currentClinic.socialHandles || [];
      const updatedHandles = currentHandles.map(h => {
        if (h.platform === 'youtube') {
          return { ...h, url: channelUrl.trim(), isActive: true };
        }
        return h;
      });
      if (!updatedHandles.some(h => h.platform === 'youtube') && channelUrl.trim()) {
        updatedHandles.push({
          id: `social-yt-${Date.now()}`,
          name: 'YouTube',
          url: channelUrl.trim(),
          platform: 'youtube',
          isActive: true
        });
      }

      await updateClinic(currentClinic.id, {
        youtubeVideos: sanitized,
        youtubeChannelUrl: channelUrl.trim(),
        socialHandles: updatedHandles
      });

      setVideos(sanitized);
      showBanner(`YouTube Channel & ${sanitized.length} videos synced & published for ${clinicName}!`, 'success');
    } catch (err: any) {
      console.error('Error saving YouTube config:', err);
      showBanner(err.message || 'Failed to save YouTube configuration.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'tour': return 'Clinic Tour';
      case 'procedure': return 'Procedure & Tech';
      case 'testimonial': return 'Patient Story';
      case 'doctor': return 'Doctor Talk';
      default: return 'General';
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {bannerMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn ${
          bannerMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {bannerMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{bannerMessage.text}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-red-50/70 via-slate-50 to-white dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900 rounded-3xl border border-red-100 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/20 shrink-0">
            <Youtube className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                YouTube Channel & Video Showcase Manager
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700">
                MEDIA SHOWCASE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage embedded video tours, clinical procedures, and YouTube links for <strong className="text-slate-700 dark:text-slate-200">{clinicName}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
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
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Save YouTube Settings'}</span>
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
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-2xs"
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

      {/* Official YouTube Channel URL Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <Youtube className="h-4 w-4 text-red-600" />
            <span>Official Clinic YouTube Channel URL *</span>
          </label>
          {channelUrl && (
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1"
            >
              <span>Visit Channel</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="url"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@revondental or https://youtube.com/channel/..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
          />
        </div>
        <p className="text-[11px] text-slate-400">
          This channel URL is linked to the <strong>"Open Clinic YouTube Channel"</strong> button in the portfolio video showcase header and footer social links.
        </p>
      </div>

      {/* Videos List Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display flex items-center space-x-2">
              <span>Showcase Video Library</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These videos are rendered in the high-definition interactive player on your public clinic portfolio.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddVideoModal}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-red-600/20 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add YouTube Video</span>
          </button>
        </div>

        {/* Video Cards Grid */}
        {videos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No showcase videos added yet. Click "Add YouTube Video" or "Reset Defaults".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((vid, idx) => (
              <div
                key={vid.id}
                className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-3 relative group"
              >
                <div className="flex gap-3 items-start">
                  {/* Thumbnail with Play Icon */}
                  <div 
                    onClick={() => setPreviewingVideo(vid)}
                    className="w-28 h-20 rounded-xl overflow-hidden relative shrink-0 bg-slate-900 cursor-pointer group/thumb border border-slate-200 dark:border-slate-700"
                    title="Click to preview video"
                  >
                    <img
                      src={vid.thumbnailUrl || `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center transition-colors">
                      <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                        <Play className="h-3 w-3 fill-current translate-x-0.5" />
                      </div>
                    </div>
                    {vid.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono px-1 py-0.2 rounded text-white">
                        {vid.duration}
                      </div>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800/60 font-mono">
                        {getCategoryLabel(vid.category)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {vid.title}
                    </h5>

                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      ID: {vid.youtubeId}
                    </div>
                  </div>
                </div>

                {vid.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                    {vid.description}
                  </p>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setPreviewingVideo(vid)}
                    className="text-xs font-bold text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditVideoModal(vid)}
                      className="p-1.5 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer text-xs flex items-center space-x-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(vid.id)}
                      className="p-1.5 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Youtube className="h-5 w-5 text-red-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  {editingVideo ? 'Edit YouTube Showcase Video' : 'Add YouTube Showcase Video'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVideoModal} className="space-y-4">
              {/* URL or ID input with instant extraction */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>YouTube URL or Video ID *</span>
                  {detectedYouTubeId && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Extracted ID: {detectedYouTubeId}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={videoInputUrl}
                  onChange={(e) => setVideoInputUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Accepts standard YouTube URLs (watch?v=...), short URLs (youtu.be/...), embed URLs, or direct 11-char IDs.
                </p>
              </div>

              {/* Real-time preview thumbnail */}
              {detectedYouTubeId && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                  <img
                    src={`https://img.youtube.com/vi/${detectedYouTubeId}/hqdefault.jpg`}
                    alt="YouTube Preview"
                    className="w-20 h-14 rounded-lg object-cover bg-black"
                  />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Valid YouTube Video Detected</span>
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Thumbnail automatically fetched from YouTube servers.
                    </p>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Virtual Walkthrough: Ultra-Modern Sterilization & Suites"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="tour">Clinic Tours</option>
                    <option value="procedure">Procedures & Technology</option>
                    <option value="testimonial">Patient Stories</option>
                    <option value="doctor">Specialist Talks</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Video Duration
                  </label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="e.g. 3:45"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Video Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Short overview of what patients will see in this video..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-red-600/20"
                >
                  {editingVideo ? 'Update Video' : 'Add to Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Interactive Preview Modal */}
      {previewingVideo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-800 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Youtube className="h-5 w-5 text-red-500" />
                <h4 className="font-bold text-sm text-white font-display truncate">
                  Preview: {previewingVideo.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingVideo(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${previewingVideo.youtubeId}?autoplay=1&rel=0`}
                title={previewingVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Category: <strong className="text-slate-200">{getCategoryLabel(previewingVideo.category)}</strong></span>
              <button
                type="button"
                onClick={() => setPreviewingVideo(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
