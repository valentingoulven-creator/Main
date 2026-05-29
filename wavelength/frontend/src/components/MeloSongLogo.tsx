interface Props {
  size?: number;
  color?: string;
  className?: string;
}

/** The MeloSong NM geometric monogram */
export function MeloSongMark({ size = 32, color = 'currentColor', className }: Props) {
  return (
    <svg
      width={size}
      height={size * (90 / 110)}
      viewBox="0 0 110 90"
      fill="none"
      className={className}
    >
      {/* Left N */}
      <polyline
        points="8,82 8,8 46,82 46,8"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right M */}
      <polyline
        points="56,82 56,8 83,50 102,8 102,82"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full lockup: mark + "MeloSong" wordmark */
interface LockupProps {
  markSize?: number;
  textSize?: string;
  className?: string;
}

export function MeloSongLockup({ markSize = 28, textSize = 'text-xl', className }: LockupProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          width: markSize + 10,
          height: markSize + 10,
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          padding: 5,
        }}
      >
        <MeloSongMark size={markSize} color="white" />
      </div>
      <span className={`font-black tracking-tight gradient-text ${textSize}`}>
        MeloSong
      </span>
    </div>
  );
}
