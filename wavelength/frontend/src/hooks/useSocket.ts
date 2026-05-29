import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { NearbyUser, Coordinates, Track, UserProfile, ChatStatus, ChatPeer, Rating, PublicLive } from '../types';

export interface RatingCallbacks {
  onRatingReceived?: (from: ChatPeer, vibe: string, note?: string) => void;
  onRatingsData?: (targetId: string, ratings: Rating[]) => void;
}

export interface LiveCallbacks {
  onViewerJoined?:  (viewerId: string) => void;
  onViewerLeft?:    (viewerId: string) => void;
  onLiveOffer?:     (from: string, offer: RTCSessionDescriptionInit) => void;
  onLiveAnswer?:    (from: string, answer: RTCSessionDescriptionInit) => void;
  onLiveIce?:       (from: string, candidate: RTCIceCandidateInit) => void;
  onLiveEnded?:     (broadcasterId: string) => void;
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
  const socketRef   = useRef<Socket | null>(null);
  const chatCbRef   = useRef<ChatCallbacks>({});
  const ratingCbRef = useRef<RatingCallbacks>({});
  const liveCbRef   = useRef<LiveCallbacks>({});
  const [nearbyUsers, setNearbyUsers]   = useState<NearbyUser[]>([]);
  const [publicLives, setPublicLives]   = useState<PublicLive[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect',      () => setConnected(true));
    socket.on('disconnect',   () => setConnected(false));
    socket.on('nearby_users', (users: NearbyUser[]) => setNearbyUsers(users));
    socket.on('public_lives', (lives: PublicLive[]) => setPublicLives(lives));
    socket.on('chat_request',     ({ from }: { from: ChatPeer }) => chatCbRef.current.onChatRequest?.(from));
    socket.on('chat_accepted',    ({ from }: { from: ChatPeer }) => chatCbRef.current.onChatAccepted?.(from));
    socket.on('chat_declined',    ({ from, reason }: { from: ChatPeer; reason?: string }) => chatCbRef.current.onChatDeclined?.(from, reason));
    socket.on('chat_message',     ({ from, text, timestamp }: { from: ChatPeer; text: string; timestamp: number }) => chatCbRef.current.onChatMessage?.(from, text, timestamp));
    socket.on('chat_closed',      ({ fromId }: { fromId: string }) => chatCbRef.current.onChatClosed?.(fromId));
    socket.on('chat_unavailable', ({ to }: { to: string }) => chatCbRef.current.onChatUnavailable?.(to));
    socket.on('rating_received', ({ from, vibe, note }: { from: ChatPeer; vibe: string; note?: string }) =>
      ratingCbRef.current.onRatingReceived?.(from, vibe, note));
    socket.on('ratings_data',  ({ targetId, ratings }: { targetId: string; ratings: Rating[] }) => ratingCbRef.current.onRatingsData?.(targetId, ratings));
    socket.on('viewer_joined', ({ viewerId }: { viewerId: string })                              => liveCbRef.current.onViewerJoined?.(viewerId));
    socket.on('viewer_left',   ({ viewerId }: { viewerId: string })                              => liveCbRef.current.onViewerLeft?.(viewerId));
    socket.on('live_offer',    ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit })   => liveCbRef.current.onLiveOffer?.(from, offer));
    socket.on('live_answer',   ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => liveCbRef.current.onLiveAnswer?.(from, answer));
    socket.on('live_ice',      ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => liveCbRef.current.onLiveIce?.(from, candidate));
    socket.on('live_ended',    ({ broadcasterId }: { broadcasterId: string })                    => liveCbRef.current.onLiveEnded?.(broadcasterId));
    const hb = setInterval(() => socket.emit('heartbeat'), 25000);
    return () => { clearInterval(hb); socket.disconnect(); };
  }, []);

  const registerChatCallbacks   = useCallback((cbs: ChatCallbacks)   => { chatCbRef.current = cbs; },   []);
  const registerRatingCallbacks = useCallback((cbs: RatingCallbacks) => { ratingCbRef.current = cbs; }, []);
  const registerLiveCallbacks   = useCallback((cbs: LiveCallbacks)   => { liveCbRef.current   = cbs; }, []);

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
  const sendRating  = useCallback((targetId: string, vibe: string, note: string, anonymous?: boolean) => socketRef.current?.emit('send_rating', { targetId, vibe, note, anonymous: anonymous ?? false }), []);

  // YouTube Sessions
  const ytCreateSession = useCallback((videoId: string, title: string, videoTitle: string) => socketRef.current?.emit('yt_session_create', { videoId, title, videoTitle }), []);
  const ytEndSession    = useCallback(()                                                   => socketRef.current?.emit('yt_session_end'), []);
  const ytJoinSession   = useCallback((hostId: string)                                    => socketRef.current?.emit('yt_session_join', { hostId }), []);
  const ytLeaveSession  = useCallback((hostId: string)                                    => socketRef.current?.emit('yt_session_leave', { hostId }), []);
  const ytSyncSession   = useCallback((state: string, currentTime: number)                => socketRef.current?.emit('yt_session_sync', { state, currentTime }), []);
  const ytGetSessionId  = useCallback(()                                                   => socketRef.current?.id ?? null, []);
  const getRatings  = useCallback((targetId: string)                              => socketRef.current?.emit('get_ratings', { targetId }), []);

  // Live
  const startLive   = useCallback((title: string, isPublic: boolean)               => socketRef.current?.emit('start_live',   { title, isPublic }), []);
  const updateLive  = useCallback((title: string, isPublic: boolean)               => socketRef.current?.emit('update_live',  { title, isPublic }), []);
  const getPublicLivesReq = useCallback(()                                         => socketRef.current?.emit('get_public_lives'), []);
  const stopLive    = useCallback(()                                                => socketRef.current?.emit('stop_live'), []);
  const joinLive    = useCallback((broadcasterId: string)                           => socketRef.current?.emit('join_live',    { broadcasterId }), []);
  const leaveLive   = useCallback((broadcasterId: string)                           => socketRef.current?.emit('leave_live',   { broadcasterId }), []);
  const sendOffer   = useCallback((to: string, offer: RTCSessionDescriptionInit)   => socketRef.current?.emit('live_offer',   { to, offer }), []);
  const sendAnswer  = useCallback((to: string, answer: RTCSessionDescriptionInit)  => socketRef.current?.emit('live_answer',  { to, answer }), []);
  const sendIce     = useCallback((to: string, candidate: RTCIceCandidateInit)     => socketRef.current?.emit('live_ice',     { to, candidate }), []);

  // YouTube session state listeners
  const onYTSessionState  = useCallback((cb: (d: { hostId: string; videoId: string; state: string; currentTime: number }) => void) => {
    socketRef.current?.on('yt_session_state', cb);
    return () => { socketRef.current?.off('yt_session_state', cb); };
  }, []);
  const onYTSessionEnded  = useCallback((cb: (d: { hostId: string }) => void) => {
    socketRef.current?.on('yt_session_ended', cb);
    return () => { socketRef.current?.off('yt_session_ended', cb); };
  }, []);

  return {
    nearbyUsers, publicLives, connected,
    join, updatePosition, updateTrack, updateRadius, updateChatStatus, updateProfile,
    registerChatCallbacks, registerRatingCallbacks, registerLiveCallbacks,
    sendChatRequest, acceptChat, declineChat, sendMessage, closeChat,
    sendRating, getRatings,
    startLive, updateLive, stopLive, joinLive, leaveLive, sendOffer, sendAnswer, sendIce,
    getPublicLivesReq,
    ytCreateSession, ytEndSession, ytJoinSession, ytLeaveSession, ytSyncSession, ytGetSessionId,
    onYTSessionState, onYTSessionEnded,
  };
}
