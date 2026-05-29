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

// ─── Distance ────────────────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function offsetCoords(lat, lng, dN, dE) {
  const R = 6371000;
  return {
    lat: lat + (dN / R) * (180 / Math.PI),
    lng: lng + ((dE / R) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180),
  };
}

// ─── Mock users ───────────────────────────────────────────────────────────────

const MOCK_DATA = [
  { username: 'Sophie',  color: '#8b5cf6', emoji: '🎵', track: { title: 'Blinding Lights',   artist: 'The Weeknd',               source: 'spotify', url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b' } },
  { username: 'Alex',    color: '#ec4899', emoji: '🎸', track: { title: 'Levitating',         artist: 'Dua Lipa',                 source: 'spotify', url: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9' } },
  { username: 'Léa',     color: '#3b82f6', emoji: '🎹', track: { title: 'As It Was',          artist: 'Harry Styles',             source: 'spotify', url: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e' } },
  { username: 'Noah',    color: '#10b981', emoji: '🎤', track: { title: 'Bad Guy',            artist: 'Billie Eilish',            source: 'spotify', url: 'https://open.spotify.com/track/2Fxmhks0live4K2e4x4b6p' } },
  { username: 'Emma',    color: '#f59e0b', emoji: '🥁', track: { title: 'Bohemian Rhapsody',  artist: 'Queen',                    source: 'youtube', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'           } },
  { username: 'Lucas',   color: '#06b6d4', emoji: '🎧', track: { title: 'Stay',               artist: 'The Kid LAROI',            source: 'spotify', url: 'https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20' } },
  { username: 'Manon',   color: '#f97316', emoji: '🎻', track: { title: 'Montero',            artist: 'Lil Nas X',                source: 'spotify', url: null } },
  { username: 'Thomas',  color: '#ef4444', emoji: '🎷', track: { title: 'Starboy',            artist: 'The Weeknd & Daft Punk',   source: 'spotify', url: null } },
];

const MOCK_GREETINGS = [
  (u) => `Salut ! T'écoutes aussi "${u.track?.artist}" ? C'est trop bien 🎵`,
  (u) => `Hey ! "${u.track?.title}" est dans ma playlist depuis des semaines 🔥`,
  (u) => `Coucou ! On est sur la même longueur d'onde 😄`,
  (u) => `Yo ! T'as de bons goûts musicaux 🎧`,
  (u) => `Salut ! Bonne écoute de ton côté ?`,
];

const MOCK_RESPONSES = [
  "C'est vraiment une bonne track ça ! 🎵",
  "Oui j'adore ce genre, t'as d'autres recs ?",
  "Je suis en mode full musique là 🎧",
  "Haha trop bien comme chanson",
  "C'est parfait pour aujourd'hui !",
  "J'ai découvert ça il y a pas longtemps",
  "Le son est incroyable sur cette track",
  "On devrait s'échanger des playlists !",
  "Trop bien ! Tu écoutes quoi d'autre ?",
  "Oui c'est mon artiste préféré du moment",
];

function mockGreeting(mockUser) {
  const fn = MOCK_GREETINGS[Math.floor(Math.random() * MOCK_GREETINGS.length)];
  return fn(mockUser);
}
function mockResponse() {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
}

let mockUsers = [];
let mockInitialized = false;

function initMockUsers(lat, lng) {
  if (mockInitialized) return;
  mockInitialized = true;
  mockUsers = MOCK_DATA.map((data, i) => {
    const angle = (i / MOCK_DATA.length) * 2 * Math.PI;
    const dist = 150 + i * 180;
    const pos = offsetCoords(lat, lng, dist * Math.cos(angle), dist * Math.sin(angle));
    return {
      id: `mock-${i}`,
      ...data,
      position: pos,
      chatStatus: 'available',
      radius: 5000,
      lastSeen: Date.now(),
      isMock: true,
    };
  });
}

// ─── Connected users ──────────────────────────────────────────────────────────

const connectedUsers = new Map();

function getPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    color: user.color,
    emoji: user.emoji,
    position: user.position,
    track: user.track,
    chatStatus: user.chatStatus ?? 'available',
    isMock: user.isMock ?? false,
  };
}

function getNearbyUsers(forId, position, radiusMeters) {
  if (!position) return [];
  return [...connectedUsers.values(), ...mockUsers]
    .filter(u => u.id !== forId && u.position)
    .map(u => ({
      ...getPublicUser(u),
      distance: Math.round(haversine(position.lat, position.lng, u.position.lat, u.position.lng)),
    }))
    .filter(u => u.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

function pushNearby(socketId) {
  const user = connectedUsers.get(socketId);
  if (!user?.position) return;
  io.sockets.sockets.get(socketId)?.emit(
    'nearby_users',
    getNearbyUsers(socketId, user.position, user.radius ?? 5000)
  );
}

function pushAll() {
  for (const id of connectedUsers.keys()) pushNearby(id);
}

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // ── Presence ────────────────────────────────────────────────────────────────
  socket.on('join', (data) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      username: data.username ?? 'Anonymous',
      color: data.color ?? '#8b5cf6',
      emoji: data.emoji ?? '🎵',
      position: data.position ?? null,
      track: data.track ?? null,
      chatStatus: data.chatStatus ?? 'available',
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

  socket.on('update_chat_status', ({ status }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.chatStatus = status;
    pushAll(); // so nearby users see updated status
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

  // ── Chat ─────────────────────────────────────────────────────────────────────

  socket.on('chat_request', ({ to }) => {
    const requester = connectedUsers.get(socket.id);
    if (!requester) return;
    const from = { id: socket.id, username: requester.username, color: requester.color, emoji: requester.emoji };

    // Mock user handling
    if (String(to).startsWith('mock-')) {
      const mockUser = mockUsers.find(m => m.id === to);
      if (!mockUser) return;

      if (mockUser.chatStatus === 'dnd') {
        socket.emit('chat_declined', { from: { id: mockUser.id, username: mockUser.username, color: mockUser.color, emoji: mockUser.emoji }, reason: 'dnd' });
        return;
      }
      if (mockUser.chatStatus === 'busy') {
        // busy users accept but with a delay
      }

      const delay = 800 + Math.random() * 1200;
      setTimeout(() => {
        socket.emit('chat_accepted', { from: { id: mockUser.id, username: mockUser.username, color: mockUser.color, emoji: mockUser.emoji } });
        setTimeout(() => {
          socket.emit('chat_message', {
            from: { id: mockUser.id, username: mockUser.username, color: mockUser.color, emoji: mockUser.emoji },
            text: mockGreeting(mockUser),
            timestamp: Date.now(),
          });
        }, 800 + Math.random() * 800);
      }, delay);
      return;
    }

    // Real user handling
    const target = connectedUsers.get(to);
    if (!target) {
      socket.emit('chat_unavailable', { to });
      return;
    }

    if (target.chatStatus === 'dnd') {
      socket.emit('chat_declined', { from: { id: target.id, username: target.username, color: target.color, emoji: target.emoji }, reason: 'dnd' });
      return;
    }

    io.sockets.sockets.get(to)?.emit('chat_request', { from });
  });

  socket.on('chat_accept', ({ to }) => {
    const accepter = connectedUsers.get(socket.id);
    if (!accepter) return;
    io.sockets.sockets.get(to)?.emit('chat_accepted', {
      from: { id: socket.id, username: accepter.username, color: accepter.color, emoji: accepter.emoji },
    });
  });

  socket.on('chat_decline', ({ to }) => {
    const decliner = connectedUsers.get(socket.id);
    if (!decliner) return;
    io.sockets.sockets.get(to)?.emit('chat_declined', {
      from: { id: socket.id, username: decliner.username, color: decliner.color, emoji: decliner.emoji },
    });
  });

  socket.on('chat_message', ({ to, text }) => {
    const sender = connectedUsers.get(socket.id);
    if (!sender || !text?.trim()) return;
    const payload = {
      from: { id: socket.id, username: sender.username, color: sender.color, emoji: sender.emoji },
      text: text.trim(),
      timestamp: Date.now(),
    };

    // Mock user auto-response
    if (String(to).startsWith('mock-')) {
      const mockUser = mockUsers.find(m => m.id === to);
      if (mockUser) {
        setTimeout(() => {
          socket.emit('chat_message', {
            from: { id: mockUser.id, username: mockUser.username, color: mockUser.color, emoji: mockUser.emoji },
            text: mockResponse(),
            timestamp: Date.now(),
          });
        }, 1200 + Math.random() * 2000);
      }
      return;
    }

    io.sockets.sockets.get(to)?.emit('chat_message', payload);
  });

  socket.on('chat_close', ({ to }) => {
    if (String(to).startsWith('mock-')) return;
    io.sockets.sockets.get(to)?.emit('chat_closed', { fromId: socket.id });
  });
});

// ─── REST ─────────────────────────────────────────────────────────────────────

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
    const r = await fetch(endpoint, { headers: { 'User-Agent': 'WavelengthApp/1.0' } });
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
