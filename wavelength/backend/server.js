const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// ─── Distance (Haversine) ─────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function offsetCoords(lat, lng, dNorthM, dEastM) {
  const R = 6371000;
  return {
    lat: lat + (dNorthM / R) * (180 / Math.PI),
    lng: lng + ((dEastM / R) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180),
  };
}

// ─── Mock users ──────────────────────────────────────────────────────────────

const MOCK_DATA = [
  { username: 'Sophie',  color: '#8b5cf6', emoji: '🎵', track: { title: 'Blinding Lights',        artist: 'The Weeknd',              source: 'spotify', url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b' } },
  { username: 'Alex',    color: '#ec4899', emoji: '🎸', track: { title: 'Levitating',              artist: 'Dua Lipa',                source: 'spotify', url: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9' } },
  { username: 'Léa',     color: '#3b82f6', emoji: '🎹', track: { title: 'As It Was',               artist: 'Harry Styles',            source: 'spotify', url: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e' } },
  { username: 'Noah',    color: '#10b981', emoji: '🎤', track: { title: 'Bad Guy',                 artist: 'Billie Eilish',           source: 'spotify', url: 'https://open.spotify.com/track/2Fxmhks0live4K2e4x4b6p' } },
  { username: 'Emma',    color: '#f59e0b', emoji: '🥁', track: { title: 'Bohemian Rhapsody',       artist: 'Queen',                   source: 'youtube', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' } },
  { username: 'Lucas',   color: '#06b6d4', emoji: '🎧', track: { title: 'Stay',                    artist: 'The Kid LAROI',           source: 'spotify', url: 'https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20' } },
  { username: 'Manon',   color: '#f97316', emoji: '🎻', track: { title: 'Montero',                 artist: 'Lil Nas X',               source: 'spotify', url: null } },
  { username: 'Thomas',  color: '#ef4444', emoji: '🎷', track: { title: 'Starboy',                 artist: 'The Weeknd ft. Daft Punk', source: 'spotify', url: null } },
];

let mockUsers = [];
let mockInitialized = false;

function initMockUsers(centerLat, centerLng) {
  if (mockInitialized) return;
  mockInitialized = true;
  mockUsers = MOCK_DATA.map((data, i) => {
    const angle = (i / MOCK_DATA.length) * 2 * Math.PI;
    const dist = 150 + i * 180;
    const pos = offsetCoords(
      centerLat,
      centerLng,
      dist * Math.cos(angle),
      dist * Math.sin(angle)
    );
    return {
      id: `mock-${i}`,
      ...data,
      position: pos,
      radius: 5000,
      lastSeen: Date.now(),
      isMock: true,
    };
  });
}

// ─── Connected users ──────────────────────────────────────────────────────────

const connectedUsers = new Map();

function getNearbyUsers(forId, position, radiusMeters) {
  if (!position) return [];
  const all = [...connectedUsers.values(), ...mockUsers];
  return all
    .filter((u) => u.id !== forId && u.position)
    .map((u) => {
      const { lastSeen, radius, ...pub } = u;
      return {
        ...pub,
        distance: Math.round(haversine(position.lat, position.lng, u.position.lat, u.position.lng)),
      };
    })
    .filter((u) => u.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

function pushNearby(socketId) {
  const user = connectedUsers.get(socketId);
  if (!user?.position) return;
  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('nearby_users', getNearbyUsers(socketId, user.position, user.radius || 5000));
}

function pushAll() {
  for (const socketId of connectedUsers.keys()) pushNearby(socketId);
}

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.on('join', (data) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      username: data.username ?? 'Anonymous',
      color: data.color ?? '#8b5cf6',
      emoji: data.emoji ?? '🎵',
      position: data.position ?? null,
      track: data.track ?? null,
      radius: data.radius ?? 5000,
      lastSeen: Date.now(),
      isMock: false,
    });
    if (data.position) initMockUsers(data.position.lat, data.position.lng);
    pushNearby(socket.id);
    pushAll();
  });

  socket.on('update_position', ({ position }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.position = position;
    u.lastSeen = Date.now();
    if (!mockInitialized) initMockUsers(position.lat, position.lng);
    pushNearby(socket.id);
    pushAll();
  });

  socket.on('update_track', ({ track }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.track = track;
    u.lastSeen = Date.now();
    pushAll();
  });

  socket.on('update_radius', ({ radius }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.radius = radius;
    pushNearby(socket.id);
  });

  socket.on('heartbeat', () => {
    const u = connectedUsers.get(socket.id);
    if (u) u.lastSeen = Date.now();
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    connectedUsers.delete(socket.id);
    pushAll();
  });
});

// ─── REST: oEmbed proxy ──────────────────────────────────────────────────────

app.get('/api/oembed', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    let endpoint;
    if (url.includes('spotify.com')) {
      endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else {
      return res.status(400).json({ error: 'Unsupported URL' });
    }
    const r = await fetch(endpoint, {
      headers: { 'User-Agent': 'WavelengthApp/1.0' },
    });
    if (!r.ok) return res.status(r.status).json({ error: 'oEmbed failed' });
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) =>
  res.json({ ok: true, users: connectedUsers.size, mock: mockUsers.length })
);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🎵 Wavelength backend → http://localhost:${PORT}`));
