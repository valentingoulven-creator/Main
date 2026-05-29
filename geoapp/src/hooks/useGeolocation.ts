import { useState, useEffect, useCallback } from 'react';
import type { LocationInfo } from '../types';

interface GeolocationState {
  location: LocationInfo | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    permissionState: null,
  });

  const fetchAddress = useCallback(async (lat: number, lng: number): Promise<Partial<LocationInfo>> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'fr,en' } }
      );
      const data = await response.json();
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.county,
        country: data.address?.country,
        postcode: data.address?.postcode,
      };
    } catch {
      return {};
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "La géolocalisation n'est pas supportée par ce navigateur." }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const extra = await fetchAddress(latitude, longitude);

        setState(prev => ({
          ...prev,
          loading: false,
          location: {
            coordinates: { lat: latitude, lng: longitude },
            accuracy,
            timestamp: position.timestamp,
            ...extra,
          },
        }));
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Permission refusée. Veuillez autoriser l'accès à votre position.",
          2: "Position indisponible. Vérifiez votre connexion.",
          3: "Délai expiré. Réessayez.",
        };
        setState(prev => ({
          ...prev,
          loading: false,
          error: messages[err.code] || "Erreur inconnue lors de la géolocalisation.",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [fetchAddress]);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setState(prev => ({ ...prev, permissionState: result.state }));
        result.onchange = () => {
          setState(prev => ({ ...prev, permissionState: result.state }));
        };
      });
    }
  }, []);

  return { ...state, getCurrentLocation };
}
