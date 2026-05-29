import type { NearbyUser, UserProfile, PublicLive, Coordinates } from '../../types';
import type { MapStyleDef } from '../MapStyleBar';
import MapView from '../MapView';
import MapStyleBar from '../MapStyleBar';
import AdBanner from '../AdBanner';
import DiscoverView from '../DiscoverView';
import { MeloSongMark, MeloSongLockup } from '../MeloSongLogo';
import { Navigation, Loader2, MapPin } from 'lucide-react';

interface Props {
  view: 'nearby' | 'discover';
  mobileTab: 'nearby' | 'map' | 'discover';
  geoPosition: Coordinates | null;
  geoLoading: boolean;
  geoError: string | null;
  geoRequest: () => void;
  profile: UserProfile;
  nearbyUsers: NearbyUser[];
  publicLives: PublicLive[];
  focusPosition: Coordinates | null;
  mapStyle: MapStyleDef;
  onMapStyleChange: (s: MapStyleDef) => void;
  amLive: boolean;
  liveViewers: number;
  onLiveFab: () => void;
  onStopLive: () => void;
  onGpsPicker: () => void;
  onWatchLive: (live: PublicLive) => void;
  onRefreshLives: () => void;
  onSendDM: (live: PublicLive) => void;
}

export default function MapPanel({
  view, mobileTab, geoPosition, geoLoading, geoError, geoRequest,
  profile, nearbyUsers, publicLives, focusPosition,
  mapStyle, onMapStyleChange, amLive, liveViewers,
  onLiveFab, onStopLive, onGpsPicker,
  onWatchLive, onRefreshLives, onSendDM,
}: Props) {
  const isDiscover = view === 'discover' || mobileTab === 'discover';

  return (
    <main className={`flex-1 flex flex-col overflow-hidden ${mobileTab === 'nearby' ? 'hidden md:flex' : 'flex'}`}>
      {/* Ad banner — only on map */}
      {!isDiscover && <AdBanner />}

      {/* Discover feed or map */}
      {isDiscover ? (
        <div className="flex-1 overflow-hidden">
          <DiscoverView
            lives={publicLives}
            onWatch={onWatchLive}
            onRefresh={onRefreshLives}
            accentColor={profile.color}
            profile={profile}
            onSendDM={onSendDM}
          />
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          {geoPosition ? (
            <MapView
              myPosition={geoPosition}
              profile={profile}
              nearbyUsers={nearbyUsers}
              focusPosition={focusPosition}
              tileUrl={mapStyle.url}
              tileUrl2={mapStyle.url2}
              attribution={mapStyle.attribution}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
              <MeloSongMark size={72} className="mb-3 opacity-60" />
              <MeloSongLockup markSize={30} textSize="text-4xl" className="mb-2" />
              <p className="text-sm text-white/40 font-medium">Découvre la musique autour de toi</p>

              {geoLoading ? (
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <Loader2 className="w-4 h-4 animate-spin" /> GPS en cours…
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {geoError && <p className="text-xs text-red-400 text-center max-w-xs">{geoError}</p>}
                  <button onClick={geoRequest}
                    className="flex items-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95 shadow-lg hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${profile.color}, #ec4899)` }}>
                    <Navigation className="w-4 h-4" /> Activer le GPS
                  </button>
                  <button onClick={onGpsPicker}
                    className="flex items-center gap-2 py-2.5 px-5 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <MapPin className="w-4 h-4" /> Choisir sur la carte
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Map style bar */}
          <MapStyleBar current={mapStyle.id} onChange={onMapStyleChange} />

          {/* Live FAB */}
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-2">
            {amLive && (
              <button onClick={onStopLive}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black text-white transition-all active:scale-95 hover:scale-105 animate-fade-in shadow-xl"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(239,68,68,0.5)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="2" fill="#ef4444"/></svg>
                <span style={{ color: '#ef4444' }}>Arrêter le live</span>
              </button>
            )}
            <button onClick={onLiveFab}
              className="flex items-center gap-2.5 transition-all active:scale-95 hover:scale-105 shadow-2xl"
              style={{
                background: amLive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                borderRadius: 999, padding: amLive ? '10px 20px' : '14px 14px',
                boxShadow: amLive ? '0 0 0 4px rgba(239,68,68,0.25), 0 8px 32px rgba(239,68,68,0.5)' : '0 0 0 4px rgba(139,92,246,0.2), 0 8px 32px rgba(139,92,246,0.4)',
              }}>
              {amLive ? (
                <>
                  <span className="w-3 h-3 bg-white rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-white font-black text-sm">EN DIRECT</span>
                  <span className="text-white/70 text-xs font-semibold">{liveViewers} 👁</span>
                </>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="white"/>
                  <path d="M8.5 8.5a5 5 0 0 0 0 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5.5 5.5a9 9 0 0 0 0 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                  <path d="M18.5 5.5a9 9 0 0 1 0 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                </svg>
              )}
            </button>
          </div>

          {/* Listener count */}
          {geoPosition && nearbyUsers.length > 0 && (
            <div className="absolute top-4 right-4 z-[500] glass rounded-2xl px-4 py-2.5 animate-fade-in">
              <div className="text-xs text-white/50 font-medium">Auditeurs proches</div>
              <div className="text-2xl font-bold gradient-text">{nearbyUsers.length}</div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
