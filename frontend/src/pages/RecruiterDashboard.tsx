import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  TrendingUp,
  FileText,
  Brain,
  ChevronRight,
  Trophy,
  CheckCircle2,
  Trash2,
  PencilLine
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import interviewService from '../services/api';
import { useToast } from '../context/ToastContext';

interface Candidate {
  session_id: string;
  candidate_name?: string;
  job_role: string;
  status: string;
  overall_score: number;
  hire_flag?: string;
  hire_label: string;
  input_mode: string;
  created_at: string;
  completed_at?: string;
}

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadCandidates = async () => {
    try {
      const data = await interviewService.getCandidates();
      const sorted = [...data].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
      setCandidates(sorted);
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Failed to load recruiter sessions.', 'error');
    }
  };

  useEffect(() => {
    void loadCandidates();
  }, [showToast]);

  const filteredCandidates = candidates.filter(c =>
    (c.candidate_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.job_role?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleDeleteSelected = () => {
    showToast('Delete is not enabled for persisted interview data in this MVP.', 'info');
  };

  const handleDeleteAll = () => {
    showToast('Bulk deletion is not enabled for persisted interview data in this MVP.', 'info');
  };

  const avgScore = candidates.length 
    ? Math.round(candidates.reduce((acc, c) => acc + (c.overall_score || 0), 0) / candidates.length)
    : 0;
  const topScore = candidates[0]?.overall_score || 0;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase mb-2">Recruiter Dashboard</h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-[0.2em]">Autonomous Protocol // Candidate Analytics</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setSelectedIds([]);
            }}
            className={cn(
              "px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              isEditMode
                ? "bg-primary text-background border-primary"
                : "bg-surface border-border hover:border-primary/50"
            )}
          >
            <PencilLine className="w-4 h-4" />
            {isEditMode ? "Done" : "Edit"}
          </button>
          {isEditMode && (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="px-4 py-3 rounded-2xl border border-secondary/50 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={candidates.length === 0}
                className="px-4 py-3 rounded-2xl border border-secondary/50 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            </>
          )}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH_CANDIDATES"
              className="bg-surface border border-border rounded-2xl pl-12 pr-6 py-3 outline-none focus:border-primary/50 transition-all text-sm font-mono w-full md:w-64"
            />
          </div>
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <Users className="w-6 h-6 text-primary" />
          </div>
        </div>
      </header>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
          { label: 'Total Applicants', value: candidates.length, icon: Users, color: 'text-primary' },
          { label: 'Avg Score', value: avgScore, icon: Brain, color: 'text-secondary' },
          { label: 'Top Match', value: topScore, icon: Trophy, color: 'text-success' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface/50 border border-border p-8 rounded-[2.5rem] backdrop-blur-xl flex items-center justify-between group hover:border-primary/30 transition-all"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{stat.label}</p>
              <p className="text-3xl font-black tracking-tighter">{stat.value}{stat.label.includes('Score') || stat.label.includes('Match') ? '%' : ''}</p>
            </div>
            <stat.icon className={cn("w-10 h-10 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all", stat.color)} />
          </motion.div>
        ))}
      </div>

      {/* Rankings Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="px-10 py-6 border-b border-border bg-background/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">Candidate Rankings</h2>
          </div>
          <span className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-widest">Sorted by Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/20 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                <th className="px-10 py-6">Rank</th>
                {isEditMode && <th className="px-10 py-6">Select</th>}
                <th className="px-10 py-6">Candidate</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6">Score</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6">Date</th>
                <th className="px-10 py-6 text-right">Insights</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate, idx) => (
                <tr key={candidate.session_id} className="group hover:bg-primary/5 transition-colors border-b border-border/50">
                  <td className="px-10 py-8">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs",
                      idx === 0 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" :
                        idx === 1 ? "bg-slate-300 text-black" :
                          idx === 2 ? "bg-amber-600 text-black" : "bg-surface border border-border text-text-muted"
                    )}>
                      {idx + 1}
                    </span>
                  </td>
                  {isEditMode && (
                    <td className="px-10 py-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(candidate.session_id)}
                        onChange={() => toggleCandidateSelection(candidate.session_id)}
                        className="w-4 h-4 accent-primary"
                      />
                    </td>
                  )}
                  <td className="px-10 py-8">
                    <div className="space-y-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-black">
                        {(candidate.candidate_name || 'A').slice(0, 1)}
                      </div>
                      <p className="font-black text-base uppercase tracking-tight">{candidate.candidate_name || 'Anonymous'}</p>
                    </div>
                    <div className="space-y-1 mt-2">
                      <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">SESSION: {candidate.session_id.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-xs font-mono text-text-muted">{candidate.job_role || 'N/A'}</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-black text-primary font-mono">{candidate.overall_score || 0}%</div>
                      <div className="w-24 h-2 bg-border rounded-full overflow-hidden hidden md:block">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${candidate.overall_score || 0}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      candidate.hire_flag === 'strong_yes' ? 'bg-success/20 text-success' :
                        candidate.hire_flag === 'maybe' ? 'bg-yellow-500/20 text-yellow-500' :
                          candidate.hire_flag === 'no' ? 'bg-secondary/20 text-secondary' :
                            'bg-surface border border-border text-text-muted'
                    )}>
                      {candidate.hire_label}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2 text-text-muted font-mono text-xs">
                      <FileText className="w-3 h-3" />
                      {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button
                      onClick={() => navigate(`/report/${candidate.session_id}`)}
                      className="px-6 py-2 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all flex items-center gap-2 ml-auto group/btn"
                    >
                      View Report
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={isEditMode ? 8 : 7} className="px-10 py-24 text-center">
                    <div className="space-y-4 opacity-30">
                      <Search className="w-12 h-12 mx-auto" />
                      <p className="font-black uppercase tracking-widest text-xs">No Candidates Matched in Protocol</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* System Integrity */}
      <footer className="pt-12 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Database: Persistent Session Store</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Algorithm: Backend + ML Orchestration</span>
          </div>
        </div>
        <p className="text-[10px] font-mono text-text-muted/50 uppercase tracking-[0.4em]">NeuralHire // Recruiter Terminal</p>
      </footer>
    </div>
  );
}
