import { useState, useRef } from 'react';
import { X, Camera, Save, Music, Link2 } from 'lucide-react';
import type { UserProfile } from '../types';
import { compressImage } from '../utils/imageUtils';
import { SpotifyLogo } from './SourceLogo';

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

export default function ProfileEditor({ profile, jamUrl: initialJamUrl, onSave, onClose }: Props) {
  const [color, setColor]       = useState(profile.color);
  const [emoji, setEmoji]       = useState(profile.emoji);
  const [bio, setBio]           = useState(profile.bio ?? '');
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [photos, setPhotos]     = useState<string[]>(profile.photos ?? []);
  const [jamUrl, setJamUrl]     = useState(initialJamUrl ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 3 - photos.length;
    for (const file of files.slice(0, remaining)) {
      try {
        const compressed = await compressImage(file, 250, 0.65);
        setPhotos(prev => [...prev, compressed]);
      } catch { /* ignore */ }
    }
    e.target.value = '';
  }

  function toggleInterest(item: string) {
    setInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : prev.length < 6 ? [...prev, item] : prev
    );
  }

  function handleSave() {
    onSave({ color, emoji, bio: bio.trim() || undefined, interests: interests.length ? interests : undefined, photos: photos.length ? photos : undefined, jamUrl: jamUrl.trim() || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong rounded-3xl w-full max-w-sm p-5 animate-pop-in overflow-y-auto"
        style={{ maxHeight: '90vh' }}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color }} /> Mon profil
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Photos */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Photos (max 3)</label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((p, i) => (
              <div key={i} className="relative w-16 h-16">
                <img src={p} className="w-16 h-16 rounded-xl object-cover" />
                <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.15)' }}>
                <Camera className="w-5 h-5 text-white/30" />
                <span className="text-xs text-white/20">Ajouter</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>

        {/* Color */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Couleur</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all relative flex-shrink-0" style={{ background: c }}>
                {color === c && <span className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-1 ring-offset-transparent" />}
              </button>
            ))}
          </div>
        </div>

        {/* Emoji */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Icône</label>
          <div className="flex gap-1.5">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all duration-200 ${emoji === e ? 'scale-110' : 'opacity-50'}`}
                style={emoji === e ? { background: color + '33', border: `2px solid ${color}66` } : { background: 'rgba(255,255,255,0.05)' }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
            Bio <span className="text-white/20 normal-case font-normal">{bio.length}/150</span>
          </label>
          <textarea
            className="wl-input w-full rounded-xl px-3 py-2.5 text-sm resize-none"
            placeholder="Parle de ta musique, tes passions…"
            value={bio} onChange={e => setBio(e.target.value.slice(0, 150))} rows={2}
          />
        </div>

        {/* Interests */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
            Centres d'intérêt <span className="text-white/20 normal-case font-normal">{interests.length}/6</span>
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {INTERESTS_LIST.map(item => {
              const selected = interests.includes(item);
              return (
                <button key={item} onClick={() => toggleInterest(item)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all duration-200 font-medium"
                  style={selected ? { background: color, color: '#fff' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spotify Jam URL */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <SpotifyLogo size={12} /> Jam Spotify (optionnel)
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input
              className="wl-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
              placeholder="open.spotify.com/jam/…"
              value={jamUrl} onChange={e => setJamUrl(e.target.value)}
            />
          </div>
          <p className="text-xs text-white/25 mt-1 pl-1">Partage le lien de ton Jam Spotify pour inviter les gens à écouter avec toi</p>
        </div>

        <button onClick={handleSave}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white
            flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color}, #ec4899)` }}>
          <Save className="w-4 h-4" /> Sauvegarder
        </button>
      </div>
    </div>
  );
}
