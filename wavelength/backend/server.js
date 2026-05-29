const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');

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
  // ── Très proches (< 200 m) ─────────────────────────────────────────────────
  {
    username: 'Sophie',  color: '#8b5cf6', emoji: '🎵', dist: 80, angle: 0.4,
    bio: 'Passionnée de musique électro et de festivals 🎪', address: 'Paris 75010', birthDate: '2000-03-15',
    interests: ['Électro 🥁', 'Festivals 🎪', 'Danse 💃', 'Art 🎨'],
    connectedApps: { spotify: 'https://open.spotify.com/user/sophie_demo', deezer: 'sophie_melo' },
    track: { title: 'Blinding Lights', artist: 'The Weeknd', source: 'spotify', url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b' },
    jamUrl: 'https://open.spotify.com/jam/demo-sophie',
  },
  {
    username: 'Camille', color: '#a855f7', emoji: '🎶', dist: 120, angle: 1.8,
    bio: 'Chanteuse de chorale le dimanche, indie pop en semaine 🎙️', address: 'Paris 75009', birthDate: '2003-06-21',
    interests: ['Pop 🎵', 'Indie 🌿', 'Art 🎨', 'Voyages ✈️'],
    connectedApps: { spotify: 'camille_chant', deezer: 'camille_indie' },
    track: { title: 'good 4 u', artist: 'Olivia Rodrigo', source: 'spotify', url: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG' },
    jamUrl: null,
  },
  {
    username: 'Nico',    color: '#0ea5e9', emoji: '🎧', dist: 160, angle: 3.2,
    bio: 'Beatmaker parisien, j\'envoie des tracks gratuitement 🎚️', address: 'Paris 75018', birthDate: '1999-09-14',
    interests: ['Hip-Hop 🎤', 'Électro 🥁', 'Gaming 🎮', 'Tech 💻'],
    connectedApps: { youtube: '@nico_beats_paris', youtubemusic: '@nico_beats_paris', spotify: 'nico_prod' },
    track: { title: 'HUMBLE.', artist: 'Kendrick Lamar', source: 'spotify', url: 'https://open.spotify.com/track/7KXjTSCq5nL1LoYtL7XAwS' },
    jamUrl: 'https://open.spotify.com/jam/demo-nico',
  },

  // ── Proches (200 m – 800 m) ────────────────────────────────────────────────
  {
    username: 'Alex',    color: '#ec4899', emoji: '🎸', dist: 280, angle: 0.9,
    bio: 'Guitariste amateur, je joue du rock depuis 10 ans 🎸', address: 'Paris 75001', birthDate: '1997-07-22',
    interests: ['Rock 🎸', 'Concerts 🎤', 'Gaming 🎮', 'Cinéma 🎬'],
    connectedApps: { youtube: '@alex_guitar', youtubemusic: '@alex_guitar' },
    track: { title: 'Levitating', artist: 'Dua Lipa', source: 'spotify', url: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9' },
    jamUrl: null,
  },
  {
    username: 'Inès',    color: '#f43f5e', emoji: '🎤', dist: 350, angle: 2.1,
    bio: 'Passionnée de K-Pop et de J-Pop depuis toujours ✨', address: 'Paris 75011', birthDate: '2002-02-28',
    interests: ['K-Pop ✨', 'Danse 💃', 'Mode 👗', 'Cinéma 🎬'],
    connectedApps: { youtubemusic: '@ines_kpop', deezer: 'ines_kpop_fr' },
    track: { title: 'Dynamite', artist: 'BTS', source: 'youtube', url: 'https://www.youtube.com/watch?v=gdZLi9oWNZg' },
    jamUrl: null,
  },
  {
    username: 'Léa',     color: '#3b82f6', emoji: '🎹', dist: 420, angle: 4.5,
    bio: 'Pianiste classique qui découvre le jazz ✨', address: 'Paris 75005', birthDate: '2001-11-08',
    interests: ['Classique 🎻', 'Jazz 🎷', 'Lecture 📚', 'Voyages ✈️'],
    connectedApps: { spotify: 'lea_piano', deezer: 'lea_classique' },
    track: { title: 'As It Was', artist: 'Harry Styles', source: 'spotify', url: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e' },
    jamUrl: null,
  },
  {
    username: 'Rayan',   color: '#22c55e', emoji: '🥁', dist: 550, angle: 5.5,
    bio: 'Batteur de metal, doux dans la vie 😄', address: 'Paris 75013', birthDate: '1998-04-03',
    interests: ['Metal 🔊', 'Rock 🎸', 'Sport 🏃', 'Gaming 🎮'],
    connectedApps: { youtube: '@rayan_drums_metal', spotify: 'rayan_metal' },
    track: { title: 'Master of Puppets', artist: 'Metallica', source: 'youtube', url: 'https://www.youtube.com/watch?v=xopkKOyNm5Q' },
    jamUrl: null,
  },
  {
    username: 'Emma',    color: '#f59e0b', emoji: '🥁', dist: 650, angle: 1.2,
    bio: 'Batteuse et fan de Queen depuis toujours 👑', address: 'Paris 75014', birthDate: '1996-08-17',
    interests: ['Rock 🎸', 'Metal 🔊', 'Gastronomie 🍕', 'Nature 🌿'],
    connectedApps: { youtube: '@emma_drums', deezer: 'emma_queen_fan' },
    track: { title: 'Bohemian Rhapsody', artist: 'Queen', source: 'youtube', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
    jamUrl: null,
  },

  // ── Moyens (800 m – 2 km) ─────────────────────────────────────────────────
  {
    username: 'Noah',    color: '#10b981', emoji: '🎤', dist: 900, angle: 3.8,
    bio: 'Fan de rap et de battles freestyle 🔥', address: 'Paris 75019', birthDate: '2000-12-05',
    interests: ['Hip-Hop 🎤', 'Sport 🏃', 'Mode 👗', 'Tech 💻'],
    connectedApps: { spotify: 'noah_hiphop', youtube: '@noah_freestyle' },
    track: { title: 'Bad Guy', artist: 'Billie Eilish', source: 'spotify', url: 'https://open.spotify.com/track/2Fxmhks0live4K2e4x4b6p' },
    jamUrl: 'https://open.spotify.com/jam/demo-noah',
  },
  {
    username: 'Lucas',   color: '#06b6d4', emoji: '🎧', dist: 1100, angle: 0.2,
    bio: 'DJ amateur en soirée, producteur le week-end 🎚️', address: 'Paris 75020', birthDate: '1995-05-30',
    interests: ['Électro 🥁', 'R&B 🎶', 'Photo 📷', 'Voyages ✈️'],
    connectedApps: { spotify: 'lucas_dj', deezer: 'lucas_dj', youtubemusic: '@lucas_beats' },
    track: { title: 'Stay', artist: 'The Kid LAROI', source: 'spotify', url: 'https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20' },
    jamUrl: 'https://open.spotify.com/jam/demo-lucas',
  },
  {
    username: 'Jade',    color: '#d946ef', emoji: '🎻', dist: 1300, angle: 2.7,
    bio: 'Violoniste, amoureuse de la folk et des grands espaces 🌿', address: 'Paris 75015', birthDate: '2004-01-19',
    interests: ['Folk 🌿', 'Classique 🎻', 'Nature 🌿', 'Lecture 📚'],
    connectedApps: { spotify: 'jade_violin_folk', deezer: 'jade_violon' },
    track: { title: 'Tennessee Whiskey', artist: 'Chris Stapleton', source: 'spotify', url: null },
    jamUrl: null,
  },
  {
    username: 'Karim',   color: '#f97316', emoji: '🎷', dist: 1600, angle: 5.0,
    bio: 'Saxophoniste de rue, jazz manouche et soul 🌙', address: 'Paris 75006', birthDate: '1993-10-11',
    interests: ['Jazz 🎷', 'Soul 🎶', 'Gastronomie 🍕', 'Cinéma 🎬'],
    connectedApps: { youtube: '@karim_sax_paris', youtubemusic: '@karim_sax_paris' },
    track: { title: 'What a Wonderful World', artist: 'Louis Armstrong', source: 'youtube', url: 'https://www.youtube.com/watch?v=A3yCcXgbKrE' },
    jamUrl: null,
  },
  {
    username: 'Chloé',   color: '#84cc16', emoji: '🎙️', dist: 1800, angle: 3.5,
    bio: 'Podcaster musicale, je parle de sons rares 🎙️', address: 'Paris 75007', birthDate: '1998-07-07',
    interests: ['Pop 🎵', 'R&B 🎶', 'Tech 💻', 'Voyages ✈️'],
    connectedApps: { spotify: 'chloe_podcast_music', deezer: 'chloe_sounds' },
    track: { title: 'Espresso', artist: 'Sabrina Carpenter', source: 'spotify', url: 'https://open.spotify.com/track/2qSkIjg1o9h3YT9RAgYN75' },
    jamUrl: null,
  },

  // ── Plus loin (2 km – 4 km) ───────────────────────────────────────────────
  {
    username: 'Manon',   color: '#f97316', emoji: '🎻', dist: 2300, angle: 1.5,
    bio: 'Violoniste de formation, ouverte à tous les genres 🎶', address: 'Paris 75016', birthDate: '2002-03-25',
    interests: ['Classique 🎻', 'Folk 🌿', 'Danse 💃', 'Art 🎨'],
    connectedApps: { spotify: 'manon_violon', deezer: 'manon_classique' },
    track: { title: 'Montero', artist: 'Lil Nas X', source: 'spotify', url: null },
    jamUrl: null,
  },
  {
    username: 'Thomas',  color: '#ef4444', emoji: '🎷', dist: 2800, angle: 4.2,
    bio: 'Saxophoniste de jazz, je joue dans les rues le soir 🌙', address: 'Paris 75003', birthDate: '1991-12-30',
    interests: ['Jazz 🎷', 'R&B 🎶', 'Cinéma 🎬', 'Gastronomie 🍕'],
    connectedApps: { youtube: '@thomas_sax', youtubemusic: '@thomas_sax' },
    track: { title: 'Starboy', artist: 'The Weeknd & Daft Punk', source: 'spotify', url: null },
    jamUrl: null,
  },
  {
    username: 'Yasmine', color: '#e879f9', emoji: '🎼', dist: 3200, angle: 0.7,
    bio: 'Compositrice en herbe, musique de film en tête 🎬', address: 'Paris 75002', birthDate: '2000-09-09',
    interests: ['Classique 🎻', 'Cinéma 🎬', 'Art 🎨', 'Lecture 📚'],
    connectedApps: { spotify: 'yasmine_compose', deezer: 'yasmine_films' },
    track: { title: 'Experience', artist: 'Ludovico Einaudi', source: 'youtube', url: 'https://www.youtube.com/watch?v=hN_q-_nGv4U' },
    jamUrl: null,
  },
  {
    username: 'Baptiste', color: '#38bdf8', emoji: '🎚️', dist: 3700, angle: 2.5,
    bio: 'Sound engineer, j\'adore les sons qui claquent fort 🔊', address: 'Paris 75017', birthDate: '1994-03-18',
    interests: ['Électro 🥁', 'House 🎚️', 'Tech 💻', 'Photo 📷'],
    connectedApps: { spotify: 'baptiste_sound', youtubemusic: '@baptiste_mix', deezer: 'baptiste_edm' },
    track: { title: 'One More Time', artist: 'Daft Punk', source: 'spotify', url: null },
    jamUrl: 'https://open.spotify.com/jam/demo-baptiste',
  },
  {
    username: 'Zoé',     color: '#fb7185', emoji: '🎤', dist: 4200, angle: 5.8,
    bio: 'Chanteuse de variété française, Brel dans le cœur ❤️', address: 'Paris 75008', birthDate: '1997-11-02',
    interests: ['Pop 🎵', 'Folk 🌿', 'Concerts 🎤', 'Gastronomie 🍕'],
    connectedApps: { deezer: 'zoe_variet_fr', spotify: 'zoe_chanson' },
    track: { title: 'Ne me quitte pas', artist: 'Jacques Brel', source: 'youtube', url: 'https://www.youtube.com/watch?v=mPJRbQRFSEc' },
    jamUrl: null,
  },
  // ── Aucun morceau en cours (idle) ─────────────────────────────────────────
  {
    username: 'Marc',    color: '#64748b', emoji: '🎵', dist: 200, angle: 2.9,
    bio: 'Mélomane curieux, ouvert à tout 🎵', address: 'Paris 75012', birthDate: '1990-06-15',
    interests: ['Pop 🎵', 'Jazz 🎷', 'Cinéma 🎬', 'Sport 🏃'],
    connectedApps: { deezer: 'marc_paris' },
    track: null,
    jamUrl: null,
  },
  {
    username: 'Élisa',   color: '#94a3b8', emoji: '🎹', dist: 480, angle: 4.0,
    bio: 'En pause musicale, mais toujours là 😴', address: 'Paris 75004', birthDate: '2005-08-22',
    interests: ['Pop 🎵', 'K-Pop ✨', 'Mode 👗', 'Art 🎨'],
    connectedApps: { spotify: 'elisa_pop', youtubemusic: '@elisa_music' },
    track: null,
    jamUrl: null,
  },

  // ── Bot EN DIRECT ─────────────────────────────────────────────────────────
  {
    username: 'DJ_Melo',  color: '#ef4444', emoji: '🎚️', dist: 60, angle: 1.0,
    bio: '🔴 En live maintenant — mix électro/house en direct de Paris !', address: 'Paris 75001', birthDate: '1995-06-10',
    interests: ['Électro 🥁', 'House 🎚️', 'Festivals 🎪', 'Tech 💻'],
    connectedApps: { spotify: 'dj_melo_paris' },
    track: { title: 'One More Time', artist: 'Daft Punk', source: 'spotify', url: 'https://open.spotify.com/track/2veoh0LMBtMFBSjCCOhrvo' },
    jamUrl: 'https://open.spotify.com/jam/demo-djmelo',
    isLive: true,
    liveTitle: '🎚️ Mix Électro/House — Paris Live',
    livePublic: true,
    liveViewers: 47,
  },

  // ── 5 nouveaux bots ───────────────────────────────────────────────────────
  {
    username: 'Axel',    color: '#7c3aed', emoji: '🎚️', dist: 95,  angle: 1.1,
    bio: 'Producer underground, trap et lo-fi 🌙', address: 'Paris 75010', birthDate: '2001-04-12',
    interests: ['Hip-Hop 🎤', 'Électro 🥁', 'House 🎚️', 'Tech 💻'],
    connectedApps: { spotify: 'axel_trap', youtube: '@axel_prod' },
    track: { title: 'SICKO MODE', artist: 'Travis Scott', source: 'spotify', url: 'https://open.spotify.com/track/2xLMifQCjDGFmkHkpNLD9h' },
    jamUrl: null,
  },
  {
    username: 'Lena',    color: '#db2777', emoji: '🌸', dist: 210, angle: 3.9,
    bio: 'Pianiste jazz, adepte des notes bleues 💙', address: 'Paris 75006', birthDate: '1999-07-30',
    interests: ['Jazz 🎷', 'Classique 🎻', 'Art 🎨', 'Lecture 📚'],
    connectedApps: { deezer: 'lena_jazz', spotify: 'lena_piano_jazz' },
    track: { title: 'So What', artist: 'Miles Davis', source: 'youtube', url: 'https://www.youtube.com/watch?v=ylXk1LBvIqU' },
    jamUrl: null,
  },
  {
    username: 'Samir',   color: '#0891b2', emoji: '🎤', dist: 330, angle: 0.5,
    bio: 'Rappeur en devenir, textes engagés ✊', address: 'Paris 75018', birthDate: '2002-11-15',
    interests: ['Hip-Hop 🎤', 'R&B 🎶', 'Sport 🏃', 'Mode 👗'],
    connectedApps: { youtube: '@samir_rap_paris', spotify: 'samir_rap' },
    track: { title: 'Coeur de Paris', artist: 'Vald', source: 'spotify', url: null },
    jamUrl: 'https://open.spotify.com/jam/demo-samir',
  },
  {
    username: 'Océane',  color: '#059669', emoji: '🎸', dist: 140, angle: 5.2,
    bio: 'Guitariste folk, grande voyageuse 🌍', address: 'Paris 75015', birthDate: '1998-03-08',
    interests: ['Folk 🌿', 'Rock 🎸', 'Voyages ✈️', 'Nature 🌿'],
    connectedApps: { spotify: 'oceane_folk', youtubemusic: '@oceane_guitar' },
    track: { title: 'Fast Car', artist: 'Tracy Chapman', source: 'youtube', url: 'https://www.youtube.com/watch?v=AIOAlaACuv4' },
    jamUrl: null,
  },
  {
    username: 'Hugo',    color: '#ea580c', emoji: '🥁', dist: 75,  angle: 2.3,
    bio: 'Batteur de funk et de soul 🕺 Groove addict', address: 'Paris 75011', birthDate: '1996-09-22',
    interests: ['Funk 🎶', 'Soul 🎵', 'R&B 🎶', 'Danse 💃'],
    connectedApps: { deezer: 'hugo_funk', spotify: 'hugo_drums_funk' },
    track: { title: 'Superstition', artist: 'Stevie Wonder', source: 'spotify', url: 'https://open.spotify.com/track/1h0VcYnGUxJEBB3aV8gVoN' },
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
    const dist = data.dist ?? 300;
    const angle = data.angle ?? Math.random() * 2 * Math.PI;
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
      isLive:     data.isLive     ?? false,
      liveTitle:  data.liveTitle  ?? null,
      livePublic: data.livePublic ?? false,
      liveStart:  data.isLive ? Date.now() - Math.floor(Math.random() * 1800000) : null, // up to 30min ago
      viewers:    data.liveViewers ?? 0,
      chatStatus: 'available',
      radius: 5000,
      lastSeen: Date.now(),
      isMock: true,
    };
  });
}

// ─── Email transport ──────────────────────────────────────────────────────────

let transporter = null;
let testAccount = null;
const APP_URL = process.env.APP_URL || 'http://localhost:5174';

async function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📧 Ethereal test account:', testAccount.user);
  }
  return transporter;
}

