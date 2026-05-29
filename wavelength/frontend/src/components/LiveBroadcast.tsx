import { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, X, Users, MicOff, Mic, VideoOff, Video, StopCircle } from 'lucide-react';
import type { UserProfile } from '../types';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface Props {
  profile: UserProfile;
  viewers: number;
  onStartLive: (title: string, isPublic: boolean) => void;
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
  profile, viewers,
  onStartLive, onUpdateLive, onStopLive,
  onSendOffer, onSendIce,
  onAnswerReceived, onIceReceived, onViewerJoined, onViewerLeft,
}: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const peersRef    = useRef<Map<string, RTCPeerConnection>>(new Map());

  const [step, setStep]         = useState<'idle' | 'preview' | 'live'>('idle');
  const [title, setTitle]       = useState('');
  const [muted, setMuted]       = useState(false);
  const [camOff, setCamOff]     = useState(false);
  const [facingMode] = useState<'user' | 'environment'>('user');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [elapsed, setElapsed]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  function goLive() {
    onStartLive(title.trim() || `Live de ${profile.username}`, isPublic);
    setStep('live');
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function stopLive() {
    onStopLive();
    streamRef.current?.getTracks().forEach(t => t.stop());
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('idle');
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

  if (step === 'idle') return (
    <button onClick={startPreview}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white
        transition-all active:scale-95 hover:opacity-90"
      style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
      <Radio className="w-4 h-4" />
      Démarrer un Live
    </button>
  );

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.7)' }}>
        {step === 'live' ? (
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
            <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setStep('idle'); }}
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
          <div className="absolute bottom-4 left-4 right-4">
            <div className="inline-block bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm text-white font-semibold">
              {title || `Live de ${profile.username}`}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 px-5 py-5"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        {step === 'preview' && (
          <>
            <input className="wl-input w-full rounded-xl px-4 py-2.5 text-sm mb-3"
              placeholder="Titre du live (optionnel)…"
              value={title} onChange={e => setTitle(e.target.value)} />
            {/* Public toggle */}
            <button onClick={() => setIsPublic(p => !p)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 transition-all"
              style={isPublic
                ? { background: 'rgba(139,92,246,0.2)', border: '1.5px solid rgba(139,92,246,0.5)' }
                : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
              }>
              <div className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-all duration-200 ${isPublic ? 'bg-violet-500' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow ${isPublic ? 'left-5' : 'left-1'}`} />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-white">{isPublic ? '🌍 Live public' : '🔒 Live privé (proximité seule)'}</div>
                <div className="text-xs text-white/40 mt-0.5">
                  {isPublic ? 'Visible dans l\'onglet Découvrir par tous' : 'Visible uniquement par les personnes à proximité'}
                </div>
              </div>
            </button>
          </>
        )}
        {step === 'live' && (
          /* Public toggle during live */
          <button onClick={() => { setIsPublic(p => { const next = !p; onUpdateLive?.(title, next); return next; }); }}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 rounded-xl mb-4 text-xs font-semibold transition-all"
            style={isPublic
              ? { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
            }>
            {isPublic ? '🌍 Public — visible dans Découvrir' : '🔒 Privé — cliquer pour rendre public'}
          </button>
        )}
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <button onClick={toggleMute}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)' }}>
            {muted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          {/* Main action */}
          {step === 'preview' ? (
            <button onClick={goLive}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-sm
                shadow-xl transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
              <Radio className="w-8 h-8" />
            </button>
          ) : (
            <button onClick={stopLive}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-sm
                shadow-xl transition-all active:scale-95"
              style={{ background: 'rgba(239,68,68,0.2)', border: '3px solid #ef4444' }}>
              <StopCircle className="w-8 h-8 text-red-400" />
            </button>
          )}

          {/* Cam on/off */}
          <button onClick={toggleCam}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: camOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)' }}>
            {camOff ? <VideoOff className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5 text-white" />}
          </button>
        </div>

        {step === 'preview' && (
          <p className="text-center text-xs text-white/30 mt-3">
            Appuie sur le bouton rouge pour démarrer le direct
          </p>
        )}
      </div>
    </div>
  );
}
