import { useState, useEffect, useRef } from 'react';
import { Link2, X, Send, Loader2, ExternalLink } from 'lucide-react';
import type { Track } from '../types';
import { SpotifyLogo, YouTubeLogo, SourceBadge } from './SourceLogo';

interface OEmbedResult { title: string; author_name?: string; thumbnail_url?: string }

function detectSource(url: string): 'spotify' | 'youtube' | null {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

function getYtId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m?.[1] ?? null;
}

interface Props {
  currentTrack: Track | null;
  onSave: (track: Track | null) => void;
  onClose: () => void;
  accentColor: string;
}

export default function TrackInput({ currentTrack, onSave, onClose, accentColor }: Props) {
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentTrack?.source !== 'manual') {
      setUrl(currentTrack?.url ?? '');
    } else {
      setMode('manual');
      setArtist(currentTrack.artist ?? '');
      setTitle(currentTrack.title ?? '');
    }
  }, [currentTrack]);

  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    const src = detectSource(url);
    if (!src || url.length < 20) { setPreview(null); setError(''); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError(''); setPreview(null);
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error('Lien non reconnu');
        const data: OEmbedResult = await res.json();
        let albumArt = data.thumbnail_url;
        if (src === 'youtube') {
          const ytId = getYtId(url);
          if (ytId) albumArt = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        }
        setPreview({ title: data.title, artist: data.author_name, albumArt, source: src, url });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => { if (debounceRef.current !== null) clearTimeout(debounceRef.current); };
  }, [url]);

  function handleSave() {
    if (mode === 'url' && preview) onSave(preview);
    else if (mode === 'manual' && title.trim()) onSave({ title: title.trim(), artist: artist.trim() || undefined, source: 'manual' });
    onClose();
  }

  const canSave = mode === 'url' ? !!preview : !!title.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong rounded-3xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Qu'est-ce que tu écoutes ?</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['url', 'manual'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200
                ${mode === m ? 'text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
              style={mode === m ? { background: accentColor } : {}}>
              {m === 'url' ? '🔗 Lien Spotify / YouTube' : '✏️ Saisir manuellement'}
            </button>
          ))}
        </div>

        {mode === 'url' ? (
          <div>
            {/* Platform logos hint */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <SpotifyLogo size={16} /> <span>open.spotify.com/track/…</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <YouTubeLogo size={16} /> <span>youtu.be/…</span>
              </div>
            </div>

            <div className="relative mb-4">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                className="wl-input w-full rounded-xl pl-10 pr-10 py-3 text-sm"
                placeholder="Colle ton lien ici…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                autoFocus
              />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />}
              {!loading && url && (
                <button onClick={() => { setUrl(''); setPreview(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10">
                  <X className="w-3.5 h-3.5 text-white/40" />
                </button>
              )}
            </div>
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            {preview && <TrackPreview track={preview} />}
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <input className="wl-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Titre du morceau *"
              value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            <input className="wl-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Artiste (optionnel)"
              value={artist} onChange={e => setArtist(e.target.value)} />
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {currentTrack && (
            <button onClick={() => { onSave(null); onClose(); }}
              className="py-3 px-4 rounded-xl text-xs font-semibold text-red-400
                border border-red-400/20 hover:bg-red-400/10 transition-colors">
              Arrêter
            </button>
          )}
          <button onClick={handleSave} disabled={!canSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #ec4899)` }}>
            <Send className="w-4 h-4" />
            Partager
          </button>
        </div>
      </div>
    </div>
  );
}

function TrackPreview({ track }: { track: Track }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4 animate-pop-in"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex gap-3 p-3">
        {track.albumArt ? (
          <img src={track.albumArt} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}>🎵</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">{track.title}</div>
          {track.artist && <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>}
          <div className="mt-1.5">
            <SourceBadge source={track.source} size={13} />
          </div>
        </div>
        {track.url && (
          <a href={track.url} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 p-2 rounded-xl hover:bg-white/10 transition-colors self-center">
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
          </a>
        )}
      </div>
    </div>
  );
}
