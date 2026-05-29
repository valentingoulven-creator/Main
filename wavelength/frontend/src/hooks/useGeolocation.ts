import { useState, useCallback } from 'react';
import type { Coordinates } from '../types';

interface GeoState {
  position: Coordinates | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ position: null, error: null, loading: false });

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "La géolocalisation n'est pas supportée par ce navigateur." }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState({
          position: { lat: coords.latitude, lng: coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "Permission refusée. Autorise l'accès à ta position dans les paramètres du navigateur.",
          2: "Position GPS indisponible. Vérifie que le GPS est activé sur ton appareil.",
          3: "Délai expiré. Réessaie.",
        };
        setState({ position: null, loading: false, error: msgs[err.code] ?? "Erreur de géolocalisation." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, request };
}
