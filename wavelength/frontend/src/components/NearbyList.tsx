import { useState, useRef } from 'react';
import { Users, Sliders, Check, X } from 'lucide-react';
import type { NearbyUser, Coordinates, ChatStatus } from '../types';
import NearbyCard from './NearbyCard';

const RADIUS_PRESETS = [
  { label: '500 m', value: 500 },
  { label: '1 km',  value: 1000 },
  { label: '2 km',  value: 2000 },
  { label: '5 km',  value: 5000 },
];

interface Props {
  users: NearbyUser[];
  radius: number;
  onRadiusChange: (r: number) => void;
  onSelectUser: (pos: Coordinates) => void;
  onChatUser: (user: NearbyUser) => void;
  onViewProfile: (user: NearbyUser) => void;
  onWatchLive: (user: NearbyUser) => void;
  myChatStatus: ChatStatus;
  accentColor: string;
}

function formatRadius(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km`;
}

export default function NearbyList({ users, radius, onRadiusChange, onSelectUser, onChatUser, onViewProfile, onWatchLive, accentColor }: Props) {
  const playing = users.filter(u => u.track);
  const idle    = users.filter(u => !u.track);

  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal]   = useState('');
  const [sliderVal, setSliderVal]   = useState(radius);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPreset = RADIUS_PRESETS.some(p => p.value === radius);

  function applyCustom() {
    const v = parseInt(customVal, 10);
    if (!isNaN(v) && v >= 50 && v <= 5000) {
      onRadiusChange(v);
      setShowCustom(false);
      setCustomVal('');
    }
  }

  function applySlider(v: number) {
    setSliderVal(v);
    onRadiusChange(v);
  }

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      {/* Radius selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-white/30 font-medium">Rayon de recherche</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: accentColor }}>{formatRadius(radius)}</span>
            <button
              onClick={() => { setShowCustom(c => !c); setSliderVal(radius); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
              style={showCustom
                ? { background: accentColor + '22', color: accentColor }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              title="Rayon personnalisé">
              <Sliders className="w-3 h-3" />
              Perso
            </button>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex gap-1">
          {RADIUS_PRESETS.map(o => (
            <button key={o.value} onClick={() => { onRadiusChange(o.value); setShowCustom(false); }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200"
              style={radius === o.value
                ? { background: accentColor, color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              {o.label}
            </button>
          ))}
        </div>

        {/* Custom radius panel */}
        {showCustom && (
          <div className="mt-2 p-3 rounded-2xl animate-fade-in"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Slider */}
            <div className="mb-3">
              <input
                type="range" min={50} max={5000} step={50}
                value={sliderVal}
                onChange={e => applySlider(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor,
                  background: `linear-gradient(to right, ${accentColor} ${(sliderVal / 5000) * 100}%, rgba(255,255,255,0.15) ${(sliderVal / 5000) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-white/25 mt-1">
                <span>50 m</span>
                <span className="font-bold" style={{ color: accentColor }}>{formatRadius(sliderVal)}</span>
                <span>5 km</span>
              </div>
            </div>

            {/* Or type exact value */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30 flex-shrink-0">ou saisir :</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="number" min={50} max={5000}
                  className="wl-input w-full rounded-xl px-3 py-2 text-sm pr-12"
                  placeholder="ex: 750"
                  value={customVal}
                  onChange={e => setCustomVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">m</span>
              </div>
              <button onClick={applyCustom}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: accentColor }}>
                <Check className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setShowCustom(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Custom badge when not preset */}
            {!isPreset && (
              <div className="mt-2 text-center text-xs font-semibold" style={{ color: accentColor }}>
                ✓ Rayon personnalisé : {formatRadius(radius)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs text-white/40">
          {users.length === 0 ? 'Personne à proximité' : `${users.length} personne${users.length > 1 ? 's' : ''} à proximité`}
        </span>
        {playing.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
            style={{ background: accentColor + '22', color: accentColor }}>
            {playing.length} en écoute
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {users.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {playing.map(u => (
              <NearbyCard key={u.id} user={u}
                onClick={() => { onViewProfile(u); onSelectUser(u.position); }}
                onChat={() => onChatUser(u)}
                onWatchLive={() => onWatchLive(u)} />
            ))}
            {idle.length > 0 && playing.length > 0 && (
              <div className="text-xs text-white/20 px-1 pt-1">Pas en écoute</div>
            )}
            {idle.map(u => (
              <NearbyCard key={u.id} user={u}
                onClick={() => { onViewProfile(u); onSelectUser(u.position); }}
                onChat={() => onChatUser(u)}
                onWatchLive={() => onWatchLive(u)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">🎧</div>
      <div className="text-sm font-semibold text-white/40">Personne à proximité</div>
      <div className="text-xs text-white/20 mt-1">Augmente le rayon ou reviens plus tard</div>
    </div>
  );
}
