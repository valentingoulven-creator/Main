import { useState } from 'react';
import { X, Globe, Users, Lock, Link2, Check, Copy, ArrowRight } from 'lucide-react';

export type LiveVisibility = 'public' | 'restricted' | 'private';

interface VisibilityOption {
  id: LiveVisibility;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
}

const VISIBILITY: VisibilityOption[] = [
  {
    id: 'public',
    icon: <Globe className="w-5 h-5" />,
    label: 'Public',
    sublabel: 'Visible dans l\'onglet Découvrir — tout le monde peut rejoindre',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
  },
  {
    id: 'restricted',
    icon: <Users className="w-5 h-5" />,
    label: 'Restreint',
    sublabel: 'Visible uniquement par les personnes à proximité',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
  {
    id: 'private',
    icon: <Lock className="w-5 h-5" />,
    label: 'Privé',
    sublabel: 'Accessible uniquement via le lien de partage',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
  },
];

interface Props {
  broadcasterId: string;
  onStart: (title: string, visibility: LiveVisibility) => void;
  onClose: () => void;
  accentColor?: string;
}

export default function LiveSetupModal({ broadcasterId, onStart, onClose }: Props) {
  const [title, setTitle]           = useState('');
  const [visibility, setVisibility] = useState<LiveVisibility>('public');
  const [copied, setCopied]         = useState(false);

  const liveLink = `${window.location.origin}/live/${broadcasterId}`;

  function copyLink() {
    navigator.clipboard.writeText(liveLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleStart() {
    onStart(title.trim() || 'Mon Live', visibility);
  }

  const selected = VISIBILITY.find(v => v.id === visibility)!;

  return (
    <div className="fixed inset-0 z-[810] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.99)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <div className="text-sm font-black text-white">Démarrer un Live</div>
              <div className="text-xs text-white/40">Configure ton direct avant de commencer</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Titre du live
            </label>
            <input
              className="wl-input w-full rounded-xl px-4 py-3 text-sm font-medium"
              placeholder="ex: Mix électro, Session guitare, Q&A musique…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              autoFocus
              maxLength={60}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Visibilité
            </label>
            <div className="space-y-2">
              {VISIBILITY.map(opt => (
                <button key={opt.id} onClick={() => setVisibility(opt.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 active:scale-[0.99]"
                  style={visibility === opt.id
                    ? { background: opt.bg, border: `1.5px solid ${opt.color}44` }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                  }>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: visibility === opt.id ? opt.bg : 'rgba(255,255,255,0.06)', color: visibility === opt.id ? opt.color : 'rgba(255,255,255,0.35)', border: visibility === opt.id ? `1px solid ${opt.color}33` : 'none' }}>
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: visibility === opt.id ? opt.color : 'rgba(255,255,255,0.8)' }}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-white/40 leading-snug mt-0.5">{opt.sublabel}</div>
                  </div>
                  {visibility === opt.id && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: opt.color }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Shareable link */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Lien de partage
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <span className="flex-1 text-xs text-white/50 truncate font-mono">{liveLink}</span>
              <button onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95"
                style={copied
                  ? { background: 'rgba(16,185,129,0.2)', color: '#10b981' }
                  : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copié !</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
              </button>
            </div>
            <p className="text-xs text-white/25 mt-1.5 pl-1">
              Partage ce lien pour inviter des personnes directement, quelle que soit la visibilité choisie.
            </p>
          </div>

          {/* Start button */}
          <button onClick={handleStart}
            className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-3
              transition-all active:scale-[0.98] hover:opacity-90 shadow-xl"
            style={{
              background: `linear-gradient(135deg, #ef4444, #dc2626)`,
              boxShadow: '0 0 30px rgba(239,68,68,0.4)',
            }}>
            <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
            Démarrer le live
            <span className="text-xs font-semibold text-white/70 flex items-center gap-1 ml-1">
              {selected.icon && <span style={{ color: selected.color }}>{visibility === 'public' ? '🌍' : visibility === 'restricted' ? '👥' : '🔒'}</span>}
              {selected.label}
            </span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
