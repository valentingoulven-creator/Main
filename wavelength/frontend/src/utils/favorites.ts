export interface FavoriteUser {
  id: string;
  username: string;
  color: string;
  emoji: string;
  photo?: string;
  bio?: string;
  savedAt: number;
}

const KEY = 'melo_favorites';

export function loadFavorites(): FavoriteUser[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
function save(list: FavoriteUser[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

export function addFavorite(user: FavoriteUser) {
  const list = loadFavorites().filter(f => f.id !== user.id);
  save([{ ...user, savedAt: Date.now() }, ...list]);
}
export function removeFavorite(id: string) {
  save(loadFavorites().filter(f => f.id !== id));
}
export function isFavorite(id: string): boolean {
  return loadFavorites().some(f => f.id === id);
}
