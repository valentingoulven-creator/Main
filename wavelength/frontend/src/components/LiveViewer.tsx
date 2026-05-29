import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Users, Volume2, VolumeX, Heart, MessageSquare } from 'lucide-react';
import type { NearbyUser, UserProfile } from '../types';
import { DonateUser } from './DonateModal';
import LiveChat from './LiveChat';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface Props {
  broadcaster: NearbyUser;
  myId: string;
  profile: UserProfile;
  onClose: () => void;
  onSendDM?: (broadcaster: NearbyUser) => void;
  onJoinLive:      (broadcasterId: string) => void;
  onLeaveLive:     (broadcasterId: string) => void;
  onSendAnswer:    (broadcasterId: string, answer: RTCSessionDescriptionInit) => void;
  onSendIce:       (to: string, candidate: RTCIceCandidateInit) => void;
  onOfferReceived: (cb: (from: string, offer: RTCSessionDescriptionInit) => void) => void;
  onIceReceived:   (cb: (from: string, candidate: RTCIceCandidateInit) => void) => void;
  onLiveEnded:     (cb: (broadcasterId: string) => void) => void;
}

export default function LiveViewer({
  broadcaster, profile, onClose, onSendDM,
  onJoinLive, onLeaveLive,
  onSendAnswer, onSendIce,
  onOfferReceived, onIceReceived, onLiveEnded,
}: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus]   = useState<'connecting' | 'live' | 'ended'>('connecting');
  const [muted, setMuted]     = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  useEffect(() => {
    onJoinLive(broadcaster.id);

    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    pc.ontrack = e => {
      if (videoRef.current) {
        videoRef.current.srcObject = e.streams[0];
        videoRef.current.play().catch(() => {});
        setStatus('live');
      }
    };

    pc.onicecandidate = e => { if (e.candidate) onSendIce(broadcaster.id, e.candidate.toJSON()); };

    return () => {
      onLeaveLive(broadcaster.id);
      pc.close();
    };
  }, [broadcaster.id]);

  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    if (from !== broadcaster.id || !pcRef.current) return;
    await pcRef.current.setRemoteDescription(offer);
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    onSendAnswer(broadcaster.id, answer);
  }, [broadcaster.id, onSendAnswer]);

  const handleIce = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    if (from !== broadcaster.id || !pcRef.current) return;
    await pcRef.current.addIceCandidate(candidate);
  }, [broadcaster.id]);

  const handleLiveEnded = useCallback((broadcasterId: string) => {
    if (broadcasterId === broadcaster.id) setStatus('ended');
  }, [broadcaster.id]);

  useEffect(() => { onOfferReceived(handleOffer); }, [onOfferReceived, handleOffer]);
  useEffect(() => { onIceReceived(handleIce);     }, [onIceReceived,   handleIce]);
  useEffect(() => { onLiveEnded(handleLiveEnded); }, [onLiveEnded,     handleLiveEnded]);

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.7)' }}>
        <div className="flex items-center gap-2.5">
          {broadcaster.photos?.[0] ? (
            <img src={broadcaster.photos[0]} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
              style={{ background: broadcaster.color }}>{broadcaster.emoji}</div>
          )}
          <div>
            <div className="text-sm font-bold text-white">{broadcaster.username}</div>
            <div className="flex items-center gap-1.5">
              {status === 'live' && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> EN DIRECT
                </span>
              )}
              {status === 'connecting' && (
                <span className="text-xs text-white/40">Connexion…</span>
              )}
              {status === 'ended' && (
                <span className="text-xs text-white/40">Live terminé</span>
              )}
              {broadcaster.viewers !== undefined && status === 'live' && (
                <span className="flex items-center gap-1 text-xs text-white/40 ml-1">
                  <Users className="w-3 h-3" /> {broadcaster.viewers}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Private message */}
          {onSendDM && (
            <button onClick={() => { onSendDM(broadcaster); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <MessageSquare className="w-3.5 h-3.5" /> Message privé
            </button>
          )}

          {/* Donate during live */}
          <button onClick={() => setShowDonate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
            <Heart className="w-3.5 h-3.5" /> Don
          </button>
          <button onClick={() => setMuted(m => !m)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            {muted ? <VolumeX className="w-4 h-4 text-white/60" /> : <Volume2 className="w-4 h-4 text-white/60" />}
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-contain" playsInline muted={muted} />

        {status === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: broadcaster.color, borderTopColor: 'transparent' }} />
            <p className="text-sm text-white/50">Connexion au live…</p>
          </div>
        )}

        {status === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-4xl">📡</div>
            <p className="text-base font-bold text-white/60">{broadcaster.username} a terminé le live</p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: broadcaster.color }}>
              Fermer
            </button>
          </div>
        )}

        {/* Title */}
        {broadcaster.liveTitle && status === 'live' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="inline-block bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm text-white font-semibold">
              {broadcaster.liveTitle}
            </div>
          </div>
        )}
      </div>
      {/* Live chat overlay */}
      <LiveChat
        broadcasterId={broadcaster.id}
        profile={profile}
        isOverlay
      />

      {/* Donate modal */}
      {showDonate && (
        <DonateUser user={broadcaster as NearbyUser} onClose={() => setShowDonate(false)} />
      )}
    </div>
  );
}
