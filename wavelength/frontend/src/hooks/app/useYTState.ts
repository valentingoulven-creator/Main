import { useState, useRef, useCallback } from 'react';
import type { NearbyUser, YTSession } from '../../types';

export function useYTState() {
  const [showYTSetup, setShowYTSetup]   = useState(false);
  const [myYTSession, setMyYTSession]   = useState<YTSession | null>(null);
  const [joiningYT, setJoiningYT]       = useState<{ host: NearbyUser; session: YTSession } | null>(null);
  const ytStateCbRef = useRef<((state: 'playing' | 'paused', t: number, ts: number) => void) | null>(null);
  const ytEndedCbRef = useRef<((hostId: string) => void) | null>(null);

  const createSession = useCallback((
    videoId: string, title: string, videoTitle: string,
    socketCreate: (id: string, t: string, vt: string) => void
  ) => {
    socketCreate(videoId, title, videoTitle);
    setMyYTSession({ videoId, title, videoTitle, participants: 0, state: 'paused', currentTime: 0, startedAt: Date.now() });
    setShowYTSetup(false);
  }, []);

  const endSession = useCallback((socketEnd: () => void) => {
    socketEnd();
    setMyYTSession(null);
  }, []);

  const joinSession = useCallback((
    user: NearbyUser,
    socketJoin: (id: string) => void
  ) => {
    if (!user.ytSession) return;
    socketJoin(user.id);
    setJoiningYT({ host: user, session: user.ytSession });
  }, []);

  const leaveSession = useCallback((socketLeave: (id: string) => void) => {
    if (!joiningYT) return;
    socketLeave(joiningYT.host.id);
    setJoiningYT(null);
  }, [joiningYT]);

  const onStateUpdate = useCallback((cb: (state: 'playing' | 'paused', t: number, ts: number) => void) => {
    ytStateCbRef.current = cb;
    return () => { ytStateCbRef.current = null; };
  }, []);

  const onSessionEnded = useCallback((cb: (hostId: string) => void) => {
    ytEndedCbRef.current = cb;
    return () => { ytEndedCbRef.current = null; };
  }, []);

  const dispatchStateUpdate = useCallback((state: string, currentTime: number, ts: number) => {
    ytStateCbRef.current?.(state as 'playing' | 'paused', currentTime, ts);
  }, []);

  const dispatchSessionEnded = useCallback((hostId: string) => {
    ytEndedCbRef.current?.(hostId);
    if (joiningYT?.host.id === hostId) setJoiningYT(null);
  }, [joiningYT]);

  return {
    showYTSetup, setShowYTSetup,
    myYTSession,
    joiningYT,
    createSession, endSession, joinSession, leaveSession,
    onStateUpdate, onSessionEnded,
    dispatchStateUpdate, dispatchSessionEnded,
  };
}
