import { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, Map as MapIcon, List, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import SetupScreen from './components/SetupScreen';
import NowPlaying from './components/NowPlaying';
import TrackInput from './components/TrackInput';
import NearbyList from './components/NearbyList';
import MapView from './components/MapView';
import ChatWindow from './components/ChatWindow';
import ChatNotification from './components/ChatNotification';
import { useGeolocation } from './hooks/useGeolocation';
import { useSocket } from './hooks/useSocket';
import type { UserProfile, Track, Coordinates, ChatStatus, ChatConversation, IncomingChatRequest, NearbyUser, ChatPeer } from './types';

const PROFILE_KEY = 'wl_profile';
const CHAT_STATUS_KEY = 'wl_chat_status';

function loadProfile(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null'); } catch { return null; }
}
function loadChatStatus(): ChatStatus {
  return (localStorage.getItem(CHAT_STATUS_KEY) as ChatStatus) ?? 'available';
}

const CHAT_STATUS_UI: Record<ChatStatus, { label: string; color: string; dot: string; next: ChatStatus }> = {
  available: { label: 'Disponible',      color: '#10b981', dot: '#10b981', next: 'busy'      },
  busy:      { label: 'Occupé·e',        color: '#f59e0b', dot: '#f59e0b', next: 'dnd'       },
  dnd:       { label: 'Ne pas déranger', color: '#ef4444', dot: '#ef4444', next: 'available' },
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);
  const [myTrack, setMyTrack] = useState<Track | null>(null);
  const [radius, setRadius] = useState(2000);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(loadChatStatus);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [showTrackInput, setShowTrackInput] = useState(false);
  const [focusPosition, setFocusPosition] = useState<Coordinates | null>(null);
  const [joined, setJoined] = useState(false);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Map<string, ChatConversation>>(() => new Map<string, ChatConversation>());
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<IncomingChatRequest | null>(null);
  const pendingChatRef = useRef<Record<string, ChatPeer>>({});

  const geo = useGeolocation();
  const socket = useSocket();

  // ── Register chat callbacks ──────────────────────────────────────────────────
  useEffect(() => {
    socket.registerChatCallbacks({
      onChatRequest: (from) => {
        setIncomingRequest({ from, timestamp: Date.now() });
        pendingChatRef.current[from.id] = from;
      },
      onChatAccepted: (from) => {
        setConversations(prev => {
          const next = new Map(prev);
          const existing = next.get(from.id);
          next.set(from.id, {
            peer: from,
            messages: existing?.messages ?? [],
            unread: 0,
            state: 'active',
          });
          return next;
        });
        setOpenChatId(from.id);
      },
      onChatDeclined: (from, reason) => {
        setConversations(prev => {
          const next = new Map(prev);
          next.set(from.id, {
            peer: from,
            messages: [],
            unread: 0,
            state: 'declined',
            declineReason: reason,
          });
          return next;
        });
        setOpenChatId(from.id);
      },
      onChatMessage: (from, text, timestamp) => {
        setConversations(prev => {
          const next = new Map(prev);
          const existing = next.get(from.id);
          const msg = { id: `${timestamp}-${Math.random()}`, fromMe: false, text, timestamp };
          if (existing) {
            next.set(from.id, {
              ...existing,
              messages: [...existing.messages, msg],
              unread: openChatId === from.id ? 0 : (existing.unread ?? 0) + 1,
              state: 'active',
            });
          } else {
            next.set(from.id, { peer: from, messages: [msg], unread: 1, state: 'active' });
          }
          return next;
        });
        if (openChatId !== from.id) setOpenChatId(from.id);
      },
      onChatClosed: (fromId) => {
        setConversations(prev => {
          const next = new Map(prev);
          const existing = next.get(fromId);
          if (existing) next.set(fromId, { ...existing, state: 'closed' });
          return next;
        });
      },
      onChatUnavailable: (toId) => {
        setConversations(prev => {
          const next = new Map(prev);
          const existing = next.get(toId);
          if (existing) next.set(toId, { ...existing, state: 'unavailable' });
          return next;
        });
      },
    });
  }, [socket, openChatId]);

  // ── Presence ────────────────────────────────────────────────────────────────
  useEffect(() => { if (profile) geo.request(); }, [profile]);

  useEffect(() => {
    if (!profile || !socket.connected || joined) return;
    socket.join(profile, geo.position, myTrack, radius, chatStatus);
    setJoined(true);
  }, [profile, socket.connected, joined]);

  useEffect(() => {
    if (socket.connected && profile && !joined) {
      socket.join(profile, geo.position, myTrack, radius, chatStatus);
      setJoined(true);
    }
    if (!socket.connected) setJoined(false);
  }, [socket.connected]);

  useEffect(() => {
    if (geo.position && joined) socket.updatePosition(geo.position);
  }, [geo.position, joined]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
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

  const handleChatStatusCycle = useCallback(() => {
    const next = CHAT_STATUS_UI[chatStatus].next;
    setChatStatus(next);
    localStorage.setItem(CHAT_STATUS_KEY, next);
    socket.updateChatStatus(next);
  }, [chatStatus, socket]);

  const handleStartChat = useCallback((user: NearbyUser) => {
    const peer: ChatPeer = { id: user.id, username: user.username, color: user.color, emoji: user.emoji };
    setConversations(prev => {
      const next = new Map(prev);
      if (!next.has(user.id)) {
        next.set(user.id, { peer, messages: [], unread: 0, state: 'requesting' });
      }
      return next;
    });
    setOpenChatId(user.id);
    socket.sendChatRequest(user.id);
  }, [socket]);

  const handleAcceptChat = useCallback(() => {
    if (!incomingRequest) return;
    const { from } = incomingRequest;
    socket.acceptChat(from.id);
    setConversations(prev => {
      const next = new Map(prev);
      next.set(from.id, { peer: from, messages: [], unread: 0, state: 'active' });
      return next;
    });
    setOpenChatId(from.id);
    setIncomingRequest(null);
    delete pendingChatRef.current[from.id];
  }, [incomingRequest, socket]);

  const handleDeclineChat = useCallback(() => {
    if (!incomingRequest) return;
    socket.declineChat(incomingRequest.from.id);
    delete pendingChatRef.current[incomingRequest.from.id];
    setIncomingRequest(null);
  }, [incomingRequest, socket]);

  const handleSendMessage = useCallback((toId: string, text: string) => {
    socket.sendMessage(toId, text);
    setConversations(prev => {
      const next = new Map(prev);
      const existing = next.get(toId);
      if (!existing) return prev;
      const msg = { id: `${Date.now()}-${Math.random()}`, fromMe: true, text, timestamp: Date.now() };
      next.set(toId, { ...existing, messages: [...existing.messages, msg] });
      return next;
    });
  }, [socket]);

  const handleCloseChat = useCallback((id: string) => {
    socket.closeChat(id);
    setConversations(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    if (openChatId === id) setOpenChatId(null);
  }, [socket, openChatId]);

  if (!profile) return <SetupScreen onComplete={handleSetupComplete} />;

  const chatStatusUI = CHAT_STATUS_UI[chatStatus];
  const openConvs = [...conversations.values()];

  return (
    <div className="app-bg h-screen flex overflow-hidden">
      {/* ── Left panel ────────────────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 flex flex-col h-full border-r"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <header className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: profile.color }}>
            {profile.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-none">{profile.username}</div>
            <div className="text-xs text-white/30 mt-0.5 leading-none">Wavelength</div>
          </div>

          {/* Chat status toggle */}
          <button
            onClick={handleChatStatusCycle}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all duration-200 hover:opacity-80"
            style={{ background: chatStatusUI.color + '18', border: `1px solid ${chatStatusUI.color}33` }}
            title="Changer ta disponibilité"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: chatStatusUI.color }} />
            <span style={{ color: chatStatusUI.color }} className="font-medium hidden sm:inline">
              {chatStatusUI.label}
            </span>
          </button>

          {/* Connection status */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full
            ${socket.connected ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ background: socket.connected ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
            {socket.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>

          {/* Reset profile */}
          <button
            onClick={() => { localStorage.removeItem(PROFILE_KEY); setProfile(null); setJoined(false); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30
              hover:text-white/60 hover:bg-white/10 transition-colors text-sm"
            title="Changer de profil">↩</button>
        </header>

        {/* Now Playing */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">
            J'écoute en ce moment
          </div>
          <NowPlaying profile={profile} track={myTrack} onEdit={() => setShowTrackInput(true)} />
        </div>

        {/* Location status */}
        {!geo.position && (
          <div className="px-4 flex-shrink-0">
            {geo.error ? (
              <div className="flex items-start gap-2 p-3 rounded-xl mb-2 text-xs text-red-300"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                {geo.error}
                <button onClick={geo.request} className="ml-auto underline whitespace-nowrap">Réessayer</button>
              </div>
            ) : geo.loading ? (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-2 text-xs text-white/40"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Localisation…
              </div>
            ) : (
              <button onClick={geo.request}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-2
                  text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                <Navigation className="w-4 h-4" /> Activer la localisation
              </button>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pb-2 flex-shrink-0">
          {([['list', <List key="l" className="w-3.5 h-3.5" />, 'Proximité'],
             ['map',  <MapIcon key="m" className="w-3.5 h-3.5" />, 'Carte']] as const).map(([id, icon, label]) => (
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
              onChatUser={handleStartChat}
              myChatStatus={chatStatus}
              accentColor={profile.color}
            />
          ) : (
            <div className="flex-1 rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {geo.position ? (
                <MapView myPosition={geo.position} profile={profile} nearbyUsers={socket.nearbyUsers} focusPosition={focusPosition} />
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
          <MapView myPosition={geo.position} profile={profile} nearbyUsers={socket.nearbyUsers} focusPosition={focusPosition} />
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
                <Navigation className="w-4 h-4" /> Activer la localisation
              </button>
            )}
            {geo.loading && <div className="flex items-center gap-2 text-sm text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Localisation…</div>}
          </div>
        )}

        {/* Listener count badge */}
        {geo.position && socket.nearbyUsers.length > 0 && (
          <div className="absolute top-4 right-4 z-[500] glass rounded-2xl px-4 py-2.5 animate-fade-in">
            <div className="text-xs text-white/50 font-medium">Auditeurs proches</div>
            <div className="text-2xl font-bold gradient-text">{socket.nearbyUsers.length}</div>
          </div>
        )}
      </main>

      {/* ── Track input modal ─────────────────────────────── */}
      {showTrackInput && (
        <TrackInput
          currentTrack={myTrack}
          onSave={handleTrackSave}
          onClose={() => setShowTrackInput(false)}
          accentColor={profile.color}
        />
      )}

      {/* ── Incoming chat request notification ───────────── */}
      {incomingRequest && (
        <ChatNotification
          request={incomingRequest}
          onAccept={handleAcceptChat}
          onDecline={handleDeclineChat}
        />
      )}

      {/* ── Chat windows (stacked bottom-right) ──────────── */}
      {openConvs.map((conv, i) => (
        <ChatWindow
          key={conv.peer.id}
          conv={conv}
          onSend={(text) => handleSendMessage(conv.peer.id, text)}
          onClose={() => handleCloseChat(conv.peer.id)}
          myColor={profile.color}
          myEmoji={profile.emoji}
          index={i}
        />
      ))}
    </div>
  );
}
