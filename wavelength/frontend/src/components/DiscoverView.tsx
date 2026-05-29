import { useState, useEffect } from 'react';
import { LayoutList, Play, RefreshCw, Radio, Users, MapPin, ExternalLink } from 'lucide-react';
import type { PublicLive, UserProfile } from '../types';
import { SpotifyLogo, YouTubeLogo } from './SourceLogo';
import LiveFeed from './LiveFeed';
import LiveChat from './LiveChat';

type ViewMode = 'feed' | 'list';

function elapsed(start: number) {
  const s = Math.floor((Date.now() - start) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h`;
}

interface Props {
  lives: PublicLive[];
  onWatch: (live: PublicLive) => void;
  onRefresh: () => void;
  accentColor: string;
  profile: UserProfile;
  onSendDM?: (live: PublicLive) => void;
}

export default function DiscoverView({ lives, onWatch, onRefresh, accentColor, profile, onSendDM }: Props) {
  const [mode, setMode] = useState<ViewMode>('feed');

  useEffect(() => { onRefresh(); }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Toggle bar */}
      <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ background: 'rgba(10,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>

        {/* Live count */}
        <div className="flex items-center gap-1.5 flex-1">
          {lives.length > 0 ? (
            <>
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white">{lives.length} live{lives.length > 1 ? 's' : ''} public{lives.length > 1 ? 's' : ''}</span>
            </>
          ) : (
            <span className="text-xs text-white/40">Aucun live public</span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => setMode('feed')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
            style={mode === 'feed'
              ? { background: '#ef4444', color: '#fff' }
              : { color: 'rgba(255,255,255,0.4)' }}>
            <Play className="w-3.5 h-3.5" /> Feed
          </button>
          <button onClick={() => setMode('list')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
            style={mode === 'list'
              ? { background: accentColor, color: '#fff' }
              : { color: 'rgba(255,255,255,0.4)' }}>
            <LayoutList className="w-3.5 h-3.5" /> Liste
          </button>
        </div>

        {/* Refresh */}
        <button onClick={onRefresh}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
          <RefreshCw className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'feed' ? (
          <LiveFeed lives={lives} onWatch={onWatch} onRefresh={onRefresh} accentColor={accentColor} profile={profile} />
        ) : (
          <ListView lives={lives} onWatch={onWatch} accentColor={accentColor} profile={profile} onSendDM={onSendDM} />
        )}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ lives, onWatch, profile, onSendDM }: { lives: PublicLive[]; onWatch: (l: PublicLive) => void; accentColor?: string; profile: UserProfile; onSendDM?: (l: PublicLive) => void }) {
  const [chatLive, setChatLive] = useState<PublicLive | null>(null);

  if (lives.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="text-5xl mb-2">📡</div>
      <div className="text-base font-bold text-white/40">Aucun live public</div>
      <p className="text-sm text-white/25">Lance un live public pour apparaître ici</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
        {lives.map(live => (
          <LiveListCard key={live.id} live={live} onWatch={() => onWatch(live)} onChat={() => setChatLive(live)} onDM={onSendDM ? () => onSendDM(live) : undefined} />
        ))}
      </div>

      {/* Chat overlay for selected live */}
      {chatLive && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setChatLive(null)}>
          <div className="w-full max-w-sm h-96 rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
            <LiveChat broadcasterId={chatLive.id} profile={profile} isOverlay={false} onClose={() => setChatLive(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function LiveListCard({ live, onWatch, onChat, onDM }: { live: PublicLive; onWatch: () => void; onChat: () => void; onDM?: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] flex flex-col"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>

      {/* Thumbnail */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 130 }}>
        {live.photos?.[0] ? (
          <img src={live.photos[0]} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, ${live.color}44, ${live.color}11)` }}>
            {live.emoji}
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.8))' }} />

        {/* LIVE badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: '#ef4444' }}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-black text-white">LIVE</span>
        </div>

        {/* Viewers */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <Users className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white">{live.viewers}</span>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
          <div className="text-sm font-black text-white truncate">{live.liveTitle}</div>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
          style={{ background: live.color }}>
          {live.photos?.[0]
            ? <img src={live.photos[0]} className="w-8 h-8 rounded-full object-cover" />
            : live.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{live.username}</div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            {live.address && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{live.address}</span>}
            <span>· {elapsed(live.liveStart)}</span>
          </div>
        </div>
        {live.track && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {live.track.source === 'spotify' ? <SpotifyLogo size={13} /> : <YouTubeLogo size={13} />}
            <span className="text-xs text-white/40 truncate max-w-[60px]">{live.track.title}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 px-3 pb-3 mt-auto">
        <button onClick={onWatch}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          <Radio className="w-3.5 h-3.5" /> Rejoindre
        </button>
        {onDM && (
          <button onClick={onDM}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
            title="Message privé">
            ✉️
          </button>
        )}
        <button onClick={onChat}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          💬
        </button>
        {live.track?.url && (
          <a href={live.track.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center px-2.5 py-2 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
