import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { RevonLogo } from './RevonLogo';

interface ForgotPasswordProps {
  onNavigate: (view: string) => void;
}

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset email. Verify your address is registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="forgot-password-page" className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-md">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <RevonLogo size={50} layout="vertical" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Reset Password</h2>
          <p className="text-sm text-gray-500">Enter your registered email to receive a secure link</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-center space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center space-x-2 text-sm font-semibold">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span>Password reset email sent successfully! Check your inbox.</span>
          </div>
        )}

        <form id="forgot-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="forgot-email-input"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-800"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            id="forgot-submit-btn"
            type="submit"
            disabled={loading || success}
            className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-teal-700 shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            id="back-to-login-btn"
            onClick={() => onNavigate('login')}
            className="inline-flex items-center space-x-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
