import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import api from '../services/axios';

export default function RecruiterLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/recruiter/login', { email, password });
      const { session_token, recruiter_id, full_name, company_name } = response.data;

      localStorage.setItem('nh_recruiter_token', session_token);
      localStorage.setItem('neural_role', 'recruiter');
      localStorage.setItem('nh_recruiter', JSON.stringify({
        id: recruiter_id,
        full_name,
        company_name
      }));

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-[#7c6af7]">NEURAL</span>
              <span className="text-[#f76a8c]">HIRE</span>
            </h1>
            <p className="text-[#6af7c8] font-mono text-xs mt-1">OS v2.0</p>
            <p className="text-gray-500 text-sm mt-2">Recruiter Portal</p>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            Welcome Back
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-10 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
                  placeholder="Enter your password"
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
              <button
                type="button"
                onClick={() => navigate('/recruiter/forgot-password')}
                className="text-sm text-[#f76a8c] hover:underline mt-1 float-right"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7c6af7] to-[#f76a8c] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to ARIA Dashboard'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-[#1e1e30]" />
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-[#1e1e30]" />
          </div>

          <p className="text-center text-gray-400 text-sm">
            New to NeuralHire?{' '}
            <button
              onClick={() => navigate('/recruiter/signup')}
              className="text-[#7c6af7] hover:underline"
            >
              Create an account →
            </button>
          </p>

          <p className="text-center text-gray-600 text-xs font-mono mt-6">
            NeuralHire OS · Agentica 2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}
