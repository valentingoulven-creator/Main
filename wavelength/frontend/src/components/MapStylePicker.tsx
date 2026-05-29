import { X, Check } from 'lucide-react';

export interface MapStyle {
  id: string;
  name: string;
  description: string;
  url: string;
  url2?: string; // optional label overlay
  previewTile: string;
  attribution: string;
  dark: boolean;
}

// Paris centre — zoom 10 tile x=518, y=351
const PARIS_TILE = (url: string) =>
  url
    .replace('{s}', 'a')
    .replace('{z}', '10')
    .replace('{x}', '518')
    .replace('{y}', '351')
    .replace('{r}', '@2x');

export const MAP_STYLES: MapStyle[] = [
  {
    id: 'carto-dark',
    name: 'Dark Blue',
    description: 'Fond bleu nuit, minimal',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    previewTile: PARIS_TILE('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'),
    attribution: '© OpenStreetMap © CARTO',
    dark: true,
  },
  {
    id: 'voyager',
    name: 'Voyager',
    description: 'Coloré, moderne, propre',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    previewTile: PARIS_TILE('https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'),
    attribution: '© OpenStreetMap © CARTO',
    dark: false,
  },
  {
    id: 'positron',
    name: 'Positron',
    description: 'Blanc épuré, très minimaliste',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    previewTile: PARIS_TILE('https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'),
    attribution: '© OpenStreetMap © CARTO',
    dark: false,
  },
  {
    id: 'esri-satellite',
    name: 'Satellite',
    description: 'Vue aérienne haute résolution',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    previewTile: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/351/518',
    attribution: '© Esri',
    dark: true,
  },
  {
    id: 'esri-natgeo',
    name: 'National Geographic',
    description: 'Style carte de géographie',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    previewTile: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/10/351/518',
    attribution: '© Esri, National Geographic',
    dark: false,
  },
  {
    id: 'esri-topo',
    name: 'Topographique',
    description: 'Reliefs, élégant et précis',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    previewTile: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/10/351/518',
    attribution: '© Esri',
    dark: false,
  },
  {
    id: 'esri-dark-gray',
    name: 'Dark Gray',
    description: 'Gris ardoise élégant',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    url2: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    previewTile: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/10/351/518',
    attribution: '© Esri',
    dark: true,
  },
  {
    id: 'stamen-toner',
    name: 'Toner',
    description: 'Noir et blanc contrasté',
    url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    previewTile: 'https://stamen-tiles.a.ssl.fastly.net/toner/10/518/351.png',
    attribution: '© Stamen Design',
    dark: false,
  },
  {
    id: 'osm-fr',
    name: 'OSM France',
    description: 'Noms en français, détaillé',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    previewTile: 'https://a.tile.openstreetmap.fr/osmfr/10/518/351.png',
    attribution: '© OpenStreetMap France',
    dark: false,
  },
];

interface Props {
  current: string;
  onSelect: (style: MapStyle) => void;
  onClose: () => void;
}

export default function MapStylePicker({ current, onSelect, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-base font-bold text-white">Choisir le style de carte</h2>
            <p className="text-xs text-white/40 mt-0.5">Aperçu de Paris — clique pour appliquer</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 p-5 overflow-y-auto" style={{ maxHeight: '72vh' }}>
          {MAP_STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => { onSelect(style); onClose(); }}
              className="group relative rounded-2xl overflow-hidden transition-all duration-200
                hover:scale-105 hover:shadow-2xl active:scale-100"
              style={current === style.id
                ? { boxShadow: '0 0 0 3px #8b5cf6, 0 8px 24px rgba(139,92,246,0.4)' }
                : { border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {/* Map preview */}
              <div className="relative overflow-hidden" style={{ paddingBottom: '65%' }}>
                <img
                  src={style.previewTile}
                  alt={style.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                {/* Fallback */}
                <div className="hidden absolute inset-0 flex items-center justify-center text-xs text-white/30"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  🗺️
                </div>

                {/* Selected check */}
                {current === style.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: '#8b5cf6' }}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="p-2.5 text-left"
                style={{ background: current === style.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)' }}>
                <div className="text-sm font-bold text-white leading-tight">{style.name}</div>
                <div className="text-xs text-white/40 mt-0.5 leading-tight">{style.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
