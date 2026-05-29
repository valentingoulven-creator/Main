import { useState, useCallback } from 'react';
import type { Coordinates } from '../types';

interface GeoState {
  position: Coordinates | null;
  error: string | null;
  loading: boolean;
  unavailable: boolean; // true when the device/browser can't provide GPS
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: null,
    error: null,
    loading: false,
    unavailable: false,
  });

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, unavailable: true, error: "Géolocalisation non supportée." }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null, unavailable: false }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState({ position: { lat: coords.latitude, lng: coords.longitude }, error: null, loading: false, unavailable: false });
      },
      (err) => {
        const isUnavailable = err.code === 2; // POSITION_UNAVAILABLE
        const msgs: Record<number, string> = {
          1: "Permission refusée. Autorise l'accès à ta position dans les paramètres du navigateur.",
          2: "Position GPS indisponible sur cet appareil.",
          3: "Délai expiré. Réessaie.",
        };
        // Auto-fallback to Paris when GPS is simply unavailable on device
        if (isUnavailable) {
          setState({
            position: { lat: 48.8566, lng: 2.3522 }, // Paris centre
            error: null,
            loading: false,
            unavailable: false,
          });
          return;
        }
        setState(s => ({
          ...s,
          loading: false,
          unavailable: isUnavailable,
          error: msgs[err.code] ?? "Erreur inconnue.",
        }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Let the user manually set a position (city search fallback)
  const setManual = useCallback((coords: Coordinates) => {
    setState({ position: coords, error: null, loading: false, unavailable: false });
  }, []);

  return { ...state, request, setManual };
}
