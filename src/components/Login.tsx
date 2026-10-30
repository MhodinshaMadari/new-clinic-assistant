import React, { useState } from 'react';
import { APP_NAME } from '../config/appConfig';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, LogIn, AlertCircle, ShieldCheck, Award, Activity, Heart, Stethoscope } from 'lucide-react';
import { RevonLogo } from './RevonLogo';
import { ZFCreationsBrand } from './ZFCreationsBrand';

interface LoginProps {
  onNavigate: (view: string) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onNavigate('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-[90vh] flex flex-col md:flex-row bg-[#FAFAF9] font-sans">
      {/* LEFT COLUMN: GORGEOUS CLINICAL GRAPHICAL PORTFOLIO DISPLAY PANEL */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-teal-950 via-cyan-900 to-slate-900 text-white relative overflow-hidden flex-col justify-between p-12 lg:p-16 items-center">
        
        {/* Absolute Background Vector Elements representing Universal Medical Cross & Health Pulse meshes */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <svg className="absolute -top-10 -left-10 w-96 h-96 text-teal-300" fill="currentColor" viewBox="0 0 100 100">
            <path d="M38 12 H62 V38 H88 V62 H62 V88 H38 V62 H12 V38 H38 Z" />
          </svg>
          <svg className="absolute -bottom-20 -right-20 w-[35rem] h-[35rem] text-cyan-300 rotate-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" />
            <circle cx="50" cy="50" r="30" strokeDasharray="4 4" />
            <path d="M10 50 H30 L35 35 L42 65 L50 25 L58 70 L65 45 L70 50 H90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Top Header Section inside Graphical Panel */}
        <div className="relative z-10 flex items-center space-x-3 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 self-center">
          <Sparkles className="h-4.5 w-4.5 text-amber-400" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-200 font-mono">{APP_NAME} Healthcare Suite</span>
        </div>

        {/* Center Graphic: Medical Presentation */}
        <div className="relative z-10 my-auto space-y-8 flex flex-col items-center text-center">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-2">
              <Award className="h-8 w-8" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-200 leading-tight tracking-tight font-display text-center">
              Specialist Healthcare, Digital Precision.
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-cyan-200/80 max-w-md leading-relaxed mx-auto">
              Connect to South India’s premier digital medical suite. Instantly manage appointments, track treatment logs, view bills, and request direct doctor consultations.
            </p>
          </div>

          {/* Clinical Bullet Points with Beautiful Modern Icons */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg pt-4 text-left">
            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <ShieldCheck className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">Board-Certified Doctors</strong>
                <span className="text-[10px] text-cyan-200/70">Top-rated cardiologists, surgeons, orthopedists & specialists.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <Activity className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">Live Queue Progress</strong>
                <span className="text-[10px] text-cyan-200/70">Check-in and track your status real-time on your mobile.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">Instant AI Companion</strong>
                <span className="text-[10px] text-cyan-200/70">Auto-book procedures and get custom answers via care chat.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <Stethoscope className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">Digital Diagnostic Chart</strong>
                <span className="text-[10px] text-cyan-200/70">Secure, encrypted access to treatment prescriptions.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Section inside Graphical Panel */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[10px] text-cyan-200/60 font-mono w-full gap-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <Heart className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
            <span>Dedicated Patient Care Unit</span>
          </div>
          <ZFCreationsBrand className="scale-90" />
        </div>
      </div>

      {/* RIGHT COLUMN: REFINED PURE FORM PANEL */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white relative">
        {/* Subtle decorative medical cross background grid pattern in pure CSS */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0D9488 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        {/* Ambient background teal blur */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-teal-200/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-4">
              <RevonLogo size={52} layout="horizontal" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display text-center">Welcome Back</h2>
            <p className="text-xs sm:text-sm text-slate-500 text-center">Sign in to your patient portal to book checkups, track bills, or monitor queue spots.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-2xl flex items-center space-x-3 text-xs border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="login-form" className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none text-xs text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Password</label>
                <button
                  id="go-forgot-btn"
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-[10px] font-bold text-teal-600 hover:text-teal-700 focus:outline-none cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none text-xs text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-bold text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer mt-6"
            >
              <LogIn className="h-4.5 w-4.5" />
              <span>{loading ? 'Verifying...' : 'Authenticate'}</span>
            </button>
          </form>

          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Secure Access</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2.5 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 cursor-pointer transition-all hover:border-slate-300"
          >
            {/* SVG Google icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.483 0 2.825.531 3.882 1.411l3.056-3.056C18.91 1.79 15.82 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.899 0 10.963-4.242 10.963-11.24 0-.637-.058-1.251-.166-1.848l-10.8-.107z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              New to {APP_NAME}?{' '}
              <button
                id="go-register-btn"
                onClick={() => onNavigate('register')}
                className="font-bold text-teal-600 hover:text-teal-700 focus:outline-none cursor-pointer transition-colors"
              >
                Create Portal Account
              </button>
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-center md:hidden">
            <ZFCreationsBrand lightMode={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

