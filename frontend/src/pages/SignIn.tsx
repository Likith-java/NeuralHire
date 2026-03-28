import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    User,
    ShieldCheck,
    Lock,
    ArrowRight,
    Briefcase,
    Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import interviewService from '../services/api';

export default function SignIn() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [step, setStep] = useState<'role' | 'candidate' | 'recruiter'>('role');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [jobRole, setJobRole] = useState('Software Developer');
    const [requiredSkills, setRequiredSkills] = useState('Python, SQL, REST API');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStartInterview = async () => {
        if (!name || !email) {
            showToast('Please enter your name and email.', 'error');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const skills = requiredSkills.split(',').map(s => s.trim()).filter(s => s);
            
            const response = await interviewService.startSession({
                jobRole,
                requiredSkills: skills,
                difficulty: 'deep_dive',
                inputMode: 'text',
                candidateName: name,
            });

            localStorage.setItem('neural_role', 'candidate');
            localStorage.setItem('neural_candidate_name', name);
            localStorage.setItem('neural_candidate_email', email);
            localStorage.setItem('neural_session_id', response.session_id);
            localStorage.setItem('neural_question_id', String(response.question_id));
            localStorage.setItem('neural_question_number', String(response.question_number));
            localStorage.setItem('neural_first_question', response.first_question);

            navigate('/interview');
        } catch (error: any) {
            showToast(error?.response?.data?.detail || 'Failed to start interview.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecruiterLogin = async () => {
        if (!email || !password) {
            showToast('Please enter email and password.', 'error');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await interviewService.loginRecruiter({ email, password });
            localStorage.setItem('neural_role', 'recruiter');
            localStorage.setItem('neural_recruiter_token', response.session_token);
            localStorage.setItem('neural_recruiter_email', response.email);
            localStorage.setItem('neural_recruiter', JSON.stringify({
                id: response.recruiter_id,
                full_name: response.full_name,
                company_name: response.company_name,
            }));
            navigate('/dashboard');
        } catch (error: any) {
            showToast(error?.response?.data?.detail || 'Login failed. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                {/* Left Side: Branding */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="space-y-2">
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic text-primary">Access Portal</h1>
                        <p className="text-text-muted font-mono text-sm tracking-widest uppercase opacity-60">NeuralHire OS // Identity Verification</p>
                    </div>
                    <div className="p-8 bg-surface border border-border rounded-3xl space-y-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-success" />
                            <span className="text-[10px] font-mono text-success uppercase tracking-widest">End-to-End Encryption Active</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed uppercase tracking-wide opacity-50">
                            Your identity determines your protocol. Choose your terminal access below to proceed with the neural evaluation.
                        </p>
                    </div>
                </motion.div>

                {/* Right Side: Options */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* Role Selection */}
                    <AnimatePresence mode="wait">
                        {step === 'role' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <button
                                    onClick={() => setStep('candidate')}
                                    className="p-8 rounded-3xl border-2 border-border hover:border-primary/50 transition-all flex flex-col items-center gap-4 group"
                                >
                                    <div className="p-4 rounded-2xl bg-surface group-hover:bg-primary/20 transition-colors">
                                        <User className="w-8 h-8 text-primary" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[10px]">Candidate</span>
                                </button>

                                <button
                                    onClick={() => setStep('recruiter')}
                                    className="p-8 rounded-3xl border-2 border-border hover:border-secondary/50 transition-all flex flex-col items-center gap-4 group"
                                >
                                    <div className="p-4 rounded-2xl bg-surface group-hover:bg-secondary/20 transition-colors">
                                        <Lock className="w-8 h-8 text-secondary" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[10px]">Recruiter</span>
                                </button>
                            </motion.div>
                        )}

                        {/* Candidate Form */}
                        {step === 'candidate' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <button onClick={() => setStep('role')} className="text-text-muted hover:text-white">
                                        ← Back
                                    </button>
                                    <span className="text-text-muted">/</span>
                                    <span className="text-primary">Candidate</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted ml-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="JOHN DOE"
                                        className="w-full bg-surface border-2 border-border focus:border-primary p-5 rounded-2xl outline-none font-mono text-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted ml-2">
                                        <Mail className="w-3 h-3 inline mr-1" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="candidate@example.com"
                                        className="w-full bg-surface border-2 border-border focus:border-primary p-5 rounded-2xl outline-none font-mono text-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted ml-2">
                                        <Briefcase className="w-3 h-3 inline mr-1" />
                                        Job Role
                                    </label>
                                    <select
                                        value={jobRole}
                                        onChange={(e) => setJobRole(e.target.value)}
                                        className="w-full bg-surface border-2 border-border focus:border-primary p-5 rounded-2xl outline-none font-mono text-sm transition-all"
                                    >
                                        <option value="Software Developer">Software Developer</option>
                                        <option value="Full Stack Developer">Full Stack Developer</option>
                                        <option value="Backend Engineer">Backend Engineer</option>
                                        <option value="Frontend Engineer">Frontend Engineer</option>
                                        <option value="DevOps Engineer">DevOps Engineer</option>
                                        <option value="Data Scientist">Data Scientist</option>
                                        <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted ml-2">Required Skills (comma separated)</label>
                                    <input
                                        type="text"
                                        value={requiredSkills}
                                        onChange={(e) => setRequiredSkills(e.target.value)}
                                        placeholder="Python, SQL, REST API"
                                        className="w-full bg-surface border-2 border-border focus:border-primary p-5 rounded-2xl outline-none font-mono text-sm transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleStartInterview}
                                    disabled={isSubmitting}
                                    className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-60 bg-primary text-background shadow-[0_0_30px_rgba(124,106,247,0.3)]"
                                >
                                    {isSubmitting ? 'Starting...' : 'Start Interview'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}

                        {/* Recruiter Form */}
                        {step === 'recruiter' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <button onClick={() => setStep('role')} className="text-text-muted hover:text-white">
                                        ← Back
                                    </button>
                                    <span className="text-text-muted">/</span>
                                    <span className="text-secondary">Recruiter</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted ml-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="recruiter@company.com"
                                        className="w-full bg-surface border-2 border-border focus:border-secondary p-5 rounded-2xl outline-none font-mono text-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted ml-2">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full bg-surface border-2 border-border focus:border-secondary p-5 rounded-2xl outline-none font-mono text-sm transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleRecruiterLogin}
                                    disabled={isSubmitting}
                                    className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-60 bg-secondary text-background shadow-[0_0_30px_rgba(247,106,140,0.3)]"
                                >
                                    {isSubmitting ? 'Authenticating...' : 'Login to Dashboard'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>

                                <p className="text-center text-text-muted text-xs">
                                    New recruiter?{' '}
                                    <button 
                                        onClick={() => navigate('/recruiter/signup')}
                                        className="text-primary hover:underline"
                                    >
                                        Sign up here
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
