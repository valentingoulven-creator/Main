import { useEffect } from 'react';
import { MessageCircle, X, Check } from 'lucide-react';
import type { IncomingChatRequest } from '../types';

interface Props {
  request: IncomingChatRequest;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ChatNotification({ request, onAccept, onDecline }: Props) {
  // Auto-decline after 30s
  useEffect(() => {
    const timer = setTimeout(onDecline, 30000);
    return () => clearTimeout(timer);
  }, [request.from.id]);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[700] flex items-center gap-3
        px-4 py-3 rounded-2xl shadow-2xl animate-pop-in"
      style={{
        background: 'rgba(18,18,30,0.97)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        minWidth: 300,
        maxWidth: 380,
      }}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: request.from.color }}>
        {request.from.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: request.from.color }} />
          <span className="text-xs text-white/50 font-medium">Demande de chat</span>
        </div>
        <div className="text-sm font-bold text-white truncate">
          {request.from.username}
        </div>
        <div className="text-xs text-white/40">veut discuter avec toi</div>
      </div>

      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={onDecline}
          className="w-8 h-8 rounded-xl flex items-center justify-center
            transition-all hover:bg-red-500/20 active:scale-95"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          title="Refuser"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
        <button
          onClick={onAccept}
          className="w-8 h-8 rounded-xl flex items-center justify-center
            transition-all active:scale-95"
          style={{ background: request.from.color }}
          title="Accepter"
        >
          <Check className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
