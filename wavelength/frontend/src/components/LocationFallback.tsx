import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import type { Coordinates } from '../types';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  onLocate: (coords: Coordinates, label: string) => void;
  onRetryGPS: () => void;
  accentColor?: string;
}

export default function LocationFallback({ onLocate, onRetryGPS }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
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

  function select(r: SearchResult) {
    const label = r.display_name.split(',').slice(0, 2).join(', ');
    onLocate({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) }, label);
    setQuery(label);
    setOpen(false);
  }

  return (
    <div className="px-4 flex-shrink-0">
      <div className="rounded-2xl p-3.5 mb-2" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300 font-medium leading-snug">
            Position GPS indisponible sur cet appareil — entre ta ville pour continuer.
          </p>
        </div>

        {/* City search */}
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input
              className="wl-input w-full rounded-xl pl-9 pr-9 py-2.5 text-sm"
              placeholder="Recherche ta ville, ton quartier…"
              value={query}
              onChange={e => { setQuery(e.target.value); }}
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
                  <button key={i} onClick={() => select(r)}
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

        {/* Retry GPS */}
        <button onClick={onRetryGPS}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
            text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
          <Navigation className="w-3 h-3" /> Réessayer avec le GPS
        </button>
      </div>
    </div>
  );
}
