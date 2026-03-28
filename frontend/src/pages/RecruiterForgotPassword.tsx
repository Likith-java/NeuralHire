import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/axios';

export default function RecruiterForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/recruiter/forgot-password', { email });
      setStep(2);
      setSuccess('If that email is registered, a reset token was sent.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/recruiter/reset-password', {
        email,
        token,
        new_password: newPassword,
      });
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/recruiter/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(124,106,247,0.1) 2px, rgba(124,106,247,0.1) 4px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#7c6af7] to-[#f76a8c]" />

        <div className="bg-[#12121a] border border-[#1e1e30] rounded-lg p-8 shadow-2xl">
          <button
            onClick={() => navigate('/recruiter/login')}
            className="text-gray-400 hover:text-white text-sm mb-4"
          >
            ← Back to Login
          </button>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">
              <span className="text-[#7c6af7]">NEURAL</span>
              <span className="text-[#f76a8c]">HIRE</span>
            </h1>
            <p className="text-[#6af7c8] font-mono text-xs mt-1">OS v2.0</p>
          </div>

          {step === 1 ? (
            <>
              <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                Reset Your Password
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Enter your company email. We'll send you a reset token.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Company Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
                      placeholder="recruiter@company.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#7c6af7] to-[#f76a8c] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Token'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                Enter Reset Token
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Check your email for the reset token.
              </p>

              {success && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Reset Token</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-4 py-2.5 text-white font-mono focus:border-[#7c6af7] focus:outline-none transition-colors"
                      placeholder="Paste your reset token"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-10 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
                      placeholder="Min 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#7c6af7] to-[#f76a8c] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
