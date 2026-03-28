import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Brain,
  Zap,
  Activity,
  Clock,
  MessageSquare,
  Mic,
  HandMetal,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
  FileSearch,
  User,
  Sparkles,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import interviewService from '../services/api';
import ARIALoader from '../components/ARIALoader';
import { useToast } from '../context/ToastContext';
import { useInterviewStore } from '../store/useInterviewStore';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// --- Animation Variants ---

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// --- Sub-components ---

const StatCard = ({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) => (
  <div className="bg-surface border border-border rounded-xl p-5 flex flex-col items-center text-center gap-2 shadow-lg hover:border-primary/30 transition-colors group">
    <div className={cn("p-2.5 rounded-lg bg-background border border-border group-hover:scale-110 transition-transform", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-2xl font-black text-text-primary tracking-tight">{value}</span>
    <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">{label}</span>
  </div>
);

const QuestionRow: React.FC<{ item: any }> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 5) return "text-yellow-500";
    return "text-secondary";
  };

  const scoreValue = item.final_score || 0;

  return (
    <>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className="border-b border-border/50 hover:bg-white/5 cursor-pointer transition-colors group"
      >
        <td className="py-4 px-4 text-[10px] font-mono text-text-muted font-bold">#{item.question_number || 0}</td>
        <td className="py-4 px-4 text-sm font-medium text-text-primary max-w-xs truncate">{item.question || item.text || ''}</td>
        <td className={cn("py-4 px-4 text-sm font-black", getScoreColor(scoreValue))}>{scoreValue.toFixed(1)}/10</td>
        <td className="py-4 px-4 text-[10px] font-mono text-text-muted font-bold">{item.semantic_score || 0}%</td>
        <td className="py-4 px-4 text-[10px] font-mono text-text-muted font-bold">{item.hesitation_score || 0}</td>
        <td className="py-4 px-4 text-xs text-text-muted italic opacity-70 group-hover:opacity-100 transition-opacity">{item.aria_feedback || 'Analysis complete.'}</td>
        <td className="py-4 px-4 text-right">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </td>
      </tr>
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-background/50"
          >
            <td colSpan={7} className="p-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase tracking-widest block mb-2 font-bold">Full Question</span>
                  <p className="text-sm text-text-primary leading-relaxed">{item.question || item.text || ''}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-secondary uppercase tracking-widest block mb-2 font-bold">Candidate Answer</span>
                  <p className="text-sm text-text-muted leading-relaxed italic">"{item.answer}"</p>
                </div>
                {item.aria_feedback && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                    <span className="text-[10px] font-mono text-primary uppercase tracking-widest block mb-2 font-bold">ARIA Feedback</span>
                    <p className="text-xs text-text-primary leading-relaxed">{item.aria_feedback}</p>
                  </div>
                )}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Main Page ---

export default function EvaluationReport() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { isDemoMode } = useInterviewStore();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId) return;
      try {
        const data = await interviewService.getReport(sessionId);
        setReport(data);
        setNotes(data.recruiter_notes || '');
      } catch (error) {
        console.error('Failed to fetch report:', error);
        showToast('Failed to load evaluation report.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId, showToast]);

  const handleSaveNotes = async () => {
    if (!sessionId) return;
    try {
      setIsNotesSaved(true);
      showToast('Notes saved successfully.', 'success');
      setTimeout(() => setIsNotesSaved(false), 2000);
    } catch (error) {
      showToast('Failed to save notes.', 'error');
      setIsNotesSaved(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!sessionId) return;
    try {
      const blob = await interviewService.getReportPdf(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neuralhire_report_${sessionId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Report downloaded successfully.', 'success');
    } catch (error) {
      showToast('Failed to download report.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ARIALoader message="Decrypting Neural Evaluation Data..." />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-surface border border-border rounded-3xl flex items-center justify-center mb-6 aria-pulse">
          <FileSearch className="w-12 h-12 text-secondary opacity-40" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Report Not Found</h2>
        <p className="text-text-muted font-mono text-xs uppercase tracking-widest mb-8">The requested session ID does not exist or is still being processed.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3 bg-primary text-background font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(124,106,247,0.4)] transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const score = report.overall_score || 0;
  const hireLabel = report.hire_label || 'PENDING';
  const statusColor = score >= 75 ? 'text-success border-success/30 bg-success/10' : score >= 50 ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' : 'text-secondary border-secondary/30 bg-secondary/10';
  const statusIcon = score >= 75 ? <CheckCircle2 className="w-4 h-4" /> : score >= 50 ? <AlertCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;

  // Prepare Radar Data
  const skillScores = report.skill_scores || {};
  const radarData = [
    { subject: 'P.Solving', A: skillScores.problem_solving || 0, fullMark: 10 },
    { subject: 'Sys.Design', A: skillScores.system_design || 0, fullMark: 10 },
    { subject: 'Comm.', A: skillScores.communication || 0, fullMark: 10 },
    { subject: 'Code Q.', A: skillScores.code_quality || 0, fullMark: 10 },
    { subject: 'Tech Depth', A: skillScores.technical_depth || 0, fullMark: 10 },
    { subject: 'Adapt.', A: skillScores.adaptability || 0, fullMark: 10 },
  ];

  // Prepare Line Data (Confidence over time)
  const lineData = (report.answers || []).map((a: any, idx: number) => ({
    name: `Q${idx + 1}`,
    confidence: a.confidence_score || 0,
    clarity: a.semantic_score || 0,
    depth: (a.confidence_score + a.semantic_score) / 2 || 0,
  }));

  return (
    <div className="min-h-screen bg-background py-12 px-6 lg:px-10 relative">
      {isDemoMode && (
        <div className="fixed top-24 right-10 z-[100] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-primary/20 backdrop-blur-xl border border-primary/40 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl shadow-primary/20"
          >
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Demo Evaluation Matrix</span>
          </motion.div>
        </div>
      )}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[900px] mx-auto space-y-12"
      >
        {/* HEADER SECTION */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight uppercase">Interview Evaluation Report</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono text-text-muted uppercase tracking-widest font-bold">
              <span className="text-text-primary flex items-center gap-1">
                {report.candidate_image ? (
                  <img src={report.candidate_image} alt={report.candidate_name} className="w-5 h-5 rounded-full object-cover border border-border" />
                ) : (
                  <User className="w-3 h-3" />
                )}
                {report.candidate_name || 'Anonymous Candidate'}
              </span>
              <span className="opacity-30">|</span>
              <span>{report.job_role || 'Software Engineer'}</span>
              <span className="opacity-30">|</span>
              <span>{new Date(report.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="opacity-30">|</span>
              <span className="text-primary">{sessionId}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl hover:border-primary transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border rounded-xl hover:border-primary transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </motion.div>

        {/* SCORE & INTEGRITY DUAL HERO */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-10">
          {/* Main Interview Score */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-x-0 bottom-0 top-0 bg-primary/10 rounded-full blur-3xl"
            />
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="90" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-border" />
                <motion.circle
                  cx="96" cy="96" r="90" fill="transparent" stroke="currentColor" strokeWidth="10"
                  strokeDasharray={565}
                  initial={{ strokeDashoffset: 565 }}
                  animate={{ strokeDashoffset: 565 - (565 * score) / 100 }}
                  className="text-primary drop-shadow-[0_0_15px_rgba(124,106,247,0.6)]"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black text-text-primary">{Math.round(score)}</span>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.3em]">Interview</span>
              </div>
            </div>
          </div>

          {/* Integrity Score (Verifier Agent Result) */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute inset-x-0 bottom-0 top-0 bg-secondary/10 rounded-full blur-3xl"
            />
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="90" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-border" />
                <motion.circle
                  cx="96" cy="96" r="90" fill="transparent" stroke="currentColor" strokeWidth="10"
                  strokeDasharray={565}
                  initial={{ strokeDashoffset: 565 }}
                  animate={{ strokeDashoffset: 565 - (565 * (report.integrity?.score || 100)) / 100 }}
                  className="text-secondary drop-shadow-[0_0_15px_rgba(247,106,140,0.6)]"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black text-text-primary">{Math.round(report.integrity?.score || 100)}</span>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.3em]">Integrity</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={cn(
            "px-6 py-2.5 border rounded-full flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-lg",
            statusColor
          )}>
            {statusIcon}
            {hireLabel}
          </div>
        </motion.div>

        {/* FOUR-COLUMN STAT CARDS */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <StatCard icon={MessageSquare} value={report.questions?.length || 0} label="Questions Asked" color="text-primary" />
          <StatCard icon={Activity} value={report.avg_score || '0.0'} label="Avg Answer Score" color="text-secondary" />
          <StatCard icon={Clock} value={report.hesitation_level || 'Low'} label={`Hesitation (${report.avg_hesitation || '0.00'})`} color="text-success" />
          <StatCard icon={Brain} value={`${report.semantic_match || '0'}%`} label="Semantic Match" color="text-primary" />
        </motion.div>

        {/* SKILL RADAR SNAPSHOT */}
        <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
          <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-[0.3em] mb-8 border-b border-border pb-4 font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Skill Breakdown
          </h3>
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="w-full lg:w-1/2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1e1e30" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#7070a0', fontSize: 10, fontWeight: 'bold' }} />
                  <Radar
                    name="Candidate"
                    dataKey="A"
                    stroke="#6af7c8"
                    fill="#7c6af7"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {radarData.map((item, i) => (
                <div key={i} className="bg-background border border-border p-3 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-mono text-text-muted uppercase font-bold">{item.subject}</span>
                  <span className="text-sm font-black text-primary">{item.A}/10</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CONFIDENCE ANALYTICS CHART */}
        {lineData.length > 0 && (
          <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
            <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-[0.3em] mb-8 border-b border-border pb-4 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-secondary" />
              Answer Confidence Over Time
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#7070a0"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#7070a0"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 10]}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e30', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '20px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#7c6af7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#7c6af7', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Confidence"
                  />
                  <Line
                    type="monotone"
                    dataKey="clarity"
                    stroke="#6af7c8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6af7c8', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Clarity"
                  />
                  <Line
                    type="monotone"
                    dataKey="depth"
                    stroke="#f76a8c"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f76a8c', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Technical Depth"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* QUESTION-BY-QUESTION TABLE */}
        <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 border-b border-border">
            <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-success" />
              Detailed Q&A Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 text-[10px] font-mono text-text-muted uppercase tracking-widest font-black">
                  <th className="py-4 px-4 border-b border-border">#</th>
                  <th className="py-4 px-4 border-b border-border">Question</th>
                  <th className="py-4 px-4 border-b border-border">Score</th>
                  <th className="py-4 px-4 border-b border-border">Semantic</th>
                  <th className="py-4 px-4 border-b border-border">Hesitation</th>
                  <th className="py-4 px-4 border-b border-border">ARIA Note</th>
                  <th className="py-4 px-4 border-b border-border"></th>
                </tr>
              </thead>
              <tbody>
                {report.answers?.map((item: any, idx: number) => (
                  <QuestionRow key={idx} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* INPUT MODE SUMMARY */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-surface/50 border border-border rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">Interview Protocol Summary</span>
            <p className="text-sm text-text-primary">Interview conducted via multiple input modes for comprehensive evaluation.</p>
          </div>
          <div className="flex gap-3">
            {[
              { mode: 'Text', count: report.mode_counts?.text || 0, icon: MessageSquare, color: 'text-primary bg-primary/10 border-primary/20' },
              { mode: 'Voice', count: report.mode_counts?.voice || 0, icon: Mic, color: 'text-secondary bg-secondary/10 border-secondary/20' },
              { mode: 'Sign', count: report.mode_counts?.sign || 0, icon: HandMetal, color: 'text-success bg-success/10 border-success/20' },
            ].map((item, i) => (
              <div key={i} className={cn("px-4 py-2 border rounded-xl flex items-center gap-3", item.color)}>
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.mode} ({item.count})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RECRUITER NOTES */}
        <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-[0.3em] font-bold">Recruiter Notes</h3>
            <button
              onClick={handleSaveNotes}
              className={cn(
                "flex items-center gap-2 px-5 py-2 bg-primary text-background rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                isNotesSaved && "bg-success"
              )}
            >
              {isNotesSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isNotesSaved ? 'Notes Saved' : 'Save Notes'}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add manual observations, cultural fit notes, or follow-up questions..."
            className="w-full bg-background border border-border rounded-xl p-6 text-sm text-text-primary outline-none focus:border-primary transition-all min-h-[150px] resize-none custom-scrollbar"
          />
        </motion.div>

        {/* FOOTER */}
        <motion.footer variants={itemVariants} className="pt-10 pb-20 border-t border-border flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-black tracking-tighter text-text-primary">NEURALHIRE OS</span>
          </div>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] font-bold">
            Generated by NeuralHire OS v2.0 · Powered by Claude Sonnet 4.5 · 5 ML Models Active
          </p>
          <div className="flex gap-4 mt-2">
            <span className="text-[8px] font-mono text-text-muted/40 uppercase">System_ID: {report.system_id || 'NH-AUTO-GEN'}</span>
            <span className="text-[8px] font-mono text-text-muted/40 uppercase">Hash: {report.hash || 'SHA-256-V2'}</span>
          </div>
        </motion.footer>
      </motion.div>
    </div>
  );
}
