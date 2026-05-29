import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Map, List, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import SetupScreen from './components/SetupScreen';
import NowPlaying from './components/NowPlaying';
import TrackInput from './components/TrackInput';
import NearbyList from './components/NearbyList';
import MapView from './components/MapView';
import { useGeolocation } from './hooks/useGeolocation';
import { useSocket } from './hooks/useSocket';
import type { UserProfile, Track, Coordinates } from './types';

const PROFILE_KEY = 'wl_profile';

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);
  const [myTrack, setMyTrack] = useState<Track | null>(null);
  const [radius, setRadius] = useState(2000);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [showTrackInput, setShowTrackInput] = useState(false);
  const [focusPosition, setFocusPosition] = useState<Coordinates | null>(null);
  const [joined, setJoined] = useState(false);

  const geo = useGeolocation();
  const socket = useSocket();

  // Auto-request location on mount
  useEffect(() => {
    if (profile) geo.request();
  }, [profile]);

  // Join server once we have profile + connected
  useEffect(() => {
    if (!profile || !socket.connected || joined) return;
    socket.join(profile, geo.position, myTrack, radius);
    setJoined(true);
  }, [profile, socket.connected, joined]);

  // Re-join if connection drops and reconnects
  useEffect(() => {
    if (socket.connected && profile && !joined) {
      socket.join(profile, geo.position, myTrack, radius);
      setJoined(true);
    }
    if (!socket.connected) setJoined(false);
  }, [socket.connected]);

  // Push position updates
  useEffect(() => {
    if (geo.position && joined) socket.updatePosition(geo.position);
  }, [geo.position, joined]);

  const handleSetupComplete = useCallback((p: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  }, []);

  const handleTrackSave = useCallback((track: Track | null) => {
    setMyTrack(track);
    socket.updateTrack(track);
  }, [socket]);

  const handleRadiusChange = useCallback((r: number) => {
    setRadius(r);
    socket.updateRadius(r);
  }, [socket]);

  if (!profile) return <SetupScreen onComplete={handleSetupComplete} />;

  return (
    <div className="app-bg h-screen flex overflow-hidden">
      {/* ── Left panel ─────────────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 flex flex-col h-full border-r"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-md"
            style={{ background: profile.color }}>
            {profile.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-none">{profile.username}</div>
            <div className="text-xs text-white/30 mt-0.5 leading-none">Wavelength</div>
          </div>

          {/* Connection status */}
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
            ${socket.connected ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ background: socket.connected ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
            {socket.connected
              ? <><Wifi className="w-3 h-3" /> En ligne</>
              : <><WifiOff className="w-3 h-3" /> Hors ligne</>}
          </div>

          {/* Reset */}
          <button
            onClick={() => { localStorage.removeItem(PROFILE_KEY); setProfile(null); setJoined(false); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30
              hover:text-white/60 hover:bg-white/10 transition-colors text-sm"
            title="Changer de profil">
            ↩
          </button>
        </header>

        {/* Now playing */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-0.5">
            J'écoute en ce moment
          </div>
          <NowPlaying profile={profile} track={myTrack} onEdit={() => setShowTrackInput(true)} />
        </div>

        {/* Geolocation status */}
        {!geo.position && (
          <div className="px-4 flex-shrink-0">
            {geo.error ? (
              <div className="flex items-start gap-2 p-3 rounded-xl mb-2 text-xs text-red-300"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                {geo.error}
                <button onClick={geo.request} className="ml-auto underline underline-offset-2 whitespace-nowrap">
                  Réessayer
                </button>
              </div>
            ) : geo.loading ? (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-2 text-xs text-white/40"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Localisation en cours…
              </div>
            ) : (
              <button onClick={geo.request}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-2
                  text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                <Navigation className="w-4 h-4" />
                Activer la localisation
              </button>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pb-2 flex-shrink-0">
          {([['list', <List key="l" className="w-3.5 h-3.5" />, 'Proximité'],
             ['map',  <Map  key="m" className="w-3.5 h-3.5" />, 'Carte']] as const).map(([id, icon, label]) => (
            <button key={id} onClick={() => setView(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                text-xs font-semibold transition-all duration-200"
              style={view === id
                ? { background: profile.color + '22', color: profile.color }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 px-4 pb-4 overflow-hidden flex flex-col">
          {view === 'list' ? (
            <NearbyList
              users={socket.nearbyUsers}
              radius={radius}
              onRadiusChange={handleRadiusChange}
              onSelectUser={(pos) => { setFocusPosition(pos); setView('map'); }}
              accentColor={profile.color}
            />
          ) : (
            /* Map inline for small screens – on desktop use the right panel */
            <div className="flex-1 rounded-2xl overflow-hidden -mx-0"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {geo.position ? (
                <MapView
                  myPosition={geo.position}
                  profile={profile}
                  nearbyUsers={socket.nearbyUsers}
                  focusPosition={focusPosition}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-white/30">
                  Active la localisation pour voir la carte
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Right panel: full map ──────────────────────────── */}
      <main className="flex-1 relative overflow-hidden">
        {geo.position ? (
          <MapView
            myPosition={geo.position}
            profile={profile}
            nearbyUsers={socket.nearbyUsers}
            focusPosition={focusPosition}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="text-6xl mb-2">🗺️</div>
            <div className="text-lg font-bold gradient-text">Carte de proximité</div>
            <p className="text-sm text-white/30 max-w-xs">
              Active la géolocalisation pour voir les auditeurs autour de toi en temps réel
            </p>
            {!geo.loading && !geo.error && (
              <button onClick={geo.request}
                className="flex items-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm text-white
                  transition-all active:scale-95 shadow-lg hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                <Navigation className="w-4 h-4" />
                Activer la localisation
              </button>
            )}
            {geo.loading && (
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Loader2 className="w-4 h-4 animate-spin" /> Localisation…
              </div>
            )}
          </div>
        )}

        {/* Map overlay: listener count badge */}
        {geo.position && socket.nearbyUsers.length > 0 && (
          <div className="absolute top-4 right-4 z-[500] glass rounded-2xl px-4 py-2.5 animate-fade-in">
            <div className="text-xs text-white/50 font-medium">Auditeurs proches</div>
            <div className="text-2xl font-bold gradient-text">{socket.nearbyUsers.length}</div>
          </div>
        )}
      </main>

      {/* ── Track input modal ────────────────────────────────── */}
      {showTrackInput && (
        <TrackInput
          currentTrack={myTrack}
          onSave={handleTrackSave}
          onClose={() => setShowTrackInput(false)}
          accentColor={profile.color}
        />
      )}
    </div>
  );
}
