import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Clock, Sparkles } from 'lucide-react';
import { useInterviewStore, Message } from '../store/useInterviewStore';
import { cn } from '../lib/utils';

interface ChatPanelProps {
  onSendMessage: (text: string) => void;
  className?: string;
  isTyping?: boolean;
  inputValue?: string;
  onInputChange?: (val: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  onSendMessage, 
  className, 
  isTyping,
  inputValue,
  onInputChange
}) => {
  const { messages } = useInterviewStore();
  const [localInput, setLocalInput] = useState('');
  
  const input = inputValue !== undefined ? inputValue : localInput;
  const setInput = onInputChange !== undefined ? onInputChange : setLocalInput;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className={cn("flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl h-full", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-background/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary">NEURAL_CHAT_V2</h4>
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">E2E_ENCRYPTED_SESSION</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[9px] font-bold text-success uppercase tracking-widest">CONNECTED</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.role === 'aria' ? "mr-auto" : "ml-auto items-end"
              )}
            >
              <div className={cn(
                "px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group",
                msg.role === 'aria' 
                  ? "bg-background border border-border/50 text-text-primary rounded-tl-none" 
                  : "bg-primary text-background font-medium rounded-tr-none shadow-[0_0_20px_rgba(124,106,247,0.2)]"
              )}>
                {msg.role === 'aria' && (
                  <div className="absolute -top-6 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">ARIA_AI</span>
                  </div>
                )}
                {msg.text}
              </div>
              <div className="mt-2 flex items-center gap-2 px-2">
                <Clock className="w-3 h-3 text-text-muted/50" />
                <span className="text-[9px] font-mono text-text-muted/50 uppercase tracking-widest">
                  {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col max-w-[85%] mr-auto"
          >
            <div className="px-5 py-4 bg-background border border-border/50 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary/80" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 bg-background/40 backdrop-blur-md border-t border-border/50">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response..."
            className="w-full bg-surface border border-border rounded-xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all pr-16 shadow-inner group-hover:border-border/80"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-background rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">CMD+ENTER_TO_SEND</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">LATENCY: 124MS</span>
          </div>
        </div>
      </form>
    </div>
  );
};
