# GéoApp — Application de Géolocalisation

Une application web interactive de géolocalisation construite avec React, Leaflet et TypeScript.

## Fonctionnalités

- **Position en temps réel** : Détection de votre position GPS avec indication de précision
- **Recherche de lieux** : Recherche d'adresses et de points d'intérêt via OpenStreetMap/Nominatim
- **Clic sur la carte** : Cliquez n'importe où pour obtenir les informations d'un lieu
- **4 styles de carte** : Rues, Satellite, Sombre, Topographique
- **Lieux sauvegardés** : Enregistrez et gérez vos lieux favoris (persistance locale)
- **Copie des coordonnées** : Copiez les coordonnées GPS en un clic
- **Geocodage inverse** : Résolution automatique d'adresses depuis des coordonnées

## Stack technique

- **React 18** + **TypeScript** + **Vite**
- **Leaflet** / **React-Leaflet** — Carte interactive
- **Tailwind CSS** — Styles
- **Lucide React** — Icônes
- **Nominatim (OpenStreetMap)** — Geocodage / Geocodage inverse

## Démarrage

```bash
cd geoapp
npm install
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur.

## Build de production

```bash
npm run build
npm run preview
```
