// ─── Spotify PKCE OAuth ───────────────────────────────────────────────────────
// Uses Authorization Code with PKCE — no client_secret needed (SPA-safe)
// Setup: create an app at https://developer.spotify.com/dashboard
//        add http://localhost:5174/spotify/callback as Redirect URI

const CLIENT_ID_KEY   = 'melo_spotify_client_id';
const TOKEN_KEY       = 'melo_spotify_token';
const REFRESH_KEY     = 'melo_spotify_refresh';
const EXPIRY_KEY      = 'melo_spotify_expiry';
const VERIFIER_KEY    = 'melo_spotify_verifier';

const REDIRECT_URI    = `${window.location.origin}/spotify/callback`;
const SCOPES          = 'user-read-currently-playing user-read-playback-state user-read-private';

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function generateRandom(length: number) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(plain: string) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? '';
}

export function saveClientId(id: string) {
  localStorage.setItem(CLIENT_ID_KEY, id.trim());
}

export function isConnected(): boolean {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? 0);
  return !!token && Date.now() < expiry;
}

export function getToken(): string | null {
  if (!isConnected()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function disconnect() {
  [TOKEN_KEY, REFRESH_KEY, EXPIRY_KEY, VERIFIER_KEY].forEach(k => localStorage.removeItem(k));
}

export async function startAuth(clientId: string) {
  saveClientId(clientId);
  const verifier  = generateRandom(64);
  const challenge = base64urlencode(await sha256(verifier));
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             clientId,
    scope:                 SCOPES,
    redirect_uri:          REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
    state:                 generateRandom(8),
    show_dialog:           'true',
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleCallback(code: string): Promise<boolean> {
  const clientId = getClientId();
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!clientId || !verifier) return false;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     clientId,
        code_verifier: verifier,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY,   data.access_token);
    if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
    localStorage.setItem(EXPIRY_KEY,  String(Date.now() + data.expires_in * 1000));
    localStorage.removeItem(VERIFIER_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function refreshToken(): Promise<boolean> {
  const clientId = getClientId();
  const refresh  = localStorage.getItem(REFRESH_KEY);
  if (!clientId || !refresh) return false;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refresh,
        client_id:     clientId,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY,  data.access_token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
    if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ─── Spotify API calls ────────────────────────────────────────────────────────

export interface SpotifyTrack {
  title: string;
  artist: string;
  albumArt?: string;
  url: string;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

export async function getCurrentlyPlaying(): Promise<SpotifyTrack | null> {
  let token = getToken();
  if (!token) {
    const ok = await refreshToken();
    if (!ok) return null;
    token = getToken();
  }
  if (!token) return null;

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204 || res.status === 404) return null; // nothing playing
    if (res.status === 401) { await refreshToken(); return null; }
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.item) return null;

    return {
      title:      data.item.name,
      artist:     data.item.artists?.map((a: { name: string }) => a.name).join(', ') ?? '',
      albumArt:   data.item.album?.images?.[0]?.url,
      url:        data.item.external_urls?.spotify ?? '',
      isPlaying:  data.is_playing,
      progressMs: data.progress_ms ?? 0,
      durationMs: data.item.duration_ms ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getSpotifyProfile(): Promise<{ name: string; image?: string } | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { name: data.display_name, image: data.images?.[0]?.url };
  } catch {
    return null;
  }
}
