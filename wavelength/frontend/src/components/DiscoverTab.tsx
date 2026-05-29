import { useEffect } from 'react';
import { Radio, Users, MapPin, RefreshCw } from 'lucide-react';
import type { PublicLive } from '../types';
import { SpotifyLogo, YouTubeLogo, ManualMusicLogo } from './SourceLogo';

interface Props {
  lives: PublicLive[];
  onWatch: (live: PublicLive) => void;
  onRefresh: () => void;
  accentColor: string;
}

function elapsed(start: number) {
  const s = Math.floor((Date.now() - start) / 1000);
  if (s < 60)  return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h`;
}

export default function DiscoverTab({ lives, onWatch, onRefresh, accentColor }: Props) {
  // Auto-refresh every 15s
  useEffect(() => {
    onRefresh();
    const t = setInterval(onRefresh, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-white">Lives publics</span>
          {lives.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
              {lives.length}
            </span>
          )}
        </div>
        <button onClick={onRefresh}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
          <RefreshCw className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        {lives.length === 0 ? (
          <EmptyState accentColor={accentColor} />
        ) : (
          lives.map(live => (
            <LiveCard key={live.id} live={live} onWatch={() => onWatch(live)} />
          ))
        )}
      </div>
    </div>
  );
}

function LiveCard({ live, onWatch }: { live: PublicLive; onWatch: () => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
      style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
      onClick={onWatch}
    >
      {/* Thumbnail / avatar zone */}
      <div className="relative overflow-hidden"
        style={{ height: 110, background: `linear-gradient(135deg, ${live.color}22, ${live.color}08)` }}>
        {live.photos?.[0] ? (
          <img src={live.photos[0]} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {live.emoji}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75))' }} />

        {/* LIVE badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: '#ef4444' }}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-black text-white">LIVE</span>
        </div>

        {/* Viewer count */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <Users className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white">{live.viewers}</span>
        </div>

        {/* Title + name at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
          <div className="text-sm font-black text-white truncate leading-tight">{live.liveTitle}</div>
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
            {live.address && (
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{live.address}</span>
            )}
            <span>• {elapsed(live.liveStart)}</span>
          </div>
        </div>

        {/* Track info */}
        {live.track && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {live.track.source === 'spotify'
              ? <SpotifyLogo size={14} />
              : live.track.source === 'youtube'
              ? <YouTubeLogo size={14} />
              : <ManualMusicLogo size={14} />}
            <span className="text-xs text-white/50 truncate max-w-[80px]">{live.track.title}</span>
          </div>
        )}
      </div>

      {/* Watch button */}
      <div className="px-3 pb-3">
        <button className="w-full py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          <Radio className="w-4 h-4" /> Regarder
        </button>
      </div>
    </div>
  );
}

function EmptyState({ accentColor: _ }: { accentColor: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <Radio className="w-7 h-7 text-red-400 opacity-60" />
      </div>
      <div className="text-sm font-bold text-white/40">Aucun live public en cours</div>
      <p className="text-xs text-white/25 max-w-xs leading-relaxed">
        Les lives publics apparaissent ici en temps réel. Lance toi !
      </p>
      <div className="text-xs text-white/20 mt-1">Rafraîchissement auto toutes les 15s</div>
    </div>
  );
}
