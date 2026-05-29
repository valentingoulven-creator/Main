import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { NearbyUser, Coordinates, UserProfile } from '../types';
import { calcAge } from '../utils/ageUtils';

function makeIcon(color: string, emoji: string, photo?: string, size = 40) {
  const inner = photo
    ? `<div style="
          position:absolute;inset:3px;border-radius:50%;
          background-image:url('${photo}');background-size:cover;background-position:center;
          box-shadow:0 2px 10px ${color}77;border:2px solid ${color};
        "></div>`
    : `<div style="
          position:absolute;inset:3px;border-radius:50%;
          background:${color};
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.42}px;
          box-shadow:0 2px 10px ${color}77;
        ">${emoji}</div>`;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};animation:ping 2.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.3;"></div>
        ${inner}
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

function makeUserIcon(color: string, emoji: string, photo?: string) {
  const size = 46;
  const inner = photo
    ? `<div style="
          position:absolute;inset:0;border-radius:50%;
          background-image:url('${photo}');background-size:cover;background-position:center;
          border:3px solid white;box-shadow:0 4px 16px ${color}88;
        "></div>`
    : `<div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.42}px;
          border:3px solid white;box-shadow:0 4px 16px ${color}88;
        ">${emoji}</div>`;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px">
        <div style="position:absolute;inset:-7px;border-radius:50%;background:${color};animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;opacity:0.18;"></div>
        ${inner}
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
  tileUrl?: string;
  tileUrl2?: string;
  attribution?: string;
}

const DEFAULT_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export default function MapView({ myPosition, profile, nearbyUsers, focusPosition, tileUrl, tileUrl2, attribution }: Props) {
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
          url={tileUrl ?? DEFAULT_TILE}
          attribution={attribution ?? '© OpenStreetMap © CARTO'}
        />
        {tileUrl2 && <TileLayer url={tileUrl2} attribution="" opacity={0.9} />}

        {focusPosition && <FlyTo center={focusPosition} />}

        {/* My position */}
        {myPosition && (
          <Marker position={[myPosition.lat, myPosition.lng]} icon={makeUserIcon(profile.color, profile.emoji, profile.photos?.[0])}>
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
        {nearbyUsers.map(u => {
          const age = u.birthDate ? calcAge(u.birthDate) : null;
          return (
          <Marker key={u.id} position={[u.position.lat, u.position.lng]} icon={makeIcon(u.color, u.emoji, u.photos?.[0])}>
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', padding: '4px 0', minWidth: 180, maxWidth: 220 }}>
                {/* Avatar + name + age */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {u.photos?.[0] ? (
                    <img src={u.photos[0]} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${u.color}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {u.emoji}
                    </div>
                  )}
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>{u.username}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {age !== null && (
                        <span style={{ color: u.color, fontSize: 11, fontWeight: 700, background: u.color + '22', padding: '1px 6px', borderRadius: 6 }}>
                          {age} ans
                        </span>
                      )}
                      <span style={{ color: '#555', fontSize: 10 }}>{u.distance} m</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {u.bio && (
                  <div style={{ color: '#aaa', fontSize: 11, marginBottom: 7, lineHeight: 1.4, borderLeft: `2px solid ${u.color}55`, paddingLeft: 7 }}>
                    {u.bio.slice(0, 80)}{u.bio.length > 80 ? '…' : ''}
                  </div>
                )}

                {/* Track */}
                {u.track ? (
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 8px' }}>
                    <div style={{ color: '#ddd', fontSize: 12, fontWeight: 700, marginBottom: 1 }}>{u.track.title}</div>
                    {u.track.artist && <div style={{ color: '#888', fontSize: 10 }}>{u.track.artist}</div>}
                    {u.track.url && (
                      <a href={u.track.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', marginTop: 5, fontSize: 11, color: u.color, fontWeight: 600 }}>
                        Écouter →
                      </a>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#555', fontSize: 11 }}>Rien en écoute</div>
                )}
              </div>
            </Popup>
          </Marker>
        )})}
      </MapContainer>
    </div>
  );
}
