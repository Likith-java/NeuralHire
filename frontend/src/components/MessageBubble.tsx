import React from 'react';
import { motion } from 'motion/react';
import { Bot, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface MessageBubbleProps {
  role: 'aria' | 'candidate';
  text: string;
  timestamp: string;
  isNew?: boolean;
}

const TypingIndicator = () => (
  <div className="flex gap-1.5 items-center h-4 px-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ 
          y: [0, -4, 0],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{ 
          duration: 0.6, 
          repeat: Infinity, 
          delay: i * 0.15 
        }}
        className="w-1.5 h-1.5 bg-primary rounded-full"
      />
    ))}
  </div>
);

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, text, timestamp, isNew = false }) => {
  const isARIA = role === 'aria';
  const isTyping = isARIA && text === '...';

  const variants = {
    initial: { 
      opacity: 0, 
      x: isNew ? (isARIA ? -20 : 20) : 0,
      y: isNew ? 10 : 0
    },
    animate: { 
      opacity: 1, 
      x: 0,
      y: 0
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "flex flex-col w-full mb-6",
        isARIA ? "items-start" : "items-end"
      )}
    >
      {/* Header Row */}
      <div className={cn(
        "flex items-center gap-2 mb-2 px-1",
        isARIA ? "flex-row" : "flex-row-reverse"
      )}>
        {isARIA ? (
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
            <Bot className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest">ARIA</span>
          </div>
        ) : (
          <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-widest">You</span>
        )}
        <span className="text-[9px] font-mono text-text-muted/60 font-medium">{timestamp}</span>
      </div>

      {/* Bubble Content */}
      <div className={cn(
        "max-w-[80%] p-4 rounded-2xl shadow-xl relative overflow-hidden group",
        isARIA 
          ? "bg-[#1a1a26] border-l-[3px] border-primary rounded-tl-none" 
          : "bg-[#1e1e2e] border border-border/50 rounded-tr-none"
      )}>
        {/* Subtle Background Glow for ARIA */}
        {isARIA && (
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        )}

        {isTyping ? (
          <TypingIndicator />
        ) : (
          <p className={cn(
            "text-sm leading-relaxed",
            isARIA ? "text-text-primary/90 italic" : "text-text-primary"
          )}>
            {text}
          </p>
        )}

        {/* Decorative Sparkle for ARIA */}
        {isARIA && !isTyping && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
