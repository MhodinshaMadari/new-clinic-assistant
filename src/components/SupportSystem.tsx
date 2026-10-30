import React, { useState, useEffect } from 'react';
import { PaginationControls } from './PaginationControls';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { 
  ClinicNotification, 
  SupportQuery, 
  QueryReply 
} from '../types';
import { 
  Megaphone, 
  LifeBuoy, 
  MessageSquare, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  Send, 
  Trash2, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export function SupportSystem() {
  const { user, userProfile } = useAuth();
  const { activeClinic } = useClinic();
  const activeSlug = activeClinic?.slug || 'revon-dental';
  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super-admin' || isSuperAdmin;
  const isStaff = userProfile?.role === 'admin' || userProfile?.role === 'super-admin' || userProfile?.role === 'dentist' || userProfile?.role === 'receptionist' || isSuperAdmin;

  // Tabs: 'notifications' | 'support'
  const [activeTab, setActiveTab] = useState<'notifications' | 'support'>('notifications');

  // Real-time collection states
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [supportQueries, setSupportQueries] = useState<SupportQuery[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, QueryReply[]>>({});

  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingSupport, setLoadingSupport] = useState(true);

  // Search & Filter state (Admin)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied'>('all');

  // Form states - Notifications (Admin)
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceContent, setNewAnnounceContent] = useState('');
  const [publishingAnnounce, setPublishingAnnounce] = useState(false);

  // Form states - Support Query (User)
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Selected query for details / reply thread view
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [newReplyMessage, setNewReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Pagination states for support queries
  const [patientQueriesPage, setPatientQueriesPage] = useState(1);
  const [patientQueriesPageSize, setPatientQueriesPageSize] = useState(10);

  const [staffQueriesPage, setStaffQueriesPage] = useState(1);
  const [staffQueriesPageSize, setStaffQueriesPageSize] = useState(10);

  useEffect(() => {
    setStaffQueriesPage(1);
  }, [searchQuery, statusFilter]);

  // --- Real-time Notifications ---
  useEffect(() => {
    if (!user) return;
    const qAnnounce = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(qAnnounce, (snapshot) => {
      const list: ClinicNotification[] = [];
      snapshot.forEach((d) => {
        const item = { id: d.id, ...d.data() } as ClinicNotification;
        const itemSlug = item.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push(item);
        }
      });
      setNotifications(list);
      setLoadingNotifications(false);
    }, (err) => {
      console.error("Notifications fetch error:", err);
      setLoadingNotifications(false);
    });
    return unsub;
  }, [user, activeSlug, isSuperAdmin]);

  // --- Real-time Support Queries ---
  useEffect(() => {
    if (!user || !userProfile) return;

    let qQueries;
    if (isStaff) {
      qQueries = query(collection(db, 'support_queries'), orderBy('createdAt', 'desc'));
    } else {
      qQueries = query(
        collection(db, 'support_queries'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsub = onSnapshot(qQueries, (snapshot) => {
      const list: SupportQuery[] = [];
      snapshot.forEach((d) => {
        const qItem = { id: d.id, ...d.data() } as SupportQuery;
        const itemSlug = qItem.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push(qItem);
        }
      });
      setSupportQueries(list);
      setLoadingSupport(false);
    }, (err) => {
      console.error("Support queries fetch error:", err);
      setLoadingSupport(false);
    });
    return unsub;
  }, [user, userProfile, isStaff, activeSlug, isSuperAdmin]);

  // --- Real-time Replies for selected Support Query ---
  useEffect(() => {
    if (!selectedQueryId) return;

    const repliesRef = collection(db, 'support_queries', selectedQueryId, 'replies');
    const qReplies = query(repliesRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(qReplies, (snapshot) => {
      const list: QueryReply[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as QueryReply);
      });
      setRepliesMap(prev => ({ ...prev, [selectedQueryId]: list }));
    }, (err) => {
      console.error("Replies fetch error:", err);
    });

    return unsub;
  }, [selectedQueryId]);

  // --- Actions ---
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceTitle.trim() || !newAnnounceContent.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    setPublishingAnnounce(true);
    try {
      const announcePayload = {
        title: newAnnounceTitle.trim(),
        content: newAnnounceContent.trim(),
        clinicSlug: activeSlug,
        createdAt: new Date().toISOString(),
        createdBy: userProfile?.displayName || 'Administrator'
      };

      await addDoc(collection(db, 'notifications'), announcePayload);
      setNewAnnounceTitle('');
      setNewAnnounceContent('');
      alert("Announcement published successfully!");
    } catch (err: any) {
      alert("Failed to publish: " + err.message);
    } finally {
      setPublishingAnnounce(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      alert("Announcement deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!querySubject.trim() || !queryMessage.trim()) {
      alert("Please enter both a subject and a message.");
      return;
    }

    setSubmittingQuery(true);
    try {
      const queryPayload = {
        userId: user?.uid,
        userName: userProfile?.displayName || 'Patient',
        userEmail: userProfile?.email || user?.email || 'N/A',
        subject: querySubject.trim(),
        message: queryMessage.trim(),
        status: 'pending' as const,
        clinicSlug: activeSlug,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'support_queries'), queryPayload);
      setQuerySubject('');
      setQueryMessage('');
      alert("Your support query/feedback has been submitted! An administrator will reply soon.");
    } catch (err: any) {
      alert("Failed to submit support query: " + err.message);
    } finally {
      setSubmittingQuery(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueryId || !newReplyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const repliesRef = collection(db, 'support_queries', selectedQueryId, 'replies');
      const replyPayload = {
        queryId: selectedQueryId,
        authorId: user?.uid,
        authorName: userProfile?.displayName || 'Staff',
        authorRole: userProfile?.role || 'Patient',
        message: newReplyMessage.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(repliesRef, replyPayload);

      // If clinical staff replies, update parent query status to 'replied'
      if (isStaff) {
        await updateDoc(doc(db, 'support_queries', selectedQueryId), {
          status: 'replied'
        });
      } else {
        // Patient replies back, we can set back to 'pending' to notify admin
        await updateDoc(doc(db, 'support_queries', selectedQueryId), {
          status: 'pending'
        });
      }

      setNewReplyMessage('');
    } catch (err: any) {
      alert("Failed to send reply: " + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteQuery = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this support ticket?")) return;
    try {
      await deleteDoc(doc(db, 'support_queries', id));
      if (selectedQueryId === id) setSelectedQueryId(null);
      alert("Ticket deleted.");
    } catch (err: any) {
      alert("Failed to delete ticket: " + err.message);
    }
  };

  // --- Filtering support queries (Admin/Staff only) ---
  const filteredQueries = supportQueries.filter(q => {
    const matchesSearch = 
      q.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedQuery = supportQueries.find(q => q.id === selectedQueryId);
  const activeReplies = selectedQueryId ? (repliesMap[selectedQueryId] || []) : [];

  return (
    <div id="support-announcements-system" className="space-y-6">
      
      {/* Dashboard Toggle Navigation Headers */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg font-display flex items-center space-x-2">
            <LifeBuoy className="h-5 w-5 text-revon-blue animate-pulse" />
            <span>Clinic Announcements & Support Hub</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isStaff 
              ? 'Publish alerts, coordinate active notices, and reply to client support feedback.' 
              : 'Read general dental clinic notices, submit feedback, or raise support tickets.'}
          </p>
        </div>

        {/* Tab switch control */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'notifications' 
                ? 'bg-white text-revon-blue shadow-xs font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Announcements</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'support' 
                ? 'bg-white text-revon-blue shadow-xs font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Support Tickets</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: ANNOUNCEMENTS / NOTIFICATIONS */}
      {/* ===================================================================== */}
      {activeTab === 'notifications' && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Admin Publishing Widget */}
          {isAdmin && (
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 h-fit">
              <div className="border-b border-slate-100 pb-3 flex items-center space-x-2 text-amber-600">
                <PlusCircle className="h-5 w-5" />
                <h4 className="font-bold text-sm font-display uppercase tracking-wider">Publish Announcement</h4>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Alert Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clinic Closed for Independence Day"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                    value={newAnnounceTitle}
                    onChange={(e) => setNewAnnounceTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Announcement Body</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide full description, scheduling adjustments or holiday hours..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                    value={newAnnounceContent}
                    onChange={(e) => setNewAnnounceContent(e.target.value)}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={publishingAnnounce}
                  className="w-full py-2 bg-revon-blue text-white font-bold text-xs rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-revon-blue/10 flex items-center justify-center space-x-1.5"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>{publishingAnnounce ? 'Publishing...' : 'Broadcast Notice'}</span>
                </button>
              </form>
            </div>
          )}

          {/* List of announcements */}
          <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
            <div className="bg-white p-4 rounded-2xl border border-slate-150/80 bg-slate-50/40 font-semibold text-slate-800 text-xs flex justify-between items-center">
              <span>Active Broadcast Alerts & Notices</span>
              <span className="font-mono text-[10px] font-bold uppercase text-slate-400">Total: {notifications.length}</span>
            </div>

            {loadingNotifications ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <RefreshCw className="h-6 w-6 text-revon-blue animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-400 font-medium">Syncing notification channel...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 border-dashed space-y-3">
                <Megaphone className="h-10 w-10 text-slate-300 mx-auto" />
                <div>
                  <h5 className="font-bold text-sm text-slate-700">No announcements yet</h5>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">Clinic notifications and holiday announcements will be displayed here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-sm hover:border-slate-200 transition-all space-y-3 relative group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                            <Megaphone className="h-4 w-4" />
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm md:text-base font-display">{n.title}</h4>
                        </div>
                        <p className="text-slate-400 text-[10px] font-mono flex items-center space-x-2">
                          <span>By: {n.createdBy}</span>
                          <span>•</span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </p>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteAnnouncement(n.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer absolute top-4 right-4"
                          title="Purge Alert"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100/60 font-medium">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: SUPPORT TICKETS & FEEDBACK */}
      {/* ===================================================================== */}
      {activeTab === 'support' && (
        <div className="grid lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Patients View: Submit Query and Ticket List */}
          {!isStaff && (
            <>
              {/* Form to submit query (Left side) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 h-fit">
                <div className="border-b border-slate-100 pb-3 flex items-center space-x-2 text-revon-blue">
                  <LifeBuoy className="h-5 w-5" />
                  <h4 className="font-bold text-sm font-display uppercase tracking-wider">Raise Support / Feedback</h4>
                </div>

                <form onSubmit={handleSubmitQuery} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Booking dispute or toothache emergency query"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                      value={querySubject}
                      onChange={(e) => setQuerySubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Detailed Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Describe your query in detail so our dental coordinator can assist you..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-revon-blue"
                      value={queryMessage}
                      onChange={(e) => setQueryMessage(e.target.value)}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingQuery}
                    className="w-full py-2 bg-revon-blue text-white font-bold text-xs rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-revon-blue/10 flex items-center justify-center space-x-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submittingQuery ? 'Submitting...' : 'Submit Support Ticket'}</span>
                  </button>
                </form>
              </div>

              {/* Tickets list (Right side) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-150/80 bg-slate-50/40 font-semibold text-slate-800 text-xs flex justify-between items-center">
                  <span>My Raised Support Queries & Feedback Logs</span>
                  <span className="font-mono text-[10px] font-bold uppercase text-slate-400">Tickets: {supportQueries.length}</span>
                </div>

                {loadingSupport ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                    <RefreshCw className="h-6 w-6 text-revon-blue animate-spin mx-auto mb-2" />
                    <span className="text-xs text-slate-400 font-medium">Syncing tickets database...</span>
                  </div>
                ) : supportQueries.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 border-dashed space-y-3">
                    <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
                    <div>
                      <h5 className="font-bold text-sm text-slate-700">No support tickets found</h5>
                      <p className="text-xs text-slate-400 mt-0.5">Use the form on the left to submit feedback or ask dental support questions.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {supportQueries
                        .slice(
                          (patientQueriesPage - 1) * patientQueriesPageSize,
                          patientQueriesPage * patientQueriesPageSize
                        )
                        .map((q) => (
                          <div 
                            key={q.id} 
                            onClick={() => setSelectedQueryId(q.id)}
                            className={`bg-white border rounded-2xl p-5 hover:border-revon-blue hover:shadow-sm transition-all space-y-4 cursor-pointer flex flex-col justify-between relative ${
                              selectedQueryId === q.id ? 'border-2 border-revon-blue ring-2 ring-revon-blue/10' : 'border-slate-100'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                  q.status === 'replied' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  {q.status === 'replied' ? 'Replied' : 'Awaiting Reply'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{new Date(q.createdAt).toLocaleDateString()}</span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 text-sm font-display line-clamp-1">{q.subject}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2">{q.message}</p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-revon-blue">
                              <span>View Replies & Discussion</span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <PaginationControls
                        currentPage={patientQueriesPage}
                        totalPages={Math.ceil(supportQueries.length / patientQueriesPageSize)}
                        pageSize={patientQueriesPageSize}
                        totalItems={supportQueries.length}
                        onPageChange={setPatientQueriesPage}
                        onPageSizeChange={setPatientQueriesPageSize}
                        idPrefix="patient-support-queries"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Panel: Selected Ticket Replies (Chat UI) */}
                {selectedQueryId && selectedQuery && (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4 animate-slideUp">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono">Ticket Conversation Thread</span>
                        <h4 className="font-bold text-slate-900 text-base font-display">{selectedQuery.subject}</h4>
                      </div>
                      <button
                        onClick={() => setSelectedQueryId(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        Close Thread
                      </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-1">My Initial Ticket Message:</strong>
                      {selectedQuery.message}
                    </div>

                    {/* Replies feed */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {activeReplies.map((r) => (
                        <div 
                          key={r.id} 
                          className={`p-4 rounded-2xl max-w-[85%] text-xs space-y-1.5 ${
                            r.authorId === user?.uid 
                              ? 'bg-blue-50/70 border border-blue-100 ml-auto' 
                              : 'bg-teal-50 border border-teal-100'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 gap-4">
                            <span className={r.authorId === user?.uid ? 'text-blue-800' : 'text-teal-800'}>
                              {r.authorName} ({r.authorRole})
                            </span>
                            <span className="font-mono text-slate-400">{new Date(r.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{r.message}</p>
                        </div>
                      ))}

                      {activeReplies.length === 0 && (
                        <div className="text-center py-6 text-xs text-slate-400 italic">
                          No replies yet. Our dental administrators have been notified.
                        </div>
                      )}
                    </div>

                    {/* Quick Response Form */}
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Type a follow-up response..."
                        className="flex-grow px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-revon-blue bg-[#F8FAFC]"
                        value={newReplyMessage}
                        onChange={(e) => setNewReplyMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={submittingReply}
                        className="px-4 py-2 bg-revon-blue text-white font-bold text-xs rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Send className="h-3 w-3" />
                        <span>{submittingReply ? 'Sending...' : 'Reply'}</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Admins/Staff View: Full Ticketing Management (12 Cols wide) */}
          {isStaff && (
            <div className="lg:col-span-12 grid lg:grid-cols-12 gap-6">
              
              {/* Left Column: Tickets Queue list (5 Cols wide) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm font-display">Tickets Dispatch Center</h3>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    Awaiting: {supportQueries.filter(q => q.status === 'pending').length}
                  </span>
                </div>

                {/* Filter and Search */}
                <div className="p-3 bg-slate-50 border-b border-slate-100 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      className="w-full pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-revon-blue text-slate-800"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex bg-slate-200/50 p-0.5 rounded-lg justify-between text-[10px] font-bold text-slate-500">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`flex-1 py-1 rounded cursor-pointer transition-colors ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'hover:text-slate-800'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`flex-1 py-1 rounded cursor-pointer transition-colors ${statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'hover:text-slate-800'}`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setStatusFilter('replied')}
                      className={`flex-1 py-1 rounded cursor-pointer transition-colors ${statusFilter === 'replied' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'hover:text-slate-800'}`}
                    >
                      Replied
                    </button>
                  </div>
                </div>

                {/* Queue list container */}
                <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
                  {loadingSupport ? (
                    <div className="text-center py-10">
                      <RefreshCw className="h-5 w-5 text-revon-blue animate-spin mx-auto mb-2" />
                      <span className="text-xs text-slate-400 font-medium">Loading database...</span>
                    </div>
                  ) : filteredQueries.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-400 font-medium">
                      No matching support queries found.
                    </div>
                  ) : (
                    filteredQueries
                      .slice(
                        (staffQueriesPage - 1) * staffQueriesPageSize,
                        staffQueriesPage * staffQueriesPageSize
                      )
                      .map((q) => (
                        <div 
                          key={q.id}
                          onClick={() => setSelectedQueryId(q.id)}
                          className={`p-4 hover:bg-slate-50/50 transition-colors cursor-pointer text-left relative space-y-2.5 ${
                            selectedQueryId === q.id ? 'bg-blue-50/30 border-r-4 border-revon-blue' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                            <span className={q.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}>
                              {q.status === 'pending' ? '● AWAITING REPLY' : '● ANSWERED'}
                            </span>
                            <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-900 text-xs font-display line-clamp-1">{q.subject}</h4>
                            <p className="text-[11px] text-slate-500 font-medium font-sans">Patient: {q.userName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{q.userEmail}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                <PaginationControls
                  currentPage={staffQueriesPage}
                  totalPages={Math.ceil(filteredQueries.length / staffQueriesPageSize)}
                  pageSize={staffQueriesPageSize}
                  totalItems={filteredQueries.length}
                  onPageChange={setStaffQueriesPage}
                  onPageSizeChange={setStaffQueriesPageSize}
                  idPrefix="staff-support-queries"
                />
              </div>

              {/* Right Column: Ticket replies thread and response box (7 Cols wide) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
                {selectedQueryId && selectedQuery ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                      <div className="text-left">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Support Dispatch Window</span>
                        <h4 className="font-bold text-slate-950 text-sm font-display line-clamp-1">{selectedQuery.subject}</h4>
                      </div>

                      {isStaff && (
                        <button
                          onClick={() => handleDeleteQuery(selectedQuery.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Close & Delete Ticket</span>
                        </button>
                      )}
                    </div>

                    {/* Chat container */}
                    <div className="flex-grow overflow-y-auto p-5 space-y-4">
                      
                      {/* Original Customer Message */}
                      <div className="bg-slate-50 border border-slate-150/60 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed text-left">
                        <div className="flex justify-between font-bold text-slate-800 mb-2">
                          <span>Patient Initial Query:</span>
                          <span className="text-slate-400 font-mono font-normal">{new Date(selectedQuery.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="font-semibold text-slate-900 mb-1">{selectedQuery.userName} ({selectedQuery.userEmail}) wrote:</p>
                        <p className="text-slate-700 italic">"{selectedQuery.message}"</p>
                      </div>

                      {/* Line Separator */}
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-150"></div>
                        <span className="flex-shrink mx-4 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Replies Thread</span>
                        <div className="flex-grow border-t border-slate-150"></div>
                      </div>

                      {/* Chat messages */}
                      <div className="space-y-3">
                        {activeReplies.map((r) => (
                          <div 
                            key={r.id} 
                            className={`p-4 rounded-2xl max-w-[85%] text-xs space-y-1.5 text-left ${
                              r.authorRole === 'admin' || r.authorRole === 'dentist' || r.authorRole === 'receptionist'
                                ? 'bg-amber-50 border border-amber-100 ml-auto' 
                                : 'bg-blue-50/70 border border-blue-100'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 gap-4">
                              <span className={r.authorRole === 'admin' || r.authorRole === 'dentist' || r.authorRole === 'receptionist' ? 'text-amber-800' : 'text-blue-800'}>
                                {r.authorName} ({r.authorRole.toUpperCase()})
                              </span>
                              <span className="font-mono text-slate-400">{new Date(r.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{r.message}</p>
                          </div>
                        ))}

                        {activeReplies.length === 0 && (
                          <div className="text-center py-6 text-xs text-slate-400 italic">
                            No response has been generated for this ticket yet. Write a message below to coordinate.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Response input */}
                    <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Type official administrative reply..."
                        className="flex-grow px-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-revon-blue"
                        value={newReplyMessage}
                        onChange={(e) => setNewReplyMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={submittingReply}
                        className="px-6 py-2 bg-revon-blue text-white font-bold text-xs rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{submittingReply ? 'Sending...' : 'Send Official Reply'}</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col justify-center items-center text-center p-6 space-y-3">
                    <MessageSquare className="h-12 w-12 text-slate-200 animate-bounce" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-700">No Support Ticket Selected</h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-0.5">Select an active ticket from the queue list on the left to review messages, issue replies, and log outcomes.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
