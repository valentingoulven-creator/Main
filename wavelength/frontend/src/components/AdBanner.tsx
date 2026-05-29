import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Ad {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
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
    description: 'Écoute ta musique en haute qualité, télécharge tes playlists et profite d\'une expérience sans interruption.',
    cta: 'Essayer gratuitement',
    url: 'https://www.spotify.com/fr/premium/',
    gradient: 'linear-gradient(135deg, #1DB954 0%, #158a3e 100%)',
  },
  {
    id: 'deezer-hifi',
    label: 'Publicité',
    icon: '🎧',
    title: 'Deezer HiFi',
    subtitle: 'Son lossless pour les vrais mélomanes',
    description: 'Redécouvre ta musique préférée avec une qualité audio sans compromis. Jusqu\'à 16 bits, 44.1 kHz.',
    cta: 'Découvrir Deezer',
    url: 'https://www.deezer.com/fr/offers/',
    gradient: 'linear-gradient(135deg, #ef5466 0%, #c0392b 100%)',
  },
  {
    id: 'youtube-music',
    label: 'Publicité',
    icon: '▶️',
    title: 'YouTube Music Premium',
    subtitle: 'Tous les sons, toutes les vidéos',
    description: 'Accède à des millions de chansons et de clips vidéo. 1 mois gratuit, puis 9,99€/mois.',
    cta: 'Commencer',
    url: 'https://music.youtube.com/',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #cc0000 100%)',
  },
  {
    id: 'fnac-concerts',
    label: 'Publicité',
    icon: '🎤',
    title: 'Fnac Spectacles',
    subtitle: 'Les meilleurs concerts près de chez toi',
    description: 'Retrouve tous tes artistes préférés en concert. Billetterie en ligne, réservation rapide et sécurisée.',
    cta: 'Voir les billets',
    url: 'https://www.fnacspectacles.com/',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
];

interface Props {
  customAd?: Omit<Ad, 'id'>;
}

export default function AdBanner({ customAd }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [adIndex] = useState(() => Math.floor(Math.random() * ADS.length));

  if (dismissed) return null;

  const ad = customAd ? { ...customAd, id: 'custom' } : ADS[adIndex];

  return (
    <div
      className="relative flex-shrink-0 animate-fade-in overflow-hidden"
      style={{
        background: 'rgba(10,10,20,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: 144,
      }}
    >
      {/* Full gradient background band */}
      <div className="absolute inset-0 opacity-10" style={{ background: ad.gradient }} />

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ background: ad.gradient }} />

      <div className="relative flex gap-4 px-6 py-5">
        {/* Big icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-xl"
          style={{ background: ad.gradient }}
        >
          {ad.icon}
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white/25 font-medium tracking-wide uppercase">Publicité</span>
            </div>
            <div className="text-lg font-black text-white leading-tight mb-1">{ad.title}</div>
            <div className="text-sm font-semibold mb-1.5" style={{
              background: ad.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {ad.subtitle}
            </div>
            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{ad.description}</p>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-3">
            <a
              href={ad.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl
                transition-all hover:opacity-90 active:scale-95 shadow-lg text-white"
              style={{ background: ad.gradient }}
            >
              {ad.cta}
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center
            hover:bg-white/10 transition-colors"
          title="Fermer"
        >
          <X className="w-4 h-4 text-white/30" />
        </button>
      </div>
    </div>
  );
}
