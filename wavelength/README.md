# Wavelength 🎵

> Partage ta musique avec les gens autour de toi en temps réel.

Une application web full-stack qui permet à des personnes proches géographiquement (via la géolocalisation) de voir ce que leurs voisins écoutent sur Spotify ou YouTube.

## Fonctionnalités

- **Profil personnalisé** — Pseudo, couleur et emoji avatar
- **Géolocalisation** — Position GPS en temps réel via le navigateur
- **Partage de musique** — Colle un lien Spotify ou YouTube (ou saisie manuelle)
- **Utilisateurs proches en temps réel** — Via Socket.io, vois ce qu'écoutent les gens autour de toi
- **Rayon configurable** — 500 m, 1 km, 2 km, 5 km, 10 km
- **Carte interactive** — Carte sombre avec marqueurs animés pour chaque auditeur
- **Utilisateurs démo** — 8 faux utilisateurs simulés autour de ta position au démarrage
- **Prévisualisation des morceaux** — Titre, artiste, pochette via oEmbed (sans clé API)

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | React 18 + TypeScript + Vite |
| Styles | Tailwind CSS v3 (dark theme + glassmorphisme) |
| Carte | Leaflet + React-Leaflet + CartoDB Dark tiles |
| Icônes | Lucide React |
| Temps réel | Socket.io (client + server) |
| Backend | Express.js + Socket.io |
| Géocodage | oEmbed Spotify/YouTube (proxied) |

## Démarrage

### Backend

```bash
cd wavelength/backend
npm install
node server.js
# → http://localhost:3001
```

### Frontend

```bash
cd wavelength/frontend
npm install
npm run dev
# → http://localhost:5174
```

## Architecture

```
wavelength/
├── backend/
│   ├── package.json
│   └── server.js         # Express + Socket.io, calcul de proximité, mock users
└── frontend/
    ├── vite.config.ts    # Proxy /socket.io et /api → port 3001
    └── src/
        ├── App.tsx                    # État global, layout split
        ├── types.ts                   # Types partagés
        ├── hooks/
        │   ├── useSocket.ts           # Socket.io client
        │   └── useGeolocation.ts      # GPS
        └── components/
            ├── SetupScreen.tsx        # Onboarding
            ├── NowPlaying.tsx         # Morceau en cours
            ├── TrackInput.tsx         # Saisie de lien/morceau
            ├── NearbyList.tsx         # Liste des auditeurs proches
            ├── NearbyCard.tsx         # Carte d'un auditeur
            └── MapView.tsx            # Carte Leaflet
```
