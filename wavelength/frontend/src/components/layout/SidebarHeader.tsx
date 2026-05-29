import { Wifi, WifiOff, UserCircle2, Heart } from 'lucide-react';
import { MeloSongLockup } from '../MeloSongLogo';
import { VerifiedBadge } from '../EmailVerifyBanner';
import type { UserProfile, ChatStatus } from '../../types';

const CHAT_STATUS_UI: Record<ChatStatus, { label: string; color: string; next: ChatStatus }> = {
  available:  { label: 'Disponible', color: '#10b981', next: 'invisible' },
  invisible:  { label: 'Invisible',  color: '#64748b', next: 'available' },
};

interface Props {
  profile: UserProfile;
  chatStatus: ChatStatus;
  connected: boolean;
  emailVerified: boolean;
  spotifyLinked: boolean;
  onSettings: () => void;
  onDonate: () => void;
  onEditProfile: () => void;
  onCycleStatus: () => void;
  onSpotify: () => void;
}

export default function SidebarHeader({
  profile, chatStatus, connected, emailVerified, spotifyLinked,
  onSettings, onDonate, onEditProfile, onCycleStatus, onSpotify,
}: Props) {
  const ui = CHAT_STATUS_UI[chatStatus];

  return (
    <header className="flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Top bar */}
      <div className="flex items-center px-3 pt-3 pb-1 gap-2">
        <button onClick={onDonate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 hover:opacity-90 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', boxShadow: '0 2px 12px rgba(139,92,246,0.35)' }}>
          <Heart className="w-3.5 h-3.5" /> Soutenir
        </button>

        <div className="flex-1 flex justify-center">
          <MeloSongLockup markSize={18} textSize="text-base" />
        </div>

        <button onClick={onSettings} title="Paramètres"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-95 group flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            className="transition-transform duration-500 group-hover:rotate-45"
            stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center pb-3 px-4 pt-2">
        <button onClick={onEditProfile} className="relative group mb-2">
          {profile.photos?.[0] ? (
            <img src={profile.photos[0]}
              className="w-20 h-20 rounded-full object-cover shadow-xl transition-all group-hover:brightness-90"
              style={{ border: `3px solid ${profile.color}` }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl transition-all group-hover:opacity-80"
              style={{ background: profile.color, border: `3px solid ${profile.color}99` }}>
              {profile.emoji}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <UserCircle2 className="w-6 h-6 text-white" />
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#0d0d1a]"
            style={{ background: ui.color }} />
        </button>

        <div className="flex items-center gap-1.5">
          <div className="text-base font-black text-white leading-tight">{profile.username}</div>
          {emailVerified && <VerifiedBadge size={16} />}
        </div>

        {profile.bio ? (
          <p className="text-xs text-white/55 mt-1.5 text-center max-w-[280px] leading-relaxed px-2">{profile.bio}</p>
        ) : (
          <div className="text-xs text-white/25 mt-0.5">membre MeloSong</div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap justify-center">
          <button onClick={onCycleStatus}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full transition-all hover:opacity-80"
            style={{ background: ui.color + '18', border: `1px solid ${ui.color}33` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ui.color }} />
            <span style={{ color: ui.color }} className="font-semibold">{ui.label}</span>
          </button>

          <div className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-full ${connected ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ background: connected ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>

          <button onClick={onSpotify}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all hover:opacity-80"
            style={spotifyLinked
              ? { background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.35)' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill={spotifyLinked ? '#1DB954' : 'rgba(255,255,255,0.3)'}/>
              <path d="M17.25 10.63c-3.01-1.78-7.97-1.95-10.84-1.08a.97.97 0 1 0 .56 1.86c2.47-.75 6.58-.6 9.17.91a.97.97 0 0 0 1.11-1.69z" fill="white"/>
              <path d="M16.65 13.58a.81.81 0 0 0-1.12-.27c-2.5-1.54-6.3-1.98-9.26-1.08a.81.81 0 0 0 .47 1.55c2.56-.78 5.75-.33 7.91 1.07a.81.81 0 0 0 1-.27z" fill="white"/>
              <path d="M15.89 16.49a.65.65 0 0 0-.9-.22 12.3 12.3 0 0 0-7.5-.87.65.65 0 1 0 .29 1.27 11 11 0 0 1 6.69.77.65.65 0 0 0 .92-.95z" fill="white"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color: spotifyLinked ? '#1DB954' : 'rgba(255,255,255,0.4)' }}>
              {spotifyLinked ? 'Spotify' : '+ Spotify'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
