import React from 'react';
import { motion } from 'motion/react';
import { Brain } from 'lucide-react';

interface ARIALoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const ARIALoader: React.FC<ARIALoaderProps> = ({ 
  message = "ARIA is thinking", 
  fullScreen = false 
}) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
    : "flex flex-col items-center justify-center p-8 gap-6";

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Pulsing Rings */}
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-2 border-primary"
        />
        <motion.div 
          animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute inset-0 rounded-full border border-primary"
        />
        
        {/* ARIA Logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="relative w-16 h-16 bg-surface border-2 border-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,106,247,0.3)] aria-pulse"
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-text-primary neon-text">
            {message}
          </span>
          <motion.div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="text-primary font-bold"
              >
                .
              </motion.span>
            ))}
          </motion.div>
        </div>
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest opacity-50">
          Neural Core Processing...
        </span>
      </div>
    </div>
  );
};

export default ARIALoader;
