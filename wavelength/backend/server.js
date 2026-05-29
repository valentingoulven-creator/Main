const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 5e6, // 5MB for profile photos
});

app.use(cors());
app.use(express.json());

// ─── Distance ─────────────────────────────────────────────────────────────────

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
  {
    username: 'Sophie',  color: '#8b5cf6', emoji: '🎵',
    bio: 'Passionnée de musique électro et de festivals 🎪', address: 'Paris 75010', birthDate: '2000-03-15',
    interests: ['Électro 🥁', 'Festivals 🎪', 'Danse 💃', 'Art 🎨'],
    connectedApps: { spotify: 'https://open.spotify.com/user/sophie_demo', deezer: 'sophie_melo' },
    track: { title: 'Blinding Lights', artist: 'The Weeknd', source: 'spotify', url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b' },
    jamUrl: 'https://open.spotify.com/jam/demo-sophie',
  },
  {
    username: 'Alex',    color: '#ec4899', emoji: '🎸',
    bio: 'Guitariste amateur, je joue du rock depuis 10 ans 🎸', address: 'Lyon 69001', birthDate: '1997-07-22',
    interests: ['Rock 🎸', 'Concerts 🎤', 'Gaming 🎮', 'Cinéma 🎬'],
    connectedApps: { youtube: '@alex_guitar_lyon', youtubemusic: '@alex_guitar_lyon' },
    track: { title: 'Levitating', artist: 'Dua Lipa', source: 'spotify', url: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9' },
    jamUrl: null,
  },
  {
    username: 'Léa',     color: '#3b82f6', emoji: '🎹',
    bio: 'Pianiste classique qui découvre le jazz ✨', address: 'Bordeaux 33000', birthDate: '2001-11-08',
    interests: ['Classique 🎻', 'Jazz 🎷', 'Lecture 📚', 'Voyages ✈️'],
    connectedApps: { spotify: 'lea_piano', deezer: 'lea_classique' },
    track: { title: 'As It Was', artist: 'Harry Styles', source: 'spotify', url: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e' },
    jamUrl: null,
  },
  {
    username: 'Noah',    color: '#10b981', emoji: '🎤',
    bio: 'Fan de rap et de battles freestyle 🔥', address: 'Marseille 13001',
    interests: ['Hip-Hop 🎤', 'Sport 🏃', 'Mode 👗', 'Tech 💻'],
    connectedApps: { spotify: 'noah_hiphop', youtube: '@noah_freestyle' },
    track: { title: 'Bad Guy', artist: 'Billie Eilish', source: 'spotify', url: 'https://open.spotify.com/track/2Fxmhks0live4K2e4x4b6p' },
    jamUrl: 'https://open.spotify.com/jam/demo-noah',
  },
  {
    username: 'Emma',    color: '#f59e0b', emoji: '🥁',
    bio: 'Batteuse et fan de Queen depuis toujours 👑', address: 'Toulouse 31000',
    interests: ['Rock 🎸', 'Metal 🔊', 'Gastronomie 🍕', 'Nature 🌿'],
    connectedApps: { youtube: '@emma_drums', deezer: 'emma_queen_fan' },
    track: { title: 'Bohemian Rhapsody', artist: 'Queen', source: 'youtube', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
    jamUrl: null,
  },
  {
    username: 'Lucas',   color: '#06b6d4', emoji: '🎧',
    bio: 'DJ amateur en soirée, producteur le week-end 🎚️', address: 'Nantes 44000',
    interests: ['Électro 🥁', 'R&B 🎶', 'Photo 📷', 'Voyages ✈️'],
    connectedApps: { spotify: 'lucas_dj_nantes', deezer: 'lucas_dj', youtubemusic: '@lucas_beats' },
    track: { title: 'Stay', artist: 'The Kid LAROI', source: 'spotify', url: 'https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20' },
    jamUrl: 'https://open.spotify.com/jam/demo-lucas',
  },
  {
    username: 'Manon',   color: '#f97316', emoji: '🎻',
    bio: 'Violoniste de formation, ouverte à tous les genres 🎶', address: 'Strasbourg 67000',
    interests: ['Classique 🎻', 'Folk 🌿', 'Danse 💃', 'Art 🎨'],
    connectedApps: { spotify: 'manon_violon', deezer: 'manon_classique' },
    track: { title: 'Montero', artist: 'Lil Nas X', source: 'spotify', url: null },
    jamUrl: null,
  },
  {
    username: 'Thomas',  color: '#ef4444', emoji: '🎷',
    bio: 'Saxophoniste de jazz, je joue dans les rues le soir 🌙', address: 'Nice 06000',
    interests: ['Jazz 🎷', 'R&B 🎶', 'Cinéma 🎬', 'Gastronomie 🍕'],
    connectedApps: { youtube: '@thomas_sax_nice', youtubemusic: '@thomas_sax_nice' },
    track: { title: 'Starboy', artist: 'The Weeknd & Daft Punk', source: 'spotify', url: null },
    jamUrl: null,
  },
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
  return MOCK_GREETINGS[Math.floor(Math.random() * MOCK_GREETINGS.length)](mockUser);
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
      username: data.username,
      color: data.color,
      emoji: data.emoji,
      bio: data.bio,
      interests: data.interests,
      photos: [],
      address: data.address ?? '',
      connectedApps: data.connectedApps ?? {},
      position: pos,
      track: data.track,
      jamUrl: data.jamUrl,
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
    bio: user.bio ?? '',
    birthDate: user.birthDate ?? null,
    interests: user.interests ?? [],
    photos: user.photos ?? [],
    address: user.address ?? '',
    connectedApps: user.connectedApps ?? {},
    position: user.position,
    track: user.track,
    jamUrl: user.jamUrl ?? null,
    chatStatus: user.chatStatus ?? 'available',
    isMock: user.isMock ?? false,
  };
}

function getNearbyUsers(forId, position, radiusMeters) {
  if (!position) return [];
  const maxRadius = Math.min(radiusMeters, 5000); // hard cap at 5km
  return [...connectedUsers.values(), ...mockUsers]
    .filter(u => u.id !== forId && u.position)
    .map(u => ({
      ...getPublicUser(u),
      distance: Math.round(haversine(position.lat, position.lng, u.position.lat, u.position.lng)),
    }))
    .filter(u => u.distance <= maxRadius)
    .sort((a, b) => a.distance - b.distance);
}

function pushNearby(socketId) {
  const user = connectedUsers.get(socketId);
  if (!user?.position) return;
  io.sockets.sockets.get(socketId)?.emit(
    'nearby_users',
    getNearbyUsers(socketId, user.position, Math.min(user.radius ?? 2000, 5000))
  );
}

function pushAll() {
  for (const id of connectedUsers.keys()) pushNearby(id);
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
      bio: data.bio ?? '',
      birthDate: data.birthDate ?? null,
      interests: data.interests ?? [],
      photos: data.photos ?? [],
      address: data.address ?? '',
      connectedApps: data.connectedApps ?? {},
      position: data.position ?? null,
      track: data.track ?? null,
      jamUrl: data.jamUrl ?? null,
      chatStatus: data.chatStatus ?? 'available',
      radius: Math.min(data.radius ?? 2000, 5000),
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

  socket.on('update_profile', (data) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    if (data.bio           !== undefined) u.bio           = data.bio;
    if (data.birthDate     !== undefined) u.birthDate     = data.birthDate;
    if (data.interests     !== undefined) u.interests     = data.interests;
    if (data.photos        !== undefined) u.photos        = data.photos;
    if (data.jamUrl        !== undefined) u.jamUrl        = data.jamUrl;
    if (data.address       !== undefined) u.address       = data.address;
    if (data.connectedApps !== undefined) u.connectedApps = data.connectedApps;
    if (data.color         !== undefined) u.color         = data.color;
    if (data.emoji         !== undefined) u.emoji         = data.emoji;
    u.lastSeen = Date.now();
    pushAll();
  });

  socket.on('update_radius', ({ radius }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.radius = Math.min(radius, 5000);
    pushNearby(socket.id);
  });

  socket.on('update_chat_status', ({ status }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.chatStatus = status;
    pushAll();
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

  // ── Chat ──────────────────────────────────────────────────────────────────

  socket.on('chat_request', ({ to }) => {
    const requester = connectedUsers.get(socket.id);
    if (!requester) return;
    const from = { id: socket.id, username: requester.username, color: requester.color, emoji: requester.emoji };

    if (String(to).startsWith('mock-')) {
      const mockUser = mockUsers.find(m => m.id === to);
      if (!mockUser) return;
      if (mockUser.chatStatus === 'dnd') {
        socket.emit('chat_declined', { from: { id: mockUser.id, username: mockUser.username, color: mockUser.color, emoji: mockUser.emoji }, reason: 'dnd' });
        return;
      }
      setTimeout(() => {
        socket.emit('chat_accepted', { from: { id: mockUser.id, username: mockUser.username, color: mockUser.color, emoji: mockUser.emoji } });
        setTimeout(() => {
          socket.emit('chat_message', {
            from: { id: mockUser.id, username: mockUser.username, color: mockUser.color, emoji: mockUser.emoji },
            text: mockGreeting(mockUser),
            timestamp: Date.now(),
          });
        }, 800 + Math.random() * 800);
      }, 800 + Math.random() * 1200);
      return;
    }

    const target = connectedUsers.get(to);
    if (!target) { socket.emit('chat_unavailable', { to }); return; }
    if (target.chatStatus === 'dnd') {
      socket.emit('chat_declined', { from: { id: target.id, username: target.username, color: target.color, emoji: target.emoji }, reason: 'dnd' });
      return;
    }
    io.sockets.sockets.get(to)?.emit('chat_request', { from });
  });

  socket.on('chat_accept',  ({ to }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    io.sockets.sockets.get(to)?.emit('chat_accepted', { from: { id: socket.id, username: u.username, color: u.color, emoji: u.emoji } });
  });

  socket.on('chat_decline', ({ to }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    io.sockets.sockets.get(to)?.emit('chat_declined', { from: { id: socket.id, username: u.username, color: u.color, emoji: u.emoji } });
  });

  socket.on('chat_message', ({ to, text }) => {
    const sender = connectedUsers.get(socket.id);
    if (!sender || !text?.trim()) return;
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
    io.sockets.sockets.get(to)?.emit('chat_message', {
      from: { id: socket.id, username: sender.username, color: sender.color, emoji: sender.emoji },
      text: text.trim(),
      timestamp: Date.now(),
    });
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
    const r = await fetch(endpoint, { headers: { 'User-Agent': 'MeloApp/1.0' } });
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
httpServer.listen(PORT, () => console.log(`🎵 MeloSong backend → http://localhost:${PORT}`));
