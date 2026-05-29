import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Check, RefreshCw, FlipHorizontal } from 'lucide-react';

interface Props {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash]       = useState(false);

  const startCamera = useCallback(async () => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setError(null);
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifie les permissions du navigateur.");
    }
  }, [facingMode]);

  useEffect(() => { startCamera(); return () => streamRef.current?.getTracks().forEach(t => t.stop()); }, [startCamera]);

  function shoot() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    // Center-crop square
    const ox = (video.videoWidth  - size) / 2;
    const oy = (video.videoHeight - size) / 2;
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, ox, oy, size, size, 0, 0, size, size);
    setPreview(canvas.toDataURL('image/jpeg', 0.75));
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  }

  function retake() { setPreview(null); }

  function confirm() {
    if (preview) { onCapture(preview); onClose(); }
  }

  function flipCamera() {
    setFacingMode(m => m === 'user' ? 'environment' : 'user');
    setPreview(null);
  }

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-sm font-semibold text-white">Photo de profil</span>
        <button onClick={flipCamera} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <FlipHorizontal className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {/* Flash effect */}
        {flash && <div className="absolute inset-0 bg-white z-10 animate-fade-in" style={{ animationDuration: '0.1s' }} />}

        {error ? (
          <div className="text-center px-8">
            <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-sm text-white/50">{error}</p>
          </div>
        ) : preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            playsInline
            muted
          />
        )}

        {/* Square crop guide */}
        {!preview && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="aspect-square w-64 rounded-full border-2 border-white/30" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 py-8 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
        {preview ? (
          <>
            <button onClick={retake}
              className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/10 transition-all">
              <RefreshCw className="w-6 h-6 text-white" />
            </button>
            <button onClick={confirm}
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              <Check className="w-8 h-8 text-white" />
            </button>
          </>
        ) : (
          <button onClick={shoot} disabled={!!error}
            className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white
              hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-xl bg-white">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-black/10" />
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
