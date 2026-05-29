import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Minus } from 'lucide-react';
import type { ChatConversation, ChatMessage } from '../types';

interface Props {
  conv: ChatConversation;
  onSend: (text: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  myColor: string;
  myEmoji?: string;
  index: number; // for stacking
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ msg, myColor }: { msg: ChatMessage; myColor: string; peerColor?: string }) {
  return (
    <div className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed
          ${msg.fromMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        style={msg.fromMe
          ? { background: myColor, color: '#fff' }
          : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {msg.text}
        <div className={`text-xs mt-1 ${msg.fromMe ? 'text-white/50' : 'text-white/30'} text-right`}>
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ conv, onSend, onClose, onMinimize, myColor, index }: Props) {
  const [text, setText] = useState('');
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const bottomOffset = 16 + index * 360;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv.messages.length]);

  useEffect(() => {
    if (conv.state === 'active' && !minimized) inputRef.current?.focus();
  }, [conv.state, minimized]);

  function handleSend() {
    const t = text.trim();
    if (!t || conv.state !== 'active') return;
    onSend(t);
    setText('');
  }

  const handleMin = () => {
    setMinimized(m => !m);
    onMinimize?.();
  };

  return (
    <div
      className="fixed z-[600] flex flex-col shadow-2xl animate-slide-up"
      style={{
        right: bottomOffset,
        bottom: 16,
        width: 320,
        maxHeight: minimized ? 52 : 420,
        transition: 'max-height 0.25s ease',
        borderRadius: 20,
        background: 'rgba(18, 18, 30, 0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer flex-shrink-0"
        style={{ borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.07)' }}
        onClick={handleMin}
      >
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
            style={{ background: conv.peer.color }}>
            {conv.peer.emoji}
          </div>
          {conv.state === 'active' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: '#10b981', borderColor: '#12121f' }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{conv.peer.username}</div>
          <div className="text-xs text-white/40">
            {conv.state === 'requesting' && '⏳ En attente…'}
            {conv.state === 'active'     && '💬 En ligne'}
            {conv.state === 'declined'   && '❌ Refusé'}
            {conv.state === 'closed'     && '👋 Conversation fermée'}
            {conv.state === 'unavailable'&& '🔕 Indisponible'}
          </div>
        </div>

        {conv.unread > 0 && minimized && (
          <span className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
            style={{ background: myColor }}>
            {conv.unread}
          </span>
        )}

        <button onClick={e => { e.stopPropagation(); handleMin(); }}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <Minus className="w-3.5 h-3.5 text-white/40" />
        </button>
        <button onClick={e => { e.stopPropagation(); onClose(); }}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ minHeight: 0, maxHeight: 300 }}>
            {conv.state === 'requesting' && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                <div className="text-xs text-white/40">Demande envoyée à {conv.peer.username}…</div>
              </div>
            )}

            {(conv.state === 'declined' || conv.state === 'unavailable') && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <div className="text-3xl">{conv.state === 'declined' ? '🙅' : '🔕'}</div>
                <div className="text-xs text-white/50 px-4">
                  {conv.state === 'declined'
                    ? conv.declineReason === 'dnd'
                      ? `${conv.peer.username} ne veut pas être dérangé·e`
                      : `${conv.peer.username} a décliné la conversation`
                    : `${conv.peer.username} n'est pas disponible`}
                </div>
              </div>
            )}

            {conv.state === 'closed' && conv.messages.length === 0 && (
              <div className="text-xs text-white/30 text-center py-4">Conversation terminée</div>
            )}

            {conv.messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} myColor={myColor} peerColor={conv.peer.color} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {conv.state === 'active' && (
            <div className="flex items-center gap-2 px-3 pb-3 pt-2 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Envoie un message…"
                className="wl-input flex-1 rounded-xl px-3 py-2 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                  disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ background: myColor }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
