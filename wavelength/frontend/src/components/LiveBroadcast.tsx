import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Users, MicOff, Mic, VideoOff, Video, StopCircle } from 'lucide-react';
import type { UserProfile } from '../types';
import type { LiveVisibility } from './LiveSetupModal';
import LiveChat from './LiveChat';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface Props {
  profile: UserProfile;
  viewers: number;
  initialTitle?: string;
  initialVisibility?: LiveVisibility;
  onStartLive: (title: string, visibility: LiveVisibility) => void;
  onUpdateLive?: (title: string, isPublic: boolean) => void;
  onStopLive: () => void;
  onSendOffer:   (viewerId: string, offer: RTCSessionDescriptionInit) => void;
  onSendIce:     (viewerId: string, candidate: RTCIceCandidateInit) => void;
  onAnswerReceived: (cb: (viewerId: string, answer: RTCSessionDescriptionInit) => void) => void;
  onIceReceived:    (cb: (fromId: string, candidate: RTCIceCandidateInit) => void) => void;
  onViewerJoined:   (cb: (viewerId: string) => void) => void;
  onViewerLeft:     (cb: (viewerId: string) => void) => void;
  isLive?: boolean;
}

export default function LiveBroadcast({
  profile, viewers, initialTitle, initialVisibility,
  onStartLive, onUpdateLive, onStopLive,
  onSendOffer, onSendIce,
  onAnswerReceived, onIceReceived, onViewerJoined, onViewerLeft,
}: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const peersRef    = useRef<Map<string, RTCPeerConnection>>(new Map());

  const [mySocketId] = useState(() => {
    const s = ((window as unknown) as Record<string, unknown>)['__melo_socket__'] as { id?: string } | undefined;
    return s?.id ?? 'broadcaster';
  });
  const [step, setStep]         = useState<'preview' | 'live'>('preview');
  const [title, setTitle]       = useState('');
  const [muted, setMuted]       = useState(false);
  const [camOff, setCamOff]     = useState(false);
  const [facingMode] = useState<'user' | 'environment'>('user');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [elapsed, setElapsed]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-start from setup modal
  useEffect(() => {
    if (initialTitle) {
      startPreview().then(() => {
        goLive(initialTitle, initialVisibility ?? 'public');
      });
    } else {
      startPreview();
    }
  }, []);

  // Start camera preview
  async function startPreview() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setError(null);
      setStep('preview');
    } catch {
      setError("Impossible d'accéder à la caméra/micro.");
    }
  }

  function goLive(liveTitle: string, visibility: LiveVisibility) {
    setTitle(liveTitle);
    setIsPublic(visibility === 'public');
    onStartLive(liveTitle, visibility);
    setStep('live');
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function stopLive() {
    onStopLive();
    streamRef.current?.getTracks().forEach(t => t.stop());
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    if (timerRef.current) clearInterval(timerRef.current);
    onStopLive();
    setElapsed(0);
  }

  // When a viewer joins: create peer connection and send offer
  const handleViewerJoined = useCallback(async (viewerId: string) => {
    if (!streamRef.current) return;
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peersRef.current.set(viewerId, pc);
    streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current!));
    pc.onicecandidate = e => { if (e.candidate) onSendIce(viewerId, e.candidate.toJSON()); };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    onSendOffer(viewerId, offer);
  }, [onSendOffer, onSendIce]);

  const handleViewerLeft = useCallback((viewerId: string) => {
    peersRef.current.get(viewerId)?.close();
    peersRef.current.delete(viewerId);
  }, []);

  const handleAnswer = useCallback(async (viewerId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peersRef.current.get(viewerId);
    if (pc) await pc.setRemoteDescription(answer);
  }, []);

  const handleIce = useCallback(async (fromId: string, candidate: RTCIceCandidateInit) => {
    const pc = peersRef.current.get(fromId);
    if (pc) await pc.addIceCandidate(candidate);
  }, []);

  useEffect(() => { onViewerJoined(handleViewerJoined);  }, [onViewerJoined, handleViewerJoined]);
  useEffect(() => { onViewerLeft(handleViewerLeft);      }, [onViewerLeft,   handleViewerLeft]);
  useEffect(() => { onAnswerReceived(handleAnswer);      }, [onAnswerReceived, handleAnswer]);
  useEffect(() => { onIceReceived(handleIce);            }, [onIceReceived,   handleIce]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function toggleMute() {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  }
  function toggleCam() {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = camOff; });
    setCamOff(c => !c);
  }
  function formatTime(s: number) {
    const m = Math.floor(s / 60); return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.7)' }}>
        {step === 'live' || step === 'preview' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-full animate-pulse"
                style={{ background: '#ef4444' }}>
                <span className="w-2 h-2 bg-white rounded-full" /> EN DIRECT
              </span>
              <span className="text-sm text-white/60 font-mono">{formatTime(elapsed)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/70">
              <Users className="w-4 h-4" /> {viewers}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onStopLive(); }}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
              <X className="w-4 h-4" /> Annuler
            </button>
            <span className="text-sm font-bold text-white">Aperçu Live</span>
            <div />
          </>
        )}
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <video ref={videoRef} className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          playsInline muted autoPlay />

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <VideoOff className="w-16 h-16 text-white/20" />
            <p className="text-sm text-white/50">{error}</p>
          </div>
        )}

        {/* Title overlay */}
        {step === 'live' && (
          <div className="absolute bottom-4 left-4 right-56">
            <div className="inline-block bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm text-white font-semibold">
              {title || `Live de ${profile.username}`}
            </div>
          </div>
        )}

        {/* Live Chat overlay (broadcaster side) */}
        {step === 'live' && (
          <LiveChat
            broadcasterId={mySocketId}
            profile={profile}
            isOverlay
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 px-5 py-5"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        {step === 'live' && (
          <button onClick={() => { setIsPublic(p => { const next = !p; onUpdateLive?.(title, next); return next; }); }}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 rounded-xl mb-4 text-xs font-semibold transition-all"
            style={isPublic
              ? { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
            }>
            {isPublic ? '🌍 Public — visible dans Découvrir' : '🔒 Restreint — cliquer pour rendre public'}
          </button>
        )}
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <button onClick={toggleMute}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)' }}>
            {muted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          {/* Stop button */}
          <button onClick={stopLive}
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-sm
              shadow-xl transition-all active:scale-95"
            style={{ background: 'rgba(239,68,68,0.2)', border: '3px solid #ef4444' }}>
            <StopCircle className="w-8 h-8 text-red-400" />
          </button>

          {/* Cam on/off */}
          <button onClick={toggleCam}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: camOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)' }}>
            {camOff ? <VideoOff className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5 text-white" />}
          </button>
        </div>

        <p className="text-center text-xs text-white/30 mt-2">
          Appuie sur ⏹ pour arrêter le direct
        </p>
      </div>
    </div>
  );
}
