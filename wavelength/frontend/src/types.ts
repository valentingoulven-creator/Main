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

export type PlatformKey = 'spotify' | 'deezer' | 'youtube' | 'youtubemusic';
export type ConnectedApps = Partial<Record<PlatformKey, string>>;

export interface UserProfile {
  username: string;
  color: string;
  emoji: string;
  bio?: string;
  birthDate?: string; // ISO 'YYYY-MM-DD'
  interests?: string[];
  photos?: string[];
  jamUrl?: string;
  address?: string;
  connectedApps?: ConnectedApps;
}

export type ChatStatus = 'available' | 'busy' | 'dnd';

export interface NearbyUser {
  id: string;
  username: string;
  color: string;
  emoji: string;
  position: Coordinates;
  track: Track | null;
  distance: number;
  chatStatus?: ChatStatus;
  bio?: string;
  birthDate?: string;
  interests?: string[];
  photos?: string[];
  jamUrl?: string;
  address?: string;
  connectedApps?: ConnectedApps;
  isMock?: boolean;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatPeer {
  id: string;
  username: string;
  color: string;
  emoji: string;
}

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
}

export type ChatConvState = 'requesting' | 'active' | 'declined' | 'closed' | 'unavailable';

export interface ChatConversation {
  peer: ChatPeer;
  messages: ChatMessage[];
  unread: number;
  state: ChatConvState;
  declineReason?: string;
}

export interface IncomingChatRequest {
  from: ChatPeer;
  timestamp: number;
}
