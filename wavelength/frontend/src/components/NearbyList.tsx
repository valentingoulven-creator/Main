import { Users } from 'lucide-react';
import type { NearbyUser, Coordinates, ChatStatus } from '../types';
import NearbyCard from './NearbyCard';

const RADIUS_OPTIONS = [
  { label: '500 m', value: 500 },
  { label: '1 km',  value: 1000 },
  { label: '2 km',  value: 2000 },
  { label: '5 km',  value: 5000 },
];

interface Props {
  users: NearbyUser[];
  radius: number;
  onRadiusChange: (r: number) => void;
  onSelectUser: (pos: Coordinates) => void;
  onChatUser: (user: NearbyUser) => void;
  onViewProfile: (user: NearbyUser) => void;
  onWatchLive: (user: NearbyUser) => void;
  myChatStatus: ChatStatus;
  accentColor: string;
}

export default function NearbyList({ users, radius, onRadiusChange, onSelectUser, onChatUser, onViewProfile, onWatchLive, accentColor }: Props) {
  const playing = users.filter(u => u.track);
  const idle = users.filter(u => !u.track);

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Radius */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/30 font-medium flex-shrink-0">Rayon :</span>
        <div className="flex gap-1 flex-1">
          {RADIUS_OPTIONS.map(o => (
            <button key={o.value} onClick={() => onRadiusChange(o.value)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200"
              style={radius === o.value
                ? { background: accentColor, color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs text-white/40">
          {users.length === 0 ? 'Personne à proximité' : `${users.length} personne${users.length > 1 ? 's' : ''} à proximité`}
        </span>
        {playing.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
            style={{ background: accentColor + '22', color: accentColor }}>
            {playing.length} en écoute
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {users.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {playing.map(u => (
              <NearbyCard key={u.id} user={u}
                onClick={() => { onViewProfile(u); onSelectUser(u.position); }}
                onChat={() => onChatUser(u)}
                onWatchLive={() => onWatchLive(u)} />
            ))}
            {idle.length > 0 && playing.length > 0 && (
              <div className="text-xs text-white/20 px-1 pt-1">Pas en écoute</div>
            )}
            {idle.map(u => (
              <NearbyCard key={u.id} user={u}
                onClick={() => { onViewProfile(u); onSelectUser(u.position); }}
                onChat={() => onChatUser(u)}
                onWatchLive={() => onWatchLive(u)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">🎧</div>
      <div className="text-sm font-semibold text-white/40">Personne à proximité</div>
      <div className="text-xs text-white/20 mt-1">Augmente le rayon ou reviens plus tard</div>
    </div>
  );
}
