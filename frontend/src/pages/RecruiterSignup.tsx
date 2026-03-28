import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Building2 } from 'lucide-react';
import api from '../services/axios';

export default function RecruiterSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    companySize: '1-10',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/recruiter/signup', {
        full_name: formData.fullName,
        email: formData.email,
        company_name: formData.companyName,
        company_size: formData.companySize,
      });

      setGeneratedPassword(response.data.generated_password);
      setShowModal(true);

      localStorage.setItem('nh_recruiter_token', response.data.session_token);
      localStorage.setItem('nh_recruiter', JSON.stringify({
        id: response.data.recruiter_id,
        company_name: response.data.company_name,
      }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
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
        className="relative w-full max-w-lg mx-4"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#7c6af7] to-[#f76a8c]" />

        <div className="bg-[#12121a] border border-[#1e1e30] rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">
              <span className="text-[#7c6af7]">NEURAL</span>
              <span className="text-[#f76a8c]">HIRE</span>
            </h1>
            <p className="text-[#6af7c8] font-mono text-xs mt-1">OS v2.0</p>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Create Your Recruiter Account
          </h2>

          <p className="text-[#6af7c8] font-mono text-xs mb-6">
            Your company password will be auto-generated and emailed to you.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
                  placeholder="John Smith"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
                  placeholder="Acme Corp"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Company Size</label>
              <select
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="w-full bg-[#0a0a0f] border border-[#1e1e30] rounded-lg px-4 py-2.5 text-white focus:border-[#7c6af7] focus:outline-none transition-colors"
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="200+">200+ employees</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7c6af7] to-[#f76a8c] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
            >
              {loading ? 'Setting up your account...' : 'Create Account & Get Password'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/recruiter/login')}
              className="text-[#7c6af7] hover:underline"
            >
              Sign in →
            </button>
          </p>
        </div>
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#12121a] border border-[#7c6af7] rounded-lg p-8 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">🔐 Your Generated Password</h3>

            <div className="bg-[#f76a8c]/10 border border-[#f76a8c] text-[#f76a8c] px-4 py-3 rounded-lg mb-4 text-sm">
              ⚠️ Save this now — it will not be shown again
            </div>

            <div className="bg-[#0a0a0f] border border-[#7c6af7] rounded-lg p-4 mb-4 text-center">
              <p className="text-2xl font-mono tracking-widest text-[#7c6af7]">{generatedPassword}</p>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full bg-[#6af7c8] text-[#0a0a0f] font-semibold py-2 rounded-lg mb-4 hover:bg-[#5ae6b5] transition-colors"
            >
              Copy to Clipboard
            </button>

            <p className="text-gray-400 text-sm text-center mb-4">
              This password has also been sent to your email
            </p>

            <button
              onClick={() => {
                setShowModal(false);
                navigate('/dashboard');
              }}
              className="w-full bg-gradient-to-r from-[#7c6af7] to-[#f76a8c] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              I've saved my password — Continue to Dashboard
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
