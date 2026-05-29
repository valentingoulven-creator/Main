import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import type { SearchResult, Coordinates } from '../types';

interface SearchBarProps {
  onSelectResult: (coords: Coordinates, result: SearchResult) => void;
}

export default function SearchBar({ onSelectResult }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'fr,en' } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(result: SearchResult) {
    onSelectResult({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) }, result);
    setQuery(result.display_name.split(',').slice(0, 2).join(','));
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher un lieu, une adresse..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-lg
            text-sm text-gray-800 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200"
        />
        {loading && <Loader2 className="absolute right-3 w-4 h-4 text-blue-500 animate-spin" />}
        {!loading && query && (
          <button onClick={handleClear} className="absolute right-3 p-0.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[9999] animate-fade-in">
          {results.map((result, i) => {
            const parts = result.display_name.split(',');
            const title = parts.slice(0, 2).join(',').trim();
            const subtitle = parts.slice(2, 4).join(',').trim();
            return (
              <button
                key={i}
                onClick={() => handleSelect(result)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{title}</div>
                  {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
