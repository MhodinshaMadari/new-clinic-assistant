import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  Plus,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Send,
  XCircle,
  Filter,
  ExternalLink
} from 'lucide-react';
import { useClinicData } from '../hooks/useClinicData';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { PaginationControls } from './PaginationControls';
import { getClinicGoogleConfig } from '../data/clinicMediaData';
import { GoogleLogoIcon } from './ClinicGoogleReviewsSection';

export function PatientReviewsView() {
  const { userProfile } = useAuth();
  const { activeClinic } = useClinic();
  const { reviews, loading, createReview } = useClinicData();

  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [treatment, setTreatment] = useState('General Consultation');
  const [patientName, setPatientName] = useState(userProfile?.displayName || '');
  const [patientEmail, setPatientEmail] = useState(userProfile?.email || '');
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Only show published reviews to patients
  const publishedReviews = reviews.filter((r) => r.isPublished !== false);

  const filteredReviews = publishedReviews.filter((r) => {
    if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;
    return true;
  });

  const totalPublished = publishedReviews.length;
  const avgRating = totalPublished > 0
    ? (publishedReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalPublished).toFixed(1)
    : '5.0';

  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide a brief feedback comment.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createReview(
        patientName.trim() || userProfile?.displayName || 'Verified Patient',
        rating,
        comment.trim(),
        {
          patientEmail: patientEmail.trim() || userProfile?.email || '',
          treatmentName: treatment,
          isVerifiedPatient: true,
          isPublished: true // Default to published for instant feedback
        }
      );

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitModal(false);
        setComment('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[11px] font-bold uppercase tracking-wider font-mono">
              Patient Experiences
            </span>
            <span className="flex items-center space-x-1 text-xs font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3 fill-amber-950" />
              <span>Verified Testimonials</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
            Patient Reviews & Feedback
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
            Real experiences from patients treated at {activeClinic?.name || 'our dental clinic'}. Share your treatment journey with us!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 flex-shrink-0">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-3xl font-black">{avgRating}</span>
              <div className="flex text-amber-300">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(Number(avgRating))
                        ? 'fill-amber-300 text-amber-300'
                        : 'text-amber-200/40'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-[10px] text-amber-200 mt-1 uppercase font-mono tracking-wider font-bold">
              Based on {totalPublished} {totalPublished === 1 ? 'Review' : 'Reviews'}
            </div>
          </div>

          <button
            id="write-patient-review-btn"
            onClick={() => {
              setShowSubmitModal(true);
              setPatientName(userProfile?.displayName || '');
              setPatientEmail(userProfile?.email || '');
            }}
            className="px-5 py-3.5 bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-amber-700" />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* Clinic Google Rating & Reviews Banner */}
      {(() => {
        const googleConfig = (activeClinic?.googleConfig && activeClinic.googleConfig.reviews.length > 0)
          ? activeClinic.googleConfig
          : getClinicGoogleConfig(activeClinic?.slug, activeClinic?.name);
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <GoogleLogoIcon className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-display">
                    {googleConfig.rating.toFixed(1)}
                  </span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    ({googleConfig.totalReviews}+ Verified Google Reviews)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Official Google Business Rating for <strong className="text-slate-800 dark:text-slate-200">{activeClinic?.name}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <a
                href={googleConfig.writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                <GoogleLogoIcon className="h-4 w-4" />
                <span>Write Google Review</span>
                <ExternalLink className="h-3 w-3 opacity-80" />
              </a>

              <a
                href={googleConfig.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <span>View on Maps</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            </div>
          </div>
        );
      })()}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-500 flex items-center space-x-1 mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Rating:</span>
          </span>
          <button
            onClick={() => {
              setRatingFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ratingFilter === 'all'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Ratings ({totalPublished})
          </button>
          {[5, 4, 3, 2, 1].map((r) => {
            const count = publishedReviews.filter((item) => item.rating === r).length;
            return (
              <button
                key={r}
                onClick={() => {
                  setRatingFilter(r);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  ratingFilter === r
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{r}</span>
                <Star className="h-3 w-3 fill-current" />
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 font-mono font-medium">
          Showing {paginatedReviews.length} of {filteredReviews.length}
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading testimonials...</p>
        </div>
      ) : paginatedReviews.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
          <MessageSquare className="h-10 w-10 text-amber-400 mx-auto" />
          <h4 className="font-bold text-slate-800 dark:text-white text-base">No reviews matching this filter</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Be the first patient to share your treatment feedback!
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Write a Review</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {rev.patientName}
                      </h4>
                      {rev.isVerifiedPatient !== false && (
                        <span title="Verified Patient" className="inline-flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                        </span>
                      )}
                    </div>
                    {rev.treatmentName && (
                      <span className="inline-block mt-1 text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-md border border-amber-200/60 dark:border-amber-800">
                        {rev.treatmentName}
                      </span>
                    )}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-0.5 text-amber-500 flex-shrink-0">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${
                          idx < (rev.rating || 5)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Footer & Doctor Reply */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">
                  {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>

                {/* Doctor Response if any */}
                {rev.adminReply && (
                  <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase font-mono">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{rev.adminReplyBy || 'Clinic Care Team'}</span>
                    </div>
                    <p className="text-xs text-amber-950 dark:text-amber-100 font-medium">
                      {rev.adminReply}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredReviews.length > 0 && (
        <div className="pt-2">
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
      )}

      {/* Modal to Write a Review */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">
                  Share Your Dental Experience
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your feedback helps us maintain the highest care standards
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base">Review Submitted!</h4>
                <p className="text-xs text-emerald-700">
                  Thank you for sharing your experience with {activeClinic?.name || 'our clinic'}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    How would you rate your treatment experience?
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        type="button"
                        key={starVal}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(starVal)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            starVal <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-600 font-mono ml-2">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Treatment Tag */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Treatment / Procedure
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                  >
                    <option value="General Consultation">General Consultation & Checkup</option>
                    <option value="Teeth Cleaning & Scaling">Teeth Cleaning & Scaling</option>
                    <option value="Root Canal Treatment">Root Canal Treatment (RCT)</option>
                    <option value="Teeth Whitening">Teeth Whitening & Aesthetics</option>
                    <option value="Dental Implants">Dental Implants</option>
                    <option value="Orthodontic Aligners & Braces">Orthodontic Aligners & Braces</option>
                    <option value="Composite Filling">Tooth Composite Filling</option>
                    <option value="Tooth Extraction">Tooth Extraction</option>
                    <option value="Crowns & Bridges">Crowns & Bridges</option>
                    <option value="Emergency Care">Emergency Dental Care</option>
                  </select>
                </div>

                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name (as displayed on review)
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Review & Feedback
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the clinic atmosphere, dentist care, painless treatment, hygiene, and comfort..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs flex items-center space-x-1.5"
                  >
                    {submitting ? (
                      <span>Publishing...</span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