function verificationEmailHTML(username, verifyUrl, code) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Valide ton compte MeloSong</title></head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;padding:40px 20px;">
  <tr><td align="center">
  <table width="520" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.05);border-radius:24px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#8b5cf6,#ec4899);padding:32px;text-align:center;">
      <svg width="44" height="36" viewBox="0 0 110 90" fill="none" style="display:block;margin:0 auto 12px;"><polyline points="8,82 8,8 46,82 46,8" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="56,82 56,8 83,50 102,8 102,82" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h1 style="color:white;margin:0;font-size:26px;font-weight:900;">MeloSong</h1>
      <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">Découvre la musique autour de toi</p>
    </td></tr>
    <tr><td style="padding:36px 32px;">
      <h2 style="color:white;margin:0 0 8px;font-size:20px;font-weight:800;">Salut ${username} 👋</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
        Bienvenue sur MeloSong ! Valide ton adresse email pour obtenir ton
        <strong style="color:#fbbf24;"> ⭐ badge compte vérifié</strong> visible sur ton profil.
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${verifyUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:white;text-decoration:none;padding:16px 44px;border-radius:16px;font-size:17px;font-weight:900;box-shadow:0 8px 24px rgba(139,92,246,0.4);">
          ⭐ Valider mon compte
        </a>
      </div>
      <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:14px;padding:18px;text-align:center;margin:0 0 22px;">
        <div style="font-size:36px;margin-bottom:6px;">⭐</div>
        <p style="color:#fbbf24;margin:0;font-size:13px;font-weight:700;">Badge compte vérifié</p>
        <p style="color:rgba(255,255,255,0.35);margin:4px 0 0;font-size:12px;">Affiché sur ton profil dès la validation</p>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;text-align:center;">
        <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0 0 8px;">Ou entre ce code dans l'app :</p>
        <div style="font-size:30px;font-weight:900;letter-spacing:8px;color:white;font-family:monospace;">${code}</div>
      </div>
    </td></tr>
    <tr><td style="border-top:1px solid rgba(255,255,255,0.07);padding:18px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">Ce lien expire dans 24h · © 2026 MeloSong</p>
    </td></tr>
  </table>
  </td></tr>
</table></body></html>`;
}

// ─── Auth store (in-memory + persisted to simple JSON) ───────────────────────

const crypto = require('crypto');
const fs     = require('fs');
const ACCOUNTS_FILE = './accounts.json';

let serverAccounts = [];
try {
  if (fs.existsSync(ACCOUNTS_FILE)) {
    serverAccounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  }
} catch { serverAccounts = []; }

function saveServerAccounts() {
  try { fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(serverAccounts, null, 2)); } catch {}
}

function hashPwd(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// ─── Ratings store ────────────────────────────────────────────────────────────
// Map<targetId, Rating[]>
const ratingsStore = new Map();

function getRatings(targetId) {
  return ratingsStore.get(targetId) ?? [];
}

function addRating(targetId, rating) {
  const existing = getRatings(targetId);
  // One rating per (fromId, targetId) — overwrite if exists
  const filtered = existing.filter(r => r.fromId !== rating.fromId);
  ratingsStore.set(targetId, [rating, ...filtered].slice(0, 50)); // keep last 50
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
    ytSession:   user.ytSession  ?? null,
    isLive:      user.isLive     ?? false,
    liveTitle:   user.liveTitle  ?? null,
    liveStart:   user.liveStart  ?? null,
    livePublic:  user.livePublic ?? false,
    viewers:     user.viewers    ?? 0,
    isMock:      user.isMock     ?? false,
  };
}

function getNearbyUsers(forId, position, radiusMeters) {
  if (!position) return [];
  const maxRadius = Math.min(radiusMeters, 5000);
  return [...connectedUsers.values(), ...mockUsers]
    .filter(u => u.id !== forId && u.position && u.chatStatus !== 'invisible') // invisible users hidden
    .map(u => ({
      ...getPublicUser(u),
      distance: Math.round(haversine(position.lat, position.lng, u.position.lat, u.position.lng)),
    }))
    .filter(u => u.distance <= maxRadius)
    .sort((a, b) => a.distance - b.distance);
}

function getPublicLives() {
  return [...connectedUsers.values(), ...mockUsers]
    .filter(u => u.isLive && u.livePublic)
    .map(u => ({
      id: u.id,
      username: u.username,
      color: u.color,
      emoji: u.emoji,
      photos: u.photos ?? [],
      bio: u.bio ?? '',
      liveTitle: u.liveTitle,
      liveStart: u.liveStart,
      viewers: u.viewers ?? 0,
      track: u.track,
      address: u.address ?? '',
    }))
    .sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0));
}

function pushPublicLives() {
  const lives = getPublicLives();
  io.emit('public_lives', lives);
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

// ─── Auth REST endpoints ──────────────────────────────────────────────────────

// ─── Email verification endpoints ────────────────────────────────────────────

app.post('/api/send-verification', async (req, res) => {
  const { uid, email, username, code } = req.body ?? {};
  if (!uid || !email || !code) return res.status(400).json({ error: 'Données manquantes' });

  const verifyUrl = `${APP_URL}/verify-email?uid=${uid}&code=${code}`;
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: '"MeloSong" <noreply@melosong.app>',
      to: email,
      subject: '⭐ Valide ton compte MeloSong',
      html: verificationEmailHTML(username, verifyUrl, code),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Email envoyé à ${email} — Preview: ${previewUrl || 'N/A'}`);
    res.json({ ok: true, previewUrl: previewUrl || null });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Erreur envoi email' });
  }
});

