import { useState } from 'react';
import { Mail, X, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { verifyEmail, getVerifyCode } from '../utils/auth';

interface Props {
  uid: string;
  email: string;
  username: string;
  onVerified: () => void;
}

export default function EmailVerifyBanner({ uid, email, username, onVerified }: Props) {
  const [stage, setStage]       = useState<'idle' | 'sending' | 'sent' | 'code' | 'error'>('idle');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Store code from local auth for code-entry fallback
  const demoCode = getVerifyCode()?.code;

  async function sendEmail() {
    setStage('sending'); setError('');
    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, username, code: demoCode ?? '000000' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      setPreviewUrl(data.previewUrl ?? null);
      setStage('sent');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur envoi');
      setStage('error');
    }
  }

  function handleVerify() {
    if (verifyEmail(code)) { onVerified(); }
    else { setError('Code incorrect.'); }
  }

  if (dismissed) return null;

  return (
    <div className="mx-4 mb-2 rounded-2xl overflow-hidden flex-shrink-0 animate-fade-in"
      style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.22)' }}>

      {stage === 'idle' && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <span className="text-xl flex-shrink-0">⭐</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-300">Valide ton compte pour obtenir le badge ⭐</div>
            <div className="text-xs text-white/35 truncate">{email}</div>
          </div>
          <button onClick={sendEmail}
            className="text-xs font-black px-3 py-1.5 rounded-xl transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
            Envoyer le mail
          </button>
          <button onClick={() => setDismissed(true)}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5 text-white/30" />
          </button>
        </div>
      )}

      {stage === 'sending' && (
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
          <span className="text-xs text-white/50">Envoi de l'email de validation…</span>
        </div>
      )}

      {stage === 'sent' && (
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Mail className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-amber-300">Email envoyé ! 📬</div>
              <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
                Vérifie ta boîte <strong className="text-white/70">{email}</strong> et clique sur{' '}
                <strong className="text-amber-300">⭐ Valider mon compte</strong>.
              </p>
            </div>
          </div>

          {/* Preview URL for dev/test (Ethereal) */}
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white mb-3 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              <Mail className="w-3.5 h-3.5 ml-3" />
              Voir l'email de validation (mode test)
              <ExternalLink className="w-3.5 h-3.5 ml-auto mr-3" />
            </a>
          )}

          {/* Code fallback */}
          <div className="flex gap-2">
            <input
              className="wl-input flex-1 rounded-xl px-3 py-2 text-sm font-mono tracking-widest text-center"
              placeholder="Code 6 chiffres"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerify()}
              maxLength={6}
            />
            <button onClick={handleVerify} disabled={code.length < 6}
              className="px-4 py-2 rounded-xl text-sm font-black text-white transition-all disabled:opacity-30 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              ⭐ Valider
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          {demoCode && (
            <p className="text-xs text-amber-400/60 mt-1 text-center">Code demo : <strong className="font-mono">{demoCode}</strong></p>
          )}
          <button onClick={() => setStage('idle')} className="mt-2 text-xs text-white/20 hover:text-white/50 transition-colors w-full text-center">
            Renvoyer l'email
          </button>
        </div>
      )}

      {stage === 'error' && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300 flex-1">{error}</span>
          <button onClick={() => setStage('idle')} className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Star verified badge ──────────────────────────────────────────────────────

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <span title="Compte vérifié ⭐" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}
