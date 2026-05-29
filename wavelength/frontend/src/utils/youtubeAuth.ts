// ─── YouTube / Google OAuth PKCE ─────────────────────────────────────────────
// Requires a Google Cloud project with YouTube Data API v3 enabled
// Setup: https://console.cloud.google.com → APIs → YouTube Data API v3
//        Create OAuth 2.0 credentials (Web App)
//        Add http://localhost:5174/youtube/callback as redirect URI

const CLIENT_ID_KEY = 'melo_yt_client_id';
const TOKEN_KEY     = 'melo_yt_token';
const EXPIRY_KEY    = 'melo_yt_expiry';
const VERIFIER_KEY  = 'melo_yt_verifier';

const REDIRECT_URI  = `${window.location.origin}/youtube/callback`;
const SCOPE         = 'https://www.googleapis.com/auth/youtube.readonly';

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function generateRandom(len: number) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function sha256(s: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
}
function b64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getYtClientId()     { return localStorage.getItem(CLIENT_ID_KEY) ?? ''; }
export function saveYtClientId(id: string) { localStorage.setItem(CLIENT_ID_KEY, id.trim()); }

export function isYtConnected() {
  return !!localStorage.getItem(TOKEN_KEY) && Date.now() < Number(localStorage.getItem(EXPIRY_KEY) ?? 0);
}
export function getYtToken()  { return isYtConnected() ? localStorage.getItem(TOKEN_KEY) : null; }
export function disconnectYt() {
  [TOKEN_KEY, EXPIRY_KEY, VERIFIER_KEY].forEach(k => localStorage.removeItem(k));
}

export async function startYtAuth(clientId: string) {
  saveYtClientId(clientId);
  const verifier  = generateRandom(64);
  const challenge = b64url(await sha256(verifier));
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             clientId,
    redirect_uri:          REDIRECT_URI,
    scope:                 SCOPE,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
    access_type:           'online',
    prompt:                'consent',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function handleYtCallback(code: string): Promise<boolean> {
  const clientId = getYtClientId();
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!clientId || !verifier) return false;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
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
    localStorage.setItem(TOKEN_KEY,  data.access_token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
    localStorage.removeItem(VERIFIER_KEY);
    return true;
  } catch { return false; }
}

// ─── YouTube API ──────────────────────────────────────────────────────────────

export interface YtVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
}

async function ytFetch(path: string): Promise<Response | null> {
  const token = getYtToken();
  if (!token) return null;
  return fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getLikedVideos(maxResults = 12): Promise<YtVideo[]> {
  const res = await ytFetch(`videos?part=snippet&myRating=like&maxResults=${maxResults}&videoCategoryId=10`);
  if (!res || !res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown>;
    const thumbnails = snippet?.thumbnails as Record<string, { url: string }>;
    return {
      id:        item.id as string,
      title:     snippet?.title as string,
      channel:   snippet?.channelTitle as string,
      thumbnail: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? '',
      url:       `https://www.youtube.com/watch?v=${item.id}`,
    };
  });
}

export async function getRecentActivity(maxResults = 12): Promise<YtVideo[]> {
  // Fetch liked music + recent watch activity
  const res = await ytFetch(`activities?part=contentDetails,snippet&mine=true&maxResults=${maxResults}`);
  if (!res || !res.ok) return getLikedVideos(maxResults);
  const data = await res.json();
  const videoIds: string[] = (data.items ?? [])
    .filter((i: Record<string, unknown>) => {
      const cd = i.contentDetails as Record<string, unknown> | undefined;
      return cd?.upload;
    })
    .map((i: Record<string, unknown>) => {
      const cd = i.contentDetails as Record<string, { resourceId: { videoId: string } }>;
      return cd?.upload?.resourceId?.videoId;
    })
    .filter(Boolean);

  if (!videoIds.length) return getLikedVideos(maxResults);

  const vRes = await ytFetch(`videos?part=snippet&id=${videoIds.join(',')}`);
  if (!vRes || !vRes.ok) return getLikedVideos(maxResults);
  const vData = await vRes.json();
  return (vData.items ?? []).map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown>;
    const thumbnails = snippet?.thumbnails as Record<string, { url: string }>;
    return {
      id:        item.id as string,
      title:     snippet?.title as string,
      channel:   snippet?.channelTitle as string,
      thumbnail: thumbnails?.medium?.url ?? '',
      url:       `https://www.youtube.com/watch?v=${item.id}`,
    };
  });
}

export async function getYtProfile(): Promise<{ name: string; photo?: string } | null> {
  const res = await ytFetch('channels?part=snippet&mine=true');
  if (!res || !res.ok) return null;
  const data = await res.json();
  const ch = data.items?.[0];
  return ch ? {
    name:  ch.snippet?.title ?? '',
    photo: ch.snippet?.thumbnails?.default?.url,
  } : null;
}
