import React, { useState } from 'react';
import { APP_NAME } from '../config/appConfig';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { Sparkles, Mail, Lock, User, Phone, CheckSquare, AlertCircle, ShieldCheck, Award, Activity, Heart, Stethoscope, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';
import { RevonLogo } from './RevonLogo';
import { ZFCreationsBrand } from './ZFCreationsBrand';

interface RegisterProps {
  onNavigate: (view: string) => void;
}

export function Register({ onNavigate }: RegisterProps) {
  const { registerWithEmail } = useAuth();
  const { activeClinic } = useClinic();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerWithEmail(email, password, displayName, phone, role, activeClinic?.slug || 'revon-dental');
      onNavigate('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create an account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-page" className="min-h-[90vh] flex flex-col md:flex-row bg-[#FAFAF9] font-sans">
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
          <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-200 font-mono">{APP_NAME} Patient Hub</span>
        </div>

        {/* Center Graphic: Medical Presentation */}
        <div className="relative z-10 my-auto space-y-8 flex flex-col items-center text-center">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-2">
              <Stethoscope className="h-8 w-8" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-200 leading-tight tracking-tight font-display text-center">
              Your Medical Care, Fully Digital.
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-cyan-200/80 max-w-md leading-relaxed mx-auto">
              Create a personalized medical portal account to book seamless consultations, view diagnostic logs, access digital billing, and talk to your AI health companion.
            </p>
          </div>

          {/* Clinical Bullet Points with Beautiful Modern Icons */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg pt-4 text-left">
            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <ShieldCheck className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">100% Secure & Compliant</strong>
                <span className="text-[10px] text-cyan-200/70">Your medical records and diagnostic logs are safely stored with cloud encryption.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <Activity className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">Priority Queue Check-in</strong>
                <span className="text-[10px] text-cyan-200/70">Check-in from anywhere and view real-time doctor slot progression.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">AI Conversational Care</strong>
                <span className="text-[10px] text-cyan-200/70">Book appointments, ask about pricing, and map specialists in our chat interface.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <Award className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block font-display">Painless Clinical Standards</strong>
                <span className="text-[10px] text-cyan-200/70">State-of-the-art diagnostic equipment and board-certified medical experts.</span>
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

        <div className="max-w-md w-full space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <RevonLogo size={52} layout="horizontal" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display text-center">Create Account</h2>
            <p className="text-xs sm:text-sm text-slate-500 text-center">Sign up and book your first clinical treatment</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-2xl flex items-center space-x-3 text-xs border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="register-form" className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="register-name-input"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none text-xs text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="Alice Johnson"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="register-email-input"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none text-xs text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="alice@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  id="register-phone-input"
                  type="tel"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none text-xs text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="register-password-input"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none text-xs text-slate-800 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Informational message about registration access */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Public registration is for <strong>Patients</strong> only. Clinic staff accounts are created solely by the Clinic Administrator.
              </p>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl font-bold text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer mt-4"
            >
              <CheckSquare className="h-4.5 w-4.5" />
              <span>{loading ? 'Creating account...' : 'Create Portal Account'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                id="register-go-login-btn"
                onClick={() => onNavigate('login')}
                className="font-bold text-teal-600 hover:text-teal-700 focus:outline-none cursor-pointer transition-colors"
              >
                Sign In
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
