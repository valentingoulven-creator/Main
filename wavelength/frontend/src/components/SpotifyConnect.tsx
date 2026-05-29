import { useState, useEffect, useRef } from 'react';
import { X, Link2, Loader2, CheckCircle2, ExternalLink, Music2, Users, Copy, Check } from 'lucide-react';
import { SpotifyLogo } from './SourceLogo';
import type { Track } from '../types';

interface OEmbed { title: string; author_name?: string; thumbnail_url?: string }

// ─── Detect Spotify URL type ──────────────────────────────────────────────────

function isJamUrl(url: string) { return url.includes('spotify.com/jam'); }

// ─── JAM section ─────────────────────────────────────────────────────────────

function JamSection({ jamUrl, onJamChange }: { jamUrl: string; onJamChange: (url: string) => void }) {
  const [input, setInput]   = useState(jamUrl);
  const [copied, setCopied] = useState(false);
  const [step, setStep]     = useState<'idle' | 'guide' | 'active'>(jamUrl ? 'active' : 'idle');

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    if (isJamUrl(pasted)) {
      e.preventDefault();
      setInput(pasted.trim());
      onJamChange(pasted.trim());
      setStep('active');
    }
  }

  function handleChange(v: string) {
    setInput(v);
    if (isJamUrl(v)) { onJamChange(v.trim()); setStep('active'); }
    else if (!v) { onJamChange(''); setStep('idle'); }
  }

  function copyJam() {
    navigator.clipboard.writeText(input).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function deactivate() { setInput(''); onJamChange(''); setStep('idle'); }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(29,185,84,0.25)' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3"
        style={{ background: 'rgba(29,185,84,0.1)', borderBottom: '1px solid rgba(29,185,84,0.15)' }}>
        <SpotifyLogo size={20} />
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: '#1DB954' }}>Spotify Jam</div>
          <div className="text-xs text-white/40">
            {step === 'active' ? '🟢 Actif — les gens autour peuvent rejoindre' : 'Écoute en groupe synchronisée'}
          </div>
        </div>
        {step === 'active' && (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(29,185,84,0.2)', color: '#1DB954' }}>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> ACTIF
          </span>
        )}
      </div>

      <div className="p-4">
        {step === 'idle' && (
          <>
            {/* Step-by-step guide */}
            <div className="space-y-2.5 mb-4">
              {[
                { n: '1', text: 'Ouvre Spotify et lance une musique', icon: '🎵' },
                { n: '2', text: 'Tape sur l\'icône en bas à droite de la lecture', icon: '👥' },
                { n: '3', text: 'Sélectionne "Démarrer un Jam"', icon: '🎉' },
                { n: '4', text: 'Partage le lien et colle-le ici', icon: '🔗' },
              ].map(({ n, text, icon }) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 text-white"
                    style={{ background: '#1DB954' }}>{n}</div>
                  <span className="text-xs text-white/60">{icon} {text}</span>
                </div>
              ))}
            </div>

            <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl mb-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#1DB954' }}>
              <SpotifyLogo size={16} /> Ouvrir Spotify
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </>
        )}

        {/* JAM link input */}
        <div>
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
            {step === 'active' ? 'Lien de ton Jam' : 'Colle le lien du Jam ici'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SpotifyLogo size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input className="wl-input w-full rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono"
                placeholder="open.spotify.com/jam/…"
                value={input}
                onChange={e => handleChange(e.target.value)}
                onPaste={handlePaste}
              />
            </div>
            {step === 'active' && (
              <button onClick={copyJam} title="Copier"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={copied ? { background: 'rgba(16,185,129,0.2)', color: '#10b981' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

            {/* Validate button — shown whenever there's a URL that hasn't been confirmed yet */}
          {input.trim() && step !== 'active' && (
            <button
              onClick={() => { onJamChange(input.trim()); setStep('active'); }}
              className="mt-2 w-full py-3 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90 animate-fade-in shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1DB954, #158a3e)', boxShadow: '0 4px 16px rgba(29,185,84,0.35)' }}>
              <CheckCircle2 className="w-4 h-4" /> Valider et activer le Jam
            </button>
          )}

          {step === 'active' && (
            <button onClick={deactivate}
              className="mt-2 text-xs text-red-400/60 hover:text-red-400 transition-colors w-full text-center">
              Désactiver le Jam
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  currentTrack: Track | null;
  jamUrl?: string;
  onShare: (track: Track) => void;
  onJamUpdate?: (jamUrl: string) => void;
  onClose: () => void;
}

export default function SpotifyConnect({ currentTrack, jamUrl = '', onShare, onJamUpdate, onClose }: Props) {
  const [url, setUrl]       = useState(currentTrack?.source === 'spotify' ? currentTrack.url ?? '' : '');
  const [track, setTrack]   = useState<Track | null>(currentTrack?.source === 'spotify' ? currentTrack : null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [shared, setShared] = useState(false);
  const [activeJamUrl, setActiveJamUrl] = useState(jamUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const clean = url.trim();
    if (!clean.includes('spotify.com') || clean.length < 20) { setTrack(null); setError(''); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError(''); setTrack(null);
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(clean)}`);
        if (!res.ok) throw new Error('Lien non reconnu — vérifie qu\'il s\'agit d\'un lien Spotify.');
        const data: OEmbed = await res.json();
        setTrack({ title: data.title, artist: data.author_name, albumArt: data.thumbnail_url, source: 'spotify', url: clean });
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur inconnue'); }
      finally { setLoading(false); }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [url]);

  function handleShare() {
    if (!track) return;
    onShare(track);
    setShared(true);
    setTimeout(onClose, 900);
  }

  function handleJamChange(newJamUrl: string) {
    setActiveJamUrl(newJamUrl);
    onJamUpdate?.(newJamUrl);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes('spotify.com')) { e.preventDefault(); setUrl(pasted.trim()); }
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up overflow-y-auto"
        style={{ background: 'rgba(14,14,24,0.99)', border: '1px solid rgba(255,255,255,0.12)', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'rgba(29,185,84,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1DB954' }}>
            <SpotifyLogo size={24} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Spotify</div>
            <div className="text-xs text-white/40">Partage ta musique + Jam</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Section 1: Partage de morceau ── */}
          <div>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Music2 className="w-3.5 h-3.5" /> Partager ce que j'écoute
            </div>

            <div className="relative mb-3">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input className="wl-input w-full rounded-xl pl-10 pr-10 py-3 text-sm"
                placeholder="Colle un lien Spotify (track, album…)"
                value={url} onChange={e => setUrl(e.target.value)} onPaste={handlePaste} />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-green-400" />}
              {!loading && url && (
                <button onClick={() => { setUrl(''); setTrack(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10">
                  <X className="w-3.5 h-3.5 text-white/30" />
                </button>
              )}
            </div>

            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

            {track && (
              <div className="flex gap-3 p-3 rounded-2xl mb-3 animate-pop-in"
                style={{ background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.2)' }}>
                {track.albumArt
                  ? <img src={track.albumArt} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md" />
                  : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(29,185,84,0.2)' }}><Music2 className="w-5 h-5 text-green-400" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{track.title}</div>
                  {track.artist && <div className="text-xs text-white/50 truncate">{track.artist}</div>}
                  <div className="flex items-center gap-1 mt-1">
                    <SpotifyLogo size={11} /><span className="text-xs font-semibold" style={{ color: '#1DB954' }}>Prêt à partager</span>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleShare} disabled={!track || shared}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 active:scale-95 hover:opacity-90"
              style={{ background: shared ? 'rgba(16,185,129,0.8)' : '#1DB954' }}>
              {shared
                ? <><CheckCircle2 className="w-4 h-4" /> Partagé ! 🎵</>
                : <><SpotifyLogo size={16} /> Partager ce morceau</>}
            </button>

            {currentTrack?.source === 'spotify' && !shared && (
              <button onClick={() => { onShare({ title: '', source: 'manual' }); onClose(); }}
                className="w-full mt-1.5 py-1.5 text-xs text-red-400/50 hover:text-red-400 transition-colors text-center">
                Arrêter de partager
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

          {/* ── Section 2: Spotify Jam ── */}
          <div>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Spotify Jam — écoute en groupe
            </div>
            <JamSection jamUrl={activeJamUrl} onJamChange={handleJamChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
