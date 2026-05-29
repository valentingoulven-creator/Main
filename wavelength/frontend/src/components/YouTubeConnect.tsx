import { useState, useEffect } from 'react';
import { X, ExternalLink, RefreshCw, Loader2, CheckCircle2, Play } from 'lucide-react';
import {
  startYtAuth, disconnectYt, isYtConnected, getYtClientId, saveYtClientId,
  getLikedVideos, getYtProfile,
} from '../utils/youtubeAuth';
import type { YtVideo } from '../utils/youtubeAuth';
import { YouTubeLogo } from './SourceLogo';
import type { Track } from '../types';

interface Props {
  onShare: (track: Track) => void;
  onClose: () => void;
}

type Step = 'main' | 'setup';

export default function YouTubeConnect({ onShare, onClose }: Props) {
  const [connected, setConnected] = useState(isYtConnected());
  const [clientId, setClientId]   = useState(getYtClientId());
  const [step, setStep]           = useState<Step>(!getYtClientId() && !isYtConnected() ? 'setup' : 'main');
  const [profile, setProfile]     = useState<{ name: string; photo?: string } | null>(null);
  const [videos, setVideos]       = useState<YtVideo[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [shared, setShared]       = useState<string | null>(null);

  useEffect(() => {
    if (connected) {
      setLoading(true);
      Promise.all([getYtProfile(), getLikedVideos(12)]).then(([prof, vids]) => {
        setProfile(prof);
        setVideos(vids);
      }).finally(() => setLoading(false));
    }
  }, [connected]);

  function handleConnect() {
    if (!clientId.trim()) { setError('Entre ton Client ID Google.'); return; }
    saveYtClientId(clientId.trim());
    startYtAuth(clientId.trim());
  }

  function handleDisconnect() {
    disconnectYt();
    setConnected(false);
    setProfile(null);
    setVideos([]);
    setStep('main');
  }

  function handleShare(video: YtVideo) {
    const track: Track = {
      title:    video.title,
      artist:   video.channel,
      albumArt: video.thumbnail,
      source:   'youtube',
      url:      video.url,
    };
    onShare(track);
    setShared(video.id);
    setTimeout(() => { setShared(null); onClose(); }, 1000);
  }

  async function reload() {
    setLoading(true);
    getLikedVideos(12).then(v => setVideos(v)).finally(() => setLoading(false));
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: connected ? 'rgba(255,0,0,0.08)' : 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ background: '#FF0000' }}>
            <YouTubeLogo size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">YouTube</div>
            <div className="text-xs text-white/40">
              {connected ? (profile?.name ? `Connecté — ${profile.name}` : 'Connecté') : 'Non connecté'}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5">
          {connected ? (
            <>
              {/* Videos grid */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Tes vidéos aimées — sélectionne pour partager
                </div>
                <button onClick={reload}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" /> : <RefreshCw className="w-3.5 h-3.5 text-white/40" />}
                </button>
              </div>

              {loading && videos.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8 text-sm text-white/30">
                  Aucune vidéo aimée trouvée
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto mb-4">
                  {videos.map(v => (
                    <button key={v.id} onClick={() => handleShare(v)}
                      className="group relative rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-100"
                      style={shared === v.id ? { boxShadow: '0 0 0 2.5px #ef4444' } : {}}>
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        <img src={v.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {shared === v.id
                            ? <CheckCircle2 className="w-8 h-8 text-green-400" />
                            : <Play className="w-8 h-8 text-white" />}
                        </div>
                      </div>
                      <div className="p-1.5" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <div className="text-xs text-white font-semibold truncate leading-tight">{v.title}</div>
                        <div className="text-xs text-white/40 truncate" style={{ fontSize: 9 }}>{v.channel}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={handleDisconnect}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 transition-all hover:bg-red-400/10"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                Déconnecter YouTube
              </button>
            </>
          ) : step === 'setup' ? (
            <>
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)' }}>
                <p className="text-xs text-white/60 leading-relaxed mb-3">
                  Pour connecter YouTube, tu as besoin d'un <strong className="text-white">Client ID</strong> depuis Google Cloud Console.
                </p>
                <ol className="text-xs text-white/50 space-y-1.5 list-decimal list-inside">
                  <li>Va sur <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-red-400 underline underline-offset-2">console.cloud.google.com</a></li>
                  <li>Active l'API <strong className="text-white/70">YouTube Data API v3</strong></li>
                  <li>Crée des identifiants OAuth 2.0 (Application Web)</li>
                  <li>Ajoute <code className="bg-white/10 px-1 rounded text-red-300 text-xs">http://localhost:5174/youtube/callback</code></li>
                  <li>Copie le Client ID ci-dessous</li>
                </ol>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Client ID Google</label>
                <input className="wl-input w-full rounded-xl px-4 py-3 text-sm font-mono"
                  placeholder="xxxx.apps.googleusercontent.com"
                  value={clientId} onChange={e => { setClientId(e.target.value); setError(''); }}
                  autoFocus />
                {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('main')}
                  className="py-3 px-4 rounded-xl text-xs font-semibold text-white/40 hover:bg-white/10 transition-colors">
                  Annuler
                </button>
                <button onClick={handleConnect}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: '#FF0000' }}>
                  <YouTubeLogo size={16} />
                  Connecter avec YouTube
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white/50 text-center mb-5 leading-relaxed">
                Connecte YouTube pour parcourir tes vidéos aimées et les partager comme musique en cours.
              </p>
              <div className="flex items-center justify-center gap-6 mb-5 text-xs text-white/30">
                {['🎬 Vidéos aimées', '🎵 Partage rapide', '🔒 Lecture seule'].map(t => <span key={t}>{t}</span>)}
              </div>
              <button onClick={() => setStep('setup')}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90 shadow-lg"
                style={{ background: '#FF0000' }}>
                <YouTubeLogo size={18} />
                Connecter avec YouTube
              </button>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 mt-3 text-xs text-white/25 hover:text-white/50 transition-colors">
                <ExternalLink className="w-3 h-3" /> Ouvrir YouTube
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
