import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates, SavedPlace, MapStyle } from '../types';

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MAP_TILES: Record<MapStyle, { url: string; attribution: string }> = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com/">Esri</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com/">CARTO</a>',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
};

function createColoredIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: 'pulse-marker',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#3b82f6;border:3px solid white;
      box-shadow:0 2px 8px rgba(59,130,246,0.5);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -15],
  });
}

interface FlyToProps {
  center: Coordinates;
  zoom?: number;
}

function FlyTo({ center, zoom = 14 }: FlyToProps) {
  const map = useMap();
  const prevCenter = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (
      !prevCenter.current ||
      prevCenter.current.lat !== center.lat ||
      prevCenter.current.lng !== center.lng
    ) {
      map.flyTo([center.lat, center.lng], zoom, { animate: true, duration: 1.2 });
      prevCenter.current = center;
    }
  }, [center, zoom, map]);

  return null;
}

interface MapViewProps {
  userLocation: Coordinates | null;
  accuracy?: number;
  selectedLocation: Coordinates | null;
  selectedAddress?: string;
  savedPlaces: SavedPlace[];
  mapStyle: MapStyle;
  onMapClick: (coords: Coordinates) => void;
}

export default function MapView({
  userLocation,
  accuracy,
  selectedLocation,
  selectedAddress,
  savedPlaces,
  mapStyle,
  onMapClick,
}: MapViewProps) {
  const tile = MAP_TILES[mapStyle];
  const center: Coordinates = selectedLocation || userLocation || { lat: 48.8566, lng: 2.3522 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={selectedLocation || userLocation ? 14 : 5}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />

      {(selectedLocation || userLocation) && (
        <FlyTo center={selectedLocation || userLocation!} zoom={selectedLocation ? 15 : 14} />
      )}

      {userLocation && (
        <>
          {accuracy && accuracy < 2000 && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={accuracy}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }}
            />
          )}
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="text-sm font-semibold text-blue-700">Ma position actuelle</div>
              <div className="text-xs text-gray-500 mt-1">
                {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </div>
              {accuracy && (
                <div className="text-xs text-gray-400 mt-0.5">
                  Précision: ±{accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy / 1000).toFixed(1)}km`}
                </div>
              )}
            </Popup>
          </Marker>
        </>
      )}

      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={createColoredIcon('#f59e0b')}
        >
          <Popup>
            <div className="text-sm font-semibold text-amber-700">Lieu sélectionné</div>
            {selectedAddress && (
              <div className="text-xs text-gray-600 mt-1 max-w-[200px]">{selectedAddress}</div>
            )}
            <div className="text-xs text-gray-400 mt-0.5">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          </Popup>
        </Marker>
      )}

      {savedPlaces.map((place) => (
        <Marker
          key={place.id}
          position={[place.coordinates.lat, place.coordinates.lng]}
          icon={createColoredIcon(place.color)}
        >
          <Popup>
            <div className="text-sm font-semibold" style={{ color: place.color }}>{place.name}</div>
            {place.city && <div className="text-xs text-gray-600 mt-0.5">{place.city}{place.country ? `, ${place.country}` : ''}</div>}
            <div className="text-xs text-gray-400 mt-0.5">
              {place.coordinates.lat.toFixed(6)}, {place.coordinates.lng.toFixed(6)}
            </div>
          </Popup>
        </Marker>
      ))}

      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
}

function MapClickHandler({ onMapClick }: { onMapClick: (coords: Coordinates) => void }) {
  const map = useMap();

  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, onMapClick]);

  return null;
}
