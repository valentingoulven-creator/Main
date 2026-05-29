import { Layers } from 'lucide-react';
import type { MapStyle } from '../types';

const STYLES: { id: MapStyle; label: string; icon: string }[] = [
  { id: 'streets', label: 'Rues', icon: '🗺️' },
  { id: 'satellite', label: 'Satellite', icon: '🛰️' },
  { id: 'dark', label: 'Sombre', icon: '🌙' },
  { id: 'topo', label: 'Topo', icon: '⛰️' },
];

interface MapStyleSelectorProps {
  current: MapStyle;
  onChange: (style: MapStyle) => void;
}

export default function MapStyleSelector({ current, onChange }: MapStyleSelectorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
        <Layers className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fond de carte</span>
      </div>
      <div className="flex p-2 gap-1">
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-all duration-200
              ${current === style.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span className="text-base mb-0.5">{style.icon}</span>
            <span className="font-medium">{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
