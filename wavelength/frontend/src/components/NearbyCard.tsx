import { ExternalLink } from 'lucide-react';
import type { NearbyUser } from '../types';

interface Props {
  user: NearbyUser;
  onClick: () => void;
}

function formatDist(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function NearbyCard({ user, onClick }: Props) {
  const { track } = user;
  const sourceCls = track?.source === 'spotify' ? 'badge-spotify' : track?.source === 'youtube' ? 'badge-youtube' : 'badge-manual';
  const sourceLabel = track?.source === 'spotify' ? '🟢' : track?.source === 'youtube' ? '🔴' : '✎';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-3.5 transition-all duration-200 animate-fade-in
        hover:bg-white/8 active:scale-[0.98]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold shadow-md"
            style={{ background: user.color }}>
            {user.emoji}
          </div>
          {/* Pulsing ring when playing */}
          {track && (
            <span className="absolute -inset-1 rounded-full animate-ping-slow opacity-30"
              style={{ background: user.color }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white truncate">{user.username}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: user.color + '22', color: user.color, fontSize: '10px' }}>
              {formatDist(user.distance)}
            </span>
          </div>
          {track ? (
            <div className="flex items-center gap-1.5">
              <div className="wave-bars" style={{ color: user.color, height: 14 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" style={{ height: '14px' }} />)}
              </div>
              <span className="text-xs text-white/60 truncate">{track.title}</span>
              {track.artist && <span className="text-xs text-white/30 truncate">· {track.artist}</span>}
              <span className={`text-xs ml-auto flex-shrink-0 ${sourceCls} px-1.5 py-0.5 rounded-full`}>
                {sourceLabel}
              </span>
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
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
              hover:bg-white/15 transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <ExternalLink className="w-3.5 h-3.5 text-white/50" />
          </a>
        )}
      </div>
    </button>
  );
}
