import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { NearbyUser, Coordinates, UserProfile } from '../types';

function makeIcon(color: string, emoji: string, size = 38) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};
          animation:ping 2.5s cubic-bezier(0,0,0.2,1) infinite;
          opacity:0.35;
        "></div>
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:${color};
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.42}px;
          box-shadow:0 2px 10px ${color}77;
        ">${emoji}</div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

function makeUserIcon(color: string, emoji: string) {
  const size = 44;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px">
        <div style="
          position:absolute;inset:-6px;border-radius:50%;
          background:${color};
          animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;
          opacity:0.2;
        "></div>
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.45}px;
          border:3px solid white;
          box-shadow:0 4px 16px ${color}88;
        ">${emoji}</div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 6],
  });
}

function FlyTo({ center }: { center: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 15, { animate: true, duration: 1 });
  }, [center.lat, center.lng]);
  return null;
}

interface Props {
  myPosition: Coordinates | null;
  profile: UserProfile;
  nearbyUsers: NearbyUser[];
  focusPosition: Coordinates | null;
}

export default function MapView({ myPosition, profile, nearbyUsers, focusPosition }: Props) {
  const center: [number, number] = myPosition
    ? [myPosition.lat, myPosition.lng]
    : [48.8566, 2.3522];

  return (
    <div className="w-full h-full">
      <style>{`
        @keyframes ping {
          75%,100% { transform:scale(2); opacity:0; }
        }
      `}</style>
      <MapContainer center={center} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com/">CARTO</a>'
        />

        {focusPosition && <FlyTo center={focusPosition} />}

        {/* My position */}
        {myPosition && (
          <Marker position={[myPosition.lat, myPosition.lng]} icon={makeUserIcon(profile.color, profile.emoji)}>
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', padding: '2px 0' }}>
                <strong style={{ color: profile.color }}>Moi — {profile.username}</strong>
                <div style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
                  {myPosition.lat.toFixed(5)}, {myPosition.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby users */}
        {nearbyUsers.map(u => (
          <Marker key={u.id} position={[u.position.lat, u.position.lng]} icon={makeIcon(u.color, u.emoji)}>
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', padding: '4px 0', minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: u.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14,
                  }}>{u.emoji}</div>
                  <strong style={{ color: '#fff' }}>{u.username}</strong>
                </div>
                {u.track ? (
                  <>
                    <div style={{ color: '#ddd', fontSize: 12, fontWeight: 600 }}>{u.track.title}</div>
                    {u.track.artist && <div style={{ color: '#888', fontSize: 11 }}>{u.track.artist}</div>}
                    {u.track.url && (
                      <a href={u.track.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', marginTop: 6, fontSize: 11, color: '#8b5cf6' }}>
                        Écouter →
                      </a>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#666', fontSize: 11 }}>Rien en écoute</div>
                )}
                <div style={{ color: '#555', fontSize: 10, marginTop: 4 }}>{u.distance} m</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
