import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  Trash2,
  HandMetal,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import interviewService from '../services/api';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// --- Types for MediaPipe ---
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

interface SignLanguageInputProps {
  onAnswer: (text: string) => void;
}

const SignLanguageInput: React.FC<SignLanguageInputProps> = ({ onAnswer }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const isActiveRef = useRef(false);
  const isProcessingRef = useRef(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<string>('');
  const [currentWord, setCurrentWord] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [assembledAnswer, setAssembledAnswer] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordSuggestions, setWordSuggestions] = useState<string[]>([]);

  // --- Dynamic Script Loading ---
  useEffect(() => {
    const loadScripts = async () => {
      try {
        const loadScript = (src: string) => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve(true);
              return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };

        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
        ]);

        console.log('MediaPipe scripts loaded successfully');
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load MediaPipe scripts:', err);
        setLoadError(true);
      }
    };

    loadScripts();
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // --- Fetch Word Suggestions ---
  useEffect(() => {
    const currentWordStr = currentWord.join('');
    if (currentWordStr.length >= 1) {
      interviewService.getWordSuggestions(currentWordStr).then((result) => {
        setWordSuggestions(result.suggestions || []);
      }).catch(console.error);
    } else {
      setWordSuggestions([]);
    }
  }, [currentWord]);

  // --- MediaPipe Results Handler ---
  // --- Word Suggestions ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      const prefix = currentWord.join('');
      if (prefix.length >= 1) {
        try {
          const data = await interviewService.getWordSuggestions(prefix);
          setWordSuggestions(data.suggestions || []);
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
        }
      } else {
        setWordSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [currentWord]);

  const onResults = useCallback(async (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        // Draw hand skeleton
        window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
          color: '#6af7c8',
          lineWidth: 5
        });
        window.drawLandmarks(canvasCtx, landmarks, {
          color: '#6af7c8',
          lineWidth: 2,
          radius: 4
        });

        // Extract 21 landmarks (x, y, z)
        const landmarkArray = landmarks.flatMap((l: any) => [l.x, l.y, l.z]);

        // Throttle API calls to avoid overwhelming the server
        const now = Date.now();
        if (now - lastDetectionTimeRef.current > 500 && !isProcessingRef.current) {
          lastDetectionTimeRef.current = now;
          isProcessingRef.current = true;
          setIsProcessing(true);

          try {
            console.log('Sending landmark data to API...');
            const data = await interviewService.detectGesture(landmarkArray);
            console.log('Gesture API result:', data);
            if (data.letter && data.confidence > 0.6) {
              setCurrentLetter(data.letter);
              setConfidence(Math.round(data.confidence * 100));

              // Auto-assemble logic: 1-second timeout between letters
              // This is handled by the throttle above (500ms) + state logic
              // For simplicity, we'll add the letter if it's different or after a delay
              setCurrentWord(prev => {
                // Only add if it's been a while or it's a new letter
                // In a real app, we'd have more complex debouncing
                if (prev.length === 0 || prev[prev.length - 1] !== data.letter) {
                  return [...prev, data.letter];
                }
                return prev;
              });
            }
          } catch (err) {
            console.error('Gesture API error:', err);
          } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
          }
        }
      }
    } else {
      // Clear current letter if no hand detected for a while
      if (Date.now() - lastDetectionTimeRef.current > 2000) {
        setCurrentLetter('');
        setConfidence(0);
      }
    }
    canvasCtx.restore();
  }, []);

  // --- Camera Control ---
  const toggleCamera = async () => {
    if (isActive) {
      isActiveRef.current = false;
      if (cameraRef.current) {
        await cameraRef.current.stop();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsActive(false);
      isProcessingRef.current = false;
      setCurrentLetter('');
      setConfidence(0);
    } else {
      try {
        if (!handsRef.current) {
          handsRef.current = new window.Hands({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
          });

          handsRef.current.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          handsRef.current.onResults((results: any) => {
            console.log('Results received from MediaPipe Hands');
            onResults(results);
          });
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          isActiveRef.current = true;
          setIsActive(true);

          // Use a simple loop to send frames to MediaPipe
          const processVideo = async () => {
            if (!videoRef.current || !handsRef.current || !isActiveRef.current) return;
            await handsRef.current.send({ image: videoRef.current });
            if (isActiveRef.current) {
              requestAnimationFrame(processVideo);
            }
          };

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            processVideo();
          };
        }
      } catch (err) {
        console.error('Camera start error:', err);
        setIsActive(false);
        isActiveRef.current = false;
      }
    }
  };

  const confirmWord = () => {
    const word = currentWord.join('');
    if (word) {
      const newAnswer = assembledAnswer ? `${assembledAnswer} ${word}` : word;
      setAssembledAnswer(newAnswer);
      setCurrentWord([]);
      setCurrentLetter('');
      onAnswer(newAnswer);
    }
  };

  const clearAssembly = () => {
    setCurrentWord([]);
    setCurrentLetter('');
  };

  if (loadError) {
    return (
      <div className="bg-surface border border-secondary/50 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-secondary mx-auto" />
        <h3 className="text-xl font-black uppercase tracking-tight">System Error</h3>
        <p className="text-sm text-text-muted">Camera/MediaPipe not available. Switch to Text mode.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-colors"
        >
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-primary/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-w-md mx-auto">
      {/* Title Bar */}
      <div className="bg-background/50 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🤟</span>
          <h2 className="text-[11px] font-mono text-text-primary uppercase tracking-[0.2em] font-bold">Sign Language Input</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full shadow-[0_0_8px]",
            isActive ? "bg-success shadow-success/50" : "bg-text-muted/30"
          )} />
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Webcam + Canvas */}
      <div className="relative aspect-[4/3] bg-black overflow-hidden">
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 bg-surface/80 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center">
              <Camera className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">Camera Offline</p>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={640}
          height={480}
        />

        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-background flex flex-col items-center justify-center space-y-4 z-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">Initializing Neural Engine...</p>
          </div>
        )}
      </div>

      {/* Detection Display */}
      <div className="p-6 space-y-6">
        <div className="bg-background/50 border border-border rounded-xl p-6 text-center relative overflow-hidden group">
          <div className="absolute top-2 left-3 text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold">Current Letter</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLetter || 'none'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-6xl font-black text-primary font-mono drop-shadow-[0_0_15px_rgba(124,106,247,0.6)]"
            >
              {currentLetter || '-'}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold">Word being formed:</span>
            <span className="text-[9px] font-mono text-primary uppercase tracking-widest font-bold">Confidence: {confidence}%</span>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-background/30 border border-border/50 rounded-xl">
            {currentWord.length === 0 ? (
              <span className="text-[10px] font-mono text-text-muted/30 uppercase tracking-widest italic">Waiting for input...</span>
            ) : (
              currentWord.map((char, i) => (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={i}
                  className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-black text-primary font-mono"
                >
                  {char}
                </motion.span>
              ))
            )}
          </div>
          {/* Word Suggestions */}
          {wordSuggestions.length > 0 && (
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold">Suggestions:</span>
              <div className="flex flex-wrap gap-2">
                {wordSuggestions.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAssembledAnswer(prev => prev ? `${prev} ${word}` : word);
                      setCurrentWord([]);
                      setCurrentLetter('');
                      setWordSuggestions([]);
                    }}
                    className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Bar */}
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-background/30 border-t border-border space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={toggleCamera}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              isActive
                ? "bg-secondary/10 border-secondary/50 text-secondary hover:bg-secondary/20"
                : "bg-primary text-background border-primary hover:opacity-90"
            )}
          >
            {isActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {isActive ? 'Stop Camera' : 'Start Camera'}
          </button>
          <button
            onClick={confirmWord}
            disabled={currentWord.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-success text-background border border-success rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Word
          </button>
        </div>

        <button
          onClick={clearAssembly}
          disabled={currentWord.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:border-secondary hover:text-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear Assembly
        </button>

        <div className="space-y-2">
          <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold">Assembled Answer:</span>
          <textarea
            readOnly
            value={assembledAnswer}
            className="w-full bg-background border border-border rounded-xl p-3 text-xs text-text-primary outline-none min-h-[60px] resize-none custom-scrollbar"
            placeholder="Confirmed words will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

export default SignLanguageInput;
