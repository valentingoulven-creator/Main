import { useState } from 'react';
import { X, Send, Star } from 'lucide-react';
import type { NearbyUser } from '../types';

const VIBES = [
  { emoji: '🔥', label: 'Enflammé·e' },
  { emoji: '🎵', label: 'Musical·e' },
  { emoji: '💜', label: 'Sympa' },
  { emoji: '😊', label: 'Agréable' },
  { emoji: '✨', label: 'Stylé·e' },
  { emoji: '🎸', label: 'Rock star' },
  { emoji: '🧠', label: 'Cultivé·e' },
  { emoji: '🌟', label: 'Excellent·e' },
  { emoji: '🎧', label: 'Audiophile' },
  { emoji: '🤝', label: 'Bon contact' },
];

interface Props {
  user: NearbyUser;
  alreadyRated?: string; // previous vibe if already rated
  onSubmit: (vibe: string, note: string) => void;
  onClose: () => void;
}

export default function RatingPicker({ user, alreadyRated, onSubmit, onClose }: Props) {
  const [vibe, setVibe] = useState(alreadyRated ?? '');
  const [note, setNote] = useState('');

  function handleSubmit() {
    if (!vibe) return;
    onSubmit(vibe, note.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 animate-slide-up"
        style={{ background: 'rgba(16,16,28,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {user.photos?.[0] ? (
            <img src={user.photos[0]} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: user.color }}>{user.emoji}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" style={{ color: user.color }} />
              Note de sympathie
            </div>
            <div className="text-xs text-white/40 truncate">pour {user.username}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Vibe picker */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
            Quelle est la vibe ? *
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {VIBES.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => setVibe(emoji)}
                title={label}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200 text-center
                  ${vibe === emoji ? 'scale-105 ring-2' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                style={vibe === emoji
                  ? { background: user.color + '22', border: `2px solid ${user.color}66` }
                  : { background: 'rgba(255,255,255,0.04)' }
                }
              >
                <span className="text-xl leading-none">{emoji}</span>
                <span className="text-xs text-white/50 leading-tight" style={{ fontSize: 9 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note text */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
            Message <span className="text-white/20 normal-case font-normal">(optionnel · {note.length}/120)</span>
          </label>
          <textarea
            className="wl-input w-full rounded-xl px-4 py-3 text-sm resize-none"
            placeholder={`Laisse un mot sympa pour ${user.username}…`}
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 120))}
            rows={2}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!vibe}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white
            flex items-center justify-center gap-2 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 hover:opacity-90"
          style={{ background: vibe ? `linear-gradient(135deg, ${user.color}, #ec4899)` : 'rgba(255,255,255,0.08)' }}
        >
          <Send className="w-4 h-4" />
          {alreadyRated ? 'Mettre à jour ma note' : 'Envoyer ma note'}
        </button>
      </div>
    </div>
  );
}
