import { useState } from 'react';
import { X, Heart, Coffee, Gift, CreditCard, Wallet, Check, ExternalLink } from 'lucide-react';
import type { NearbyUser } from '../types';
import { MeloSongMark } from './MeloSongLogo';

// ─── Tip amounts ──────────────────────────────────────────────────────────────

const TIPS = [
  { amount: 1,  emoji: '☕', label: 'Un café',     desc: 'Petite pensée' },
  { amount: 3,  emoji: '🎵', label: 'Un son',      desc: 'Pour la vibe' },
  { amount: 5,  emoji: '🍕', label: 'Une pizza',   desc: 'Tu assures !' },
  { amount: 10, emoji: '🎁', label: 'Un cadeau',   desc: 'Trop généreux·se' },
];

const PAYMENT_METHODS = [
  { id: 'card',   icon: <CreditCard className="w-4 h-4" />, label: 'Carte bancaire' },
  { id: 'paypal', icon: <span className="text-sm font-black text-blue-400">P</span>, label: 'PayPal' },
  { id: 'lydia',  icon: <Wallet className="w-4 h-4" />,     label: 'Lydia / Sumeria' },
];

// ─── User tip modal ───────────────────────────────────────────────────────────

interface UserDonateProps {
  user: NearbyUser;
  onClose: () => void;
}

