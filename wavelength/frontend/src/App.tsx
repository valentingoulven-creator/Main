import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Navigation, AlertCircle, Loader2, UserCircle2, MapPin, Heart } from 'lucide-react';
import { MeloSongLockup, MeloSongMark } from './components/MeloSongLogo';
import SetupScreen from './components/SetupScreen';
import AuthScreen from './components/AuthScreen';
import NowPlaying from './components/NowPlaying';
import TrackInput from './components/TrackInput';
import NearbyList from './components/NearbyList';
import MapView from './components/MapView';
import ChatWindow from './components/ChatWindow';
import ChatNotification from './components/ChatNotification';
import ProfileModal from './components/ProfileModal';
import ProfileEditor from './components/ProfileEditor';
import RatingPicker from './components/RatingPicker';
import { useGeolocation } from './hooks/useGeolocation';
import GpsPicker from './components/GpsPicker';
import AdBanner from './components/AdBanner';
import MapStyleBar, { MAP_STYLES_5 } from './components/MapStyleBar';
import type { MapStyleDef } from './components/MapStyleBar';
import CameraCapture from './components/CameraCapture';
import { DonateUser, DonateApp } from './components/DonateModal';
import LiveBroadcast from './components/LiveBroadcast';
import LiveViewer from './components/LiveViewer';
import DiscoverTab from './components/DiscoverTab';
import type { PublicLive } from './types';
import { useSocket } from './hooks/useSocket';
import type { UserProfile, Track, Coordinates, ChatStatus, ChatConversation, IncomingChatRequest, NearbyUser, ChatPeer, Rating } from './types';
import { loadSession, logout } from './utils/auth';
import type { Session } from './utils/auth';

const PROFILE_KEY   = 'melo_profile';
const JAM_KEY       = 'melo_jam_url';
const CHAT_STATUS_KEY = 'melo_chat_status';

function loadProfile(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null'); } catch { return null; }
}
function loadChatStatus(): ChatStatus {
  return (localStorage.getItem(CHAT_STATUS_KEY) as ChatStatus) ?? 'available';
}

const CHAT_STATUS_UI: Record<ChatStatus, { label: string; color: string; next: ChatStatus }> = {
  available: { label: 'Disponible',      color: '#10b981', next: 'busy'      },
  busy:      { label: 'Occupé·e',        color: '#f59e0b', next: 'dnd'       },
  dnd:       { label: 'Ne pas déranger', color: '#ef4444', next: 'available' },
};

