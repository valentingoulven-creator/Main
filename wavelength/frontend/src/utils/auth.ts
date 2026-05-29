const ACCOUNTS_KEY = 'melo_accounts';
const SESSION_KEY  = 'melo_session';

export interface Account {
  uid: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: number;
  emailVerified: boolean;
  verifyCode?: string;
}

export const VERIFY_KEY = 'melo_email_verify';

export interface Session {
  uid: string;
  email: string;
  username: string;
  emailVerified: boolean;
}

// ─── Simple hash (SHA-256 via Web Crypto) ────────────────────────────────────

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateUid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Account store ────────────────────────────────────────────────────────────

function loadAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]'); } catch { return []; }
}

function saveAccounts(accounts: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function register(email: string, username: string, password: string): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const accounts = loadAccounts();
  const emailLower = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return { ok: false, error: 'Adresse email invalide.' };
  if (accounts.find(a => a.email === emailLower)) return { ok: false, error: 'Cette adresse email est déjà utilisée.' };
  if (username.trim().length < 2) return { ok: false, error: 'Pseudo trop court (min. 2 caractères).' };
  if (password.length < 6) return { ok: false, error: 'Mot de passe trop court (min. 6 caractères).' };

  const uid        = generateUid();
  const hash       = await hashPassword(password, uid);
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const account: Account = { uid, email: emailLower, username: username.trim(), passwordHash: hash, createdAt: Date.now(), emailVerified: false, verifyCode };
  saveAccounts([...accounts, account]);

  const session: Session = { uid, email: emailLower, username: username.trim(), emailVerified: false };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Store code for in-app verification
  localStorage.setItem(VERIFY_KEY, JSON.stringify({ uid, code: verifyCode }));
  return { ok: true, session };
}

export async function login(email: string, password: string): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const accounts = loadAccounts();
  const emailLower = email.trim().toLowerCase();
  const account = accounts.find(a => a.email === emailLower);

  if (!account) return { ok: false, error: 'Aucun compte trouvé avec cette adresse.' };
  const hash = await hashPassword(password, account.uid);
  if (hash !== account.passwordHash) return { ok: false, error: 'Mot de passe incorrect.' };

  const session: Session = { uid: account.uid, email: account.email, username: account.username, emailVerified: account.emailVerified };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export function loadSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null'); } catch { return null; }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateUsername(uid: string, username: string) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx >= 0) { accounts[idx].username = username; saveAccounts(accounts); }
}

export function getVerifyCode(): { uid: string; code: string } | null {
  try { return JSON.parse(localStorage.getItem(VERIFY_KEY) ?? 'null'); } catch { return null; }
}

export function verifyEmail(code: string): boolean {
  const stored = getVerifyCode();
  if (!stored) return false;
  if (stored.code !== code.trim()) return false;

  const accounts = loadAccounts();
  const idx = accounts.findIndex(a => a.uid === stored.uid);
  if (idx < 0) return false;
  accounts[idx].emailVerified = true;
  saveAccounts(accounts);
  localStorage.removeItem(VERIFY_KEY);

  // Update session
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    if (s) { s.emailVerified = true; localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  } catch {}
  return true;
}

export function isEmailVerified(uid: string): boolean {
  const accounts = loadAccounts();
  return accounts.find(a => a.uid === uid)?.emailVerified ?? false;
}
