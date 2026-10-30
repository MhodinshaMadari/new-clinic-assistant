import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Youtube, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  CheckCircle,
  Video,
  Eye,
  Film
} from 'lucide-react';
import { ClinicYouTubeVideo, Clinic } from '../types';
import { getClinicYouTubeVideos } from '../data/clinicMediaData';

interface ClinicYouTubeVideoSectionProps {
  clinic: Clinic | null;
}

export function ClinicYouTubeVideoSection({ clinic }: ClinicYouTubeVideoSectionProps) {
  const clinicSlug = clinic?.slug || 'revon-dental';
  const clinicName = clinic?.name || 'Our Clinic';

  // Get videos from clinic object if defined, or fallback to clinic-specific media library
  const videos: ClinicYouTubeVideo[] = useMemo(() => {
    return (clinic?.youtubeVideos && clinic.youtubeVideos.length > 0)
      ? clinic.youtubeVideos
      : getClinicYouTubeVideos(clinicSlug, clinicName);
  }, [clinic?.youtubeVideos, clinicSlug, clinicName]);

  const [activeVideoId, setActiveVideoId] = useState<string>(() => videos[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Automatically keep activeVideoId in sync whenever videos change
  useEffect(() => {
    if (videos.length > 0 && !videos.some(v => v.id === activeVideoId)) {
      setActiveVideoId(videos[0]?.id || '');
      setIsPlaying(false);
    }
  }, [videos, activeVideoId]);

  const youtubeChannelUrl = clinic?.youtubeChannelUrl 
    || clinic?.socialHandles?.find(s => s.platform === 'youtube' && s.isActive)?.url 
    || (clinicSlug === 'revon-dental' ? 'https://www.youtube.com/@RevonMultiSpecialty' : `https://www.youtube.com/@${clinicSlug}`);

  const activeVideo = videos.find(v => v.id === activeVideoId) || videos[0];

  const categories = [
    { key: 'all', label: 'All Videos' },
    { key: 'tour', label: 'Clinic Tours' },
    { key: 'procedure', label: 'Procedures & Technology' },
    { key: 'testimonial', label: 'Patient Stories' },
    { key: 'doctor', label: 'Specialist Talks' }
  ];

  const filteredVideos = selectedCategory === 'all'
    ? videos
    : videos.filter(v => v.category === selectedCategory);

  const handleSelectVideo = (video: ClinicYouTubeVideo) => {
    setActiveVideoId(video.id);
    setIsPlaying(true);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'tour':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'procedure':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'testimonial':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'doctor':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'tour': return 'Virtual Tour';
      case 'procedure': return 'Procedure Guide';
      case 'testimonial': return 'Patient Story';
      case 'doctor': return 'Doctor Briefing';
      default: return 'Featured';
    }
  };

  return (
    <section id="clinic-videos-section" className="py-20 bg-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-4 sm:px-8 shadow-2xl relative overflow-hidden dark:bg-slate-950 dark:border dark:border-slate-800">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-revon-blue/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold font-mono tracking-wider">
              <Youtube className="h-4 w-4 fill-red-500 text-white" />
              <span>OFFICIAL CLINIC VIDEO SHOWCASE</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display text-white">
              Watch Inside <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-200">{clinicName}</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Explore our modern operatory theaters, sterilized facilities, cutting-edge treatment procedures, and real patient recovery stories through high-definition video walkthroughs.
            </p>
          </div>

          {/* External YouTube Channel Link */}
          <div className="flex items-center space-x-3">
            <a
              href={youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-red-600/20 cursor-pointer"
            >
              <Youtube className="h-4 w-4" />
              <span>Open Clinic YouTube Channel</span>
              <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-80" />
            </a>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-800 pb-4">
          {categories.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <div className="ml-auto text-xs text-slate-400 font-mono hidden sm:block">
            Showing {filteredVideos.length} {filteredVideos.length === 1 ? 'Video' : 'Videos'}
          </div>
        </div>

        {/* Main Interactive Player + Playlist Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Video Player Container (7 cols) */}
          <div className="lg:col-span-7 bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/70 shadow-xl space-y-4">
            {activeVideo ? (
              <>
                {/* 16:9 Aspect Video Frame */}
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700 group">
                  {isPlaying ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                      title={activeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div 
                      onClick={() => setIsPlaying(true)}
                      className="relative w-full h-full cursor-pointer flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={activeVideo.thumbnailUrl || `https://img.youtube.com/vi/${activeVideo.youtubeId}/maxresdefault.jpg`}
                        alt={activeVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30"></div>

                      {/* Prominent Play Button */}
                      <div className="absolute flex flex-col items-center space-y-2 z-10">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 group-hover:scale-110 group-hover:bg-red-500 transition-all">
                          <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-white translate-x-0.5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 drop-shadow-md bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                          Click to Play Video Directly
                        </span>
                      </div>

                      {/* Duration Tag */}
                      {activeVideo.duration && (
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-mono font-semibold px-2.5 py-1 rounded-md flex items-center space-x-1.5 backdrop-blur-sm">
                          <Clock className="h-3 w-3 text-red-400" />
                          <span>{activeVideo.duration}</span>
                        </div>
                      )}

                      {/* Category Tag */}
                      <div className="absolute top-3 left-3">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-lg border uppercase tracking-wider ${getCategoryBadgeClass(activeVideo.category)}`}>
                          {getCategoryLabel(activeVideo.category)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Video Info */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getCategoryBadgeClass(activeVideo.category)}`}>
                      {getCategoryLabel(activeVideo.category)}
                    </span>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                      {activeVideo.duration && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{activeVideo.duration}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Verified Clinic Media</span>
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-display text-white">
                    {activeVideo.title}
                  </h3>

                  {activeVideo.description && (
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {activeVideo.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-700/60 text-xs">
                    <span className="text-slate-400">
                      Now playing video for: <strong className="text-white font-medium">{clinicName}</strong>
                    </span>
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 inline-flex items-center space-x-1 font-semibold"
                    >
                      <span>Watch on YouTube</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-sm">
                No video selected
              </div>
            )}
          </div>

          {/* Playlist & Video Cards List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                <Film className="h-3.5 w-3.5 text-red-400" />
                <span>Clinic Video Playlist ({filteredVideos.length})</span>
              </div>
              <span className="text-[11px] text-slate-400">Select any video to play</span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredVideos.map((video, idx) => {
                const isSelected = video.id === activeVideoId;
                return (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3.5 group ${
                      isSelected
                        ? 'bg-slate-800 border-red-500/80 shadow-lg shadow-red-500/10'
                        : 'bg-slate-800/40 hover:bg-slate-800/90 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                      <img
                        src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-red-600 text-white' : 'bg-black/60 text-white group-hover:bg-red-600'
                        }`}>
                          <Play className="h-4 w-4 fill-current translate-x-0.5" />
                        </div>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono px-1.5 py-0.5 rounded text-white">
                          {video.duration}
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getCategoryBadgeClass(video.category)}`}>
                            {getCategoryLabel(video.category)}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-red-400 font-bold font-mono animate-pulse">
                              PLAYING NOW
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {video.title}
                        </h4>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Video #{idx + 1}</span>
                        <span className="text-slate-400 group-hover:text-red-400 flex items-center space-x-1">
                          <span>Watch</span>
                          <Play className="h-2.5 w-2.5 fill-current" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
