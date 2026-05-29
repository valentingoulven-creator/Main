export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Track {
  title: string;
  artist?: string;
  albumArt?: string;
  source: 'spotify' | 'youtube' | 'manual';
  url?: string;
}

export interface UserProfile {
  username: string;
  color: string;
  emoji: string;
}

export interface NearbyUser {
  id: string;
  username: string;
  color: string;
  emoji: string;
  position: Coordinates;
  track: Track | null;
  distance: number;
  isMock?: boolean;
}
