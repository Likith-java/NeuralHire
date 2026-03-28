import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Menu, X, Brain, PlayCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInterviewStore } from '../store/useInterviewStore';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDemoMode, setDemoMode } = useInterviewStore();

  const role = localStorage.getItem('neural_role');
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', visibleFor: 'recruiter' },
    { name: 'Interview', path: '/interview', visibleFor: 'candidate' },
    { name: 'Report', path: '/report/demo-session', visibleFor: 'recruiter' },
  ].filter(link => !link.visibleFor || link.visibleFor === role);

  return (
    <div className="flex flex-col sticky top-0 z-[100]">
      <nav className="bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between nav-gradient-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 bg-surface border border-primary/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,106,247,0.1)] group-hover:shadow-[0_0_30px_rgba(124,106,247,0.3)] transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Brain className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-lg tracking-tighter leading-none neon-text">NEURALHIRE</span>
            <span className="text-[10px] font-mono text-text-muted tracking-[0.3em] uppercase font-bold">Operating System</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "relative text-[11px] font-mono font-bold tracking-[0.2em] uppercase transition-all hover:text-primary py-2",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_#7c6af7]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-6">
          {/* Demo Mode Toggle */}
          <button
            onClick={() => setDemoMode(!isDemoMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
              isDemoMode
                ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(124,106,247,0.3)]"
                : "bg-surface border-border text-text-muted hover:border-primary/50"
            )}
          >
            <PlayCircle className={cn("w-3.5 h-3.5", isDemoMode && "animate-pulse")} />
            {isDemoMode ? 'Demo Mode Active' : 'Demo Mode'}
          </button>

          <div className="flex items-center gap-4 px-4 py-2 bg-surface/50 border border-border rounded-full">
            <div className="flex items-center gap-2">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 bg-success rounded-full animate-ping opacity-75" />
                <div className="relative w-2 h-2 bg-success rounded-full shadow-[0_0_10px_#6af7c8]" />
              </div>
              <span className="text-[9px] font-mono text-success tracking-widest uppercase font-bold">ARIA Online</span>
            </div>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-text-primary hover:text-primary transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-surface border-b border-border p-6 flex flex-col gap-6 md:hidden shadow-2xl"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "text-sm font-mono font-bold tracking-[0.2em] uppercase py-2 border-b border-border/50",
                    location.pathname === link.path ? "text-primary" : "text-text-muted"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-4 pt-2">
                <button
                  onClick={() => {
                    setDemoMode(!isDemoMode);
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-mono font-bold uppercase tracking-widest transition-all",
                    isDemoMode
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-background border-border text-text-muted"
                  )}
                >
                  <PlayCircle className="w-4 h-4" />
                  {isDemoMode ? 'Demo Mode Active' : 'Demo Mode'}
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full shadow-[0_0_10px_#6af7c8]" />
                  <span className="text-[10px] font-mono text-success tracking-widest uppercase font-bold">ARIA Online</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Demo Mode Banner */}
      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary/10 border-b border-primary/30 overflow-hidden"
          >
            <div className="px-6 py-1.5 flex items-center justify-center gap-3">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.2em]">
                ⚡ DEMO MODE — Using pre-loaded candidate profiles
              </span>
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
