import { Users } from 'lucide-react';
import type { NearbyUser, Coordinates, ChatStatus } from '../types';
import NearbyCard from './NearbyCard';

interface Props {
  users: NearbyUser[];
  radius: number;
  onSelectUser: (pos: Coordinates) => void;
  onChatUser: (user: NearbyUser) => void;
  onViewProfile: (user: NearbyUser) => void;
  onWatchLive: (user: NearbyUser) => void;
  onJoinYT?: (user: NearbyUser) => void;
  myChatStatus: ChatStatus;
  accentColor: string;
}

function formatRadius(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km`;
}

export default function NearbyList({ users, radius, onSelectUser, onChatUser, onViewProfile, onWatchLive, onJoinYT, accentColor }: Props) {
  const playing = users.filter(u => u.track);
  const idle    = users.filter(u => !u.track);

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      {/* Count + radius label */}
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs text-white/40">
          {users.length === 0 ? 'Personne à proximité' : `${users.length} personne${users.length > 1 ? 's' : ''} dans un rayon de ${formatRadius(radius)}`}
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
                onWatchLive={() => onWatchLive(u)}
                onJoinYT={u.ytSession ? () => onJoinYT?.(u) : undefined} />
            ))}
            {idle.length > 0 && playing.length > 0 && (
              <div className="text-xs text-white/20 px-1 pt-1">Pas en écoute</div>
            )}
            {idle.map(u => (
              <NearbyCard key={u.id} user={u}
                onClick={() => { onViewProfile(u); onSelectUser(u.position); }}
                onChat={() => onChatUser(u)}
                onWatchLive={() => onWatchLive(u)}
                onJoinYT={u.ytSession ? () => onJoinYT?.(u) : undefined} />
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
      <div className="text-xs text-white/20 mt-1">Modifie le rayon dans les Paramètres ⚙️</div>
    </div>
  );
}
