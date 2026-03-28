import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Brain, Sparkles } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { cn } from '../lib/utils';

interface ChatWidgetProps {
  onSendMessage: (text: string) => void;
  isTyping?: boolean;
  inputValue?: string;
  onInputChange?: (val: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  onSendMessage, 
  isTyping,
  inputValue,
  onInputChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[10000] flex flex-col items-end gap-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
            className="w-[400px] h-[600px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden border border-border/50"
          >
            <ChatPanel 
              onSendMessage={onSendMessage} 
              isTyping={isTyping} 
              inputValue={inputValue}
              onInputChange={onInputChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden group",
          isOpen 
            ? "bg-secondary text-white shadow-secondary/20" 
            : "bg-primary text-background shadow-primary/20"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="flex items-center justify-center"
            >
              <Brain className="w-8 h-8" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {!isOpen && (
          <div className="absolute top-2 right-2 flex items-center justify-center">
            <div className="w-3 h-3 bg-secondary rounded-full border-2 border-primary animate-pulse shadow-[0_0_10px_rgba(255,68,68,0.5)]" />
          </div>
        )}
      </motion.button>

      {/* Label */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-20 top-1/2 -translate-y-1/2 px-4 py-2 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-xl flex items-center gap-3 whitespace-nowrap pointer-events-none"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-text-primary">ARIA_AI_READY</span>
        </motion.div>
      )}
    </div>
  );
};
