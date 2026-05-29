import { useState, useRef, useCallback, useEffect } from 'react';
import { Radio, Users, Music2, MapPin, ChevronUp, ChevronDown, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import type { PublicLive } from '../types';
import { SpotifyLogo, YouTubeLogo } from './SourceLogo';

function elapsed(start: number) {
  const s = Math.floor((Date.now() - start) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h`;
}

interface LiveCardProps {
  live: PublicLive;
  isActive: boolean;
  onWatch: () => void;
  accentColor: string;
}

function LiveCard({ live, onWatch }: LiveCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 200 + 10));

  function handleLike() {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ userSelect: 'none' }}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        {live.photos?.[0] ? (
          <img src={live.photos[0]} className="w-full h-full object-cover scale-110"
            style={{ filter: 'blur(2px) brightness(0.55)' }} />
        ) : (
          <div className="w-full h-full"
            style={{ background: `radial-gradient(ellipse at center, ${live.color}55 0%, #0d0d1a 70%)` }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-between p-6">
        {/* Top — LIVE badge + viewers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white"
              style={{ background: '#ef4444' }}>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              EN DIRECT
            </span>
            <span className="flex items-center gap-1 text-xs text-white/80 font-semibold">
              <Users className="w-3.5 h-3.5" /> {live.viewers}
            </span>
          </div>
          <span className="text-xs text-white/50">{elapsed(live.liveStart)}</span>
        </div>

        {/* Center — big avatar */}
        <div className="flex flex-col items-center gap-3">
          {live.photos?.[0] ? (
            <img src={live.photos[0]} className="w-24 h-24 rounded-full object-cover shadow-2xl"
              style={{ border: `3px solid ${live.color}` }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl"
              style={{ background: live.color, border: `3px solid white` }}>
              {live.emoji}
            </div>
          )}
          <div className="text-center">
            <div className="text-xl font-black text-white">{live.username}</div>
            {live.address && (
              <div className="flex items-center justify-center gap-1 text-sm text-white/50 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />{live.address}
              </div>
            )}
          </div>

          {/* Track playing */}
          {live.track && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl max-w-xs w-full"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              {live.track.albumArt ? (
                <img src={live.track.albumArt} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 animate-spin-slow" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: live.color + '33' }}>
                  <Music2 className="w-5 h-5 text-white/60" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{live.track.title}</div>
                <div className="flex items-center gap-1.5">
                  {live.track.source === 'spotify' ? <SpotifyLogo size={11} /> : <YouTubeLogo size={11} />}
                  <span className="text-xs text-white/50 truncate">{live.track.artist ?? live.track.source}</span>
                </div>
              </div>
              {live.track.url && (
                <a href={live.track.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <ExternalLink className="w-4 h-4 text-white/40" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bottom — title + actions */}
        <div className="flex items-end gap-4">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="text-base font-black text-white mb-1 drop-shadow-lg">{live.liveTitle}</div>
            {live.bio && <p className="text-sm text-white/60 leading-relaxed line-clamp-2">{live.bio}</p>}
          </div>

          {/* Right: actions */}
          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            {/* Like */}
            <button onClick={handleLike} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: liked ? '#ec4899' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <Heart className={`w-5 h-5 ${liked ? 'text-white fill-white' : 'text-white'}`} />
              </div>
              <span className="text-xs text-white/80 font-semibold">{likeCount}</span>
            </button>

            {/* Chat */}
            <button className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/80 font-semibold">Chat</span>
            </button>

            {/* Watch live */}
            <button onClick={onWatch}
              className="flex flex-col items-center gap-1 active:scale-90 transition-all">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: '#ef4444', boxShadow: '0 4px 16px rgba(239,68,68,0.5)' }}>
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/80 font-semibold">Rejoindre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  lives: PublicLive[];
  onWatch: (live: PublicLive) => void;
  onRefresh: () => void;
  accentColor: string;
}

export default function LiveFeed({ lives, onWatch, onRefresh, accentColor }: Props) {
  const [idx, setIdx] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animDir, setAnimDir] = useState<'up' | 'down' | null>(null);

  useEffect(() => { onRefresh(); }, []);

  const goNext = useCallback(() => {
    if (idx < lives.length - 1) {
      setAnimDir('up');
      setTimeout(() => { setIdx(i => i + 1); setAnimDir(null); }, 180);
    }
  }, [idx, lives.length]);

  const goPrev = useCallback(() => {
    if (idx > 0) {
      setAnimDir('down');
      setTimeout(() => { setIdx(i => i - 1); setAnimDir(null); }, 180);
    }
  }, [idx]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) { if (dy > 0) goNext(); else goPrev(); }
    touchStartY.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    if (e.deltaY > 30) goNext();
    else if (e.deltaY < -30) goPrev();
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp')   goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  if (lives.length === 0) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4"
      style={{ background: '#0d0d1a' }}>
      <div className="text-5xl">📡</div>
      <div className="text-base font-bold text-white/40">Aucun live public en cours</div>
      <p className="text-sm text-white/25 text-center px-8">Lance un live public pour apparaître ici !</p>
      <button onClick={onRefresh}
        className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
        Rafraîchir
      </button>
    </div>
  );

  const live = lives[idx];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#0d0d1a', touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      {/* Slide animation */}
      <div className="absolute inset-0 transition-transform duration-180 ease-out"
        style={{ transform: animDir === 'up' ? 'translateY(-6%)' : animDir === 'down' ? 'translateY(6%)' : 'translateY(0)', opacity: animDir ? 0.5 : 1 }}>
        <LiveCard key={live.id} live={live} isActive accentColor={accentColor} onWatch={() => onWatch(live)} />
      </div>

      {/* Navigation arrows */}
      {idx > 0 && (
        <button onClick={goPrev}
          className="absolute top-20 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
      )}
      {idx < lives.length - 1 && (
        <button onClick={goNext}
          className="absolute bottom-32 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {lives.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className="rounded-full transition-all duration-200"
            style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? '#ef4444' : 'rgba(255,255,255,0.3)' }} />
        ))}
      </div>

      {/* Swipe hint */}
      {lives.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 text-xs text-white/25 flex items-center gap-1.5 pointer-events-none">
          <ChevronUp className="w-3.5 h-3.5" /> Swipe pour naviguer <ChevronDown className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
