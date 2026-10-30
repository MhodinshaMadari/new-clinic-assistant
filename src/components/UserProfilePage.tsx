import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Shield, CheckCircle, AlertCircle, Info, Bell, BellOff, Check } from 'lucide-react';

export function UserProfilePage() {
  const { userProfile, updateProfileData } = useAuth();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState<boolean>(
    userProfile?.emailRemindersEnabled !== false
  );
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setEmailRemindersEnabled(userProfile.emailRemindersEnabled !== false);
    }
  }, [userProfile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await updateProfileData({
        displayName,
        phone,
        emailRemindersEnabled
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="profile-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your dentist clinic profile details and system preferences</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left column - details card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm text-center space-y-4">
            <div className="h-20 w-20 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto uppercase">
              {userProfile?.displayName?.[0] || 'U'}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">{userProfile?.displayName}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{userProfile?.email}</p>
            </div>
            <div className="pt-2">
              <span className="text-xs font-bold bg-teal-50 text-teal-800 px-3 py-1 rounded-full uppercase tracking-wider">
                Current: {userProfile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right column - form */}
        <div className="md:col-span-2">
          <form id="profile-edit-form" onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-150 p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-xl text-gray-900 border-b border-gray-100 pb-4">Personal Information</h3>

            {success && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center space-x-2 text-sm font-semibold">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Profile details saved and synchronized in Firestore successfully!</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    id="profile-name-input"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-800"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Phone className="h-5 w-5" />
                  </span>
                  <input
                    id="profile-phone-input"
                    type="tel"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-800"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Email Address (Read Only)</label>
              <div className="relative opacity-60">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 outline-none cursor-not-allowed"
                  value={userProfile?.email || ''}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                *For security reasons, your credential email address must be modified from your Firebase authentication portal.
              </p>
            </div>

            {/* Email Reminders & Notifications Settings */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-teal-600" />
                    <span>Email Appointment Reminders</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Receive automated confirmation emails and real-time status updates for your scheduled clinic visits.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="toggle-email-reminders"
                    type="checkbox"
                    checked={emailRemindersEnabled}
                    onChange={(e) => setEmailRemindersEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 transition-all ${
                emailRemindersEnabled 
                  ? 'bg-teal-50 border border-teal-150 text-teal-900' 
                  : 'bg-amber-50 border border-amber-150 text-amber-900'
              }`}>
                {emailRemindersEnabled ? (
                  <>
                    <Bell className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <span><strong>Reminders Enabled:</strong> You will receive email confirmations, QR code portal badges, and update notices.</span>
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span><strong>Reminders Disabled:</strong> Automated email notifications for your bookings will be suppressed. You can re-enable anytime.</span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 text-right">
              <button
                id="profile-save-btn"
                type="submit"
                disabled={loading}
                className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-teal-700 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
