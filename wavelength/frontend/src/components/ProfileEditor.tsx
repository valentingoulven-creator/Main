import { useState, useRef } from 'react';
import { X, Camera, Save, MapPin, Link2, Cake } from 'lucide-react';
import { maxBirthDate, minBirthDate } from '../utils/ageUtils';
import type { UserProfile, ConnectedApps } from '../types';
import { compressImage } from '../utils/imageUtils';
import { PLATFORMS, SpotifyLogo } from './SourceLogo';

const COLORS  = ['#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316'];
const EMOJIS  = ['🎵','🎸','🎹','🎤','🥁','🎧','🎻','🎷'];
const INTERESTS_LIST = [
  'Pop 🎵','Rock 🎸','Hip-Hop 🎤','Électro 🥁','Jazz 🎷','Classique 🎻',
  'R&B 🎶','Metal 🔊','Reggae 🌴','K-Pop ✨','Folk 🌿','House 🎚️',
  'Concerts 🎤','Festivals 🎪','Danse 💃','Gaming 🎮','Cinéma 🎬',
  'Art 🎨','Photo 📷','Voyages ✈️','Sport 🏃','Lecture 📚','Mode 👗','Tech 💻',
];

interface Props {
  profile: UserProfile;
  jamUrl?: string;
  onSave: (updated: Partial<UserProfile> & { jamUrl?: string }) => void;
  onClose: () => void;
}

export default function ProfileEditor({ profile, jamUrl: initJamUrl, onSave, onClose }: Props) {
  const [color, setColor]             = useState(profile.color);
  const [emoji, setEmoji]             = useState(profile.emoji);
  const [bio, setBio]                 = useState(profile.bio ?? '');
  const [birthDate, setBirthDate]     = useState(profile.birthDate ?? '');
  const [address, setAddress]         = useState(profile.address ?? '');
  const [interests, setInterests]     = useState<string[]>(profile.interests ?? []);
  const [photos, setPhotos]           = useState<string[]>(profile.photos ?? []);
  const [jamUrl, setJamUrl]           = useState(initJamUrl ?? '');
  const [connectedApps, setConnectedApps] = useState<ConnectedApps>(profile.connectedApps ?? {});
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    for (const file of Array.from(e.target.files ?? []).slice(0, 3 - photos.length)) {
      try { const c = await compressImage(file, 250, 0.65); setPhotos(p => [...p, c]); }
      catch { /* ignore */ }
    }
    e.target.value = '';
  }

  function toggleInterest(item: string) {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : prev.length < 6 ? [...prev, item] : prev);
  }

  function setApp(key: string, val: string) {
    setConnectedApps(prev => {
      const next = { ...prev };
      if (val.trim()) next[key as keyof ConnectedApps] = val.trim();
      else delete next[key as keyof ConnectedApps];
      return next;
    });
  }

  function handleSave() {
    onSave({ color, emoji, bio: bio.trim() || undefined, birthDate: birthDate || undefined, address: address.trim() || undefined,
      interests: interests.length ? interests : undefined, photos: photos.length ? photos : undefined,
      connectedApps: Object.keys(connectedApps).length ? connectedApps : undefined,
      jamUrl: jamUrl.trim() || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong rounded-3xl w-full max-w-sm p-5 animate-pop-in overflow-y-auto" style={{ maxHeight: '92vh' }}>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Mon profil</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Photos */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Photos (max 3)</label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((p, i) => (
              <div key={i} className="relative w-14 h-14">
                <img src={p} className="w-14 h-14 rounded-xl object-cover" />
                <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button onClick={() => fileRef.current?.click()}
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.15)' }}>
                <Camera className="w-4 h-4 text-white/30" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>

        {/* Color + Emoji */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Couleur</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all relative" style={{ background: c }}>
                  {color === c && <span className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-1 ring-offset-transparent" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Icône</label>
            <div className="flex gap-1 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${emoji === e ? 'scale-110' : 'opacity-50'}`}
                  style={emoji === e ? { background: color + '33', border: `2px solid ${color}66` } : { background: 'rgba(255,255,255,0.05)' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Adresse / Ville
          </label>
          <input className="wl-input w-full rounded-xl px-3 py-2.5 text-sm"
            placeholder="Paris 75010, Lyon…" value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        {/* Birth date */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Cake className="w-3 h-3" /> Date de naissance
          </label>
          <input type="date"
            className="wl-input w-full rounded-xl px-3 py-2.5 text-sm"
            value={birthDate} onChange={e => setBirthDate(e.target.value)}
            max={maxBirthDate()} min={minBirthDate()}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Bio */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
            Bio <span className="text-white/20 normal-case font-normal">{bio.length}/150</span>
          </label>
          <textarea className="wl-input w-full rounded-xl px-3 py-2.5 text-sm resize-none"
            placeholder="Ta musique, tes passions…" value={bio}
            onChange={e => setBio(e.target.value.slice(0, 150))} rows={2} />
        </div>

        {/* Connected apps */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Applis musique connectées</label>
          <div className="space-y-1.5">
            {PLATFORMS.map(({ key, label, color: pColor, bgColor, placeholder, Logo }) => (
              <div key={key} className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: bgColor, border: `1px solid ${pColor}20` }}>
                <Logo size={18} className="flex-shrink-0" />
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
        <div className="mb-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
            Centres d'intérêt <span className="text-white/20 normal-case font-normal">{interests.length}/6</span>
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {INTERESTS_LIST.map(item => {
              const sel = interests.includes(item);
              return (
                <button key={item} onClick={() => toggleInterest(item)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all font-medium"
                  style={sel ? { background: color, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Jam URL */}
        <div className="mb-4">
          <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#1DB954' }}>
            <SpotifyLogo size={12} /> Jam Spotify
            <span className="text-white/25 normal-case font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            <input className="wl-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
              placeholder="open.spotify.com/jam/…"
              value={jamUrl} onChange={e => setJamUrl(e.target.value)} />
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2
            transition-all active:scale-95 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color}, #ec4899)` }}>
          <Save className="w-4 h-4" /> Sauvegarder
        </button>
      </div>
    </div>
  );
}
