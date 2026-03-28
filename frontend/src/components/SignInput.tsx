import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { HandMetal, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import interviewService from '../services/api';

interface SignInputProps {
  onGesture: (letter: string) => void;
  className?: string;
  isActive?: boolean;
}

export const SignInput: React.FC<SignInputProps> = ({ onGesture, className, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedLetter, setDetectedLetter] = useState<string | null>(null);
  const lastGestureTime = useRef<number>(0);

  const onResults = useCallback(async (results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Draw landmarks for visual feedback
      for (const landmarks of results.multiHandLandmarks) {
        canvasCtx.fillStyle = '#7C6AF7';
        for (const landmark of landmarks) {
          const x = landmark.x * canvasRef.current.width;
          const y = landmark.y * canvasRef.current.height;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);
          canvasCtx.fill();
        }

        // Throttled gesture detection
        const now = Date.now();
        if (now - lastGestureTime.current > 1000) {
          try {
            // Convert landmarks to the format expected by the backend
            const landmarkArray = landmarks.map(l => [l.x, l.y, l.z]);
            const { letter } = await interviewService.detectGesture(landmarkArray);
            
            if (letter) {
              setDetectedLetter(letter);
              onGesture(letter);
              lastGestureTime.current = now;
              setTimeout(() => setDetectedLetter(null), 800);
            }
          } catch (err) {
            console.error('Gesture Detection Error:', err);
          }
        }
      }
    }
    canvasCtx.restore();
  }, [onGesture]);

  useEffect(() => {
    if (!isActive) return;

    let camera: Camera | null = null;
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    if (videoRef.current) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start().then(() => setIsReady(true)).catch(err => {
        console.error('Sign Camera Error:', err);
        setError('Could not access sign camera.');
      });
    }

    return () => {
      camera?.stop();
      hands.close();
    };
  }, [isActive, onResults]);

  if (!isActive) return null;

  return (
    <div className={cn("relative aspect-video bg-surface rounded-2xl overflow-hidden border border-border group", className)}>
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-secondary/5">
          <AlertCircle className="w-12 h-12 text-secondary mb-4 animate-pulse" />
          <p className="text-sm font-medium text-secondary max-w-[200px]">{error}</p>
        </div>
      ) : (
        <>
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface">
              <HandMetal className="w-8 h-8 text-primary animate-pulse" />
            </div>
          )}

          <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/60 backdrop-blur-md rounded-lg border border-border/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">SIGN_INPUT_ACTIVE</span>
          </div>

          <AnimatePresence>
            {detectedLetter && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: -20 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-24 h-24 rounded-3xl bg-primary/20 backdrop-blur-xl border border-primary/40 flex items-center justify-center shadow-[0_0_50px_rgba(124,106,247,0.4)]">
                  <span className="text-5xl font-black text-primary">{detectedLetter}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/60 backdrop-blur-md rounded-lg border border-border/50 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">MEDIAPIPE_HANDS_V1</span>
          </div>
        </>
      )}
    </div>
  );
};