// Link-click verification (GET from email)
app.get('/api/verify-email', (req, res) => {
  const { uid, code } = req.query;
  const accounts = serverAccounts;
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx < 0) return res.redirect(`${APP_URL}/verify-error`);
  if (accounts[idx].verifyCode !== code) return res.redirect(`${APP_URL}/verify-error`);

  accounts[idx].emailVerified = true;
  accounts[idx].verifyCode = null;
  saveServerAccounts();

  // Redirect to app with success flag
  res.redirect(`${APP_URL}/?verified=1&uid=${uid}`);
});

app.post('/api/register', (req, res) => {
  const { email, username, password } = req.body ?? {};
  if (!email || !username || !password) return res.status(400).json({ error: 'Champs manquants.' });
  const emailLower = email.toLowerCase().trim();
  if (serverAccounts.find(a => a.email === emailLower)) return res.status(409).json({ error: 'Email déjà utilisé.' });
  const uid  = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const hash = hashPwd(password, uid);
  serverAccounts.push({ uid, email: emailLower, username: username.trim(), passwordHash: hash, createdAt: Date.now() });
  saveServerAccounts();
  res.json({ ok: true, uid, username: username.trim() });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Champs manquants.' });
  const account = serverAccounts.find(a => a.email === email.toLowerCase().trim());
  if (!account) return res.status(401).json({ error: 'Email inconnu.' });
  if (hashPwd(password, account.uid) !== account.passwordHash) return res.status(401).json({ error: 'Mot de passe incorrect.' });
  res.json({ ok: true, uid: account.uid, username: account.username });
});

