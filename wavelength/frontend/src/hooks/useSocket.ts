import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { NearbyUser, Coordinates, Track, UserProfile, ChatStatus, ChatPeer } from '../types';

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
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('nearby_users', (users: NearbyUser[]) => setNearbyUsers(users));

    // Chat events — delegate to registered callbacks
    socket.on('chat_request',     ({ from }: { from: ChatPeer }) => chatCbRef.current.onChatRequest?.(from));
    socket.on('chat_accepted',    ({ from }: { from: ChatPeer }) => chatCbRef.current.onChatAccepted?.(from));
    socket.on('chat_declined',    ({ from, reason }: { from: ChatPeer; reason?: string }) => chatCbRef.current.onChatDeclined?.(from, reason));
    socket.on('chat_message',     ({ from, text, timestamp }: { from: ChatPeer; text: string; timestamp: number }) => chatCbRef.current.onChatMessage?.(from, text, timestamp));
    socket.on('chat_closed',      ({ fromId }: { fromId: string }) => chatCbRef.current.onChatClosed?.(fromId));
    socket.on('chat_unavailable', ({ to }: { to: string }) => chatCbRef.current.onChatUnavailable?.(to));

    const hb = setInterval(() => socket.emit('heartbeat'), 25000);
    return () => { clearInterval(hb); socket.disconnect(); };
  }, []);

  // Register chat callbacks (updated each render without re-subscribing)
  const registerChatCallbacks = useCallback((cbs: ChatCallbacks) => {
    chatCbRef.current = cbs;
  }, []);

  // Presence
  const join = useCallback((profile: UserProfile, position: Coordinates | null, track: Track | null, radius: number, chatStatus: ChatStatus) => {
    socketRef.current?.emit('join', { ...profile, position, track, radius, chatStatus });
  }, []);
  const updatePosition   = useCallback((position: Coordinates)  => socketRef.current?.emit('update_position',   { position }), []);
  const updateTrack      = useCallback((track: Track | null)     => socketRef.current?.emit('update_track',      { track }), []);
  const updateRadius     = useCallback((radius: number)          => socketRef.current?.emit('update_radius',     { radius }), []);
  const updateChatStatus = useCallback((status: ChatStatus)      => socketRef.current?.emit('update_chat_status',{ status }), []);

  // Chat
  const sendChatRequest = useCallback((to: string) => socketRef.current?.emit('chat_request', { to }), []);
  const acceptChat      = useCallback((to: string) => socketRef.current?.emit('chat_accept',  { to }), []);
  const declineChat     = useCallback((to: string) => socketRef.current?.emit('chat_decline', { to }), []);
  const sendMessage     = useCallback((to: string, text: string) => socketRef.current?.emit('chat_message', { to, text }), []);
  const closeChat       = useCallback((to: string) => socketRef.current?.emit('chat_close',   { to }), []);

  return {
    nearbyUsers, connected,
    join, updatePosition, updateTrack, updateRadius, updateChatStatus,
    registerChatCallbacks,
    sendChatRequest, acceptChat, declineChat, sendMessage, closeChat,
  };
}
