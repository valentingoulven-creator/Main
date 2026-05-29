import { useState, useCallback } from 'react';
import type { NearbyUser, PublicLive } from '../../types';
import type { LiveVisibility } from '../../components/LiveSetupModal';

export function useLiveState() {
  const [showLiveSetup, setShowLiveSetup]   = useState(false);
  const [showLiveBroadcast, setShowLiveBroadcast] = useState(false);
  const [liveSetupData, setLiveSetupData]   = useState<{ title: string; visibility: LiveVisibility } | null>(null);
  const [watchingLive, setWatchingLive]     = useState<NearbyUser | PublicLive | null>(null);
  const [amLive, setAmLive]               = useState(false);
  const [liveViewers, setLiveViewers]     = useState(0);

  const openLiveSetup  = useCallback(() => setShowLiveSetup(true),  []);
  const openBroadcast  = useCallback(() => setShowLiveBroadcast(true), []);
  const closeBroadcast = useCallback(() => setShowLiveBroadcast(false), []);

  const startLive = useCallback((title: string, visibility: LiveVisibility, socketStart: (t: string, pub: boolean) => void) => {
    setLiveSetupData({ title, visibility });
    setShowLiveSetup(false);
    setShowLiveBroadcast(true);
    socketStart(title, visibility === 'public');
    setAmLive(true);
  }, []);

  const stopLive = useCallback((socketStop: () => void) => {
    socketStop();
    setAmLive(false);
    setLiveViewers(0);
    setShowLiveBroadcast(false);
  }, []);

  const addViewer    = useCallback(() => setLiveViewers(v => v + 1), []);
  const removeViewer = useCallback(() => setLiveViewers(v => Math.max(0, v - 1)), []);

  return {
    showLiveSetup, setShowLiveSetup, openLiveSetup,
    showLiveBroadcast, setShowLiveBroadcast, openBroadcast, closeBroadcast,
    liveSetupData,
    watchingLive, setWatchingLive,
    amLive, liveViewers,
    startLive, stopLive, addViewer, removeViewer,
  };
}