app.get('/api/users/count', (_req, res) => res.json({ count: serverAccounts.length }));

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
    if (target.chatStatus === 'invisible' || target.chatStatus === 'dnd') {
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

  // ── Ratings ─────────────────────────────────────────────────────────────────

  socket.on('send_rating', ({ targetId, vibe, note, anonymous }) => {
    const sender = connectedUsers.get(socket.id);
    if (!sender || !vibe) return;

    const isAnon = anonymous === true;
    const rating = {
      fromId:       isAnon ? `anon-${socket.id}` : socket.id,
      fromUsername: isAnon ? 'Anonyme 🎭'         : sender.username,
      fromEmoji:    isAnon ? '🎭'                  : sender.emoji,
      fromColor:    isAnon ? '#64748b'             : sender.color,
      fromPhoto:    isAnon ? null                  : (sender.photos?.[0] ?? null),
      anonymous:    isAnon,
      vibe,
      note: note?.trim() || null,
      timestamp: Date.now(),
    };

    addRating(targetId, rating);

    // Notify the rated user if they're connected
    if (!String(targetId).startsWith('mock-')) {
      io.sockets.sockets.get(targetId)?.emit('rating_received', {
        from: { id: socket.id, username: sender.username, emoji: sender.emoji, color: sender.color },
        vibe,
        note: rating.note,
      });
    }

    // Send back the updated ratings to requester
    socket.emit('ratings_data', { targetId, ratings: getRatings(targetId) });
  });

  socket.on('get_ratings', ({ targetId }) => {
    socket.emit('ratings_data', { targetId, ratings: getRatings(targetId) });
  });

  socket.on('get_public_lives', () => {
    socket.emit('public_lives', getPublicLives());
  });

  // ── YouTube Sessions ─────────────────────────────────────────────────────

  socket.on('yt_session_create', ({ videoId, title, videoTitle }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.ytSession = { videoId, title: title || `Session de ${u.username}`, videoTitle, participants: 0, state: 'paused', currentTime: 0, startedAt: Date.now() };
    socket.join(`ytsession:${socket.id}`);
    pushAll();
  });

  socket.on('yt_session_end', () => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.ytSession = null;
    io.to(`ytsession:${socket.id}`).emit('yt_session_ended', { hostId: socket.id });
    io.socketsLeave(`ytsession:${socket.id}`);
    pushAll();
  });

  socket.on('yt_session_join', ({ hostId }) => {
    const host = connectedUsers.get(hostId);
    if (!host?.ytSession) { socket.emit('yt_session_unavailable', { hostId }); return; }
    socket.join(`ytsession:${hostId}`);
    host.ytSession.participants = (host.ytSession.participants ?? 0) + 1;
    pushAll();
    // Send current state to new joiner
    socket.emit('yt_session_state', { hostId, ...host.ytSession });
  });

  socket.on('yt_session_leave', ({ hostId }) => {
    socket.leave(`ytsession:${hostId}`);
    const host = connectedUsers.get(hostId);
    if (host?.ytSession) host.ytSession.participants = Math.max(0, (host.ytSession.participants ?? 1) - 1);
    pushAll();
  });

  // Host broadcasts playback state to all participants
  socket.on('yt_session_sync', ({ state, currentTime }) => {
    const u = connectedUsers.get(socket.id);
    if (!u?.ytSession) return;
    u.ytSession.state = state;
    u.ytSession.currentTime = currentTime;
    // Broadcast to all participants (not host)
    socket.to(`ytsession:${socket.id}`).emit('yt_session_state', {
      hostId: socket.id, videoId: u.ytSession.videoId, state, currentTime, ts: Date.now(),
    });
  });

  // ── Live streaming (WebRTC signaling) ─────────────────────────────────────

  socket.on('start_live', ({ title, isPublic }) => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.isLive       = true;
    u.liveTitle    = title?.trim() || `Live de ${u.username}`;
    u.liveStart    = Date.now();
    u.livePublic   = isPublic === true;
    u.viewers      = 0;
    pushAll();
    pushPublicLives();
    console.log(`🔴 LIVE: ${u.username} — "${u.liveTitle}" (${u.livePublic ? 'public' : 'privé'})`);
  });

  socket.on('update_live', ({ title, isPublic }) => {
    const u = connectedUsers.get(socket.id);
    if (!u?.isLive) return;
    if (title    !== undefined) u.liveTitle  = title?.trim() || u.liveTitle;
    if (isPublic !== undefined) u.livePublic = isPublic;
    pushAll();
    pushPublicLives();
  });

  socket.on('stop_live', () => {
    const u = connectedUsers.get(socket.id);
    if (!u) return;
    u.isLive     = false;
    u.liveTitle  = null;
    u.liveStart  = null;
    u.livePublic = false;
    u.viewers    = 0;
    pushAll();
    pushPublicLives();
    io.sockets.sockets.forEach(s => s.emit('live_ended', { broadcasterId: socket.id }));
  });

  // Viewer asks to watch a live
  socket.on('join_live', ({ broadcasterId }) => {
    const broadcaster = connectedUsers.get(broadcasterId);
    if (!broadcaster?.isLive) {
      socket.emit('live_ended', { broadcasterId });
      return;
    }
    broadcaster.viewers = (broadcaster.viewers ?? 0) + 1;
    pushAll();
    // Tell broadcaster a new viewer is joining, send them the viewer's socket id
    io.sockets.sockets.get(broadcasterId)?.emit('viewer_joined', { viewerId: socket.id });
  });

  socket.on('leave_live', ({ broadcasterId }) => {
    const broadcaster = connectedUsers.get(broadcasterId);
    if (broadcaster) broadcaster.viewers = Math.max(0, (broadcaster.viewers ?? 1) - 1);
    pushAll();
    io.sockets.sockets.get(broadcasterId)?.emit('viewer_left', { viewerId: socket.id });
  });

  // ── Live Chat ────────────────────────────────────────────────────────────────

  socket.on('live_chat_join', ({ broadcasterId }) => {
    socket.join(`livechat:${broadcasterId}`);
  });

  socket.on('live_chat_leave', ({ broadcasterId }) => {
    socket.leave(`livechat:${broadcasterId}`);
  });

  socket.on('live_chat_message', ({ broadcasterId, text, username, color, emoji, photo }) => {
    if (!text?.trim()) return;
    const msg = {
      id:        `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId:    socket.id,
      username:  username ?? 'Anonyme',
      color:     color    ?? '#8b5cf6',
      emoji:     emoji    ?? '🎵',
      photo:     photo    ?? null,
      text:      text.trim().slice(0, 200),
      timestamp: Date.now(),
    };
    io.to(`livechat:${broadcasterId}`).emit('live_chat_message', msg);
  });

  // WebRTC signaling relay
  socket.on('live_offer',     ({ to, offer })     => io.sockets.sockets.get(to)?.emit('live_offer',     { from: socket.id, offer }));
  socket.on('live_answer',    ({ to, answer })    => io.sockets.sockets.get(to)?.emit('live_answer',    { from: socket.id, answer }));
  socket.on('live_ice',       ({ to, candidate }) => io.sockets.sockets.get(to)?.emit('live_ice',       { from: socket.id, candidate }));
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
