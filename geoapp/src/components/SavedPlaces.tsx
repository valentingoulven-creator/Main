import { useState } from 'react';
import { Bookmark, Trash2, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { SavedPlace, Coordinates } from '../types';

interface SavedPlacesProps {
  places: SavedPlace[];
  onSelectPlace: (coords: Coordinates, place: SavedPlace) => void;
  onRemovePlace: (id: string) => void;
  onClearAll: () => void;
}

export default function SavedPlaces({ places, onSelectPlace, onRemovePlace, onClearAll }: SavedPlacesProps) {
  const [expanded, setExpanded] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  if (places.length === 0) return null;

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-purple-200" />
          <span className="text-sm font-semibold text-white">Lieux sauvegardés</span>
          <span className="bg-purple-500 text-purple-100 text-xs px-2 py-0.5 rounded-full">{places.length}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-purple-200" /> : <ChevronUp className="w-4 h-4 text-purple-200" />}
      </div>

      {expanded && (
        <div className="p-3">
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {places.map((place) => (
              <div
                key={place.id}
                className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectPlace(place.coordinates, place)}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: place.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{place.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {place.city ? (
                      <span className="truncate">{place.city}{place.country ? `, ${place.country}` : ''}</span>
                    ) : (
                      <span>{place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-300">{formatDate(place.savedAt)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemovePlace(place.id); }}
                    className="p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3
                  text-xs text-gray-400 hover:text-red-500 hover:bg-red-50
                  rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Tout supprimer
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-xs text-gray-500 flex-1">Confirmer la suppression ?</span>
                <button
                  onClick={() => { onClearAll(); setConfirmClear(false); }}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Oui
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Non
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
