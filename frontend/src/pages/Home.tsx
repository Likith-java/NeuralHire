import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Brain, User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6 text-center">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="grid-overlay opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 space-y-12"
      >
        {/* Centered Branding */}
        <div className="space-y-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20 backdrop-blur-md">
              <Brain className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-text-primary neon-text"
          >
            NEURALHIRE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-text-muted text-lg md:text-xl font-mono tracking-widest uppercase opacity-60"
          >
            Fully Autonomous AI Evaluation Protocol
          </motion.p>
        </div>

        {/* Navigation Entry Point */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          <Link
            to="/signin"
            className="group relative px-12 py-6 bg-primary text-background font-black rounded-3xl hover:shadow-[0_0_50px_rgba(124,106,247,0.3)] transition-all duration-500 flex items-center gap-4 uppercase tracking-[0.4em] text-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            Enter Neural System
          </Link>

          <Link
            to="/recruiter/signup"
            className="group px-8 py-4 border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all rounded-xl flex items-center gap-3 font-semibold text-sm tracking-wide"
          >
            <ShieldCheck className="w-4 h-4" />
            Recruiter Portal
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-0 w-full"
      >
        <p className="text-[10px] font-mono text-text-muted tracking-[0.4em] uppercase">
          Full-Stack Interview Orchestration // Backend + ML Services Active
        </p>
      </motion.div>
    </div>
  );
}
