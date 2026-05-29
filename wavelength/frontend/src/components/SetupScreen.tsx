import { useState } from 'react';
import { Music2, ArrowRight } from 'lucide-react';
import type { UserProfile } from '../types';

const COLORS = ['#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316'];
const EMOJIS = ['🎵','🎸','🎹','🎤','🥁','🎧','🎻','🎷'];

interface Props { onComplete: (p: UserProfile) => void }

export default function SetupScreen({ onComplete }: Props) {
  const [username, setUsername] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  function submit() {
    const name = username.trim();
    if (!name) return;
    onComplete({ username: name, color, emoji });
  }

  return (
    <div className="app-bg h-screen flex items-center justify-center p-4">
      {/* Floating orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
      </div>

      <div className="glass-strong rounded-3xl p-8 w-full max-w-sm animate-pop-in relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
            <Music2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Wavelength</h1>
          <p className="text-sm text-white/40 mt-1 text-center">Partage ta musique avec ceux autour de toi</p>
        </div>

        {/* Username */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
            Ton prénom ou pseudo
          </label>
          <input
            className="wl-input w-full rounded-xl px-4 py-3 text-sm font-medium"
            placeholder="ex: Sophie, Dj_Alex, Musiklover…"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
            maxLength={24}
          />
        </div>

        {/* Color */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
            Ta couleur
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-all duration-200 relative"
                style={{ background: c }}
              >
                {color === c && (
                  <span className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-2 ring-offset-transparent" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Emoji */}
        <div className="mb-8">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
            Ton icône
          </label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-200
                  ${emoji === e ? 'scale-110 shadow-lg' : 'opacity-60 hover:opacity-90'}`}
                style={emoji === e ? { background: color + '33', border: `2px solid ${color}66` } : { background: 'rgba(255,255,255,0.05)' }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Preview + CTA */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl"
          style={{ background: color + '15', border: `1px solid ${color}30` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: color }}>
            {emoji}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{username || 'Ton pseudo'}</div>
            <div className="text-xs text-white/40">Prêt à partager ta vibe</div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!username.trim()}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white
            flex items-center justify-center gap-2 transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-95 hover:opacity-90 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color}, #ec4899)` }}
        >
          Commencer <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
