import { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, Music2, Camera, X, MapPin } from 'lucide-react';
import type { UserProfile, ConnectedApps } from '../types';
import { compressImage } from '../utils/imageUtils';
import { PLATFORMS } from './SourceLogo';

const COLORS   = ['#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316'];
const EMOJIS   = ['🎵','🎸','🎹','🎤','🥁','🎧','🎻','🎷'];
const INTERESTS_LIST = [
  'Pop 🎵','Rock 🎸','Hip-Hop 🎤','Électro 🥁','Jazz 🎷','Classique 🎻',
  'R&B 🎶','Metal 🔊','Reggae 🌴','K-Pop ✨','Folk 🌿','House 🎚️',
  'Concerts 🎤','Festivals 🎪','Danse 💃','Gaming 🎮','Cinéma 🎬',
  'Art 🎨','Photo 📷','Voyages ✈️','Sport 🏃','Lecture 📚','Mode 👗','Tech 💻',
];

interface Props { onComplete: (p: UserProfile) => void }

export default function SetupScreen({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [color, setColor]       = useState(COLORS[0]);
  const [emoji, setEmoji]       = useState(EMOJIS[0]);
  const [bio, setBio]           = useState('');
  const [address, setAddress]   = useState('');
  const [interests, setInterests]     = useState<string[]>([]);
  const [photos, setPhotos]           = useState<string[]>([]);
  const [connectedApps, setConnectedApps] = useState<ConnectedApps>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    for (const file of Array.from(e.target.files ?? []).slice(0, 3 - photos.length)) {
      try { setPhotos(p => [...p, '']); const c = await compressImage(file, 250, 0.65); setPhotos(p => [...p.slice(0, -1), c]); }
      catch { setPhotos(p => p.slice(0, -1)); }
    }
    e.target.value = '';
  }

  function toggleInterest(item: string) {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : prev.length < 6 ? [...prev, item] : prev);
  }

  function setApp(key: string, val: string) {
    setConnectedApps(prev => ({ ...prev, [key]: val || undefined }));
  }

  function finish() {
    onComplete({
      username: username.trim(), color, emoji,
      bio: bio.trim() || undefined,
      address: address.trim() || undefined,
      interests: interests.length ? interests : undefined,
      photos: photos.filter(Boolean).length ? photos.filter(Boolean) : undefined,
      connectedApps: Object.keys(connectedApps).length ? connectedApps : undefined,
    });
  }

  return (
    <div className="app-bg h-screen flex items-center justify-center p-4 overflow-auto">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
      </div>

      <div className="glass-strong rounded-3xl p-7 w-full max-w-sm animate-pop-in relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-2xl mb-2.5 flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Melo</h1>
          <p className="text-xs text-white/40 mt-0.5">Découvre la musique autour de toi</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-5 justify-center">
          {[1, 2].map(s => (
            <div key={s} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: step === s ? 28 : 16, background: step >= s ? color : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>

        {step === 1 ? (
          /* ── STEP 1: identity ───────────────────────────── */
          <>
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Ton pseudo</label>
              <input className="wl-input w-full rounded-xl px-4 py-3 text-sm font-medium"
                placeholder="ex: Sophie, DJ_Alex…" value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && username.trim() && setStep(2)}
                autoFocus maxLength={24} />
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Couleur</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full transition-all duration-200 relative flex-shrink-0" style={{ background: c }}>
                    {color === c && <span className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-2 ring-offset-transparent" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Icône</label>
              <div className="flex gap-2">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? 'scale-110' : 'opacity-50 hover:opacity-80'}`}
                    style={emoji === e ? { background: color + '33', border: `2px solid ${color}66` } : { background: 'rgba(255,255,255,0.05)' }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl"
              style={{ background: color + '15', border: `1px solid ${color}30` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: color }}>{emoji}</div>
              <div>
                <div className="text-sm font-semibold text-white">{username || 'Ton pseudo'}</div>
                <div className="text-xs text-white/40">Prêt à découvrir la musique</div>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!username.trim()}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2
                transition-all disabled:opacity-40 active:scale-95 hover:opacity-90 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${color}, #ec4899)` }}>
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* ── STEP 2: profile details ─────────────────────── */
          <div className="overflow-y-auto" style={{ maxHeight: '62vh' }}>
            {/* Photos */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Photos (max 3)</label>
              <div className="flex gap-2 flex-wrap">
                {photos.filter(Boolean).map((p, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={p} className="w-16 h-16 rounded-xl object-cover" />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {photos.filter(Boolean).length < 3 && (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.15)' }}>
                    <Camera className="w-5 h-5 text-white/30" />
                    <span className="text-xs text-white/20">Photo</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Adresse / Ville
                <span className="text-white/20 normal-case font-normal">(optionnel)</span>
              </label>
              <input className="wl-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="ex: Paris 75010, Lyon…"
                value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                Bio <span className="text-white/20 normal-case font-normal">{bio.length}/150</span>
              </label>
              <textarea className="wl-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                placeholder="Ta musique, tes passions…" value={bio}
                onChange={e => setBio(e.target.value.slice(0, 150))} rows={2} />
            </div>

            {/* Connected apps */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Connecte tes applis musique</label>
              <div className="space-y-2">
                {PLATFORMS.map(({ key, label, color: pColor, bgColor, placeholder, Logo }) => (
                  <div key={key} className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: bgColor, border: `1px solid ${pColor}20` }}>
                    <Logo size={20} className="flex-shrink-0" />
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: pColor, minWidth: 80 }}>{label}</span>
                    <input
                      className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/25 outline-none min-w-0"
                      placeholder={placeholder}
                      value={connectedApps[key as keyof ConnectedApps] ?? ''}
                      onChange={e => setApp(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                Centres d'intérêt <span className="text-white/20 normal-case font-normal">{interests.length}/6</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS_LIST.map(item => {
                  const sel = interests.includes(item);
                  return (
                    <button key={item} onClick={() => toggleInterest(item)}
                      className="text-xs px-2.5 py-1 rounded-full transition-all font-medium"
                      style={sel ? { background: color, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={() => setStep(1)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={finish}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2
                transition-all active:scale-95 hover:opacity-90 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${color}, #ec4899)` }}>
              Commencer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
