import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface MapStyleDef {
  id: string;
  name: string;
  url: string;
  url2?: string;
  attribution: string;
  thumb: string;
}

// Paris centre — zoom 10, tile x=518, y=351
export const MAP_STYLES_5: MapStyleDef[] = [
  // ── Sombres ──────────────────────────────────────────────────────────────
  {
    id: 'carto-dark',
    name: 'Dark Blue',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    thumb: 'https://a.basemaps.cartocdn.com/dark_all/10/518/351.png',
  },
  {
    id: 'dark-nolabels',
    name: 'Dark Pure',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    thumb: 'https://a.basemaps.cartocdn.com/dark_nolabels/10/518/351.png',
  },
  {
    id: 'esri-dark-gray',
    name: 'Gris Foncé',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    url2: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/10/351/518',
  },
  {
    id: 'stamen-toner',
    name: 'Toner',
    url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    attribution: '© Stamen Design',
    thumb: 'https://stamen-tiles.a.ssl.fastly.net/toner/10/518/351.png',
  },
  {
    id: 'stamen-toner-lite',
    name: 'Toner Lite',
    url: 'https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
    attribution: '© Stamen Design',
    thumb: 'https://stamen-tiles.a.ssl.fastly.net/toner-lite/10/518/351.png',
  },

  // ── Clairs ───────────────────────────────────────────────────────────────
  {
    id: 'positron',
    name: 'Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    thumb: 'https://a.basemaps.cartocdn.com/light_all/10/518/351.png',
  },
  {
    id: 'voyager',
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    thumb: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/10/518/351.png',
  },
  {
    id: 'osm-standard',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributeurs',
    thumb: 'https://tile.openstreetmap.org/10/518/351.png',
  },
  {
    id: 'osm-france',
    name: 'OSM France',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '© OSM France',
    thumb: 'https://a.tile.openstreetmap.fr/osmfr/10/518/351.png',
  },
  {
    id: 'esri-light-gray',
    name: 'Gris Clair',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/10/351/518',
  },

  // ── Satellite & Relief ────────────────────────────────────────────────────
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/351/518',
  },
  {
    id: 'esri-topo',
    name: 'Topo Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/10/351/518',
  },
  {
    id: 'opentopomap',
    name: 'OpenTopo',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    thumb: 'https://tile.opentopomap.org/10/518/351.png',
  },
  {
    id: 'esri-natgeo',
    name: 'Nat Geo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, National Geographic',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/10/351/518',
  },
  {
    id: 'stamen-watercolor',
    name: 'Aquarelle',
    url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    attribution: '© Stamen Design',
    thumb: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/10/518/351.jpg',
  },
];

interface Props {
  current: string;
  onChange: (style: MapStyleDef) => void;
}

export default function MapStyleBar({ current, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' });
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] animate-fade-in select-none"
      style={{ width: 'min(680px, calc(100vw - 32px))' }}>
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-2xl shadow-2xl"
        style={{
          background: 'rgba(10,10,20,0.90)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* Scroll left */}
        <button onClick={() => scroll('left')}
          className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4 text-white/50" />
        </button>

        {/* Scrollable thumbnails */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto flex-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.map-thumb-scroll::-webkit-scrollbar{display:none}`}</style>
          {MAP_STYLES_5.map(style => {
            const active = current === style.id;
            return (
              <button
                key={style.id}
                onClick={() => onChange(style)}
                className="flex flex-col items-center gap-1 flex-shrink-0 transition-all duration-200 active:scale-95"
                title={style.name}
              >
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{
                    width: 56,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    boxShadow: active
                      ? '0 0 0 2.5px #8b5cf6, 0 4px 16px rgba(139,92,246,0.5)'
                      : '0 2px 6px rgba(0,0,0,0.5)',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    position: 'relative',
                  }}
                >
                  <img
                    src={style.thumb}
                    alt={style.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                    draggable={false}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="40"><rect fill="%23222" width="56" height="40"/><text x="50%" y="55%" font-size="16" text-anchor="middle" fill="%23555">🗺️</text></svg>';
                    }}
                  />
                  {active && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 10,
                      background: 'rgba(139,92,246,0.2)',
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}>
                  {style.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scroll right */}
        <button onClick={() => scroll('right')}
          className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-white/50" />
        </button>
      </div>
    </div>
  );
}
