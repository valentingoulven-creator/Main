import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, X, ChevronDown } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import type { UserProfile } from '../types';

export interface LiveChatMsg {
  id: string;
  userId: string;
  username: string;
  color: string;
  emoji: string;
  photo?: string | null;
  text: string;
  timestamp: number;
}

interface Props {
  broadcasterId: string;
  profile: UserProfile;
  isOverlay?: boolean;      // true = transparent overlay on video, false = side panel
  onClose?: () => void;
}

const SOCKET_INSTANCE_KEY = '__melo_socket__';

function getSocket(): Socket {
  if (!((window as unknown) as Record<string, unknown>)[SOCKET_INSTANCE_KEY]) {
    ((window as unknown) as Record<string, unknown>)[SOCKET_INSTANCE_KEY] = io('/', {
      path: '/socket.io', transports: ['websocket', 'polling'],
    });
  }
  return ((window as unknown) as Record<string, unknown>)[SOCKET_INSTANCE_KEY] as Socket;
}

export default function LiveChat({ broadcasterId, profile, isOverlay = true, onClose }: Props) {
  const [messages, setMessages] = useState<LiveChatMsg[]>([]);
  const [text, setText]         = useState('');
  const [open, setOpen]         = useState(!isOverlay);
  const [unread, setUnread]     = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const listRef   = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket>(getSocket());

  // Join chat room
  useEffect(() => {
    const socket = socketRef.current;
    socket.emit('live_chat_join', { broadcasterId });

    const handler = (msg: LiveChatMsg) => {
      setMessages(prev => [...prev.slice(-199), msg]);
      if (!open || !atBottom) setUnread(u => u + 1);
    };
    socket.on('live_chat_message', handler);

    return () => {
      socket.emit('live_chat_leave', { broadcasterId });
      socket.off('live_chat_message', handler);
    };
  }, [broadcasterId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (atBottom && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, atBottom]);

  // Reset unread when opened
  useEffect(() => {
    if (open) { setUnread(0); setAtBottom(true); }
  }, [open]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    setAtBottom(isBottom);
    if (isBottom) setUnread(0);
  }, []);

  function send() {
    const t = text.trim();
    if (!t) return;
    socketRef.current.emit('live_chat_message', {
      broadcasterId,
      text: t,
      username: profile.username,
      color:    profile.color,
      emoji:    profile.emoji,
      photo:    profile.photos?.[0] ?? null,
    });
    setText('');
    setAtBottom(true);
  }

  // ── Overlay toggle button (when closed) ──────────────────────────────────────
  if (isOverlay && !open) return (
    <button
      onClick={() => { setOpen(true); setUnread(0); }}
      className="absolute bottom-24 right-4 z-[501] flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-2xl transition-all active:scale-95 hover:scale-105"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <MessageCircle className="w-4 h-4 text-white" />
      <span className="text-xs font-bold text-white">Chat</span>
      {unread > 0 && (
        <span className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center bg-red-500 text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );

  return (
    <div
      className={`flex flex-col z-[501] ${isOverlay
        ? 'absolute bottom-0 right-0 w-72 h-[60%] rounded-2xl overflow-hidden m-3'
        : 'w-full h-full border-l'}`}
      style={isOverlay
        ? { background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }
        : { background: 'rgba(10,10,20,0.98)', borderColor: 'rgba(255,255,255,0.07)' }
      }
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <MessageCircle className="w-3.5 h-3.5 text-white/50" />
        <span className="text-xs font-bold text-white flex-1">Chat en direct</span>
        {messages.length > 0 && (
          <span className="text-xs text-white/30">{messages.length} msg</span>
        )}
        {isOverlay && (
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        )}
        {onClose && !isOverlay && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5"
        style={{ scrollbarWidth: 'thin' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageCircle className="w-8 h-8 text-white/10" />
            <p className="text-xs text-white/25">Sois le premier à écrire !</p>
          </div>
        ) : (
          messages.map(msg => <ChatBubble key={msg.id} msg={msg} isOwn={msg.userId === socketRef.current.id} />)
        )}
      </div>

      {/* Scroll to bottom */}
      {!atBottom && (
        <button onClick={() => { listRef.current!.scrollTop = listRef.current!.scrollHeight; setAtBottom(true); setUnread(0); }}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white transition-all hover:opacity-80"
          style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <ChevronDown className="w-3.5 h-3.5" />
          {unread > 0 ? `${unread} nouveaux` : 'Défiler vers le bas'}
        </button>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-2 py-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {profile.photos?.[0] ? (
          <img src={profile.photos[0]} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
            style={{ background: profile.color }}>{profile.emoji}</div>
        )}
        <input
          className="flex-1 text-xs bg-transparent text-white placeholder-white/30 outline-none min-w-0"
          style={{ caretColor: profile.color }}
          placeholder="Écris un message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          maxLength={200}
        />
        <button onClick={send} disabled={!text.trim()}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
          style={{ background: profile.color }}>
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Individual bubble ─────────────────────────────────────────────────────────

function ChatBubble({ msg, isOwn }: { msg: LiveChatMsg; isOwn: boolean }) {
  return (
    <div className={`flex items-start gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {msg.photo ? (
        <img src={msg.photo} className="w-5 h-5 rounded-full object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
          style={{ background: msg.color, fontSize: 9 }}>{msg.emoji}</div>
      )}
      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        <span className="text-xs font-bold" style={{ color: msg.color }}>{msg.username}</span>
        <div className="text-xs text-white/85 leading-relaxed break-words rounded-xl px-2.5 py-1.5"
          style={isOwn
            ? { background: msg.color + 'cc', borderRadius: '12px 4px 12px 12px' }
            : { background: 'rgba(255,255,255,0.1)', borderRadius: '4px 12px 12px 12px' }
          }>
          {msg.text}
        </div>
      </div>
    </div>
  );
}
