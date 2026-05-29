import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, Navigation, Map, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates } from '../types';

// Fix default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom pulsing pin icon
function makePinIcon(color = '#8b5cf6') {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:36px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.8s infinite cubic-bezier(0,0,0.2,1)"></div>
      <div style="position:absolute;inset:6px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 12px ${color}99"></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapPickerProps {
  center: Coordinates;
  onPick: (coords: Coordinates) => void;
}

function MapPicker({ center, onPick }: MapPickerProps) {
  const [pos, setPos] = useState<Coordinates>(center);

  useMapEvents({
    click(e) {
      const c = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPos(c);
      onPick(c);
    },
  });

  return (
    <Marker
      position={[pos.lat, pos.lng]}
      icon={makePinIcon()}
      draggable
      eventHandlers={{
        dragend(e) {
          const latlng = (e.target as L.Marker).getLatLng();
          const c = { lat: latlng.lat, lng: latlng.lng };
          setPos(c);
          onPick(c);
        },
      }}
    />
  );
}

interface Props {
  onLocate: (coords: Coordinates, label: string) => void;
  onRetryGPS: () => void;
}

export default function LocationFallback({ onLocate, onRetryGPS }: Props) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [showMap, setShowMap]   = useState(false);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 48.8566, lng: 2.3522 }); // Paris default
  const [pickedPos, setPickedPos] = useState<Coordinates | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=fr`,
        { headers: { 'User-Agent': 'MeloSongApp/1.0' } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectResult(r: SearchResult) {
    const coords = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    const label = r.display_name.split(',').slice(0, 2).join(', ');
    setQuery(label);
    setOpen(false);
    setMapCenter(coords);
    setPickedPos(coords);
    onLocate(coords, label);
  }

  function confirmMapPick() {
    if (!pickedPos) return;
    onLocate(pickedPos, `${pickedPos.lat.toFixed(4)}, ${pickedPos.lng.toFixed(4)}`);
    setShowMap(false);
  }

  return (
    <div className="px-4 flex-shrink-0">
      <div className="rounded-2xl p-3.5 mb-2"
        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300 font-medium leading-snug">
            GPS indisponible — recherche ta ville ou place le curseur sur la carte.
          </p>
        </div>

        {/* City search */}
        <div ref={containerRef} className="relative mb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input
              className="wl-input w-full rounded-xl pl-9 pr-9 py-2.5 text-sm"
              placeholder="Recherche ta ville, ton quartier…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              autoFocus
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-violet-400" />}
          </div>

          {open && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-[999] shadow-2xl"
              style={{ background: 'rgba(18,18,30,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {results.map((r, i) => {
                const parts = r.display_name.split(',');
                return (
                  <button key={i} onClick={() => selectResult(r)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
                    <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{parts[0]}</div>
                      {parts.length > 1 && <div className="text-xs text-white/40 truncate">{parts.slice(1, 3).join(', ')}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Map picker button */}
        <button
          onClick={() => setShowMap(v => !v)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold
            transition-all hover:opacity-90 active:scale-95 mb-2"
          style={{ background: showMap ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
          <Map className="w-3.5 h-3.5" />
          {showMap ? 'Masquer la carte' : 'Placer ma position sur la carte'}
        </button>

        {/* Embedded map picker */}
        {showMap && (
          <div className="rounded-xl overflow-hidden mb-2 animate-fade-in" style={{ height: 220, border: '1px solid rgba(255,255,255,0.1)' }}>
            <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='© <a href="https://carto.com/">CARTO</a>'
              />
              <MapPicker
                center={mapCenter}
                onPick={setPickedPos}
              />
            </MapContainer>
          </div>
        )}

        {/* Confirm map pick */}
        {showMap && pickedPos && (
          <button
            onClick={confirmMapPick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white
              transition-all hover:opacity-90 active:scale-95 mb-2 animate-fade-in"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
            <Check className="w-4 h-4" />
            Confirmer cette position
          </button>
        )}

        {showMap && (
          <p className="text-xs text-white/30 text-center mb-2">
            Clique ou glisse l'épingle pour ajuster ta position exacte
          </p>
        )}

        {/* Retry GPS */}
        <button onClick={onRetryGPS}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
            text-xs font-medium text-white/35 hover:text-white/60 hover:bg-white/5 transition-all">
          <Navigation className="w-3 h-3" /> Réessayer avec le GPS
        </button>
      </div>
    </div>
  );
}
