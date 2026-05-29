import { useState, useEffect } from 'react';
import { X, ExternalLink, Music2, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { startAuth, disconnect, isConnected, getClientId, saveClientId, getSpotifyProfile } from '../utils/spotifyAuth';
import { SpotifyLogo } from './SourceLogo';
import type { SpotifyTrack } from '../utils/spotifyAuth';

interface Props {
  currentTrack: SpotifyTrack | null;
  isPolling: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SpotifyConnect({ currentTrack, isPolling, onClose, onRefresh }: Props) {
  const [connected, setConnected] = useState(isConnected());
  const [clientId, setClientId]   = useState(getClientId());
  const [step, setStep]           = useState<'main' | 'setup'>(!getClientId() && !isConnected() ? 'setup' : 'main');
  const [profile, setProfile]     = useState<{ name: string; image?: string } | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (connected) {
      getSpotifyProfile().then(p => setProfile(p));
    }
  }, [connected]);

  function handleConnect() {
    if (!clientId.trim()) { setError('Entre ton Client ID Spotify.'); return; }
    saveClientId(clientId.trim());
    startAuth(clientId.trim()); // redirects to Spotify
  }

  function handleDisconnect() {
    disconnect();
    setConnected(false);
    setProfile(null);
    setStep('main');
  }

  const progressPct = currentTrack
    ? Math.round((currentTrack.progressMs / currentTrack.durationMs) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: connected ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#1DB954' }}>
            <SpotifyLogo size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">Spotify</div>
            <div className="text-xs" style={{ color: connected ? '#1DB954' : 'rgba(255,255,255,0.4)' }}>
              {connected ? (profile?.name ? `Connecté — ${profile.name}` : 'Connecté') : 'Non connecté'}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5">
          {connected ? (
            /* ── Connected state ── */
            <>
              {/* Now playing */}
              <div className="mb-5">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${currentTrack?.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
                  {currentTrack?.isPlaying ? 'En écoute maintenant' : 'Rien en cours'}
                </div>

                {currentTrack ? (
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.2)' }}>
                    <div className="flex gap-3 p-3">
                      {currentTrack.albumArt ? (
                        <img src={currentTrack.albumArt} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'rgba(29,185,84,0.2)' }}>
                          <Music2 className="w-6 h-6 text-green-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="text-sm font-bold text-white truncate">{currentTrack.title}</div>
                        <div className="text-xs text-white/50 truncate mt-0.5">{currentTrack.artist}</div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${progressPct}%`, background: '#1DB954' }} />
                        </div>
                      </div>
                      <a href={currentTrack.url} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 self-center p-1.5 rounded-xl hover:bg-white/10 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 text-center text-sm text-white/30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    Lance une chanson sur Spotify pour qu'elle apparaisse ici
                  </div>
                )}
              </div>

              {/* Auto-sync info */}
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                style={{ background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.15)' }}>
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-green-300">Synchronisation automatique active</div>
                  <div className="text-xs text-white/40 mt-0.5">MeloSong partage ta musique en temps réel</div>
                </div>
                <button onClick={onRefresh}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  {isPolling ? <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-white/40" />}
                </button>
              </div>

              <button onClick={handleDisconnect}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 transition-all hover:bg-red-400/10"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                Déconnecter Spotify
              </button>
            </>
          ) : step === 'setup' ? (
            /* ── Setup: enter client ID ── */
            <>
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: 'rgba(29,185,84,0.06)', border: '1px solid rgba(29,185,84,0.15)' }}>
                <p className="text-xs text-white/60 leading-relaxed mb-3">
                  Pour connecter Spotify, tu as besoin d'un <strong className="text-white">Client ID</strong> gratuit depuis le Dashboard Spotify Developer.
                </p>
                <ol className="text-xs text-white/50 space-y-1.5 list-decimal list-inside">
                  <li>Va sur <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-green-400 underline underline-offset-2">developer.spotify.com/dashboard</a></li>
                  <li>Crée une app (gratuit)</li>
                  <li>Ajoute <code className="bg-white/10 px-1 rounded text-green-300">http://localhost:5174/spotify/callback</code> en Redirect URI</li>
                  <li>Copie le Client ID ci-dessous</li>
                </ol>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Client ID Spotify</label>
                <input className="wl-input w-full rounded-xl px-4 py-3 text-sm font-mono"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                  style={{ background: '#1DB954' }}>
                  <SpotifyLogo size={16} />
                  Connecter avec Spotify
                </button>
              </div>
            </>
          ) : (
            /* ── Not connected: prompt ── */
            <>
              <p className="text-sm text-white/50 text-center mb-5 leading-relaxed">
                Connecte ton compte Spotify pour que MeloSong partage automatiquement ce que tu écoutes avec les gens autour de toi.
              </p>
              <div className="flex flex-col gap-2 mb-3 text-xs text-white/30 text-center">
                <div className="flex items-center justify-center gap-5">
                  {['🎵 Partage auto', '🔄 Sync temps réel', '🔒 Lecture seule'].map(t => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep('setup')}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90 shadow-lg"
                style={{ background: '#1DB954' }}>
                <SpotifyLogo size={18} />
                Connecter avec Spotify
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
