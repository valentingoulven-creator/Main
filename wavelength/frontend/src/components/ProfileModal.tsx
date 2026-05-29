import { useState } from 'react';
import { X, MessageCircle, ExternalLink, Music2, MapPin, Cake } from 'lucide-react';
import type { NearbyUser } from '../types';
import { calcAge } from '../utils/ageUtils';
import { SpotifyLogo, YouTubeLogo, PLATFORMS } from './SourceLogo';

interface Props {
  user: NearbyUser;
  onClose: () => void;
  onChat: () => void;
  canChat: boolean;
}

function formatDist(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function ProfileModal({ user, onClose, onChat, canChat }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = user.photos ?? [];
  const { track } = user;
  const apps = user.connectedApps ?? {};
  const connectedPlatforms = PLATFORMS.filter(p => apps[p.key]);

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-sm animate-pop-in overflow-hidden rounded-3xl overflow-y-auto"
        style={{ background: 'rgba(14,14,24,0.98)', border: '1px solid rgba(255,255,255,0.12)', maxHeight: '92vh' }}>

        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Photo / avatar header */}
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          {photos.length > 0 ? (
            <>
              <img src={photos[photoIdx]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(14,14,24,0.95))' }} />
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className="h-1.5 rounded-full transition-all"
                      style={{ background: i === photoIdx ? user.color : 'rgba(255,255,255,0.4)', width: i === photoIdx ? 20 : 6 }} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${user.color}33, ${user.color}11)` }}>
              <div className="text-7xl">{user.emoji}</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {/* Name row */}
          <div className="flex items-end gap-3 -mt-5 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-xl ring-2 ring-white/10"
              style={{ background: user.color }}>{user.emoji}</div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="text-base font-bold text-white truncate">{user.username}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white/40">{formatDist(user.distance)}</span>
                {user.birthDate && (
                  <span className="flex items-center gap-0.5 text-xs text-white/40">
                    <Cake className="w-3 h-3" />{calcAge(user.birthDate)} ans
                  </span>
                )}
                {user.address && (
                  <span className="flex items-center gap-0.5 text-xs text-white/35">
                    <MapPin className="w-3 h-3" />{user.address}
                  </span>
                )}
                {user.chatStatus && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: user.chatStatus === 'available' ? 'rgba(16,185,129,0.15)' : user.chatStatus === 'busy' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: user.chatStatus === 'available' ? '#10b981' : user.chatStatus === 'busy' ? '#f59e0b' : '#ef4444',
                    }}>
                    {user.chatStatus === 'available' ? '● Disponible' : user.chatStatus === 'busy' ? '● Occupé·e' : '● DND'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && <p className="text-sm text-white/70 leading-relaxed mb-4">{user.bio}</p>}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Centres d'intérêt</div>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map(interest => (
                  <span key={interest} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: user.color + '20', color: user.color, border: `1px solid ${user.color}30` }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connected apps */}
          {connectedPlatforms.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Sur les plateformes</div>
              <div className="grid grid-cols-2 gap-2">
                {connectedPlatforms.map(({ key, label, color: pColor, bgColor, Logo, buildUrl }) => {
                  const val = apps[key]!;
                  return (
                    <a key={key} href={buildUrl(val)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                      style={{ background: bgColor, border: `1px solid ${pColor}25` }}>
                      <Logo size={16} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold" style={{ color: pColor }}>{label}</div>
                        <div className="text-xs text-white/40 truncate">{val.startsWith('http') ? 'Voir le profil' : val}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 opacity-40 flex-shrink-0 ml-auto" style={{ color: pColor }} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Now playing */}
          {track && (
            <div className="rounded-2xl overflow-hidden mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 p-3">
                {track.albumArt ? (
                  <img src={track.albumArt} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: user.color + '22' }}>
                    <Music2 className="w-5 h-5" style={{ color: user.color }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {track.source === 'spotify' ? <SpotifyLogo size={13} /> : <YouTubeLogo size={13} />}
                    <span className="text-xs text-white/40 font-medium capitalize">{track.source}</span>
                  </div>
                  <div className="text-sm font-semibold text-white truncate">{track.title}</div>
                  {track.artist && <div className="text-xs text-white/50 truncate">{track.artist}</div>}
                </div>
                {track.url && (
                  <a href={track.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Spotify Jam CTA */}
          {user.jamUrl && (
            <a href={user.jamUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl mb-3
                font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1DB954, #158a3e)', color: '#fff' }}>
              <SpotifyLogo size={16} /> Rejoindre le Jam Spotify 🎉
            </a>
          )}

          {/* Chat */}
          <button onClick={() => { if (canChat) { onChat(); onClose(); } }} disabled={!canChat}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl font-semibold text-sm text-white
              transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
            style={{ background: canChat ? `linear-gradient(135deg, ${user.color}, #ec4899)` : 'rgba(255,255,255,0.08)' }}>
            <MessageCircle className="w-4 h-4" />
            {user.chatStatus === 'dnd' ? 'Ne veut pas être dérangé·e' : 'Discuter'}
          </button>
        </div>
      </div>
    </div>
  );
}
