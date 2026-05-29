import { useState, useCallback } from 'react';
import type { SavedPlace, Coordinates } from '../types';

const STORAGE_KEY = 'geoapp_saved_places';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function loadPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePlaces(places: SavedPlace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>(loadPlaces);

  const addPlace = useCallback((name: string, coordinates: Coordinates, address?: string, city?: string, country?: string) => {
    const newPlace: SavedPlace = {
      id: Date.now().toString(),
      name,
      coordinates,
      address,
      city,
      country,
      savedAt: Date.now(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    setPlaces(prev => {
      const updated = [newPlace, ...prev];
      savePlaces(updated);
      return updated;
    });
    return newPlace;
  }, []);

  const removePlace = useCallback((id: string) => {
    setPlaces(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePlaces(updated);
      return updated;
    });
  }, []);

  const clearPlaces = useCallback(() => {
    setPlaces([]);
    savePlaces([]);
  }, []);

  return { places, addPlace, removePlace, clearPlaces };
}
