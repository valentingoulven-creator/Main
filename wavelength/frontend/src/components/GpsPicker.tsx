import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, Check, Navigation, X } from 'lucide-react';
import type { Coordinates } from '../types';
import { MeloSongLockup } from './MeloSongLogo';

// Pulsing pin icon
function makePinIcon(color = '#8b5cf6') {
  const s = 48;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${s}px;height:${s}px;transform:translateY(-${s/2}px)">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;animation:ping 1.8s infinite cubic-bezier(0,0,0.2,1)"></div>
        <div style="position:absolute;inset:8px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 16px ${color}aa"></div>
        <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:3px;height:10px;background:${color};border-radius:2px;opacity:0.7"></div>
      </div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor: [0, -s],
  });
}

interface SearchResult { display_name: string; lat: string; lon: string }

function FlyTo({ center }: { center: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 15, { animate: true, duration: 1 });
  }, [center.lat, center.lng]);
  return null;
}

function DraggablePin({ color, onChange }: { color: string; onChange: (c: Coordinates) => void }) {
  const [pos, setPos] = useState<Coordinates | null>(null);

  useMapEvents({
    click(e) {
      const c = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPos(c);
      onChange(c);
    },
    locationfound(e) {
      const c = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPos(c);
      onChange(c);
    },
  });

  if (!pos) return null;

  return (
    <Marker
      position={[pos.lat, pos.lng]}
      icon={makePinIcon(color)}
      draggable
      eventHandlers={{
        dragend(e) {
          const ll = (e.target as L.Marker).getLatLng();
          const c = { lat: ll.lat, lng: ll.lng };
          setPos(c);
          onChange(c);
        },
      }}
    />
  );
}

interface Props {
  accentColor: string;
  onConfirm: (coords: Coordinates) => void;
  onClose?: () => void;
}

export default function GpsPicker({ accentColor, onConfirm, onClose }: Props) {
  const [picked, setPicked]       = useState<Coordinates | null>(null);
  const [flyTo, setFlyTo]         = useState<Coordinates | null>(null);
  const [address, setAddress]     = useState('');
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const [locating, setLocating]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=fr`,
        { headers: { 'User-Agent': 'MeloSongApp/1.0' } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Try real GPS first
  function tryGPS() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const c = { lat: coords.latitude, lng: coords.longitude };
        setPicked(c);
        setFlyTo(c);
        setAddress('Ma position GPS');
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function selectResult(r: SearchResult) {
    const c = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    const label = r.display_name.split(',').slice(0, 2).join(', ');
    setPicked(c);
    setFlyTo(c);
    setAddress(label);
    setQuery(label);
    setOpen(false);
  }

  function handleMapPick(c: Coordinates) {
    setPicked(c);
    setAddress(`${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
  }

  return (
    <div className="fixed inset-0 z-[800] flex flex-col animate-fade-in"
      style={{ background: 'rgba(10,10,20,0.97)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <MeloSongLockup markSize={20} textSize="text-lg" />
        <div className="flex-1 min-w-0 ml-2">
          <div className="text-sm font-bold text-white">Choisir ma position</div>
          <div className="text-xs text-white/40">Clique sur la carte ou cherche ta ville</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 flex-shrink-0 flex gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div ref={containerRef} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            className="wl-input w-full rounded-xl pl-10 pr-10 py-2.5 text-sm"
            placeholder="Recherche une ville, une adresse…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            autoFocus
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-violet-400" />}

          {open && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-[9999] shadow-2xl"
              style={{ background: 'rgba(18,18,30,0.99)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {results.map((r, i) => {
                const parts = r.display_name.split(',');
                return (
                  <button key={i} onClick={() => selectResult(r)}
                    className="w-full flex items-start gap-2.5 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
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

        {/* Real GPS button */}
        <button onClick={tryGPS} disabled={locating}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #ec4899)` }}
          title="Utiliser le vrai GPS">
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          <span className="hidden sm:inline">GPS réel</span>
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'
          />
          {flyTo && <FlyTo center={flyTo} />}
          <DraggablePin color={accentColor} onChange={handleMapPick} />
        </MapContainer>

        {/* Hint overlay */}
        {!picked && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
            <div className="glass px-4 py-2.5 rounded-full text-xs text-white/70 flex items-center gap-2 animate-pulse-slow">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              Clique sur la carte pour placer ton épingle
            </div>
          </div>
        )}

        {/* Selected position info */}
        {picked && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] animate-pop-in">
            <div className="glass px-4 py-2 rounded-xl text-xs text-white/70 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor }} />
              <span className="truncate max-w-[220px]">{address || `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`}</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => picked && onConfirm(picked)}
          disabled={!picked}
          className="w-full py-4 rounded-2xl font-bold text-base text-white
            flex items-center justify-center gap-3 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] hover:opacity-90 shadow-xl"
          style={{ background: picked ? `linear-gradient(135deg, ${accentColor}, #ec4899)` : 'rgba(255,255,255,0.08)' }}>
          <Check className="w-5 h-5" />
          {picked ? 'Confirmer ma position' : 'Choisis une position sur la carte'}
        </button>
      </div>
    </div>
  );
}
