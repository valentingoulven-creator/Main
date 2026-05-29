import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { register, login } from '../utils/auth';
import type { Session } from '../utils/auth';
import { MeloSongLockup } from './MeloSongLogo';

interface Props {
  onSuccess: (session: Session) => void;
}

export default function AuthScreen({ onSuccess }: Props) {
  const [tab, setTab]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]     = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password strength
  const pwdStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /\d/.test(password) ? 4 : 3;
  const pwdColors   = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const pwdLabels   = ['', 'Trop court', 'Faible', 'Moyen', 'Fort'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (tab === 'signup') {
        if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
        const res = await register(email, username, password);
        if (!res.ok) { setError(res.error); return; }
        setSuccess('Compte créé ! Bienvenue sur MeloSong 🎵');
        setTimeout(() => onSuccess(res.session), 800);
      } else {
        const res = await login(email, password);
        if (!res.ok) { setError(res.error); return; }
        onSuccess(res.session);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-bg h-screen flex items-center justify-center p-4 overflow-auto">
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
      </div>

      <div className="glass-strong rounded-3xl p-7 w-full max-w-sm animate-pop-in relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <MeloSongLockup markSize={32} textSize="text-2xl" className="mb-1.5" />
          <p className="text-xs text-white/40">Découvre la musique autour de toi</p>
        </div>

        {/* Tab toggle */}
        <div className="flex p-1 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['login', 'signup'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(null); setSuccess(null); }}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff' }
                : { color: 'rgba(255,255,255,0.4)' }}>
              {t === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input type="email" required autoComplete="email"
              className="wl-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
              placeholder="Adresse email"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>

          {/* Username (signup only) */}
          {tab === 'signup' && (
            <div className="relative animate-fade-in">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input type="text" required maxLength={24} autoComplete="username"
                className="wl-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                placeholder="Pseudo (affiché aux autres)"
                value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          )}

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input type={showPwd ? 'text' : 'password'} required autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              className="wl-input w-full rounded-xl pl-10 pr-10 py-3 text-sm"
              placeholder="Mot de passe"
              value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPwd(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors">
              {showPwd ? <EyeOff className="w-4 h-4 text-white/30" /> : <Eye className="w-4 h-4 text-white/30" />}
            </button>
          </div>

          {/* Password strength (signup) */}
          {tab === 'signup' && password.length > 0 && (
            <div className="animate-fade-in">
              <div className="flex gap-1 mb-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{ background: i <= pwdStrength ? pwdColors[pwdStrength] : 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              <p className="text-xs" style={{ color: pwdColors[pwdStrength] }}>{pwdLabels[pwdStrength]}</p>
            </div>
          )}

          {/* Confirm password (signup) */}
          {tab === 'signup' && (
            <div className="relative animate-fade-in">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input type={showPwd ? 'text' : 'password'} required autoComplete="new-password"
                className="wl-input w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                placeholder="Confirmer le mot de passe"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
              {confirm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {confirm === password
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl animate-fade-in"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300">{success}</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all
              disabled:opacity-50 active:scale-95 hover:opacity-90 flex items-center justify-center gap-2 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {tab === 'login' ? 'Me connecter' : 'Créer mon compte'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Terms (signup) */}
        {tab === 'signup' && (
          <p className="text-center text-xs text-white/20 mt-4 leading-relaxed">
            En créant un compte, tu acceptes nos<br />
            <span className="text-white/40 underline underline-offset-2 cursor-pointer">conditions d'utilisation</span>
            {' '}et notre{' '}
            <span className="text-white/40 underline underline-offset-2 cursor-pointer">politique de confidentialité</span>.
          </p>
        )}

        {/* Forgot password */}
        {tab === 'login' && (
          <button className="w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors mt-4">
            Mot de passe oublié ?
          </button>
        )}
      </div>
    </div>
  );
}
