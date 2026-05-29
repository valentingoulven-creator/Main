import { MessageCircle, ExternalLink, Users } from 'lucide-react';
import type { NearbyUser } from '../types';
import { SpotifyLogo, YouTubeLogo, ManualMusicLogo } from './SourceLogo';

interface Props {
  user: NearbyUser;
  onClick: () => void;
  onChat: () => void;
}

function formatDist(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

const STATUS_DOT: Record<string, string> = {
  available: '#10b981',
  busy:      '#f59e0b',
  dnd:       '#ef4444',
};

export default function NearbyCard({ user, onClick, onChat }: Props) {
  const { track } = user;
  const canChat = user.chatStatus !== 'dnd';
  const statusDot = STATUS_DOT[user.chatStatus ?? 'available'];

  return (
    <div
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 animate-fade-in
        hover:bg-white/5 active:scale-[0.98] cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.photos && user.photos[0] ? (
            <img src={user.photos[0]} className="w-11 h-11 rounded-full object-cover shadow-md" />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md"
              style={{ background: user.color }}>
              {user.emoji}
            </div>
          )}
          {track && (
            <span className="absolute -inset-1 rounded-full animate-ping-slow opacity-25"
              style={{ background: user.color }} />
          )}
          {/* Chat status dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: statusDot, borderColor: '#0d0d1a' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white truncate">{user.username}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
              style={{ background: user.color + '22', color: user.color, fontSize: 10 }}>
              {formatDist(user.distance)}
            </span>
            {/* Jam badge */}
            {user.jamUrl && (
              <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium badge-spotify flex items-center gap-0.5">
                <SpotifyLogo size={10} /> Jam
              </span>
            )}
          </div>

          {track ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Waveform */}
              <div className="wave-bars flex-shrink-0" style={{ color: user.color, height: 12 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" />)}
              </div>
              {/* Platform logo — prominent */}
              {track.source === 'spotify'
                ? <SpotifyLogo size={14} className="flex-shrink-0" />
                : track.source === 'youtube'
                ? <YouTubeLogo size={14} className="flex-shrink-0" />
                : <ManualMusicLogo size={14} className="flex-shrink-0" />}
              <span className="text-xs text-white/65 truncate font-medium">{track.title}</span>
              {track.artist && (
                <span className="text-xs text-white/30 truncate hidden md:inline">· {track.artist}</span>
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

        {/* External link */}
        {track?.url && (
          <a href={track.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
          </a>
        )}

        {/* Chat button */}
        <button
          onClick={e => { e.stopPropagation(); if (canChat) onChat(); }}
          disabled={!canChat}
          title={canChat ? 'Discuter' : 'Ne pas déranger'}
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
            text-white transition-all duration-200
            ${canChat ? 'hover:opacity-90 active:scale-95 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
          style={{ background: canChat ? user.color : 'rgba(255,255,255,0.06)' }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Jam strip */}
      {user.jamUrl && (
        <a href={user.jamUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(90deg, rgba(29,185,84,0.15), rgba(29,185,84,0.08))', borderTop: '1px solid rgba(29,185,84,0.15)', color: '#1DB954' }}>
          <SpotifyLogo size={13} />
          <Users className="w-3 h-3" />
          Rejoindre le Jam Spotify
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      )}
    </div>
  );
}
