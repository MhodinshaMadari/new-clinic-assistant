import React, { useState, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  Reply,
  Search,
  RefreshCw,
  Award,
  Check,
  Sparkles,
  MessageCircle,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useClinicData } from '../hooks/useClinicData';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { Review } from '../types';
import { PaginationControls } from './PaginationControls';
import { AdminGoogleReviewsManager } from './AdminGoogleReviewsManager';
import { GoogleLogoIcon } from './ClinicGoogleReviewsSection';

interface AdminReviewsManagerProps {
  onTriggerConfirm?: (
    title: string,
    message: string,
    onConfirmCallback: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
}

export function AdminReviewsManager({ onTriggerConfirm }: AdminReviewsManagerProps) {
  const { userProfile } = useAuth();
  const { activeClinic } = useClinic();
  const {
    reviews,
    loading,
    updateReview,
    deleteReview,
    replyToReview,
    toggleReviewVisibility
  } = useClinicData();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'replied' | 'unreplied'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Add / Edit Form State
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientEmail, setFormPatientEmail] = useState('');
  const [formTreatmentName, setFormTreatmentName] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState('');
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formIsVerified, setFormIsVerified] = useState<boolean>(true);
  const [formAdminReply, setFormAdminReply] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reply Composer State
  const [replyText, setReplyText] = useState('');
  const [replyAuthor, setReplyAuthor] = useState(userProfile?.displayName || 'Clinical Director');
  const [replySaving, setReplySaving] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Google Reviews Config Drawer State
  const [showGoogleConfig, setShowGoogleConfig] = useState(false);

  // Feedback banner
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMessage({ type, text });
    setTimeout(() => {
      setBannerMessage(null);
    }, 4000);
  };

  // Quick reply presets
  const replyTemplates = [
    "Thank you so much for your kind words! We are delighted to know you had a comfortable visit.",
    "Our entire dental team appreciates your positive review. We look forward to seeing you again!",
    "Thank you for trusting us with your oral health. Wishing you a healthy and bright smile!",
    "We appreciate your valuable feedback and will continue to uphold the highest standard of dental care."
  ];

  // Calculated Metrics
  const metrics = useMemo(() => {
    const list = reviews || [];
    const total = list.length;
    if (total === 0) {
      return {
        total: 0,
        average: 0,
        published: 0,
        hidden: 0,
        replied: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const average = (sum / total).toFixed(1);
    const published = list.filter((r) => r.isPublished !== false).length;
    const hidden = total - published;
    const replied = list.filter((r) => Boolean(r.adminReply && r.adminReply.trim())).length;

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      distribution[star] = (distribution[star] || 0) + 1;
    });

    return {
      total,
      average,
      published,
      hidden,
      replied,
      distribution
    };
  }, [reviews]);

  // Filtered & Sorted reviews
  const filteredReviews = useMemo(() => {
    let list = [...(reviews || [])];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) =>
        (r.patientName && r.patientName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.patientEmail && r.patientEmail.toLowerCase().includes(q)) ||
        (r.treatmentName && r.treatmentName.toLowerCase().includes(q)) ||
        (r.adminReply && r.adminReply.toLowerCase().includes(q))
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      list = list.filter((r) => Math.round(Number(r.rating) || 5) === ratingFilter);
    }

    // Status filter
    if (statusFilter === 'published') {
      list = list.filter((r) => r.isPublished !== false);
    } else if (statusFilter === 'hidden') {
      list = list.filter((r) => r.isPublished === false);
    } else if (statusFilter === 'replied') {
      list = list.filter((r) => Boolean(r.adminReply && r.adminReply.trim()));
    } else if (statusFilter === 'unreplied') {
      list = list.filter((r) => !r.adminReply || !r.adminReply.trim());
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      }
      if (sortBy === 'highest') {
        return (Number(b.rating) || 5) - (Number(a.rating) || 5);
      }
      if (sortBy === 'lowest') {
        return (Number(a.rating) || 5) - (Number(b.rating) || 5);
      }
      return 0;
    });

    return list;
  }, [reviews, searchQuery, ratingFilter, statusFilter, sortBy]);

  // Paginated reviews
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  // Handlers
  const handleOpenEdit = (review: Review) => {
    setSelectedReview(review);
    setFormPatientName(review.patientName || '');
    setFormPatientEmail(review.patientEmail || '');
    setFormTreatmentName(review.treatmentName || '');
    setFormRating(review.rating || 5);
    setFormComment(review.comment || '');
    setFormIsPublished(review.isPublished !== false);
    setFormIsVerified(review.isVerifiedPatient !== false);
    setFormAdminReply(review.adminReply || '');
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.adminReply || '');
    setReplyAuthor(review.adminReplyBy || userProfile?.displayName || 'Clinical Director');
    setReplyError(null);
    setShowReplyModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    if (!formPatientName.trim()) {
      setFormError('Patient name is required.');
      return;
    }
    if (!formComment.trim()) {
      setFormError('Review comment / testimonial is required.');
      return;
    }

    setFormSaving(true);
    setFormError(null);
    try {
      await updateReview(selectedReview.id, {
        patientName: formPatientName.trim(),
        patientEmail: formPatientEmail.trim(),
        treatmentName: formTreatmentName.trim(),
        rating: Number(formRating),
        comment: formComment.trim(),
        isPublished: formIsPublished,
        isVerifiedPatient: formIsVerified,
        adminReply: formAdminReply.trim(),
        adminReplyBy: formAdminReply.trim() ? (selectedReview.adminReplyBy || userProfile?.displayName || 'Admin') : ''
      });
      setShowEditModal(false);
      showBanner(`Review by ${formPatientName} updated successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update review.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setReplySaving(true);
    setReplyError(null);
    try {
      await replyToReview(selectedReview.id, replyText, replyAuthor);
      setShowReplyModal(false);
      showBanner(replyText.trim() ? 'Official response saved successfully!' : 'Official response cleared.');
    } catch (err: any) {
      setReplyError(err.message || 'Failed to save response.');
    } finally {
      setReplySaving(false);
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    const current = review.isPublished !== false;
    try {
      await toggleReviewVisibility(review.id, current);
      showBanner(
        current
          ? `Review by ${review.patientName} is now HIDDEN from the public landing page.`
          : `Review by ${review.patientName} is now PUBLISHED and visible publicly.`
      );
    } catch (err: any) {
      showBanner(`Error updating visibility: ${err.message}`, 'error');
    }
  };

  const handleDelete = (review: Review) => {
    const doDelete = async () => {
      try {
        await deleteReview(review.id);
        showBanner(`Review by ${review.patientName} deleted successfully.`);
      } catch (err: any) {
        showBanner(`Failed to delete review: ${err.message}`, 'error');
      }
    };

    if (onTriggerConfirm) {
      onTriggerConfirm(
        'Delete Patient Review',
        `Are you sure you want to permanently delete the review by "${review.patientName}"? This action cannot be undone.`,
        doDelete,
        'Delete Review',
        'Cancel'
      );
    } else {
      if (window.confirm(`Delete review by ${review.patientName}?`)) {
        doDelete();
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Alert */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-fadeIn ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header & Metric Analytics */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-base flex items-center space-x-2 font-display">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <span>Patient Reviews & Testimonials Moderation</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Oversee, moderate, reply to, and publish testimonials for <strong>{activeClinic?.name || 'Clinic'}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowGoogleConfig(!showGoogleConfig)}
            className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-xl text-xs font-bold text-blue-900 dark:text-blue-300 shadow-xs cursor-pointer transition-all"
          >
            <GoogleLogoIcon className="h-4 w-4" />
            <span>{showGoogleConfig ? 'Hide Google Reviews Settings' : 'Configure Google Review URLs'}</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 bg-amber-50 border border-amber-200/80 px-4 py-2 rounded-xl text-xs font-semibold text-amber-900 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>Patient-Authored Only • Admin Moderation Panel</span>
          </div>
        </div>
      </div>

      {/* Google Reviews Integration Section Drawer */}
      {showGoogleConfig && (
        <div className="p-6 bg-slate-50/70 dark:bg-slate-900/70 rounded-3xl border border-blue-200 dark:border-blue-900 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <GoogleLogoIcon className="h-5 w-5" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Google Business Profile & External Reviews Configuration
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleConfig(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
            >
              Close Drawer ✕
            </button>
          </div>
          <AdminGoogleReviewsManager />
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-100/90 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Reviews</div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">{metrics.total}</div>
          <div className="text-[11px] text-slate-500 font-medium">Recorded for clinic</div>
        </div>

        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-100 space-y-1">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">Average Rating</div>
          <div className="text-2xl font-extrabold text-amber-700 font-display flex items-center gap-1">
            <span>{metrics.average}</span>
            <Star className="h-4 w-4 fill-amber-500 text-amber-500 inline" />
          </div>
          <div className="text-[11px] text-amber-800/80 font-medium">Out of 5.0 stars</div>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100 space-y-1">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">Published Online</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-display">{metrics.published}</div>
          <div className="text-[11px] text-emerald-800/80 font-medium">{metrics.hidden} hidden from public</div>
        </div>

        <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 space-y-1">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">Clinic Responses</div>
          <div className="text-2xl font-extrabold text-blue-700 font-display">{metrics.replied}</div>
          <div className="text-[11px] text-blue-800/80 font-medium">Doctor replies logged</div>
        </div>
      </div>

      {/* Star Distribution Breakdown Bar */}
      <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-500 font-mono uppercase mr-1">Star Filter:</span>
        <button
          type="button"
          onClick={() => { setRatingFilter('all'); setCurrentPage(1); }}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            ratingFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All ({metrics.total})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            type="button"
            onClick={() => { setRatingFilter(stars); setCurrentPage(1); }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
              ratingFilter === stars
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'
            }`}
          >
            <span>{stars}</span>
            <Star className={`h-3 w-3 ${ratingFilter === stars ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
            <span className="text-[10px] opacity-80 font-mono">({metrics.distribution[stars] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search, Status Filter & Sorting Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews by patient name, keyword, treatment, email..."
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">All Moderation States</option>
            <option value="published">Published Only</option>
            <option value="hidden">Hidden / Moderated Only</option>
            <option value="replied">Replied by Doctor</option>
            <option value="unreplied">Pending Doctor Reply</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Moderation List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
          <span>Synchronizing patient reviews...</span>
        </div>
      ) : paginatedReviews.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl p-8 space-y-3">
          <MessageSquare className="h-10 w-10 mx-auto text-slate-300" />
          <h5 className="font-bold text-sm text-slate-700 font-display">No reviews found matching criteria</h5>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || ratingFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters above.'
              : 'Patient reviews submitted through the patient dashboard and landing page will appear here for admin moderation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((review) => {
            const isPub = review.isPublished !== false;
            const hasReply = Boolean(review.adminReply && review.adminReply.trim());

            return (
              <div
                key={review.id}
                className={`p-5 rounded-2xl border transition-all duration-200 bg-white space-y-4 ${
                  isPub
                    ? 'border-slate-200/90 shadow-xs hover:border-amber-300/80'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                {/* Review Header: Patient Info & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                      {review.patientName ? review.patientName[0] : 'P'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 font-display flex items-center gap-1.5">
                        <span>{review.patientName}</span>
                        {review.isVerifiedPatient !== false && (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                            <Check className="h-3 w-3 mr-0.5 text-teal-600" />
                            Verified Patient
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{review.patientEmail || 'Offline Testimonial'}</span>
                        <span>•</span>
                        <span className="font-mono">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Recent'}
                        </span>
                        {review.treatmentName && (
                          <>
                            <span>•</span>
                            <span className="text-teal-600 font-semibold">{review.treatmentName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges & Visibility Controls */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(review)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        isPub
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                      title={isPub ? 'Click to hide from website' : 'Click to publish on website'}
                    >
                      {isPub ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-rose-600" />}
                      <span>{isPub ? 'Published' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReply(review)}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hasReply
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      title="Add or edit official clinic response"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      <span>{hasReply ? 'Edit Reply' : 'Reply'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(review)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                      title="Edit review details"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(review)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Delete review record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Rating & Comment Body */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (review.rating || 5)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1.5 font-mono">
                      {review.rating || 5}.0
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    "{review.comment}"
                  </p>
                </div>

                {/* Official Response from Clinic / Doctor (if present) */}
                {hasReply && (
                  <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-blue-800 font-bold">
                      <div className="flex items-center space-x-1.5 font-mono text-[10.5px] uppercase tracking-wider">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>Response from {review.adminReplyBy || 'Clinical Director'}</span>
                      </div>
                      {review.adminReplyAt && (
                        <span className="text-[10px] text-blue-600/70 font-mono font-normal">
                          {new Date(review.adminReplyAt).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 italic leading-relaxed text-xs">
                      "{review.adminReply}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="pt-4 border-t border-slate-100">
            <PaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredReviews.length}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* EDIT PATIENT REVIEW MODAL */}
      {/* ===================================================================== */}
      {showEditModal && selectedReview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 font-display flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-500" />
                <span>Edit Review Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Email (Optional)</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
                    value={formPatientEmail}
                    onChange={(e) => setFormPatientEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Treatment / Specialty Tag</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
                    value={formTreatmentName}
                    onChange={(e) => setFormTreatmentName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Star Rating (1 to 5 Stars)</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= formRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-slate-700 ml-2">{formRating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Comment / Testimonial *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Publish to Landing Page</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={(e) => setFormIsVerified(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Verified Patient Badge</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {formSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>{formSaving ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* OFFICIAL CLINIC REPLY MODAL */}
      {/* ===================================================================== */}
      {showReplyModal && selectedReview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 font-display flex items-center gap-2">
                <Reply className="h-5 w-5 text-blue-600" />
                <span>Official Clinic Response</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReplyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Original Review Snippet */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>{selectedReview.patientName}</span>
                <span className="text-amber-500 font-mono">{'★'.repeat(selectedReview.rating || 5)}</span>
              </div>
              <p className="text-slate-600 italic line-clamp-2">"{selectedReview.comment}"</p>
            </div>

            {replyError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
                {replyError}
              </div>
            )}

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Response Author / Clinician Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Official Response Text</label>
                  <span className="text-[10px] text-slate-400">Leave blank to remove reply</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Type your response to the patient's review..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Quick Template Responses:</span>
                <div className="flex flex-col gap-1.5">
                  {replyTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(tmpl)}
                      className="text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-100 text-[11px] text-slate-600 transition-colors cursor-pointer"
                    >
                      "{tmpl}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                {selectedReview.adminReply ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyText('');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Clear Response
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={replySaving}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {replySaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    <span>{replySaving ? 'Saving...' : 'Save Response'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
