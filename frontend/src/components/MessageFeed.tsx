import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'aria' | 'candidate';
  text: string;
  timestamp: string;
  isNew?: boolean;
}

interface MessageFeedProps {
  messages: Message[];
  isARIATyping: boolean;
}

const DateDivider = ({ time }: { time: string }) => (
  <div className="flex items-center justify-center gap-4 my-8">
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
    <div className="px-3 py-1 bg-background border border-border/50 rounded-full">
      <span className="text-[9px] font-mono text-text-muted/60 font-bold uppercase tracking-[0.2em]">
        {time}
      </span>
    </div>
    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-border/30 to-transparent" />
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-8 opacity-60">
    <div className="relative">
      {/* Pulsing Outer Rings */}
      <motion.div
        animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
        className="absolute inset-0 border-2 border-primary rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        className="absolute inset-0 border border-primary/50 rounded-full"
      />
      
      {/* ARIA Avatar Core */}
      <div className="relative w-24 h-24 bg-surface border-2 border-primary/40 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(124,106,247,0.2)]">
        <Bot className="w-10 h-10 text-primary" />
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-primary/5 rounded-full"
        />
      </div>
    </div>

    <div className="text-center space-y-3">
      <h3 className="text-[11px] font-mono text-primary uppercase tracking-[0.3em] font-black">
        Neural Link Established
      </h3>
      <p className="text-xs text-text-muted font-medium max-w-[240px] leading-relaxed">
        ARIA is ready. Your interview will begin shortly.
      </p>
    </div>
  </div>
);

const MessageFeed: React.FC<MessageFeedProps> = ({ messages, isARIATyping }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or typing status changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isARIATyping]);

  // Helper to determine if a divider is needed (if time difference > 2 mins)
  const shouldShowDivider = (current: Message, previous: Message | null) => {
    if (!previous) return true;
    
    // Simple check: if timestamps are different (assuming HH:MM format)
    return current.timestamp !== previous.timestamp;
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar scroll-smooth relative"
    >
      <AnimatePresence mode="popLayout">
        {messages.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-full"
          >
            <EmptyState />
          </motion.div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDivider = shouldShowDivider(msg, prevMsg);

              return (
                <React.Fragment key={msg.id}>
                  {showDivider && <DateDivider time={msg.timestamp} />}
                  <MessageBubble 
                    role={msg.role}
                    text={msg.text}
                    timestamp={msg.timestamp}
                    isNew={msg.isNew}
                  />
                </React.Fragment>
              );
            })}

            {/* Typing Indicator */}
            {isARIATyping && (
              <MessageBubble 
                key="typing"
                role="aria"
                text="..."
                timestamp="Now"
                isNew={true}
              />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Spacer for padding */}
      <div className="h-4" />
    </div>
  );
};

export default MessageFeed;
