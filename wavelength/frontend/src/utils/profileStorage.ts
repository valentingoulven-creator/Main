import type { UserProfile } from '../types';

const PROFILE_KEY    = 'melo_profile';
const JAM_KEY        = 'melo_jam_url';
const CHAT_STATUS_KEY = 'melo_chat_status';
const BLOCKED_KEY    = 'melo_blocked_users';
const REFERRAL_KEY   = 'melo_referral_code';

// ─── Profile ─────────────────────────────────────────────────────────────────

export function saveProfile(p: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function loadProfile(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null'); } catch { return null; }
}

export function saveJamUrl(url: string) {
  localStorage.setItem(JAM_KEY, url);
}

export function loadJamUrl(): string {
  return localStorage.getItem(JAM_KEY) ?? '';
}

export function saveChatStatus(s: string) {
  localStorage.setItem(CHAT_STATUS_KEY, s);
}

export function loadChatStatus(): string {
  return localStorage.getItem(CHAT_STATUS_KEY) ?? 'available';
}

// ─── Blocked users ────────────────────────────────────────────────────────────

export interface BlockedUser {
  id: string;
  username: string;
  color: string;
  emoji: string;
  blockedAt: number;
}

export function loadBlocked(): BlockedUser[] {
  try { return JSON.parse(localStorage.getItem(BLOCKED_KEY) ?? '[]'); } catch { return []; }
}

export function blockUser(user: BlockedUser) {
  const list = loadBlocked().filter(b => b.id !== user.id);
  localStorage.setItem(BLOCKED_KEY, JSON.stringify([user, ...list]));
}

export function unblockUser(id: string) {
  const list = loadBlocked().filter(b => b.id !== id);
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(list));
}

export function isBlocked(id: string): boolean {
  return loadBlocked().some(b => b.id === id);
}

// ─── Referral code ────────────────────────────────────────────────────────────

export function getReferralCode(uid: string): string {
  const stored = localStorage.getItem(REFERRAL_KEY);
  if (stored) return stored;
  const code = `MELO-${uid.toUpperCase().slice(0, 6)}`;
  localStorage.setItem(REFERRAL_KEY, code);
  return code;
}

// ─── Full reset ───────────────────────────────────────────────────────────────

export function clearAllData() {
  [PROFILE_KEY, JAM_KEY, CHAT_STATUS_KEY, BLOCKED_KEY, REFERRAL_KEY].forEach(k => localStorage.removeItem(k));
}
