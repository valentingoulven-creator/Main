import { useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import LocationPanel from './components/LocationPanel';
import SavedPlaces from './components/SavedPlaces';
import MapStyleSelector from './components/MapStyleSelector';
import { useGeolocation } from './hooks/useGeolocation';
import { useSavedPlaces } from './hooks/useSavedPlaces';
import type { Coordinates, SearchResult, MapStyle, SavedPlace } from './types';

interface SelectedLocation {
  coordinates: Coordinates;
  address?: string;
  city?: string;
  country?: string;
}

export default function App() {
  const { location: userLocation, loading, error, getCurrentLocation } = useGeolocation();
  const { places, addPlace, removePlace, clearPlaces } = useSavedPlaces();
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSearchSelect = useCallback((coords: Coordinates, result: SearchResult) => {
    setSelected({
      coordinates: coords,
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      country: result.address?.country,
    });
  }, []);

  const handleMapClick = useCallback(async (coords: Coordinates) => {
    setSelected({ coordinates: coords });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`,
        { headers: { 'Accept-Language': 'fr,en' } }
      );
      const data = await res.json();
      setSelected({
        coordinates: coords,
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.county,
        country: data.address?.country,
      });
    } catch {
      // keep coordinates only
    }
  }, []);

  function handleSavePlace(name: string) {
    const source = selected || (userLocation ? {
      coordinates: userLocation.coordinates,
      city: userLocation.city,
      country: userLocation.country,
      address: userLocation.address,
    } : null);
    if (!source) return;
    addPlace(name, source.coordinates, source.address, source.city, source.country);
  }

  function handleSelectSavedPlace(coords: Coordinates, place: SavedPlace) {
    setSelected({ coordinates: coords, city: place.city, country: place.country });
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-3 px-4 py-3 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">GéoApp</h1>
            <p className="text-xs text-gray-400 leading-none mt-0.5">Géolocalisation</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <SearchBar onSelectResult={handleSearchSelect} />
        </div>

        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200
            text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="hidden sm:inline">{sidebarOpen ? 'Masquer' : 'Afficher'} le panneau</span>
          <span className="sm:hidden">≡</span>
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            userLocation={userLocation?.coordinates || null}
            accuracy={userLocation?.accuracy}
            selectedLocation={selected?.coordinates || null}
            selectedAddress={selected?.address}
            savedPlaces={places}
            mapStyle={mapStyle}
            onMapClick={handleMapClick}
          />

          {/* Map click hint */}
          {!userLocation && !selected && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500]
              bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg
              text-xs text-gray-600 pointer-events-none animate-pulse-slow">
              Cliquez sur la carte pour explorer un lieu
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto
            bg-gray-100 border-l border-gray-200 z-10">
            <LocationPanel
              userLocation={userLocation}
              selectedLocation={selected}
              loading={loading}
              error={error}
              onGetLocation={getCurrentLocation}
              onSavePlace={handleSavePlace}
            />

            <MapStyleSelector current={mapStyle} onChange={setMapStyle} />

            <SavedPlaces
              places={places}
              onSelectPlace={handleSelectSavedPlace}
              onRemovePlace={removePlace}
              onClearAll={clearPlaces}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
