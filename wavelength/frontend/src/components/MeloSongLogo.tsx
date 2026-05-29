interface Props {
  size?: number;
  className?: string;
}

/** MeloSong stylized MS monogram */
export function MeloSongMark({ size = 40, className }: Props) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 120 120" fill="none" className={className}>
      <defs>
        <linearGradient id="ms-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
        <linearGradient id="ms-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.25"/>
        </linearGradient>
        <filter id="ms-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.5"/>
        </filter>
      </defs>

      {/* Badge background */}
      <rect width="120" height="120" rx="28" fill="#0d0d1a"/>
      <rect width="120" height="120" rx="28" fill="url(#ms-glow)"/>
      <rect x="1.5" y="1.5" width="117" height="117" rx="26.5" fill="none"
        stroke="url(#ms-bg)" strokeWidth="2" opacity="0.6"/>

      {/* Subtle accent dots */}
      <circle cx="60" cy="104" r="3" fill="url(#ms-bg)" opacity="0.4"/>
      <circle cx="53" cy="104" r="2" fill="url(#ms-bg)" opacity="0.25"/>
      <circle cx="67" cy="104" r="2" fill="url(#ms-bg)" opacity="0.25"/>

      {/* M — gradient shadow layer */}
      <polyline points="14,82 14,38 38,70 62,38 62,82"
        stroke="url(#ms-bg)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#ms-shadow)"/>
      {/* M — white stroke */}
      <polyline points="14,82 14,38 38,70 62,38 62,82"
        stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>

      {/* S — gradient shadow layer */}
      <path d="M76,46 C76,41 80,36 90,36 C100,36 106,41 106,48 C106,55 98,59 90,63 C82,67 76,71 76,79 C76,86 82,90 92,90 C100,90 106,85 106,85"
        stroke="url(#ms-bg)" strokeWidth="8" strokeLinecap="round" filter="url(#ms-shadow)"/>
      {/* S — white stroke */}
      <path d="M76,46 C76,41 80,36 90,36 C100,36 106,41 106,48 C106,55 98,59 90,63 C82,67 76,71 76,79 C76,86 82,90 92,90 C100,90 106,85 106,85"
        stroke="white" strokeWidth="5.5" strokeLinecap="round" opacity="0.95"/>
    </svg>
  );
}

/** Full lockup: mark + "MeloSong" wordmark */
interface LockupProps {
  markSize?: number;
  textSize?: string;
  className?: string;
}

export function MeloSongLockup({ markSize = 32, textSize = 'text-xl', className }: LockupProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <MeloSongMark size={markSize} />
      <span className={`font-black tracking-tight gradient-text ${textSize}`}>
        MeloSong
      </span>
    </div>
  );
}
