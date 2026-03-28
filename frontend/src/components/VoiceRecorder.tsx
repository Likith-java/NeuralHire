import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import interviewService from '../services/api';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onAudioCaptured?: (blob: Blob, transcript: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  className?: string;
  isTranscribing?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscript, 
  onAudioCaptured,
  onRecordingStateChange,
  className,
  isTranscribing 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        try {
          const { transcript } = await interviewService.transcribeAudio(audioBlob);
          if (transcript) {
            onTranscript(transcript);
          }
          onAudioCaptured?.(audioBlob, transcript);
        } catch (err) {
          console.error('Transcription Error:', err);
          setError('Failed to transcribe audio.');
        } finally {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange?.(true);
      setError(null);
    } catch (err: any) {
      console.error('Mic Error:', err);
      setError('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStateChange?.(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        onClick={toggleRecording}
        disabled={isTranscribing}
        className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
          isRecording 
            ? "bg-secondary text-white shadow-[0_0_20px_rgba(255,68,68,0.4)]" 
            : "bg-surface border border-border text-text-muted hover:border-primary hover:text-primary",
          isTranscribing && "opacity-50 cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="mic-on"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <MicOff className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="mic-off"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Mic className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {isRecording && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-secondary/30 pointer-events-none"
          />
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-secondary text-[10px] font-bold uppercase tracking-widest">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">RECORDING...</span>
        </div>
      )}
    </div>
  );
};
