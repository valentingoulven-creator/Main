import { useState, useEffect, useRef } from 'react';
import { X, Link2, Loader2, CheckCircle2, ExternalLink, RefreshCw, Music2 } from 'lucide-react';
import { SpotifyLogo } from './SourceLogo';
import type { Track } from '../types';

interface OEmbed { title: string; author_name?: string; thumbnail_url?: string }

interface Props {
  currentTrack: Track | null;
  onShare: (track: Track) => void;
  onClose: () => void;
}

const STEPS = [
  { icon: '1️⃣', text: 'Ouvre Spotify sur ton téléphone ou ordinateur' },
  { icon: '2️⃣', text: 'Lance la chanson que tu veux partager' },
  { icon: '3️⃣', text: 'Appuie sur ⋯ → Partager → Copier le lien' },
  { icon: '4️⃣', text: 'Colle le lien ci-dessous' },
];

export default function SpotifyConnect({ currentTrack, onShare, onClose }: Props) {
  const [url, setUrl]         = useState(currentTrack?.source === 'spotify' ? currentTrack.url ?? '' : '');
  const [track, setTrack]     = useState<Track | null>(currentTrack?.source === 'spotify' ? currentTrack : null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [shared, setShared]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const clean = url.trim();
    if (!clean.includes('spotify.com') || clean.length < 20) {
      setTrack(null); setError(''); return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError(''); setTrack(null);
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(clean)}`);
        if (!res.ok) throw new Error('Lien non reconnu — vérifie qu\'il s\'agit d\'un lien Spotify.');
        const data: OEmbed = await res.json();
        setTrack({
          title:    data.title,
          artist:   data.author_name,
          albumArt: data.thumbnail_url,
          source:   'spotify',
          url:      clean,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [url]);

  function handleShare() {
    if (!track) return;
    onShare(track);
    setShared(true);
    setTimeout(onClose, 900);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes('spotify.com')) {
      e.preventDefault();
      setUrl(pasted.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'rgba(29,185,84,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#1DB954' }}>
            <SpotifyLogo size={24} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Partager depuis Spotify</div>
            <div className="text-xs text-white/40">Aucun compte développeur requis</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5">
          {/* How to */}
          <div className="rounded-2xl p-3.5 mb-4"
            style={{ background: 'rgba(29,185,84,0.06)', border: '1px solid rgba(29,185,84,0.15)' }}>
            <div className="space-y-2">
              {STEPS.map(({ icon, text }) => (
                <div key={icon} className="flex items-start gap-2.5 text-xs text-white/55">
                  <span className="flex-shrink-0 leading-tight">{icon}</span>
                  <span className="leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
            <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 mt-3 text-xs font-semibold transition-all hover:opacity-80"
              style={{ color: '#1DB954' }}>
              <ExternalLink className="w-3.5 h-3.5" />
              Ouvrir Spotify
            </a>
          </div>

          {/* URL input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Lien Spotify
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                className="wl-input w-full rounded-xl pl-10 pr-10 py-3 text-sm"
                placeholder="https://open.spotify.com/track/…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onPaste={handlePaste}
                autoFocus
              />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-green-400" />}
              {!loading && url && (
                <button onClick={() => { setUrl(''); setTrack(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10">
                  <X className="w-3.5 h-3.5 text-white/30" />
                </button>
              )}
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          {/* Track preview */}
          {track && (
            <div className="rounded-2xl overflow-hidden mb-4 animate-pop-in"
              style={{ background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.2)' }}>
              <div className="flex gap-3 p-3">
                {track.albumArt ? (
                  <img src={track.albumArt} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(29,185,84,0.2)' }}>
                    <Music2 className="w-6 h-6 text-green-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="text-sm font-bold text-white truncate leading-tight">{track.title}</div>
                  {track.artist && <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <SpotifyLogo size={12} />
                    <span className="text-xs font-semibold" style={{ color: '#1DB954' }}>Prêt à partager</span>
                  </div>
                </div>
                <a href={track.url} target="_blank" rel="noopener noreferrer"
                  className="self-center p-1.5 rounded-xl hover:bg-white/10 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                </a>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!track && !loading && !url && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-white/25 mb-4">
              <SpotifyLogo size={14} />
              <span>En attente du lien…</span>
            </div>
          )}

          {/* CTA */}
          <button onClick={handleShare} disabled={!track || shared}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2
              transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 hover:opacity-90 shadow-lg"
            style={{ background: shared ? 'rgba(16,185,129,0.8)' : '#1DB954' }}>
            {shared
              ? <><CheckCircle2 className="w-4 h-4" /> Partagé avec les gens autour de toi !</>
              : <><SpotifyLogo size={18} /> Partager ce morceau</>
            }
          </button>

          {/* Remove */}
          {currentTrack?.source === 'spotify' && !shared && (
            <button onClick={() => { onShare({ title: '', source: 'manual' }); onClose(); }}
              className="w-full mt-2 py-2 text-xs text-red-400/60 hover:text-red-400 transition-colors text-center">
              Arrêter de partager Spotify
            </button>
          )}

          {/* Refresh tip */}
          <div className="flex items-center gap-1.5 mt-3 text-xs text-white/20 justify-center">
            <RefreshCw className="w-3 h-3" />
            Reviens coller un nouveau lien quand tu changes de morceau
          </div>
        </div>
      </div>
    </div>
  );
}