export default function App() {
  const [session, setSession]       = useState<Session | null>(loadSession);
  const [profile, setProfile]       = useState<UserProfile | null>(loadProfile);
  const [myTrack, setMyTrack]       = useState<Track | null>(null);
  const [myJamUrl, setMyJamUrl]     = useState<string>(() => localStorage.getItem(JAM_KEY) ?? '');
  const [radius, setRadius]         = useState(2000);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(loadChatStatus);
  const [showTrackInput, setShowTrackInput] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showGpsPicker, setShowGpsPicker]         = useState(false);
  const [ratingTarget, setRatingTarget]           = useState<NearbyUser | null>(null);
  const [mapStyle, setMapStyle]                   = useState<MapStyleDef>(MAP_STYLES_5[0]);
  const [showCamera, setShowCamera]               = useState(false);
  const [donateTarget, setDonateTarget]           = useState<NearbyUser | null>(null);
  const [showDonateApp, setShowDonateApp]         = useState(false);
  const [showLiveBroadcast, setShowLiveBroadcast] = useState(false);
  const [watchingLive, setWatchingLive]           = useState<NearbyUser | PublicLive | null>(null);
  const [amLive, setAmLive]                       = useState(false);
  const [liveViewers, setLiveViewers]             = useState(0);
  const [view, setView]                           = useState<'nearby' | 'discover'>('nearby');
  const [ratingsCache, setRatingsCache]           = useState<Record<string, Rating[]>>({});
  const [myRatings, setMyRatings]                 = useState<Record<string, string>>({}); // targetId → vibe
  const [focusPosition, setFocusPosition]   = useState<Coordinates | null>(null);
  const [viewedProfile, setViewedProfile]   = useState<NearbyUser | null>(null);
  const [joined, setJoined] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<Map<string, ChatConversation>>(() => new Map<string, ChatConversation>());
  const [openChatId, setOpenChatId]       = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<IncomingChatRequest | null>(null);

  const geo    = useGeolocation();
  const socket = useSocket();

  // Register live callbacks
  useEffect(() => {
    socket.registerLiveCallbacks({
      onViewerJoined: () => setLiveViewers(v => v + 1),
      onViewerLeft:   () => setLiveViewers(v => Math.max(0, v - 1)),
    });
  }, [socket]);

  // Register rating callbacks
  useEffect(() => {
    socket.registerRatingCallbacks({
      onRatingsData: (targetId, ratings) => {
        setRatingsCache(prev => ({ ...prev, [targetId]: ratings }));
      },
    });
  }, [socket]);

  // Register chat callbacks
  useEffect(() => {
    socket.registerChatCallbacks({
      onChatRequest: (from) => setIncomingRequest({ from, timestamp: Date.now() }),
      onChatAccepted: (from) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          m.set(from.id, { peer: from, messages: m.get(from.id)?.messages ?? [], unread: 0, state: 'active' });
          return m;
        });
        setOpenChatId(from.id);
      },
      onChatDeclined: (from, reason) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          m.set(from.id, { peer: from, messages: [], unread: 0, state: 'declined', declineReason: reason });
          return m;
        });
        setOpenChatId(from.id);
      },
      onChatMessage: (from, text, timestamp) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          const ex = m.get(from.id);
          const msg = { id: `${timestamp}-${Math.random()}`, fromMe: false, text, timestamp };
          m.set(from.id, ex
            ? { ...ex, messages: [...ex.messages, msg], unread: openChatId === from.id ? 0 : (ex.unread + 1), state: 'active' }
            : { peer: from, messages: [msg], unread: 1, state: 'active' }
          );
          return m;
        });
        setOpenChatId(id => id ?? from.id);
      },
      onChatClosed: (fromId: string) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          const ex = m.get(fromId);
          if (ex) m.set(fromId, { ...ex, state: 'closed' });
          return m;
        });
      },
      onChatUnavailable: (toId) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          const ex = m.get(toId);
          if (ex) m.set(toId, { ...ex, state: 'unavailable' });
          return m;
        });
      },
    });
  }, [socket, openChatId]);

  // Presence
  useEffect(() => { if (profile) geo.request(); }, [profile]);

  useEffect(() => {
    if (!profile || !socket.connected || joined) return;
    socket.join({ ...profile, jamUrl: myJamUrl || undefined }, geo.position, myTrack, radius, chatStatus);
    setJoined(true);
  }, [profile, socket.connected, joined]);

  useEffect(() => {
    if (socket.connected && profile && !joined) {
      socket.join({ ...profile, jamUrl: myJamUrl || undefined }, geo.position, myTrack, radius, chatStatus);
      setJoined(true);
    }
    if (!socket.connected) setJoined(false);
  }, [socket.connected]);

  useEffect(() => { if (geo.position && joined) socket.updatePosition(geo.position); }, [geo.position, joined]);

  // Handlers
  function handleSetupComplete(p: UserProfile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  }

  const handleTrackSave = useCallback((track: Track | null, jamUrl?: string) => {
    setMyTrack(track);
    socket.updateTrack(track);
    if (jamUrl !== undefined) {
      setMyJamUrl(jamUrl);
      localStorage.setItem(JAM_KEY, jamUrl);
      socket.updateProfile({ jamUrl: jamUrl || undefined });
    }
  }, [socket]);

  const handleCameraCapture = useCallback((dataUrl: string) => {
    if (!profile) return;
    const updated = { ...profile, photos: [dataUrl, ...(profile.photos ?? [])].slice(0, 3) };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    setProfile(updated);
    socket.updateProfile({ photos: updated.photos });
  }, [profile, socket]);

  const handleProfileSave = useCallback((data: Partial<UserProfile> & { jamUrl?: string }) => {
    const updated = { ...profile!, ...data };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    if (data.jamUrl !== undefined) {
      setMyJamUrl(data.jamUrl ?? '');
      localStorage.setItem(JAM_KEY, data.jamUrl ?? '');
    }
    setProfile(updated);
    socket.updateProfile(data);
  }, [profile, socket]);

  const handleRadiusChange = useCallback((r: number) => {
    setRadius(r);
    socket.updateRadius(r);
  }, [socket]);

  const handleChatStatusCycle = useCallback(() => {
    const next = CHAT_STATUS_UI[chatStatus].next;
    setChatStatus(next);
    localStorage.setItem(CHAT_STATUS_KEY, next);
    socket.updateChatStatus(next);
  }, [chatStatus, socket]);

  const handleStartChat = useCallback((user: NearbyUser) => {
    const peer: ChatPeer = { id: user.id, username: user.username, color: user.color, emoji: user.emoji };
    setConversations(prev => {
      const m = new Map<string, ChatConversation>(prev);
      if (!m.has(user.id)) m.set(user.id, { peer, messages: [], unread: 0, state: 'requesting' });
      return m;
    });
    setOpenChatId(user.id);
    socket.sendChatRequest(user.id);
  }, [socket]);

  const handleAcceptChat = useCallback(() => {
    if (!incomingRequest) return;
    const { from } = incomingRequest;
    socket.acceptChat(from.id);
    setConversations(prev => { const m = new Map<string, ChatConversation>(prev); m.set(from.id, { peer: from, messages: [], unread: 0, state: 'active' }); return m; });
    setOpenChatId(from.id);
    setIncomingRequest(null);
  }, [incomingRequest, socket]);

  const handleDeclineChat = useCallback(() => {
    if (!incomingRequest) return;
    socket.declineChat(incomingRequest.from.id);
    setIncomingRequest(null);
  }, [incomingRequest, socket]);

  const handleSendMessage = useCallback((toId: string, text: string) => {
    socket.sendMessage(toId, text);
    setConversations(prev => {
      const m = new Map<string, ChatConversation>(prev);
      const ex = m.get(toId);
      if (!ex) return prev;
      const msg = { id: `${Date.now()}-${Math.random()}`, fromMe: true, text, timestamp: Date.now() };
      m.set(toId, { ...ex, messages: [...ex.messages, msg] });
      return m;
    });
  }, [socket]);

  const handleOpenProfile = useCallback((user: NearbyUser) => {
    setViewedProfile(user);
    socket.getRatings(user.id);
  }, [socket]);

  const handleSendRating = useCallback((vibe: string, note: string) => {
    if (!ratingTarget) return;
    socket.sendRating(ratingTarget.id, vibe, note);
    setMyRatings(prev => ({ ...prev, [ratingTarget.id]: vibe }));
  }, [socket, ratingTarget]);

  const handleCloseChat = useCallback((id: string) => {
    socket.closeChat(id);
    setConversations(prev => { const m = new Map<string, ChatConversation>(prev); m.delete(id); return m; });
    if (openChatId === id) setOpenChatId(null);
  }, [socket, openChatId]);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!session) return <AuthScreen onSuccess={(s) => setSession(s)} />;

  // ── Profile gate ───────────────────────────────────────────────────────────
  if (!profile) return <SetupScreen onComplete={handleSetupComplete} initialUsername={session.username} />;

  const chatStatusUI = CHAT_STATUS_UI[chatStatus];
  const openConvs = [...conversations.values()];

  return (
    <div className="app-bg h-screen flex overflow-hidden">
      {/* ── Left panel ─────────────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 flex flex-col h-full border-r"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <header className="flex-shrink-0">
          {/* App wordmark */}
          <div className="flex items-center justify-center px-4 pt-4 pb-2">
            <MeloSongLockup markSize={22} textSize="text-xl" />
          </div>
          {/* User row */}
          <div className="flex items-center gap-2 px-4 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Avatar — click to edit profile */}
          <button onClick={() => setShowProfileEditor(true)} className="relative flex-shrink-0 group">
            {profile.photos?.[0] ? (
              <img src={profile.photos[0]} className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-white/30 transition-all" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg group-hover:ring-2 group-hover:ring-white/30 transition-all"
                style={{ background: profile.color }}>{profile.emoji}</div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-none truncate">{profile.username}</div>
            <div className="text-xs leading-none mt-0.5 text-white/30">membre MeloSong</div>
          </div>

          {/* Chat status */}
          <button onClick={handleChatStatusCycle}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all hover:opacity-80"
            style={{ background: chatStatusUI.color + '18', border: `1px solid ${chatStatusUI.color}33` }}
            title="Changer ta disponibilité">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chatStatusUI.color }} />
            <span style={{ color: chatStatusUI.color }} className="font-medium hidden sm:inline">{chatStatusUI.label}</span>
          </button>

          {/* Connection */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full
            ${socket.connected ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ background: socket.connected ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
            {socket.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>

          {/* Edit profile */}
          <button onClick={() => setShowProfileEditor(true)} title="Modifier mon profil"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30
              hover:text-white/60 hover:bg-white/10 transition-colors">
            <UserCircle2 className="w-4 h-4" />
          </button>

          {/* Donate app */}
          <button onClick={() => setShowDonateApp(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-pink-400/50
              hover:text-pink-400 hover:bg-pink-400/10 transition-colors" title="Soutenir MeloSong">
            <Heart className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button onClick={() => { localStorage.removeItem(PROFILE_KEY); logout(); setProfile(null); setSession(null); setJoined(false); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20
              hover:text-white/50 hover:bg-white/10 transition-colors text-sm" title="Se déconnecter">
            ↩
          </button>
          </div>{/* end user row */}
        </header>

        {/* Now playing */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">J'écoute en ce moment</div>
          <NowPlaying profile={profile} track={myTrack} jamUrl={myJamUrl} onEdit={() => setShowTrackInput(true)} />
          {/* Go Live button */}
          <button onClick={() => setShowLiveBroadcast(true)}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
            style={amLive
              ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }
              : { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }
            }>
            <span className={`w-2 h-2 bg-red-500 rounded-full ${amLive ? 'animate-pulse' : ''}`} />
            {amLive ? `En direct — ${liveViewers} spectateur${liveViewers > 1 ? 's' : ''}` : 'Démarrer un Live'}
          </button>
        </div>

        {/* Location status */}
        {!geo.position && (
          <div className="px-4 flex-shrink-0">
            {geo.loading ? (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-2 text-xs text-white/40"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> GPS en cours…
              </div>
            ) : (
              <>
                {geo.error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl mb-2 text-xs text-red-300"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                    <span className="flex-1">{geo.error}</span>
                    <button onClick={geo.request} className="underline whitespace-nowrap">Réessayer</button>
                  </div>
                )}
                <button onClick={geo.request}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-1.5 text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                  <Navigation className="w-4 h-4" /> Activer le GPS
                </button>
                <button onClick={() => setShowGpsPicker(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl mb-2 text-xs font-medium transition-all active:scale-95 text-white/50 hover:text-white/80"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <MapPin className="w-3.5 h-3.5" /> Choisir sur la carte
                </button>
              </>
            )}
          </div>
        )}

        {/* Tabs: Proximité / Découvrir */}
        <div className="flex gap-1 px-4 pb-2 flex-shrink-0">
          {([
            ['nearby',   '🎵', 'Proximité'],
            ['discover', '🔴', 'Découvrir'],
          ] as const).map(([id, icon, label]) => (
            <button key={id} onClick={() => setView(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={view === id
                ? { background: id === 'discover' ? 'rgba(239,68,68,0.2)' : profile.color + '22',
                    color: id === 'discover' ? '#ef4444' : profile.color }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
              {icon} {label}
              {id === 'discover' && socket.publicLives.length > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full text-xs font-black flex items-center justify-center bg-red-500 text-white" style={{ fontSize: 9 }}>
                  {socket.publicLives.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 px-4 pb-4 overflow-hidden flex flex-col">
          {view === 'nearby' ? (
            <NearbyList
              users={socket.nearbyUsers}
              radius={radius}
              onRadiusChange={handleRadiusChange}
              onSelectUser={(pos) => setFocusPosition(pos)}
              onChatUser={handleStartChat}
              onViewProfile={handleOpenProfile}
              onWatchLive={(user) => setWatchingLive(user)}
              myChatStatus={chatStatus}
              accentColor={profile.color}
            />
          ) : (
            <DiscoverTab
              lives={socket.publicLives}
              onWatch={(live) => setWatchingLive(live as unknown as NearbyUser)}
              onRefresh={socket.getPublicLivesReq}
              accentColor={profile.color}
            />
          )}
        </div>
      </aside>

      {/* ── Right panel: full map ─────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Ad banner */}
        <AdBanner />

        {/* Map or empty state */}
        <div className="flex-1 relative overflow-hidden">
        {geo.position ? (
          <MapView myPosition={geo.position} profile={profile} nearbyUsers={socket.nearbyUsers} focusPosition={focusPosition}
            tileUrl={mapStyle.url} tileUrl2={mapStyle.url2} attribution={mapStyle.attribution} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
            <MeloSongMark size={72} className="mb-3 opacity-60" />
            <MeloSongLockup markSize={30} textSize="text-4xl" className="mb-2" />
            <p className="text-sm text-white/40 font-medium">Découvre la musique autour de toi</p>
            <p className="text-xs text-white/25 max-w-xs mt-1 text-center">Active la géolocalisation pour voir les auditeurs à proximité</p>
            {geo.loading ? (
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Loader2 className="w-4 h-4 animate-spin" /> GPS en cours…
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {geo.error && (
                  <p className="text-xs text-red-400 text-center max-w-xs">{geo.error}</p>
                )}
                <button onClick={geo.request}
                  className="flex items-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95 shadow-lg hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                  <Navigation className="w-4 h-4" /> Activer le GPS
                </button>
                <button onClick={() => setShowGpsPicker(true)}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <MapPin className="w-4 h-4" /> Choisir sur la carte
                </button>
              </div>
            )}
          </div>
        )}

        {/* Style bar */}
        <MapStyleBar current={mapStyle.id} onChange={setMapStyle} />

        {/* Listener count */}
        {geo.position && socket.nearbyUsers.length > 0 && (
          <div className="absolute top-4 right-4 z-[500] glass rounded-2xl px-4 py-2.5 animate-fade-in">
            <div className="text-xs text-white/50 font-medium">Auditeurs proches</div>
            <div className="text-2xl font-bold gradient-text">{socket.nearbyUsers.length}</div>
          </div>
        )}
        </div>{/* end map wrapper */}
      </main>

      {/* ── Modals & overlays ─────────────────────────────── */}
      {showTrackInput && (
        <TrackInput currentTrack={myTrack} jamUrl={myJamUrl} onSave={handleTrackSave} onClose={() => setShowTrackInput(false)} accentColor={profile.color} />
      )}

      {showProfileEditor && (
        <ProfileEditor profile={profile} jamUrl={myJamUrl} onSave={handleProfileSave}
          onClose={() => setShowProfileEditor(false)} onOpenCamera={() => { setShowProfileEditor(false); setShowCamera(true); }} />
      )}

      {viewedProfile && (
        <ProfileModal
          user={viewedProfile}
          onClose={() => setViewedProfile(null)}
          onChat={() => { handleStartChat(viewedProfile); setViewedProfile(null); }}
          onRate={() => { setRatingTarget(viewedProfile); setViewedProfile(null); }}
          onTip={() => { setDonateTarget(viewedProfile); setViewedProfile(null); }}
          canChat={viewedProfile.chatStatus !== 'dnd'}
          ratings={ratingsCache[viewedProfile.id]}
          myRating={myRatings[viewedProfile.id]}
        />
      )}

      {incomingRequest && (
        <ChatNotification request={incomingRequest} onAccept={handleAcceptChat} onDecline={handleDeclineChat} />
      )}

      {openConvs.map((conv, i) => (
        <ChatWindow key={conv.peer.id} conv={conv} onSend={(text) => handleSendMessage(conv.peer.id, text)}
          onClose={() => handleCloseChat(conv.peer.id)} myColor={profile.color} index={i} />
      ))}

      {/* Live broadcast */}
      {showLiveBroadcast && (
        <LiveBroadcast
          profile={profile}
          viewers={liveViewers}
          isLive={amLive}
          onStartLive={(title, isPublic) => { socket.startLive(title, isPublic); setAmLive(true); }}
          onUpdateLive={(title, isPublic) => socket.updateLive(title, isPublic)}
          onStopLive={() => { socket.stopLive(); setAmLive(false); setLiveViewers(0); setShowLiveBroadcast(false); }}
          onSendOffer={socket.sendOffer}
          onSendIce={socket.sendIce}
          onAnswerReceived={(cb) => socket.registerLiveCallbacks({ ...{}, onLiveAnswer: (from, answer) => cb(from, answer) })}
          onIceReceived={(cb) => socket.registerLiveCallbacks({ ...{}, onLiveIce: (from, c) => cb(from, c) })}
          onViewerJoined={(cb) => socket.registerLiveCallbacks({ ...{}, onViewerJoined: cb })}
          onViewerLeft={(cb) => socket.registerLiveCallbacks({ ...{}, onViewerLeft: cb })}
        />
      )}

      {/* Live viewer */}
      {watchingLive && (
        <LiveViewer
          broadcaster={watchingLive as NearbyUser}
          myId=""
          onClose={() => setWatchingLive(null)}
          onJoinLive={socket.joinLive}
          onLeaveLive={socket.leaveLive}
          onSendAnswer={socket.sendAnswer}
          onSendIce={socket.sendIce}
          onOfferReceived={(cb) => socket.registerLiveCallbacks({ ...{}, onLiveOffer: cb })}
          onIceReceived={(cb) => socket.registerLiveCallbacks({ ...{}, onLiveIce: cb })}
          onLiveEnded={(cb) => socket.registerLiveCallbacks({ ...{}, onLiveEnded: cb })}
        />
      )}

      {/* Camera capture */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* User tip */}
      {donateTarget && (
        <DonateUser user={donateTarget} onClose={() => setDonateTarget(null)} />
      )}

      {/* App donation */}
      {showDonateApp && (
        <DonateApp accentColor={profile.color} onClose={() => setShowDonateApp(false)} />
      )}

      {/* Rating picker */}
      {ratingTarget && (
        <RatingPicker
          user={ratingTarget}
          alreadyRated={myRatings[ratingTarget.id]}
          onSubmit={handleSendRating}
          onClose={() => setRatingTarget(null)}
        />
      )}

      {/* GPS Picker fullscreen */}
      {showGpsPicker && (
        <GpsPicker
          accentColor={profile.color}
          onConfirm={(coords) => { geo.setManual(coords); setShowGpsPicker(false); }}
          onClose={() => setShowGpsPicker(false)}
        />
      )}
    </div>
  );
}
