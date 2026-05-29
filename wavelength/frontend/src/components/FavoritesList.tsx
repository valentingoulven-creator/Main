import { MessageCircle, Trash2 } from 'lucide-react';
import type { FavoriteUser } from '../utils/favorites';
import type { NearbyUser } from '../types';

interface Props {
  favorites: FavoriteUser[];
  nearbyUsers: NearbyUser[];
  onChat: (user: FavoriteUser) => void;
  onRemove: (id: string) => void;
  accentColor: string;
}

export default function FavoritesList({ favorites, nearbyUsers, onChat, onRemove, accentColor }: Props) {
  const nearbyIds = new Set(nearbyUsers.map(u => u.id));

  const online  = favorites.filter(f => nearbyIds.has(f.id));
  const offline = favorites.filter(f => !nearbyIds.has(f.id));

  if (favorites.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      <div className="text-4xl">⭐</div>
      <div className="text-sm font-bold text-white/40">Aucun favori</div>
      <p className="text-xs text-white/25 max-w-xs leading-relaxed">
        Appuie sur l'étoile ⭐ d'un utilisateur pour l'ajouter à tes favoris
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
      {online.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-green-400">À proximité ({online.length})</span>
          </div>
          {online.map(f => {
            const nearby = nearbyUsers.find(u => u.id === f.id);
            return <FavCard key={f.id} fav={f} isOnline nearby={nearby} onChat={onChat} onRemove={onRemove} accentColor={accentColor} />;
          })}
        </>
      )}

      {offline.length > 0 && (
        <>
          {online.length > 0 && <div className="text-xs text-white/20 px-1 pt-1">Hors ligne</div>}
          {offline.map(f => <FavCard key={f.id} fav={f} isOnline={false} onChat={onChat} onRemove={onRemove} accentColor={accentColor} />)}
        </>
      )}
    </div>
  );
}

function FavCard({ fav, isOnline, nearby, onChat, onRemove, accentColor }: {
  fav: FavoriteUser; isOnline: boolean; nearby?: NearbyUser;
  onChat: (f: FavoriteUser) => void; onRemove: (id: string) => void; accentColor: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={{ background: isOnline ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isOnline ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}` }}>
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {fav.photo
          ? <img src={fav.photo} className="w-11 h-11 rounded-full object-cover shadow-md" />
          : <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md" style={{ background: fav.color }}>{fav.emoji}</div>
        }
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d1a] flex-shrink-0"
          style={{ background: isOnline ? '#10b981' : '#374151' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white truncate">{fav.username}</span>
          {isOnline && nearby?.distance !== undefined && (
            <span className="text-xs text-white/35 flex-shrink-0">{nearby.distance < 1000 ? `${nearby.distance}m` : `${(nearby.distance/1000).toFixed(1)}km`}</span>
          )}
        </div>
        {nearby?.track ? (
          <div className="flex items-center gap-1.5 text-xs text-white/45 truncate">
            <span className="wave-bars flex-shrink-0" style={{ color: fav.color, height: 10 }}>
              {[1,2,3].map(i => <div key={i} className="wave-bar" />)}
            </span>
            <span className="truncate">{nearby.track.title}</span>
          </div>
        ) : (
          <div className="text-xs text-white/30">{isOnline ? 'Connecté·e' : 'Hors ligne'}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isOnline && (
          <button onClick={() => onChat(fav)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: accentColor }}>
            <MessageCircle className="w-4 h-4 text-white" />
          </button>
        )}
        <button onClick={() => onRemove(fav.id)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/15 transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <Trash2 className="w-3.5 h-3.5 text-white/35" />
        </button>
      </div>
    </div>
  );
}
