import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { NearbyUser, Coordinates, Track, UserProfile, ChatStatus, ChatPeer, Rating } from '../types';

export interface RatingCallbacks {
  onRatingReceived?: (from: ChatPeer, vibe: string, note?: string) => void;
  onRatingsData?: (targetId: string, ratings: Rating[]) => void;
}

export interface ChatCallbacks {
  onChatRequest?: (from: ChatPeer) => void;
  onChatAccepted?: (from: ChatPeer) => void;
  onChatDeclined?: (from: ChatPeer, reason?: string) => void;
  onChatMessage?: (from: ChatPeer, text: string, timestamp: number) => void;
  onChatClosed?: (fromId: string) => void;
  onChatUnavailable?: (toId: string) => void;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const chatCbRef = useRef<ChatCallbacks>({});
  const ratingCbRef = useRef<RatingCallbacks>({});
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect',      () => setConnected(true));
    socket.on('disconnect',   () => setConnected(false));
    socket.on('nearby_users', (users: NearbyUser[]) => setNearbyUsers(users));
    socket.on('chat_request',     ({ from }: { from: ChatPeer }) => chatCbRef.current.onChatRequest?.(from));
    socket.on('chat_accepted',    ({ from }: { from: ChatPeer }) => chatCbRef.current.onChatAccepted?.(from));
    socket.on('chat_declined',    ({ from, reason }: { from: ChatPeer; reason?: string }) => chatCbRef.current.onChatDeclined?.(from, reason));
    socket.on('chat_message',     ({ from, text, timestamp }: { from: ChatPeer; text: string; timestamp: number }) => chatCbRef.current.onChatMessage?.(from, text, timestamp));
    socket.on('chat_closed',      ({ fromId }: { fromId: string }) => chatCbRef.current.onChatClosed?.(fromId));
    socket.on('chat_unavailable', ({ to }: { to: string }) => chatCbRef.current.onChatUnavailable?.(to));
    socket.on('rating_received', ({ from, vibe, note }: { from: ChatPeer; vibe: string; note?: string }) =>
      ratingCbRef.current.onRatingReceived?.(from, vibe, note));
    socket.on('ratings_data', ({ targetId, ratings }: { targetId: string; ratings: Rating[] }) =>
      ratingCbRef.current.onRatingsData?.(targetId, ratings));
    const hb = setInterval(() => socket.emit('heartbeat'), 25000);
    return () => { clearInterval(hb); socket.disconnect(); };
  }, []);

  const registerChatCallbacks   = useCallback((cbs: ChatCallbacks)   => { chatCbRef.current = cbs; },   []);
  const registerRatingCallbacks = useCallback((cbs: RatingCallbacks) => { ratingCbRef.current = cbs; }, []);

  // Presence
  const join = useCallback((profile: UserProfile, position: Coordinates | null, track: Track | null, radius: number, chatStatus: ChatStatus) => {
    socketRef.current?.emit('join', { ...profile, position, track, radius, chatStatus });
  }, []);
  const updatePosition   = useCallback((position: Coordinates)       => socketRef.current?.emit('update_position',    { position }),   []);
  const updateTrack      = useCallback((track: Track | null)          => socketRef.current?.emit('update_track',       { track }),      []);
  const updateRadius     = useCallback((radius: number)               => socketRef.current?.emit('update_radius',      { radius }),     []);
  const updateChatStatus = useCallback((status: ChatStatus)           => socketRef.current?.emit('update_chat_status', { status }),     []);
  const updateProfile    = useCallback((data: Partial<UserProfile> & { jamUrl?: string }) => socketRef.current?.emit('update_profile', data), []);

  // Chat
  const sendChatRequest = useCallback((to: string)              => socketRef.current?.emit('chat_request', { to }),               []);
  const acceptChat      = useCallback((to: string)              => socketRef.current?.emit('chat_accept',  { to }),               []);
  const declineChat     = useCallback((to: string)              => socketRef.current?.emit('chat_decline', { to }),               []);
  const sendMessage     = useCallback((to: string, text: string)=> socketRef.current?.emit('chat_message', { to, text }),         []);
  const closeChat       = useCallback((to: string)              => socketRef.current?.emit('chat_close',   { to }),               []);

  // Ratings
  const sendRating  = useCallback((targetId: string, vibe: string, note: string) =>
    socketRef.current?.emit('send_rating', { targetId, vibe, note }), []);
  const getRatings  = useCallback((targetId: string) =>
    socketRef.current?.emit('get_ratings', { targetId }), []);

  return {
    nearbyUsers, connected,
    join, updatePosition, updateTrack, updateRadius, updateChatStatus, updateProfile,
    registerChatCallbacks, registerRatingCallbacks,
    sendChatRequest, acceptChat, declineChat, sendMessage, closeChat,
    sendRating, getRatings,
  };
}
