import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useInterviewStore } from '../store/useInterviewStore';
import { cn } from '../lib/utils';
import { Sparkles } from 'lucide-react';
import AriaAvatar3D from './AriaAvatar3D';

interface AvatarPanelProps {
  className?: string;
  avatarUrl?: string;
}

export const AvatarPanel: React.FC<AvatarPanelProps> = ({ className, avatarUrl }) => {
  const { isSpeaking, candidateName } = useInterviewStore();

  return (
    <div className={cn("relative aspect-video bg-surface rounded-2xl overflow-hidden border border-border group flex items-center justify-center", className)}>
      {/* Background Glow */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 3D Avatar Container */}
      <div className="relative z-10 w-full h-full">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono text-text-muted uppercase">Loading Avatar...</span>
            </div>
          </div>
        }>
          <AriaAvatar3D />
        </Suspense>
      </div>

      {/* Status Badges */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/60 backdrop-blur-md rounded-lg border border-border/50 flex items-center gap-2 z-20">
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          isSpeaking ? "bg-primary" : "bg-success"
        )} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">
          {isSpeaking ? "TRANSMITTING" : "READY"}
        </span>
      </div>

      {/* ARIA Badge */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-primary/10 backdrop-blur-md rounded-lg border border-primary/30 flex items-center gap-2 z-20">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">ARIA</span>
      </div>

      {/* Candidate Name Badge */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-background/60 backdrop-blur-md rounded-lg border border-border/50 flex items-center gap-2 z-20">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">INTERVIEWING:</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">{candidateName || "CANDIDATE"}</span>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute bottom-4 right-4 flex gap-1 items-end z-20">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [8, 24, 8] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 bg-primary rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};
