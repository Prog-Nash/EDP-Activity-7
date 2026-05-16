import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import luminaLogo from '../assets/lumina-logo.svg';

const Auth = ({ onLogin }) => {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      onLogin(data.user, { rememberMe });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/api/auth/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setDemoCode(data.demoCode);
      setRecoveryCode(data.demoCode);
      setExpiresAt(data.expiresAt);
      setNewPassword('');
      setPassword('');
      setSuccess(`Recovery code generated for demo use: ${data.demoCode}`);
      setView('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    if (!email || !recoveryCode || !newPassword) {
      setError('Please complete all password reset fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch('/api/auth/recovery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recoveryCode,
          newPassword,
        }),
      });

      setView('login');
      setPassword('');
      setNewPassword('');
      setRecoveryCode('');
      setDemoCode('');
      setExpiresAt('');
      setSuccess('Password reset successful. You can now sign in with your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-40"></div>

        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <img
              src={luminaLogo}
              alt="Lumina Hub logo"
              className="mx-auto mb-4 h-32 w-32 object-contain drop-shadow-[0_14px_28px_rgba(37,128,255,0.2)]"
            />
            <h1 className="text-2xl font-bold tracking-[0.25em] text-white">LUMINA</h1>
            <p className="mt-1 text-blue-300 text-lg font-semibold">Hub</p>
            <p className="text-slate-300 text-sm mt-1">Distribution Hub Management</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-green-500/40 bg-green-500/15 p-3 text-sm text-green-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setError(''); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                    placeholder="admin@lumina.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError(''); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setView('recovery'); setError(''); setSuccess(''); }}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl py-3 font-semibold shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {view === 'recovery' && (
            <form onSubmit={handleRecoverySubmit} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-white">Reset Password</h2>
                <p className="text-slate-300 text-sm mt-2">Enter your email address and the system will generate a secure recovery code for your demo reset flow.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setError(''); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                    placeholder="admin@lumina.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl py-3 font-semibold shadow-lg transition-all disabled:opacity-60"
              >
                {isSubmitting ? 'Generating Code...' : 'Generate Recovery Code'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                  className="w-full flex items-center justify-center space-x-2 text-sm text-slate-300 hover:text-white transition-colors py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to login</span>
                </button>
              </div>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-white">Create New Password</h2>
                <p className="text-slate-300 text-sm mt-2">Use the recovery code below to set a new password for your account.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Recovery Code</label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(event) => { setRecoveryCode(event.target.value); setError(''); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                    placeholder="Enter recovery code"
                  />
                </div>
              </div>

              {demoCode && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                  <div className="font-semibold">Demo recovery code: {demoCode}</div>
                  {expiresAt && <div className="mt-1 text-xs text-amber-200/80">Valid until {new Date(expiresAt).toLocaleString()}</div>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => { setNewPassword(event.target.value); setError(''); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl py-3 font-semibold shadow-lg transition-all disabled:opacity-60"
              >
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                className="w-full flex items-center justify-center space-x-2 text-sm text-slate-300 hover:text-white transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to login</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
