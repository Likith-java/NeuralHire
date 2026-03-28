import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Square,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useInterviewStore } from '../store/useInterviewStore';
import interviewService from '../services/api';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface VoiceInputProps {
  onAnswer: (text: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onAnswer }) => {
  const { setIsSpeaking, setIsCandidateSpeaking } = useInterviewStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const isRecordingRef = useRef(false);

  // Initialize Web Speech API for fallback
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTextChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTextChunk += event.results[i][0].transcript + ' ';
          }
        }

        if (finalTextChunk) {
          setTranscript(prev => `${prev}${finalTextChunk}`);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            // Browser can throw if recognition is already starting/stopping.
          }
        }
      };
    }
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to use MediaRecorder for high-quality audio
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsSpeaking(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        await handleTranscription(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setIsCandidateSpeaking(true);
      setStatus('recording');

      // Also start Web Speech API for live visual feedback if available
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied or not supported.');
      setIsSpeaking(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsCandidateSpeaking(false);
      setStatus('processing');

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsProcessing(true);
    setStatus('processing');

    try {
      // Use backend ElevenLabs/Groq transcription service
      const result = await interviewService.transcribeAudio(blob);
      console.log('Transcription result:', result);

      const backendTranscript = result?.transcript || '';
      const webSpeechTranscript = transcriptRef.current.trim();

      // Use backend transcription first, fallback to Web Speech API
      const finalTranscript = (backendTranscript || webSpeechTranscript).trim();

      if (finalTranscript) {
        console.log('Final transcript:', finalTranscript);
        onAnswer(finalTranscript);
      } else {
        setError('No speech detected. Please try again or type your answer.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      // Fallback to Web Speech API
      const fallbackTranscript = transcriptRef.current.trim();
      if (fallbackTranscript) {
        onAnswer(fallbackTranscript);
      } else {
        setError('Transcription failed. Please try again or type your answer.');
      }
    } finally {
      setIsProcessing(false);
      setStatus('idle');
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onAnswer(transcript.trim());
      setStatus('idle');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return (
    <div className={cn(
      "bg-surface border-2 rounded-2xl p-8 transition-all duration-500 shadow-2xl max-w-lg mx-auto",
      isRecording ? "border-secondary shadow-[0_0_30px_rgba(247,106,140,0.2)]" : "border-border"
    )}>
      {/* Recording Area */}
      <div className="flex flex-col items-center space-y-6 mb-8">
        <div className="relative">
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.2 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-secondary rounded-full blur-xl"
              />
            )}
          </AnimatePresence>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={cn(
              "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 z-10",
              isRecording
                ? "bg-secondary shadow-[0_0_20px_rgba(247,106,140,0.5)]"
                : "bg-background border border-border hover:border-secondary/50 group"
            )}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-background fill-background" />
            ) : (
              <Mic className={cn(
                "w-8 h-8 transition-colors",
                isProcessing ? "text-text-muted" : "text-text-muted group-hover:text-secondary"
              )} />
            )}
          </button>
        </div>

        <div className="text-center">
          <p className={cn(
            "text-[11px] font-mono uppercase tracking-[0.2em] font-bold",
            isRecording ? "text-secondary animate-pulse" : "text-text-muted"
          )}>
            {status === 'idle' && "Click to speak"}
            {status === 'recording' && "Recording..."}
            {status === 'processing' && "Processing..."}
          </p>
        </div>

        {/* Waveform Visualizer */}
        <div className="h-12 flex items-center gap-1">
          {isRecording ? (
            [...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [8, Math.random() * 32 + 8, 8],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-1.5 rounded-full bg-gradient-to-t from-primary to-secondary"
              />
            ))
          ) : (
            <div className="flex gap-1">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-1.5 h-2 bg-border rounded-full opacity-30" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Area */}
      <div className="relative group">
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            isProcessing ? "bg-secondary animate-pulse" : "bg-text-muted/30"
          )} />
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold">Neural Transcript</span>
        </div>

        <div className="w-full bg-background/50 border border-border rounded-xl p-8 pt-10 min-h-[160px] max-h-[240px] overflow-y-auto custom-scrollbar shadow-inner relative">
          {isProcessing && transcript === '' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-background/40 backdrop-blur-[2px] z-10">
              <Loader2 className="w-6 h-6 text-secondary animate-spin" />
              <span className="text-[10px] font-mono text-secondary uppercase tracking-widest font-bold">Transcribing...</span>
            </div>
          ) : null}

          {transcript ? (
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
          ) : (
            <p className="text-sm text-text-muted italic opacity-40">
              Your speech will appear here...
            </p>
          )}

          <div className="absolute bottom-3 right-4 text-[9px] font-mono text-text-muted/50 font-bold">
            {transcript.length} CHARS
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-secondary text-[10px] font-bold uppercase tracking-wider"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isRecording || isProcessing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-success text-background border border-success rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit Answer
          </button>
          <button
            onClick={clearTranscript}
            disabled={!transcript && !error}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-secondary hover:border-secondary transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-background/50 border border-border rounded-full">
            <span className="text-[8px] font-mono text-text-muted uppercase tracking-widest font-bold">Powered by Web Speech API</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInput;
