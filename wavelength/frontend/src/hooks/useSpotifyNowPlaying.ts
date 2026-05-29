import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentlyPlaying, isConnected, refreshToken } from '../utils/spotifyAuth';
import type { SpotifyTrack } from '../utils/spotifyAuth';

export function useSpotifyNowPlaying(enabled: boolean, onTrackChange?: (track: SpotifyTrack | null) => void) {
  const [track, setTrack]     = useState<SpotifyTrack | null>(null);
  const [loading, setLoading] = useState(false);
  const lastTrackId = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (!isConnected()) {
      const ok = await refreshToken();
      if (!ok) return;
    }
    const current = await getCurrentlyPlaying();
    setTrack(current);

    // Only trigger callback when track changes
    const newId = current ? `${current.title}-${current.artist}` : null;
    if (newId !== lastTrackId.current) {
      lastTrackId.current = newId;
      onTrackChange?.(current);
    }
  }, [onTrackChange]);

  useEffect(() => {
    if (!enabled) { setTrack(null); return; }
    setLoading(true);
    poll().finally(() => setLoading(false));
    intervalRef.current = setInterval(poll, 10000); // poll every 10s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enabled, poll]);

  return { track, loading, refresh: poll };
}
