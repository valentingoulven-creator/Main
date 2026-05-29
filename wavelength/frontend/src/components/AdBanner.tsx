import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Ad {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  gradient: string;
  icon: string;
}

const ADS: Ad[] = [
  {
    id: 'spotify-premium',
    label: 'Publicité',
    icon: '🎵',
    title: 'Spotify Premium',
    subtitle: '3 mois offerts — Sans pub, sans limite',
    cta: 'Essayer gratuitement',
    url: 'https://www.spotify.com/fr/premium/',
    gradient: 'linear-gradient(90deg, #1DB954 0%, #158a3e 100%)',
  },
  {
    id: 'deezer-hifi',
    label: 'Publicité',
    icon: '🎧',
    title: 'Deezer HiFi',
    subtitle: 'Son lossless pour les vrais mélomanes',
    cta: 'Découvrir',
    url: 'https://www.deezer.com/fr/offers/',
    gradient: 'linear-gradient(90deg, #ef5466 0%, #c0392b 100%)',
  },
  {
    id: 'youtube-music',
    label: 'Publicité',
    icon: '▶️',
    title: 'YouTube Music',
    subtitle: 'Tous les sons, toutes les vidéos — 1 mois gratuit',
    cta: 'Commencer',
    url: 'https://music.youtube.com/',
    gradient: 'linear-gradient(90deg, #FF0000 0%, #cc0000 100%)',
  },
  {
    id: 'fnac-concerts',
    label: 'Publicité',
    icon: '🎤',
    title: 'Fnac Spectacles',
    subtitle: 'Les meilleurs concerts près de chez toi',
    cta: 'Voir les billets',
    url: 'https://www.fnacspectacles.com/',
    gradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
  },
];

interface Props {
  // Pass a custom ad slot or null to use the rotating demo ads
  customAd?: Omit<Ad, 'id'>;
}

export default function AdBanner({ customAd }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [adIndex] = useState(() => Math.floor(Math.random() * ADS.length));

  if (dismissed) return null;

  const ad = customAd ? { ...customAd, id: 'custom' } : ADS[adIndex];

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 relative animate-fade-in flex-shrink-0"
      style={{
        background: 'rgba(10,10,20,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        minHeight: 48,
      }}
    >
      {/* Gradient accent line on left */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: ad.gradient }} />

      {/* Ad label */}
      <span className="text-xs text-white/20 font-medium flex-shrink-0 pl-2">Pub</span>

      {/* Icon */}
      <span className="text-base flex-shrink-0 leading-none">{ad.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="min-w-0">
          <span className="text-xs font-bold text-white mr-1.5">{ad.title}</span>
          <span className="text-xs text-white/45 truncate hidden sm:inline">{ad.subtitle}</span>
        </div>

        {/* CTA */}
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full transition-all hover:opacity-90 active:scale-95"
          style={{ background: ad.gradient, color: '#fff' }}
        >
          {ad.cta}
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        title="Fermer"
      >
        <X className="w-3.5 h-3.5 text-white/30" />
      </button>
    </div>
  );
}
