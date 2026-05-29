import { useState, useEffect, useRef } from 'react';
import {
  X, Search, Link2, Loader2, Play,
  Users, Copy, Check, ExternalLink, Radio, StopCircle, ChevronLeft, Settings
} from 'lucide-react';
import { YouTubeLogo } from './SourceLogo';
import type { UserProfile, NearbyUser } from '../types';
import LiveChat from './LiveChat';

// ─── YouTube IFrame API ───────────────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: object) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(t: number, allow: boolean): void;
  loadVideoById(id: string): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoData(): { title: string; video_id: string };
  destroy(): void;
}

let ytApiReady = false;
let ytApiPromise: Promise<void> | null = null;

function loadYTApi(): Promise<void> {
  if (ytApiReady) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise(resolve => {
    if (window.YT?.Player) { ytApiReady = true; resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => { ytApiReady = true; resolve(); };
  });
  return ytApiPromise;
}

function getVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]{11})/);
  return m?.[1] ?? (url.length === 11 ? url : null);
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ─── Search + Setup ───────────────────────────────────────────────────────────

interface VideoResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

interface SetupProps {
  onStart: (videoId: string, title: string, videoTitle: string) => void;
  onClose: () => void;
}

export function YouTubeSessionSetup({ onStart, onClose }: SetupProps) {
  const [url, setUrl]       = useState('');
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('melo_yt_api_key') ?? '');
  const [showApiInput, setShowApiInput] = useState(false);
  const [meta, setMeta]     = useState<{ id: string; title: string; thumbnail: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [title, setTitle]   = useState('');
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve URL via oEmbed
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const id = getVideoId(url.trim());
    if (!id) { setMeta(null); setError(''); return; }
    debRef.current = setTimeout(async () => {
      setLoading(true); setError(''); setMeta(null);
      try {
        const res = await fetch(`/api/oembed?url=https://www.youtube.com/watch?v=${id}`);
        if (!res.ok) throw new Error('Vidéo introuvable');
        const d = await res.json();
        setMeta({ id, title: d.title, thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg` });
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur'); }
      finally { setLoading(false); }
    }, 500);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [url]);

  // Search via YouTube Data API
  async function searchVideos() {
    if (!query.trim()) return;
    if (!apiKey.trim()) { setError('Clé API requise pour la recherche'); setShowApiInput(true); return; }
    setLoading(true); setError(''); setResults([]);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=8&key=${apiKey}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Erreur API');
      }
      const data = await res.json();
      setResults((data.items ?? []).map((item: Record<string, unknown>) => {
        const snippet = item.snippet as Record<string, unknown>;
        const thumbnails = snippet?.thumbnails as Record<string, { url: string }>;
        const id = (item.id as Record<string, string>).videoId;
        return {
          id,
          title:     snippet?.title as string,
          channel:   snippet?.channelTitle as string,
          thumbnail: thumbnails?.medium?.url ?? `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        };
      }));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur de recherche'); }
    finally { setLoading(false); }
  }

  function selectResult(v: VideoResult) {
    setMeta({ id: v.id, title: v.title, thumbnail: v.thumbnail });
    setResults([]);
    setUrl(`https://www.youtube.com/watch?v=${v.id}`);
  }

  function handleStart() {
    if (!meta) return;
    localStorage.setItem('melo_yt_api_key', apiKey);
    onStart(meta.id, title.trim() || `Session YouTube`, meta.title);
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.99)', border: '1px solid rgba(255,255,255,0.12)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ background: 'rgba(255,0,0,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FF0000' }}>
            <YouTubeLogo size={26} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Session d'écoute YouTube</div>
            <div className="text-xs text-white/40">Écoute en synchronisé avec tes amis</div>
          </div>
          <button onClick={() => setShowApiInput(s => !s)} title="Clé API YouTube"
            className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-white/40" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(90vh - 72px)' }}>

          {/* API key input */}
          {showApiInput && (
            <div className="p-3 rounded-2xl animate-fade-in"
              style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)' }}>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                Clé API YouTube Data v3 <span className="text-white/20 normal-case font-normal">(pour la recherche)</span>
              </label>
              <input className="wl-input w-full rounded-xl px-3 py-2.5 text-sm font-mono"
                placeholder="AIza..."
                value={apiKey} onChange={e => setApiKey(e.target.value)} />
              <p className="text-xs text-white/25 mt-1.5">
                <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-red-400 underline">console.cloud.google.com</a> → YouTube Data API v3 → Créer une clé
              </p>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Rechercher une vidéo</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input className="wl-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                  placeholder="Artiste, chanson, playlist…"
                  value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchVideos()} />
              </div>
              <button onClick={searchVideos} disabled={loading || !query.trim()}
                className="px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: '#FF0000' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chercher'}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          {/* Search results */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-2 animate-fade-in">
              {results.map(v => (
                <button key={v.id} onClick={() => selectResult(v)}
                  className="text-left rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="relative" style={{ paddingBottom: '56.25%' }}>
                    <img src={v.thumbnail} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-semibold text-white truncate">{v.title}</div>
                    <div className="text-xs text-white/40 truncate">{v.channel}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* OR paste URL */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Ou coller un lien YouTube
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input className="wl-input w-full rounded-xl pl-10 pr-10 py-3 text-sm"
                placeholder="https://youtube.com/watch?v=…"
                value={url} onChange={e => setUrl(e.target.value)} />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-red-400" />}
            </div>
          </div>

          {/* Selected video preview */}
          {meta && (
            <div className="flex gap-3 p-3 rounded-2xl animate-pop-in"
              style={{ background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)' }}>
              <img src={meta.thumbnail} className="w-20 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{meta.title}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <YouTubeLogo size={13} />
                  <span className="text-xs text-white/50">Prête pour la session</span>
                </div>
              </div>
            </div>
          )}

          {/* Session title */}
          {meta && (
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
                Nom de la session <span className="text-white/20 normal-case font-normal">(optionnel)</span>
              </label>
              <input className="wl-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="ex: Chill du dimanche, Rap Battle…"
                value={title} onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && meta && handleStart()} />
            </div>
          )}

          <button onClick={handleStart} disabled={!meta}
            className="w-full py-3.5 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2
              transition-all disabled:opacity-30 active:scale-[0.98] hover:opacity-90 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #FF0000, #cc0000)' }}>
            <Radio className="w-5 h-5" /> Lancer la session
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
  hostSocketId: string;
  profile: UserProfile;
  onSync: (state: 'playing' | 'paused', currentTime: number) => void;
  onEnd: () => void;
}

export function YouTubeSessionHost({ videoId, sessionTitle, participants, hostSocketId, profile, onSync, onEnd }: HostProps) {
  const playerRef    = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrent] = useState(0);
  const [copied, setCopied]     = useState(false);
  const [ready, setReady]       = useState(false);

  const sessionLink = `${window.location.origin}/ytsession/${hostSocketId}`;

  useEffect(() => {
    loadYTApi().then(() => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%', height: '100%',
        playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: { data: number }) => {
            const isPlay = e.data === window.YT.PlayerState.PLAYING;
            setPlaying(isPlay);
            const t = playerRef.current?.getCurrentTime() ?? 0;
            onSync(isPlay ? 'playing' : 'paused', t);
          },
        },
      });
    });

    // Periodic sync + progress update
    const progInterval = setInterval(() => {
      if (!playerRef.current) return;
      const t = playerRef.current.getCurrentTime();
      const d = playerRef.current.getDuration();
      setCurrent(t);
      setDuration(d);
      setProgress(d > 0 ? (t / d) * 100 : 0);
      // Sync every 5s when playing
      if (playerRef.current.getPlayerState() === window.YT?.PlayerState?.PLAYING) {
        onSync('playing', t);
      }
    }, 1000);

    return () => {
      playerRef.current?.destroy();
      clearInterval(progInterval);
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, [videoId]);

  function seek(pct: number) {
    if (!playerRef.current) return;
    const t = (pct / 100) * duration;
    playerRef.current.seekTo(t, true);
    onSync(playing ? 'playing' : 'paused', t);
  }

  function copyLink() {
    navigator.clipboard.writeText(sessionLink)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#FF0000' }}>
          <YouTubeLogo size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{sessionTitle}</div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Users className="w-3 h-3" /> {participants} auditeur{participants > 1 ? 's' : ''}
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-1" />
            <span className="text-red-400 font-semibold">SESSION ACTIVE</span>
          </div>
        </div>
        <button onClick={copyLink}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={copied
            ? { background: 'rgba(16,185,129,0.2)', color: '#10b981' }
            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié !' : 'Inviter'}
        </button>
        <button onClick={onEnd}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          <StopCircle className="w-3.5 h-3.5" /> Terminer
        </button>
      </div>

      {/* Main layout: player + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Player */}
        <div className="flex-1 relative bg-black flex flex-col">
          {/* YouTube IFrame */}
          <div className="flex-1 relative">
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 animate-spin text-red-400" />
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
          </div>

          {/* Custom progress bar */}
          <div className="flex-shrink-0 px-4 py-3"
            style={{ background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-white/50 font-mono w-10 text-right flex-shrink-0">{fmtTime(currentTime)}</span>
              <div className="flex-1 h-1.5 rounded-full cursor-pointer relative group"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seek(((e.clientX - rect.left) / rect.width) * 100);
                }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#FF0000' }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 6px)` }} />
              </div>
              <span className="text-xs text-white/50 font-mono w-10 flex-shrink-0">{fmtTime(duration)}</span>
            </div>
            <div className="text-center text-xs text-white/25">
              Tu contrôles la lecture — {participants} auditeur{participants > 1 ? 's' : ''} synchronisé{participants > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="w-72 flex-shrink-0 hidden md:flex">
          <LiveChat broadcasterId={`ytsession-${hostSocketId}`} profile={profile} isOverlay={false} />
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
  hostSocketId: string;
  profile: UserProfile;
  initialTime: number;
  initialState: 'playing' | 'paused';
  onLeave: () => void;
  onStateUpdate: (cb: (state: 'playing' | 'paused', currentTime: number, ts: number) => void) => (() => void);
  onSessionEnded: (cb: (hostId: string) => void) => (() => void);
}

export function YouTubeSessionViewer({
  host, videoId, sessionTitle, hostSocketId, profile,
  initialTime, initialState,
  onLeave, onStateUpdate, onSessionEnded,
}: ViewerProps) {
  const playerRef    = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'ended'>('loading');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    loadYTApi().then(() => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%', height: '100%',
        playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, disablekb: 1, origin: window.location.origin },
        events: {
          onReady: () => {
            setStatus('ready');
            // Jump to initial time and apply initial state
            playerRef.current?.seekTo(initialTime, true);
            if (initialState === 'playing') playerRef.current?.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 0) setStatus('ended');
          },
        },
      });
    });

    // Progress tracker
    const t = setInterval(() => {
      if (!playerRef.current) return;
      const ct = playerRef.current.getCurrentTime();
      const d  = playerRef.current.getDuration();
      setCurrent(ct); setDuration(d);
      setProgress(d > 0 ? (ct / d) * 100 : 0);
    }, 500);

    // Subscribe to host state updates
    const unsubState = onStateUpdate((state, hostTime, ts) => {
      if (!playerRef.current) return;
      // Account for network latency (rough estimate)
      const latency = (Date.now() - ts) / 1000;
      const targetTime = hostTime + latency;
      const diff = Math.abs(playerRef.current.getCurrentTime() - targetTime);
      if (diff > 1.5) playerRef.current.seekTo(targetTime, true);
      if (state === 'playing') playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    });

    const unsubEnded = onSessionEnded((hostId) => {
      if (hostId === hostSocketId) setStatus('ended');
    });

    return () => {
      playerRef.current?.destroy();
      clearInterval(t);
      unsubState();
      unsubEnded();
    };
  }, [videoId]);

  // Mute toggle on video element
  useEffect(() => {
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
  }, [status]);

  return (
    <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {host.photos?.[0]
          ? <img src={host.photos[0]} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: host.color }}>{host.emoji}</div>
        }
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{sessionTitle}</div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Hôte : {host.username}
          </div>
        </div>
        <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
          className="p-2 rounded-xl hover:bg-white/10 transition-colors" title="Ouvrir sur YouTube">
          <ExternalLink className="w-4 h-4 text-white/50" />
        </a>
        <button onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          <ChevronLeft className="w-3.5 h-3.5" /> Quitter
        </button>
      </div>

      {/* Player + chat */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative flex flex-col bg-black">
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
              <span className="text-sm text-white/50">Synchronisation avec {host.username}…</span>
            </div>
          )}
          {status === 'ended' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black/80">
              <div className="text-4xl">📺</div>
              <p className="text-base font-bold text-white/60">Vidéo terminée</p>
              <button onClick={onLeave} className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white" style={{ background: '#FF0000' }}>
                Quitter
              </button>
            </div>
          )}

          {/* Player */}
          <div className="flex-1 relative" ref={containerRef} />

          {/* Progress bar (read-only) */}
          <div className="flex-shrink-0 px-4 py-3"
            style={{ background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs text-white/50 font-mono w-10 text-right flex-shrink-0">{fmtTime(currentTime)}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#FF0000' }} />
              </div>
              <span className="text-xs text-white/50 font-mono w-10 flex-shrink-0">{fmtTime(duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-white/25">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Synchronisé avec {host.username} — contrôles désactivés
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="w-72 flex-shrink-0 hidden md:flex">
          <LiveChat broadcasterId={`ytsession-${hostSocketId}`} profile={profile} isOverlay={false} />
        </div>
      </div>
    </div>
  );
}