export function DonateUser({ user, onClose }: UserDonateProps) {
  const [amount, setAmount]       = useState<number | null>(null);
  const [custom, setCustom]       = useState('');
  const [method, setMethod]       = useState('card');
  const [step, setStep]           = useState<'pick' | 'pay' | 'done'>('pick');
  const [message, setMessage]     = useState('');

  const finalAmount = amount ?? (parseFloat(custom) || 0);

  function handlePay() {
    if (finalAmount <= 0) return;
    setStep('pay');
    // Simulate payment processing
    setTimeout(() => setStep('done'), 2000);
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${user.color}, #ec4899)` }} />
          <div className="relative flex items-center gap-3 px-5 py-4">
            {user.photos?.[0] ? (
              <img src={user.photos[0]} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: user.color }}>{user.emoji}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-base font-black text-white">Envoyer un don</div>
              <div className="text-sm text-white/60">à {user.username}</div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {step === 'done' ? (
            /* ── Success ── */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
                style={{ background: `linear-gradient(135deg, ${user.color}, #ec4899)` }}>
                <Check className="w-8 h-8 text-white" />
              </div>
              <div className="text-lg font-black text-white mb-1">Don envoyé ! 🎉</div>
              <p className="text-sm text-white/50">{user.username} a reçu {finalAmount.toFixed(2)} €</p>
              <button onClick={onClose}
                className="mt-5 w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
                style={{ background: `linear-gradient(135deg, ${user.color}, #ec4899)` }}>
                Fermer
              </button>
            </div>
          ) : step === 'pay' ? (
            /* ── Processing ── */
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full border-2 border-t-transparent mx-auto mb-4 animate-spin"
                style={{ borderColor: user.color, borderTopColor: 'transparent' }} />
              <p className="text-sm text-white/50">Traitement du paiement…</p>
            </div>
          ) : (
            /* ── Pick amount ── */
            <>
              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {TIPS.map(t => (
                  <button key={t.amount} onClick={() => { setAmount(t.amount); setCustom(''); }}
                    className="flex flex-col items-center py-3 rounded-xl transition-all duration-200 active:scale-95"
                    style={amount === t.amount
                      ? { background: user.color, boxShadow: `0 4px 16px ${user.color}55` }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                    }>
                    <span className="text-xl mb-0.5">{t.emoji}</span>
                    <span className="text-sm font-black text-white">{t.amount}€</span>
                    <span className="text-xs text-white/40">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/50">€</span>
                  <input type="number" min="0.5" max="500" step="0.5"
                    className="wl-input w-full rounded-xl pl-7 pr-4 py-2.5 text-sm font-semibold"
                    placeholder="Montant libre"
                    value={custom}
                    onChange={e => { setCustom(e.target.value); setAmount(null); }}
                  />
                </div>
              </div>

              {/* Message */}
              <textarea rows={2}
                className="wl-input w-full rounded-xl px-3 py-2.5 text-sm resize-none mb-4"
                placeholder={`Laisse un mot pour ${user.username}… (optionnel)`}
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 100))}
              />

              {/* Payment method */}
              <div className="flex gap-1.5 mb-5">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={method === m.id
                      ? { background: 'rgba(139,92,246,0.25)', border: '1.5px solid #8b5cf6', color: '#a78bfa' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }
                    }>
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>

              <button onClick={handlePay} disabled={finalAmount <= 0}
                className="w-full py-3.5 rounded-2xl font-black text-base text-white transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                style={{ background: finalAmount > 0 ? `linear-gradient(135deg, ${user.color}, #ec4899)` : 'rgba(255,255,255,0.08)' }}>
                <Heart className="w-4 h-4" />
                {finalAmount > 0 ? `Envoyer ${finalAmount.toFixed(2)} €` : 'Choisir un montant'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App donation modal ───────────────────────────────────────────────────────

interface AppDonateProps {
  onClose: () => void;
  accentColor?: string;
}

const APP_TIERS = [
  { amount: 2,  emoji: '☕', label: 'Café',        desc: 'Un coup de pouce' },
  { amount: 5,  emoji: '🎵', label: 'Soutien',     desc: 'Tu nous aides !' },
  { amount: 10, emoji: '⭐', label: 'Fan',         desc: 'Tu déchires !' },
  { amount: 20, emoji: '💜', label: 'Champion',    desc: 'Légende absolue' },
];

export function DonateApp({ onClose }: AppDonateProps) {
  const [amount, setAmount]   = useState<number | null>(5);
  const [custom, setCustom]   = useState('');
  const [method, setMethod]   = useState('card');
  const [step, setStep]       = useState<'pick' | 'pay' | 'done'>('pick');

  const finalAmount = amount ?? (parseFloat(custom) || 0);

  function handlePay() {
    if (finalAmount <= 0) return;
    setStep('pay');
    setTimeout(() => setStep('done'), 2000);
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>

        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-15" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }} />
          <div className="relative px-5 pt-5 pb-4 text-center">
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/50" />
            </button>
            <MeloSongMark size={48} className="mx-auto mb-3" />
            <h2 className="text-xl font-black gradient-text">Soutenir MeloSong</h2>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">
              MeloSong est gratuit et sans pub forcée.<br />
              Ton soutien nous aide à continuer ! 💜
            </p>
          </div>
        </div>

        <div className="p-5">
          {step === 'done' ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <div className="text-lg font-black gradient-text mb-1">Merci infiniment !</div>
              <p className="text-sm text-white/50">Tu as donné {finalAmount.toFixed(2)} € à MeloSong</p>
              <p className="text-xs text-white/30 mt-2">Tu es un·e vrai·e champion·ne de la musique partagée 💜</p>
              <button onClick={onClose}
                className="mt-5 w-full py-3 rounded-2xl font-semibold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                Fermer
              </button>
            </div>
          ) : step === 'pay' ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full border-2 border-t-transparent mx-auto mb-4 animate-spin"
                style={{ borderColor: '#8b5cf6', borderTopColor: 'transparent' }} />
              <p className="text-sm text-white/50">Traitement en cours…</p>
            </div>
          ) : (
            <>
              {/* Tiers */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {APP_TIERS.map(t => (
                  <button key={t.amount} onClick={() => { setAmount(t.amount); setCustom(''); }}
                    className="flex flex-col items-center py-3 rounded-xl transition-all duration-200 active:scale-95"
                    style={amount === t.amount
                      ? { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                    }>
                    <span className="text-xl mb-0.5">{t.emoji}</span>
                    <span className="text-sm font-black text-white">{t.amount}€</span>
                    <span className="text-xs text-white/40">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom */}
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/50">€</span>
                <input type="number" min="1" max="500" step="1"
                  className="wl-input w-full rounded-xl pl-7 pr-4 py-2.5 text-sm font-semibold"
                  placeholder="Montant libre"
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setAmount(null); }}
                />
              </div>

              {/* Payment */}
              <div className="flex gap-1.5 mb-5">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={method === m.id
                      ? { background: 'rgba(139,92,246,0.25)', border: '1.5px solid #8b5cf6', color: '#a78bfa' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }
                    }>
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>

              <button onClick={handlePay} disabled={finalAmount <= 0}
                className="w-full py-3.5 rounded-2xl font-black text-base text-white transition-all
                  disabled:opacity-30 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                <Heart className="w-4 h-4" />
                {finalAmount > 0 ? `Donner ${finalAmount.toFixed(2)} €` : 'Choisir un montant'}
              </button>

              <div className="flex items-center justify-center gap-4 mt-4">
                <a href="https://buymeacoffee.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
                  <Coffee className="w-3 h-3" /> Buy Me a Coffee
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a href="https://ko-fi.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
                  <Gift className="w-3 h-3" /> Ko-fi
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
