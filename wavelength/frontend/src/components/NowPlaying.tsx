import { Play, Pencil, ExternalLink, Users } from 'lucide-react';
import type { Track, UserProfile } from '../types';
import { SourceBadge, SpotifyLogo } from './SourceLogo';

interface Props {
  profile: UserProfile;
  track: Track | null;
  jamUrl?: string;
  onEdit: () => void;
  onOpenSpotify?: () => void;
}

export default function NowPlaying({ profile, track, jamUrl, onEdit, onOpenSpotify }: Props) {
  const hasJam = !!jamUrl;

  return (
    <div className="rounded-2xl overflow-hidden">
      {/* ── Main player card ── */}
      <div className="relative">
        {/* Background blur */}
        {track?.albumArt ? (
          <div className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${track.albumArt})`, filter: 'blur(20px) brightness(0.4)' }} />
        ) : (
          <div className="absolute inset-0"
            style={{ background: hasJam
              ? 'linear-gradient(135deg, rgba(29,185,84,0.25), rgba(29,185,84,0.08))'
              : `linear-gradient(135deg, ${profile.color}33, ${profile.color}11)` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,13,26,0.9), rgba(13,13,26,0.55))' }} />

        <div className="relative flex items-center gap-3.5 p-4">
          {/* Artwork / avatar */}
          {track?.albumArt ? (
            <img src={track.albumArt} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
          ) : profile.photos?.[0] ? (
            <img src={profile.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-lg"
              style={{ background: hasJam ? 'rgba(29,185,84,0.2)' : profile.color + '33',
                       border: `1.5px solid ${hasJam ? 'rgba(29,185,84,0.4)' : profile.color + '44'}` }}>
              {track ? '🎵' : hasJam ? <SpotifyLogo size={28} /> : profile.emoji}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {track ? (
              <>
                <div className="wave-bars mb-1.5" style={{ color: hasJam ? '#1DB954' : profile.color }}>
                  {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" />)}
                </div>
                <div className="text-sm font-bold text-white truncate leading-tight">{track.title}</div>
                {track.artist && <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>}
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <SourceBadge source={track.source} size={13} />
                  {hasJam && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(29,185,84,0.15)', color: '#1DB954' }}>
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Jam actif
                    </span>
                  )}
                </div>
              </>
            ) : hasJam ? (
              /* JAM actif mais pas de morceau partagé */
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-bold" style={{ color: '#1DB954' }}>Jam Spotify actif</span>
                </div>
                <div className="text-xs text-white/40 mt-0.5">Partage ce que tu écoutes dans le Jam</div>
                <button onClick={onOpenSpotify}
                  className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 hover:opacity-90 flex items-center gap-1.5"
                  style={{ background: '#1DB954', color: '#fff' }}>
                  <SpotifyLogo size={12} /> Partager le morceau
                </button>
              </div>
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

      {/* ── JAM active banner ── */}
      {hasJam && (
        <div className="flex items-center"
          style={{ background: 'linear-gradient(90deg, rgba(29,185,84,0.2), rgba(29,185,84,0.08))', borderTop: '1px solid rgba(29,185,84,0.25)' }}>
          {/* Join link */}
          <a href={jamUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center gap-2 px-3 py-2.5 transition-all hover:opacity-90">
            <SpotifyLogo size={14} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black truncate" style={{ color: '#1DB954' }}>
                🎉 Jam actif — {track ? `${track.title}` : 'Rejoins l\'écoute !'}
              </div>
              <div className="text-xs text-white/35 truncate">Appuie pour rejoindre le Jam</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" style={{ color: '#1DB954' }} />
          </a>
          {/* Invite button */}
          <button onClick={() => { navigator.clipboard.writeText(jamUrl); }}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-bold transition-all hover:opacity-90 border-l"
            style={{ color: '#1DB954', borderColor: 'rgba(29,185,84,0.2)' }}>
            <Users className="w-3.5 h-3.5" />
            Inviter
          </button>
        </div>
      )}
    </div>
  );
}
