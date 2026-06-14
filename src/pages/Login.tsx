import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Stethoscope, Lock, User as UserIcon, AlertCircle, Info } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username || !password) {
        throw new Error('Please fill in all database login fields');
      }
      const data = await api.auth.login(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err?.message || 'Invalid username or password. Try using "doctor" or "reception".');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutLogin = async (role: 'doctor' | 'reception') => {
    setError(null);
    setLoading(true);
    try {
      const u = role === 'doctor' ? 'doctor' : 'reception';
      const data = await api.auth.login(u, 'password');
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError('Shortcut login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotUsername) {
      setForgotSent(true);
      setTimeout(() => {
        setForgotSent(false);
        setForgotUsername('');
        setShowForgotModal(false);
        alert('Password reset link sent to your registered clinic email addresses. Check your inbox!');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl overflow-hidden relative z-10">
        
        {/* HEADER BRAND */}
        <div className="pt-8 pb-6 px-8 text-center border-b border-white/40 bg-white/25 backdrop-blur-xs">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white mb-3 shadow-md shadow-blue-500/10">
            <Stethoscope className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinix Manager Portal</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Clinic Care Gateway</p>
        </div>

        {/* CONTROLS */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="flex items-start space-x-2 text-xs bg-rose-50/70 border border-rose-100/40 rounded-xl p-3 text-rose-700 font-semibold backdrop-blur-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700" htmlFor="username">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="username"
                type="text"
                placeholder="doctor / reception..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/70 backdrop-blur-xs border border-white/40 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-slate-800 placeholder-slate-400"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700" htmlFor="password">Password</label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/70 backdrop-blur-xs border border-white/40 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-slate-800 placeholder-slate-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 mt-2 shadow-md shadow-blue-500/10"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {/* QUICK CHANNELS - HIGHLY USER-FRIENDLY */}
          <div className="border-t border-white/40 pt-5 mt-4 space-y-2 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Quick Sandbox Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleShortcutLogin('doctor')}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 border border-white/40 rounded-xl hover:bg-white/45 text-xs font-bold text-slate-755 transition-all bg-white/20 shadow-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span>Doctor Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleShortcutLogin('reception')}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 border border-white/40 rounded-xl hover:bg-white/45 text-xs font-bold text-slate-755 transition-all bg-white/20 shadow-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span>Receptionist</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Reset Password</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              Enter your clinic username or email. We will dispatch a recovery token to the designated medical administrator.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="username or email"
                className="w-full px-3 py-2 bg-white/70 backdrop-blur-xs border border-white/40 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                required
              />
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotUsername('');
                  }}
                  className="flex-1 border border-white/40 hover:bg-white/45 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all bg-white/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotSent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm"
                >
                  {forgotSent ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
