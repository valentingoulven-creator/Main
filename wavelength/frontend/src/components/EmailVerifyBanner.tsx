import { useState } from 'react';
import { Mail, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { verifyEmail, getVerifyCode } from '../utils/auth';

interface Props {
  email: string;
  onVerified: () => void;
}

export default function EmailVerifyBanner({ email, onVerified }: Props) {
  const [open, setOpen]       = useState(false);
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Show the demo code (in a real app this would be sent by email)
  const demoCode = getVerifyCode()?.code;

  if (dismissed) return null;

  function handleVerify() {
    if (verifyEmail(code)) {
      onVerified();
      setOpen(false);
    } else {
      setError('Code incorrect. Réessaie.');
    }
  }

  return (
    <div className="mx-4 mb-2 rounded-2xl overflow-hidden flex-shrink-0 animate-fade-in"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>

      {!open ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-amber-300">Email non vérifié</span>
            <span className="text-xs text-white/40 ml-1.5 hidden sm:inline truncate">{email}</span>
          </div>
          <button onClick={() => setOpen(true)}
            className="text-xs font-bold px-3 py-1 rounded-lg transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
            Vérifier
          </button>
          <button onClick={() => setDismissed(true)}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5 text-white/30" />
          </button>
        </div>
      ) : (
        <div className="p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-300">Vérification de l'email</span>
            <button onClick={() => setOpen(false)} className="ml-auto">
              <X className="w-4 h-4 text-white/30" />
            </button>
          </div>

          <p className="text-xs text-white/50 mb-3 leading-relaxed">
            Un code de vérification a été envoyé à <strong className="text-white/70">{email}</strong>.
            {demoCode && (
              <span className="block mt-1 text-amber-400/80">
                (Demo — code : <strong className="font-mono">{demoCode}</strong>)
              </span>
            )}
          </p>

          <div className="flex gap-2">
            <input
              className="wl-input flex-1 rounded-xl px-3 py-2 text-sm font-mono tracking-widest text-center"
              placeholder="_ _ _ _ _ _"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerify()}
              maxLength={6}
              autoFocus
            />
            <button onClick={handleVerify} disabled={code.length < 6}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30 active:scale-95"
              style={{ background: '#f59e0b' }}>
              OK
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />{error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Verified badge (inline) ─────────────────────────────────────────────────

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <span title="Email vérifié" className="inline-flex">
      <CheckCircle2 style={{ width: size, height: size, color: '#3b82f6', flexShrink: 0 }} />
    </span>
  );
}
