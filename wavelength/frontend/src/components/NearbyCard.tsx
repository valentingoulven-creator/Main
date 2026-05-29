import { MessageCircle, ExternalLink } from 'lucide-react';
import type { NearbyUser, ChatStatus } from '../types';
import { SpotifyLogo, YouTubeLogo, ManualMusicLogo } from './SourceLogo';

interface Props {
  user: NearbyUser;
  onClick: () => void;
  onChat: () => void;
  myChatStatus?: ChatStatus;
}

function formatDist(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

const CHAT_STATUS_CONFIG: Record<ChatStatus, { label: string; dot: string; btnStyle: string; disabled: boolean }> = {
  available: { label: 'Discuter',      dot: '#10b981', btnStyle: '',        disabled: false },
  busy:      { label: 'Occupé',        dot: '#f59e0b', btnStyle: 'opacity-70', disabled: false },
  dnd:       { label: 'Indispo',       dot: '#ef4444', btnStyle: 'opacity-40', disabled: true },
};

function SourceIcon({ source }: { source: 'spotify' | 'youtube' | 'manual' }) {
  if (source === 'spotify') return <SpotifyLogo size={13} />;
  if (source === 'youtube') return <YouTubeLogo size={13} />;
  return <ManualMusicLogo size={13} />;
}

export default function NearbyCard({ user, onClick, onChat }: Props) {
  const { track } = user;
  const chatCfg = CHAT_STATUS_CONFIG[user.chatStatus ?? 'available'];
  const canChat = !chatCfg.disabled;

  return (
    <div
      className="w-full text-left rounded-2xl p-3.5 transition-all duration-200 animate-fade-in cursor-pointer
        hover:bg-white/5 active:scale-[0.98]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with chat status dot */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold shadow-md"
            style={{ background: user.color }}>
            {user.emoji}
          </div>
          {/* Pulsing ring when playing */}
          {track && (
            <span className="absolute -inset-1 rounded-full animate-ping-slow opacity-25"
              style={{ background: user.color }} />
          )}
          {/* Chat status dot */}
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: chatCfg.dot, borderColor: '#0d0d1a' }}
            title={chatCfg.label}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white truncate">{user.username}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
              style={{ background: user.color + '22', color: user.color, fontSize: 10 }}>
              {formatDist(user.distance)}
            </span>
          </div>
          {track ? (
            <div className="flex items-center gap-1.5">
              {/* Waveform */}
              <div className="wave-bars flex-shrink-0" style={{ color: user.color, height: 12 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" />)}
              </div>
              {/* Source icon */}
              <SourceIcon source={track.source} />
              <span className="text-xs text-white/60 truncate">{track.title}</span>
              {track.artist && (
                <span className="text-xs text-white/30 truncate hidden sm:inline">· {track.artist}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-white/25">Rien en écoute…</span>
          )}
        </div>

        {/* Album art */}
        {track?.albumArt && (
          <img src={track.albumArt} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm" />
        )}

        {/* Open track externally */}
        {track?.url && (
          <a href={track.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
              hover:bg-white/15 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
          </a>
        )}

        {/* Chat button */}
        <button
          onClick={e => { e.stopPropagation(); if (canChat) onChat(); }}
          disabled={!canChat}
          title={chatCfg.label}
          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl
            text-xs font-semibold text-white transition-all duration-200
            ${canChat ? 'hover:opacity-90 active:scale-95 cursor-pointer' : 'cursor-not-allowed'}
            ${chatCfg.btnStyle}`}
          style={{ background: canChat ? user.color : 'rgba(255,255,255,0.06)' }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{chatCfg.label}</span>
        </button>
      </div>
    </div>
  );
}
