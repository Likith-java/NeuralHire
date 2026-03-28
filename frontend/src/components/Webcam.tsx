import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface WebcamProps {
  className?: string;
  onStreamReady?: (stream: MediaStream) => void;
}

export const Webcam: React.FC<WebcamProps> = ({ className, onStreamReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
          onStreamReady?.(stream);
        }
      } catch (err: any) {
        console.error('Webcam Error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please enable it in your browser settings.');
        } else {
          setError('Could not access camera. Please check your connection.');
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onStreamReady]);

  return (
    <div className={cn("relative aspect-video bg-surface rounded-2xl overflow-hidden border border-border group", className)}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-secondary/5">
          <AlertCircle className="w-12 h-12 text-secondary mb-4 animate-pulse" />
          <p className="text-sm font-medium text-secondary max-w-[200px]">{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover transition-opacity duration-1000",
              isReady ? "opacity-100" : "opacity-0"
            )}
          />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface">
              <Camera className="w-8 h-8 text-primary animate-pulse" />
            </div>
          )}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-background/60 backdrop-blur-md rounded-lg border border-border/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">LIVE_FEED</span>
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-2 bg-background/60 backdrop-blur-md rounded-lg border border-border/50">
              <Camera className="w-4 h-4 text-text-muted" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
