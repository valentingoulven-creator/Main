import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface MapStyleDef {
  id: string;
  name: string;
  url: string;
  url2?: string;
  attribution: string;
  thumb: string; // static tile for Paris
}

// Paris zoom 10 — tile x=518, y=351
export const MAP_STYLES_5: MapStyleDef[] = [
  {
    id: 'dark',
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    thumb: 'https://a.basemaps.cartocdn.com/dark_all/10/518/351.png',
  },
  {
    id: 'voyager',
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    thumb: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/10/518/351.png',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/351/518',
  },
  {
    id: 'topo',
    name: 'Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/10/351/518',
  },
  {
    id: 'light',
    name: 'Clair',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
    thumb: 'https://a.basemaps.cartocdn.com/light_all/10/518/351.png',
  },
];

interface Props {
  current: string;
  onChange: (style: MapStyleDef) => void;
}

export default function MapStyleBar({ current, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] animate-fade-in select-none">
      <div
        className="flex items-center gap-1.5 px-2 py-2 rounded-2xl shadow-2xl"
        style={{
          background: 'rgba(10,10,20,0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* Toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
        >
          {expanded
            ? <ChevronLeft className="w-4 h-4 text-white/50" />
            : <ChevronRight className="w-4 h-4 text-white/50" />}
        </button>

        {expanded && MAP_STYLES_5.map(style => {
          const active = current === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onChange(style)}
              className="group flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-95"
              title={style.name}
            >
              {/* Thumbnail */}
              <div
                className="relative overflow-hidden transition-all duration-200"
                style={{
                  width: 52,
                  height: 38,
                  borderRadius: 10,
                  boxShadow: active
                    ? '0 0 0 2.5px #8b5cf6, 0 4px 16px rgba(139,92,246,0.5)'
                    : '0 2px 8px rgba(0,0,0,0.4)',
                  transform: active ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <img
                  src={style.thumb}
                  alt={style.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
                {active && (
                  <div className="absolute inset-0 rounded-[10px]"
                    style={{ background: 'rgba(139,92,246,0.15)' }} />
                )}
              </div>
              {/* Label */}
              <span
                className="text-xs font-semibold leading-none"
                style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.45)', fontSize: 10 }}
              >
                {style.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
