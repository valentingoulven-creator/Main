import { Play, Pencil } from 'lucide-react';
import type { Track, UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  track: Track | null;
  onEdit: () => void;
}

export default function NowPlaying({ profile, track, onEdit }: Props) {
  const sourceCls = track?.source === 'spotify' ? 'badge-spotify' : track?.source === 'youtube' ? 'badge-youtube' : 'badge-manual';
  const sourceLabel = track?.source === 'spotify' ? '🟢 Spotify' : track?.source === 'youtube' ? '🔴 YouTube' : '✎ Manuel';

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 120 }}>
      {/* Album art background blur */}
      {track?.albumArt && (
        <div className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: `url(${track.albumArt})`, filter: 'blur(20px) brightness(0.4)' }} />
      )}
      {!track?.albumArt && (
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${profile.color}33, ${profile.color}11)` }} />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,13,26,0.85), rgba(13,13,26,0.5))' }} />

      <div className="relative flex items-center gap-4 p-4">
        {/* Album art or avatar */}
        {track?.albumArt ? (
          <img src={track.albumArt} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-lg" />
        ) : (
          <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-lg"
            style={{ background: profile.color + '33', border: `1.5px solid ${profile.color}44` }}>
            {track ? '🎵' : profile.emoji}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {track ? (
            <>
              {/* Waveform */}
              <div className="wave-bars mb-1.5" style={{ color: profile.color }}>
                {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" />)}
              </div>
              <div className="text-sm font-bold text-white truncate leading-tight">{track.title}</div>
              {track.artist && (
                <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>
              )}
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1.5 ${sourceCls}`}>
                {sourceLabel}
              </span>
            </>
          ) : (
            <div>
              <div className="text-sm font-semibold text-white/60">Rien en cours…</div>
              <div className="text-xs text-white/30 mt-0.5">Partage ce que tu écoutes</div>
            </div>
          )}
        </div>

        <button onClick={onEdit}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
            hover:bg-white/15 transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {track ? <Pencil className="w-4 h-4 text-white/70" /> : <Play className="w-4 h-4 text-white/70" />}
        </button>
      </div>
    </div>
  );
}
