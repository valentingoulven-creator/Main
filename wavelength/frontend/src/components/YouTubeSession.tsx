import { useState, useEffect, useRef } from 'react';
import { X, Users, Copy, Check, ExternalLink, Radio, StopCircle, Link2, Loader2 } from 'lucide-react';
import { YouTubeLogo } from './SourceLogo';
import type { UserProfile, NearbyUser } from '../types';
import LiveChat from './LiveChat';

// ─── YouTube IFrame API types ─────────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: object) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(t: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

function loadYTApi(): Promise<void> {
  return new Promise(resolve => {
    if (window.YT?.Player) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = resolve;
  });
}

function getVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return m?.[1] ?? null;
}

// ─── Setup modal ──────────────────────────────────────────────────────────────

interface SetupProps {
  onStart: (videoId: string, title: string, videoTitle: string) => void;
  onClose: () => void;
  accentColor: string;
}

export function YouTubeSessionSetup({ onStart, onClose }: SetupProps) {
  const [url, setUrl]     = useState('');
  const [title, setTitle] = useState('');
  const [meta, setMeta]   = useState<{ title: string; thumbnail: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const id = getVideoId(url);
    if (!id) { setMeta(null); setError(''); return; }
    debRef.current = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch(`/api/oembed?url=https://www.youtube.com/watch?v=${id}`);
        if (!res.ok) throw new Error('Vidéo non trouvée');
        const d = await res.json();
        setMeta({ title: d.title, thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg` });
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur'); }
      finally { setLoading(false); }
    }, 500);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [url]);

  function handleStart() {
    const id = getVideoId(url);
    if (!id) return;
    onStart(id, title.trim() || `Session YouTube`, meta?.title ?? '');
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.99)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'rgba(255,0,0,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: '#FF0000' }}>
            <YouTubeLogo size={26} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Session d'écoute YouTube</div>
            <div className="text-xs text-white/40">Écoute une vidéo en synchronisé avec tes amis</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* URL input */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Lien YouTube</label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input className="wl-input w-full rounded-xl pl-10 pr-10 py-3 text-sm"
                placeholder="https://youtube.com/watch?v=…"
                value={url} onChange={e => setUrl(e.target.value)} autoFocus />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-red-400" />}
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          {/* Preview */}
          {meta && (
            <div className="flex gap-3 p-3 rounded-2xl animate-pop-in"
              style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)' }}>
              <img src={meta.thumbnail} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate leading-tight">{meta.title}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <YouTubeLogo size={13} />
                  <span className="text-xs text-white/50">Prête à partager</span>
                </div>
              </div>
            </div>
          )}

          {/* Session title */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Nom de la session <span className="text-white/20 normal-case font-normal">(optionnel)</span>
            </label>
            <input className="wl-input w-full rounded-xl px-4 py-3 text-sm"
              placeholder="ex: Chill du dimanche, Mix électro…"
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && meta && handleStart()} />
          </div>

          <button onClick={handleStart} disabled={!meta}
            className="w-full py-3.5 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2
              transition-all disabled:opacity-30 active:scale-[0.98] hover:opacity-90 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #FF0000, #cc0000)' }}>
            <Radio className="w-5 h-5" /> Démarrer la session
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Host view ────────────────────────────────────────────────────────────────

interface HostProps {
  videoId: string;
  sessionTitle: string;
  participants: number;
  hostId: string;
  profile: UserProfile;
  onSync: (state: 'playing' | 'paused', currentTime: number) => void;
  onEnd: () => void;
}

export function YouTubeSessionHost({ videoId, sessionTitle, participants, hostId, profile, onSync, onEnd }: HostProps) {
  const playerRef    = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const [_isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied]       = useState(false);
  const sessionLink = `${window.location.origin}/ytsession/${hostId}`;

  useEffect(() => {
    loadYTApi().then(() => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            const playing = e.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            onSync(playing ? 'playing' : 'paused', playerRef.current?.getCurrentTime() ?? 0);
          },
        },
      });
    });
    // Periodic sync every 3s when playing
    syncRef.current = setInterval(() => {
      if (playerRef.current) {
        const state = playerRef.current.getPlayerState();
        const isPlay = state === (window.YT?.PlayerState?.PLAYING ?? 1);
        if (isPlay) onSync('playing', playerRef.current.getCurrentTime());
      }
    }, 3000);
    return () => {
      playerRef.current?.destroy();
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, [videoId]);

  function copyLink() {
    navigator.clipboard.writeText(sessionLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FF0000' }}>
          <YouTubeLogo size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{sessionTitle}</div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Users className="w-3 h-3" /> {participants} participant{participants > 1 ? 's' : ''}
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-1" />
            <span className="text-red-400 font-semibold">EN SESSION</span>
          </div>
        </div>
        <button onClick={copyLink}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={copied ? { background: 'rgba(16,185,129,0.2)', color: '#10b981' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié' : 'Inviter'}
        </button>
        <button onClick={onEnd}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          <StopCircle className="w-3.5 h-3.5" /> Terminer
        </button>
      </div>

      {/* Player + chat */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* YouTube player */}
        <div className="flex-1 relative bg-black">
          <div ref={containerRef} className="w-full h-full" />
        </div>
        {/* Chat sidebar */}
        <div className="w-72 flex-shrink-0">
          <LiveChat broadcasterId={`ytsession-${hostId}`} profile={profile} isOverlay={false} />
        </div>
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

interface ViewerProps {
  host: NearbyUser;
  videoId: string;
  sessionTitle: string;
  hostId: string;
  profile: UserProfile;
  onLeave: () => void;
  onStateUpdate: (cb: (state: 'playing' | 'paused', currentTime: number) => void) => void;
}

export function YouTubeSessionViewer({ host, videoId, sessionTitle, hostId, profile, onLeave, onStateUpdate }: ViewerProps) {
  const playerRef    = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'ended'>('loading');

  useEffect(() => {
    loadYTApi().then(() => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, disablekb: 1 },
        events: { onReady: () => setStatus('ready'), onStateChange: (e: { data: number }) => { if (e.data === 0) setStatus('ended'); } },
      });
    });
    return () => playerRef.current?.destroy();
  }, [videoId]);

  // Sync from host
  useEffect(() => {
    onStateUpdate((state, currentTime) => {
      if (!playerRef.current) return;
      const diff = Math.abs(playerRef.current.getCurrentTime() - currentTime);
      if (diff > 1.5) playerRef.current.seekTo(currentTime, true);
      if (state === 'playing') playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    });
  }, [onStateUpdate]);

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {host.photos?.[0]
          ? <img src={host.photos[0]} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: host.color }}>{host.emoji}</div>
        }
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{sessionTitle}</div>
          <div className="text-xs text-white/40">Hôte : {host.username}</div>
        </div>
        <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
          className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ExternalLink className="w-4 h-4 text-white/50" />
        </a>
        <button onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          <X className="w-3.5 h-3.5" /> Quitter
        </button>
      </div>

      {/* Player + chat */}
      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 relative bg-black">
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-red-400" />
              <span className="text-sm text-white/50">Synchronisation avec {host.username}…</span>
            </div>
          )}
          {status === 'ended' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="text-3xl">📺</div>
              <div className="text-sm text-white/60">La vidéo est terminée</div>
              <button onClick={onLeave} className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white" style={{ background: '#FF0000' }}>Fermer</button>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
          {/* Viewer overlay — shows it's synced */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/70 font-semibold">Synchronisé</span>
          </div>
          {/* No controls message */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/25 pointer-events-none">
            Contrôles désactivés — l'hôte gère la lecture
          </div>
        </div>
        {/* Chat */}
        <div className="w-72 flex-shrink-0">
          <LiveChat broadcasterId={`ytsession-${hostId}`} profile={profile} isOverlay={false} />
        </div>
      </div>
    </div>
  );
}
