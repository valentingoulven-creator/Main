import { Play, Pencil, ExternalLink } from 'lucide-react';
import type { Track, UserProfile } from '../types';
import { SourceBadge, SpotifyLogo } from './SourceLogo';

interface Props {
  profile: UserProfile;
  track: Track | null;
  jamUrl?: string;
  onEdit: () => void;
}

export default function NowPlaying({ profile, track, jamUrl, onEdit }: Props) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ minHeight: 100 }}>
      {/* bg */}
      <div className="relative">
        {track?.albumArt ? (
          <div className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${track.albumArt})`, filter: 'blur(20px) brightness(0.4)' }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${profile.color}33, ${profile.color}11)` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,13,26,0.9), rgba(13,13,26,0.55))' }} />

        <div className="relative flex items-center gap-3.5 p-4">
          {/* Art */}
          {track?.albumArt ? (
            <img src={track.albumArt} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
          ) : profile.photos?.[0] ? (
            <img src={profile.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-lg"
              style={{ background: profile.color + '33', border: `1.5px solid ${profile.color}44` }}>
              {track ? '🎵' : profile.emoji}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {track ? (
              <>
                <div className="wave-bars mb-1.5" style={{ color: profile.color }}>
                  {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" />)}
                </div>
                <div className="text-sm font-bold text-white truncate leading-tight">{track.title}</div>
                {track.artist && <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>}
                <div className="mt-1.5"><SourceBadge source={track.source} size={13} /></div>
              </>
            ) : (
              <div>
                <div className="text-sm font-semibold text-white/60">Rien en cours…</div>
                <div className="text-xs text-white/30 mt-0.5">Partage ce que tu écoutes</div>
              </div>
            )}
          </div>

          <button onClick={onEdit}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/15 transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            {track ? <Pencil className="w-4 h-4 text-white/70" /> : <Play className="w-4 h-4 text-white/70" />}
          </button>
        </div>
      </div>

      {/* Jam strip */}
      {jamUrl && (
        <a href={jamUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(90deg, rgba(29,185,84,0.18), rgba(29,185,84,0.08))', borderTop: '1px solid rgba(29,185,84,0.2)', color: '#1DB954' }}>
          <SpotifyLogo size={13} className="flex-shrink-0" />
          <span className="truncate">Mon Jam Spotify est actif — Inviter</span>
          <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
        </a>
      )}
    </div>
  );
}
