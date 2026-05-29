import { useState } from 'react';
import { MessageCircle, ExternalLink, Users, Radio, Star } from 'lucide-react';
import type { NearbyUser } from '../types';
import { SpotifyLogo, YouTubeLogo, ManualMusicLogo } from './SourceLogo';
import { isFavorite, addFavorite, removeFavorite } from '../utils/favorites';

interface Props {
  user: NearbyUser;
  onClick: () => void;
  onChat: () => void;
  onWatchLive?: () => void;
  onJoinYT?: () => void;
}

function formatDist(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

const STATUS_DOT: Record<string, string> = {
  available: '#10b981',
  busy:      '#f59e0b',
  dnd:       '#ef4444',
};

export default function NearbyCard({ user, onClick, onChat, onWatchLive, onJoinYT }: Props) {
  const { track } = user;
  const canChat = user.chatStatus !== 'dnd';
  const statusDot = STATUS_DOT[user.chatStatus ?? 'available'];
  const [fav, setFav] = useState(isFavorite(user.id));

  function toggleFav(e: React.MouseEvent) {
    e.stopPropagation();
    if (fav) { removeFavorite(user.id); setFav(false); }
    else { addFavorite({ id: user.id, username: user.username, color: user.color, emoji: user.emoji, photo: user.photos?.[0], bio: user.bio, savedAt: Date.now() }); setFav(true); }
  }

  return (
    <div
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 animate-fade-in
        hover:bg-white/5 active:scale-[0.98] cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.photos?.[0] ? (
            <img src={user.photos[0]} className="w-11 h-11 rounded-full object-cover shadow-md" />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md"
              style={{ background: user.color }}>
              {user.emoji}
            </div>
          )}
          {track && (
            <span className="absolute -inset-1 rounded-full animate-ping-slow opacity-25"
              style={{ background: user.color }} />
          )}
          {/* LIVE badge or chat dot */}
          {user.isLive ? (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black px-1.5 py-0.5 rounded-full leading-none animate-pulse"
              style={{ fontSize: 8 }}>LIVE</span>
          ) : (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: statusDot, borderColor: '#0d0d1a' }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name row — distance et Jam réduits */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-bold text-white truncate">{user.username}</span>

            {/* Distance — petit */}
            <span className="px-1 py-0.5 rounded-md flex-shrink-0 font-semibold text-white/40"
              style={{ fontSize: 9, background: 'rgba(255,255,255,0.07)' }}>
              {formatDist(user.distance)}
            </span>

            {/* Jam badge — petit */}
            {user.jamUrl && (
              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded-md flex-shrink-0"
                style={{ fontSize: 9, background: 'rgba(29,185,84,0.12)', color: '#1DB954' }}>
                <SpotifyLogo size={8} /> Jam
              </span>
            )}
          </div>

          {/* Track — plus grand et mis en valeur */}
          {/* Bio — milieu de la carte */}
          {user.bio && (
            <p className="text-xs text-white/45 leading-snug truncate mt-0.5 mb-1">{user.bio}</p>
          )}

          {track ? (
            <div className="flex items-center gap-2 min-w-0">
              {/* Waveform */}
              <div className="wave-bars flex-shrink-0" style={{ color: user.color, height: 14 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" />)}
              </div>
              {/* Platform logo */}
              {track.source === 'spotify'
                ? <SpotifyLogo size={15} className="flex-shrink-0" />
                : track.source === 'youtube'
                ? <YouTubeLogo size={15} className="flex-shrink-0" />
                : <ManualMusicLogo size={15} className="flex-shrink-0" />}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate leading-tight">{track.title}</div>
                {track.artist && (
                  <div className="text-xs text-white/45 truncate leading-tight">{track.artist}</div>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs text-white/25">Rien en écoute…</span>
          )}
        </div>

        {/* Album art — slightly larger */}
        {track?.albumArt && (
          <img src={track.albumArt} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md" />
        )}

        {/* External link */}
        {track?.url && (
          <a href={track.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
          </a>
        )}

        {/* Favorite button */}
        <button onClick={toggleFav}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={fav ? { background: 'rgba(251,191,36,0.2)' } : { background: 'rgba(255,255,255,0.06)' }}
          title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          <Star className="w-4 h-4" style={{ color: fav ? '#fbbf24' : 'rgba(255,255,255,0.3)', fill: fav ? '#fbbf24' : 'none' }} />
        </button>

        {/* Chat button */}
        <button
          onClick={e => { e.stopPropagation(); if (canChat) onChat(); }}
          disabled={!canChat}
          title={canChat ? 'Discuter' : 'Ne pas déranger'}
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
            text-white transition-all duration-200
            ${canChat ? 'hover:opacity-90 active:scale-95 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
          style={{ background: canChat ? user.color : 'rgba(255,255,255,0.06)' }}
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {/* LIVE strip */}
      {user.isLive && (
        <button
          onClick={e => { e.stopPropagation(); onWatchLive?.(); }}
          className="flex items-center justify-center gap-2 py-2 w-full text-xs font-bold transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))', borderTop: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <Radio className="w-3.5 h-3.5" />
          <span className="truncate">EN DIRECT — {user.liveTitle ?? `Live de ${user.username}`}</span>
          {user.viewers !== undefined && (
            <span className="flex items-center gap-0.5 text-red-400/60 ml-auto mr-2">
              <Users className="w-3 h-3" />{user.viewers}
            </span>
          )}
        </button>
      )}

      {/* YouTube session strip */}
      {user.ytSession && onJoinYT && (
        <button
          onClick={e => { e.stopPropagation(); onJoinYT(); }}
          className="flex items-center justify-center gap-2 py-2 w-full text-xs font-bold transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'linear-gradient(90deg, rgba(255,0,0,0.2), rgba(204,0,0,0.1))', borderTop: '1px solid rgba(255,0,0,0.2)', color: '#ff4444' }}>
          <YouTubeLogo size={14} />
          <span className="truncate">Rejoindre la session — {user.ytSession.title}</span>
          <span className="text-red-400/60 flex items-center gap-0.5"><Users className="w-3 h-3" />{user.ytSession.participants}</span>
        </button>
      )}

      {/* Jam strip */}
      {user.jamUrl && (
        <a href={user.jamUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(90deg, rgba(29,185,84,0.12), rgba(29,185,84,0.06))', borderTop: '1px solid rgba(29,185,84,0.12)', color: '#1DB954' }}>
          <SpotifyLogo size={11} />
          Rejoindre le Jam
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      )}
    </div>
  );
}
