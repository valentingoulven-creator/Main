export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  coordinates: Coordinates;
  address?: string;
  city?: string;
  country?: string;
  postcode?: string;
  accuracy?: number;
  timestamp: number;
}

export interface SavedPlace {
  id: string;
  name: string;
  coordinates: Coordinates;
  address?: string;
  city?: string;
  country?: string;
  savedAt: number;
  color: string;
}

export interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    postcode?: string;
    road?: string;
    state?: string;
  };
  type?: string;
  importance?: number;
}

export type MapStyle = 'streets' | 'satellite' | 'dark' | 'topo';
