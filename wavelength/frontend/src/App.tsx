import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Navigation, AlertCircle, Loader2, UserCircle2 } from 'lucide-react';
import { MeloSongLockup, MeloSongMark } from './components/MeloSongLogo';
import SetupScreen from './components/SetupScreen';
import NowPlaying from './components/NowPlaying';
import TrackInput from './components/TrackInput';
import NearbyList from './components/NearbyList';
import MapView from './components/MapView';
import ChatWindow from './components/ChatWindow';
import ChatNotification from './components/ChatNotification';
import ProfileModal from './components/ProfileModal';
import ProfileEditor from './components/ProfileEditor';
import { useGeolocation } from './hooks/useGeolocation';
import LocationFallback from './components/LocationFallback';
import { useSocket } from './hooks/useSocket';
import type { UserProfile, Track, Coordinates, ChatStatus, ChatConversation, IncomingChatRequest, NearbyUser, ChatPeer } from './types';

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
  const [profile, setProfile]       = useState<UserProfile | null>(loadProfile);
  const [myTrack, setMyTrack]       = useState<Track | null>(null);
  const [myJamUrl, setMyJamUrl]     = useState<string>(() => localStorage.getItem(JAM_KEY) ?? '');
  const [radius, setRadius]         = useState(2000);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(loadChatStatus);
  const [showTrackInput, setShowTrackInput] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [focusPosition, setFocusPosition]   = useState<Coordinates | null>(null);
  const [viewedProfile, setViewedProfile]   = useState<NearbyUser | null>(null);
  const [joined, setJoined] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<Map<string, ChatConversation>>(() => new Map<string, ChatConversation>());
  const [openChatId, setOpenChatId]       = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<IncomingChatRequest | null>(null);

  const geo    = useGeolocation();
  const socket = useSocket();

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
      onChatClosed: (fromId) => {
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

  const handleCloseChat = useCallback((id: string) => {
    socket.closeChat(id);
    setConversations(prev => { const m = new Map<string, ChatConversation>(prev); m.delete(id); return m; });
    if (openChatId === id) setOpenChatId(null);
  }, [socket, openChatId]);

  if (!profile) return <SetupScreen onComplete={handleSetupComplete} />;

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

          {/* Reset */}
          <button onClick={() => { localStorage.removeItem(PROFILE_KEY); setProfile(null); setJoined(false); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20
              hover:text-white/50 hover:bg-white/10 transition-colors text-sm" title="Changer de compte">
            ↩
          </button>
          </div>{/* end user row */}
        </header>

        {/* Now playing */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">J'écoute en ce moment</div>
          <NowPlaying profile={profile} track={myTrack} jamUrl={myJamUrl} onEdit={() => setShowTrackInput(true)} />
        </div>

        {/* Location status */}
        {!geo.position && (
          geo.unavailable ? (
            <LocationFallback
              accentColor={profile.color}
              onLocate={(coords) => { geo.setManual(coords); }}
              onRetryGPS={geo.request}
            />
          ) : geo.error ? (
            <div className="px-4 flex-shrink-0">
              <div className="flex items-start gap-2 p-3 rounded-xl mb-2 text-xs text-red-300"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                {geo.error}
                <button onClick={geo.request} className="ml-auto underline whitespace-nowrap">Réessayer</button>
              </div>
            </div>
          ) : geo.loading ? (
            <div className="px-4 flex-shrink-0">
              <div className="flex items-center gap-2 p-3 rounded-xl mb-2 text-xs text-white/40" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Localisation en cours…
              </div>
            </div>
          ) : (
            <div className="px-4 flex-shrink-0">
              <button onClick={geo.request}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-2 text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                <Navigation className="w-4 h-4" /> Activer la localisation
              </button>
            </div>
          )
        )}

        {/* Content — always nearby list */}
        <div className="flex-1 min-h-0 px-4 pb-4 overflow-hidden flex flex-col">
          <NearbyList
            users={socket.nearbyUsers}
            radius={radius}
            onRadiusChange={handleRadiusChange}
            onSelectUser={(pos) => setFocusPosition(pos)}
            onChatUser={handleStartChat}
            onViewProfile={setViewedProfile}
            myChatStatus={chatStatus}
            accentColor={profile.color}
          />
        </div>
      </aside>

      {/* ── Right panel: full map ─────────────────────────── */}
      <main className="flex-1 relative overflow-hidden">
        {geo.position ? (
          <MapView myPosition={geo.position} profile={profile} nearbyUsers={socket.nearbyUsers} focusPosition={focusPosition} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
            <MeloSongMark size={72} color="rgba(139,92,246,0.6)" className="mb-3" />
            <MeloSongLockup markSize={30} textSize="text-4xl" className="mb-2" />
            <p className="text-sm text-white/40 font-medium">Découvre la musique autour de toi</p>
            <p className="text-xs text-white/25 max-w-xs mt-1 text-center">Active la géolocalisation pour voir les auditeurs à proximité</p>
            {geo.unavailable ? (
              <div className="w-full max-w-sm">
                <LocationFallback
                  accentColor={profile.color}
                  onLocate={(coords) => { geo.setManual(coords); }}
                  onRetryGPS={geo.request}
                />
              </div>
            ) : !geo.loading && !geo.error ? (
              <button onClick={geo.request}
                className="flex items-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95 shadow-lg hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                <Navigation className="w-4 h-4" /> Activer la localisation
              </button>
            ) : geo.loading ? (
              <div className="flex items-center gap-2 text-sm text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Localisation…</div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-red-400 max-w-xs text-center">{geo.error}</div>
            )}
          </div>
        )}

        {/* MeloSong watermark on map */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-none select-none opacity-50">
          <MeloSongLockup markSize={16} textSize="text-sm" />
        </div>

        {/* Listener count */}
        {geo.position && socket.nearbyUsers.length > 0 && (
          <div className="absolute top-4 right-4 z-[500] glass rounded-2xl px-4 py-2.5 animate-fade-in">
            <div className="text-xs text-white/50 font-medium">Auditeurs proches</div>
            <div className="text-2xl font-bold gradient-text">{socket.nearbyUsers.length}</div>
          </div>
        )}
      </main>

      {/* ── Modals & overlays ─────────────────────────────── */}
      {showTrackInput && (
        <TrackInput currentTrack={myTrack} jamUrl={myJamUrl} onSave={handleTrackSave} onClose={() => setShowTrackInput(false)} accentColor={profile.color} />
      )}

      {showProfileEditor && (
        <ProfileEditor profile={profile} jamUrl={myJamUrl} onSave={handleProfileSave} onClose={() => setShowProfileEditor(false)} />
      )}

      {viewedProfile && (
        <ProfileModal
          user={viewedProfile}
          onClose={() => setViewedProfile(null)}
          onChat={() => { handleStartChat(viewedProfile); setViewedProfile(null); }}
          canChat={viewedProfile.chatStatus !== 'dnd'}
        />
      )}

      {incomingRequest && (
        <ChatNotification request={incomingRequest} onAccept={handleAcceptChat} onDecline={handleDeclineChat} />
      )}

      {openConvs.map((conv, i) => (
        <ChatWindow key={conv.peer.id} conv={conv} onSend={(text) => handleSendMessage(conv.peer.id, text)}
          onClose={() => handleCloseChat(conv.peer.id)} myColor={profile.color} index={i} />
      ))}
    </div>
  );
}
