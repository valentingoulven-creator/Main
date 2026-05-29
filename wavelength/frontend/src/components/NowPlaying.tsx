import { Play, Pencil, ExternalLink } from 'lucide-react';
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

  function openJam() {
    const deepLink = jamUrl!.startsWith('spotify:')
      ? jamUrl!
      : `spotify:${jamUrl!.replace('https://open.spotify.com/', '').replace(/\//g, ':')}`;
    window.location.href = deepLink;
    setTimeout(() => { window.open(jamUrl, '_blank'); }, 600);
  }

  return (
    <div className="rounded-2xl overflow-hidden">
      {/* ── Main player card ── */}
      <div className="relative">
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
                <div className="mt-1.5"><SourceBadge source={track.source} size={13} /></div>
              </>
            ) : hasJam ? (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-bold" style={{ color: '#1DB954' }}>Jam Spotify actif</span>
                </div>
                <div className="text-xs text-white/40">Partage ce que tu écoutes dans le Jam</div>
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

      {/* ── Jam Spotify strip with button ── */}
      {hasJam && (
        <button
          onClick={openJam}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(90deg, rgba(29,185,84,0.18), rgba(29,185,84,0.08))',
            borderTop: '1px solid rgba(29,185,84,0.22)',
          }}
        >
          <SpotifyLogo size={16} className="flex-shrink-0" />
          <span className="text-xs font-black flex-1 text-left truncate" style={{ color: '#1DB954' }}>
            {track ? `Jam actif — ${track.title}` : 'Jam Spotify actif'}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-all hover:brightness-110"
            style={{ background: '#1DB954', color: '#fff' }}>
            Rejoindre <ExternalLink className="w-3 h-3" />
          </span>
        </button>
      )}
    </div>
  );
}
