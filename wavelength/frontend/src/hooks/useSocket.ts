import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { NearbyUser, Coordinates, Track, UserProfile } from '../types';

export function useSocket() {
  const ref = useRef<Socket | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
    ref.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('nearby_users', (users: NearbyUser[]) => setNearbyUsers(users));
    const hb = setInterval(() => socket.emit('heartbeat'), 25000);
    return () => { clearInterval(hb); socket.disconnect(); };
  }, []);

  const join = useCallback((profile: UserProfile, position: Coordinates | null, track: Track | null, radius: number) => {
    ref.current?.emit('join', { ...profile, position, track, radius });
  }, []);

  const updatePosition = useCallback((position: Coordinates) => {
    ref.current?.emit('update_position', { position });
  }, []);

  const updateTrack = useCallback((track: Track | null) => {
    ref.current?.emit('update_track', { track });
  }, []);

  const updateRadius = useCallback((radius: number) => {
    ref.current?.emit('update_radius', { radius });
  }, []);

  return { nearbyUsers, connected, join, updatePosition, updateTrack, updateRadius };
}
