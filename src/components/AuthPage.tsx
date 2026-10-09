import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff, BookOpen, Flame, Bell, Share2, Check } from 'lucide-react';
import { authApi } from '../utils/api';

interface AuthPageProps {
  darkMode: boolean;
  onAuthSuccess: (user: {
    id: string;
    name: string;
    email: string;
    dailyGoalHours: number;
    streak: number;
    darkMode: boolean;
    soundEnabled: boolean;
  }) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ darkMode, onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareApp = () => {
    const shareUrl = window.location.origin.includes('ais-dev-')
      ? window.location.origin.replace('ais-dev-', 'ais-pre-')
      : window.location.origin;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!isLoginMode) {
      if (!name.trim()) {
        setErrorMessage('Please enter your name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please recheck.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLoginMode) {
        const res = await authApi.login(email.trim(), password);
        onAuthSuccess(res.user);
      } else {
        const res = await authApi.register(name.trim(), email.trim(), password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div
        className={`w-full max-w-md rounded-2xl p-6 sm:p-8 border shadow-2xl backdrop-blur-md transition-all ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50'
        }`}
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
            SkillTracker
          </h1>
          <p className={`text-xs sm:text-sm mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isLoginMode
              ? 'Welcome back! Log in to track your learning journey'
              : 'Create your account to start tracking skills'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Only on Register) */}
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-semibold mb-1">
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Joshna"
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-10 py-2 rounded-xl text-xs border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Only on Register) */}
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-semibold mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition shadow-md cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <span>{isLoginMode ? 'Login' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Mode Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isLoginMode ? "Don't have an account yet?" : 'Already have an account?'}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMessage(null);
            }}
            className="mt-1 text-xs font-semibold text-indigo-500 hover:text-indigo-400 underline cursor-pointer"
          >
            {isLoginMode ? 'Go to Register' : 'Go to Login'}
          </button>
        </div>

        {/* Feature Highlights for Beginner */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Target Goals</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Daily Streaks</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Bell className="w-4 h-4 text-sky-500" />
            <span>Study Alarms</span>
          </div>
        </div>

        {/* Share Public Link Helper */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
          <button
            type="button"
            onClick={handleShareApp}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              copiedLink
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : darkMode
                ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-sky-400'
                : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 text-sky-600'
            }`}
            title="Copy Public Link to send to friends"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share App Link with Friends</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
