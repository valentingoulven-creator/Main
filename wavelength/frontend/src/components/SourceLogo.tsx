import React from 'react';

interface LogoProps { size?: number; className?: string }

// ─── Streaming platform logos ─────────────────────────────────────────────────

export function SpotifyLogo({ size = 16, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="12" fill="#1DB954"/>
      <path d="M17.25 10.63c-3.01-1.78-7.97-1.95-10.84-1.08a.97.97 0 1 0 .56 1.86c2.47-.75 6.58-.6 9.17.91a.97.97 0 0 0 1.11-1.69z" fill="white"/>
      <path d="M16.65 13.58a.81.81 0 0 0-1.12-.27c-2.5-1.54-6.3-1.98-9.26-1.08a.81.81 0 0 0 .47 1.55c2.56-.78 5.75-.33 7.91 1.07a.81.81 0 0 0 1-.27z" fill="white"/>
      <path d="M15.89 16.49a.65.65 0 0 0-.9-.22 12.3 12.3 0 0 0-7.5-.87.65.65 0 1 0 .29 1.27 11 11 0 0 1 6.69.77.65.65 0 0 0 .92-.95z" fill="white"/>
    </svg>
  );
}

export function YouTubeLogo({ size = 16, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="5" fill="#FF0000"/>
      <path d="M19.8 7.87a2.3 2.3 0 0 0-1.62-1.63C16.78 5.9 12 5.9 12 5.9s-4.78 0-6.18.34A2.3 2.3 0 0 0 4.2 7.87 24 24 0 0 0 3.86 12a24 24 0 0 0 .34 4.13A2.3 2.3 0 0 0 5.82 17.8C7.22 18.1 12 18.1 12 18.1s4.78 0 6.18-.34a2.3 2.3 0 0 0 1.62-1.63c.22-1.14.33-2.3.34-4.13a24 24 0 0 0-.36-4.13z" fill="#FF0000"/>
      <path d="M9.85 15.02V8.98L15.52 12l-5.67 3.02z" fill="white"/>
    </svg>
  );
}

export function YouTubeMusicLogo({ size = 16, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="12" fill="#FF0000"/>
      {/* Outer ring */}
      <circle cx="12" cy="12" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
      {/* Play triangle */}
      <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="white"/>
      {/* Center dot */}
      <circle cx="12" cy="12" r="2.5" fill="#FF0000"/>
      <circle cx="12" cy="12" r="1.2" fill="white"/>
    </svg>
  );
}

export function DeezerLogo({ size = 16, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Deezer-style soundwave bars */}
      <rect x="1"  y="14" width="3.2" height="6"  rx="1.6" fill="#ef5466"/>
      <rect x="5.2" y="11" width="3.2" height="9"  rx="1.6" fill="#ef5466" opacity="0.85"/>
      <rect x="9.4" y="7"  width="3.2" height="13" rx="1.6" fill="#ef5466" opacity="0.9"/>
      <rect x="13.6" y="9" width="3.2" height="11" rx="1.6" fill="#ef5466" opacity="0.8"/>
      <rect x="17.8" y="12" width="3.2" height="8" rx="1.6" fill="#ef5466" opacity="0.7"/>
      {/* Top active indicator */}
      <rect x="1"  y="4"  width="3.2" height="3"  rx="1.5" fill="#1bd95b"/>
      <rect x="5.2" y="4"  width="3.2" height="3"  rx="1.5" fill="#1bd95b" opacity="0.85"/>
      <rect x="9.4" y="4"  width="3.2" height="3"  rx="1.5" fill="#1bd95b" opacity="0.75"/>
    </svg>
  );
}

export function ManualMusicLogo({ size = 16, color = 'rgba(255,255,255,0.4)', className }: LogoProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.5" fill="rgba(255,255,255,0.05)"/>
      <path d="M9 17V7l10-2v10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="17" r="2" fill={color}/>
      <circle cx="17" cy="15" r="2" fill={color}/>
    </svg>
  );
}

// ─── Source badge (track) ─────────────────────────────────────────────────────

interface SourceBadgeProps { source: 'spotify' | 'youtube' | 'manual'; size?: number }

export function SourceBadge({ source, size = 15 }: SourceBadgeProps) {
  if (source === 'spotify') return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full badge-spotify">
      <SpotifyLogo size={size} /> Spotify
    </span>
  );
  if (source === 'youtube') return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full badge-youtube">
      <YouTubeLogo size={size} /> YouTube
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full badge-manual">
      <ManualMusicLogo size={size} /> Manuel
    </span>
  );
}

// ─── Platform config (for connected apps) ────────────────────────────────────

export type PlatformKey = 'spotify';

export interface PlatformConfig {
  key: PlatformKey;
  label: string;
  color: string;
  bgColor: string;
  placeholder: string;
  Logo: (props: LogoProps) => React.ReactElement;
  buildUrl: (value: string) => string;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    key: 'spotify',
    label: 'Spotify',
    color: '#1DB954',
    bgColor: 'rgba(29,185,84,0.12)',
    placeholder: 'Lien profil ou nom d\'utilisateur',
    Logo: SpotifyLogo,
    buildUrl: (v) => v.startsWith('http') ? v : `https://open.spotify.com/user/${v}`,
  },
];
