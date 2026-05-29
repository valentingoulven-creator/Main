import { useState, useCallback, useEffect } from 'react';
import type { NearbyUser, Rating } from '../../types';
import type { RatingCallbacks } from '../useSocket';

export function useRatings(registerCallbacks: (cbs: RatingCallbacks) => void) {
  const [ratingsCache, setRatingsCache] = useState<Record<string, Rating[]>>({});
  const [myRatings, setMyRatings]       = useState<Record<string, string>>({}); // targetId → vibe
  const [ratingTarget, setRatingTarget] = useState<NearbyUser | null>(null);

  useEffect(() => {
    registerCallbacks({
      onRatingsData: (targetId, ratings) => {
        setRatingsCache(prev => ({ ...prev, [targetId]: ratings }));
      },
    });
  }, [registerCallbacks]);

  const openProfile = useCallback((user: NearbyUser, fetchRatings: (id: string) => void) => {
    fetchRatings(user.id);
  }, []);

  const sendRating = useCallback((
    vibe: string, note: string, anonymous: boolean,
    socketSend: (id: string, vibe: string, note: string, anon?: boolean) => void
  ) => {
    if (!ratingTarget) return;
    socketSend(ratingTarget.id, vibe, note, anonymous);
    setMyRatings(prev => ({ ...prev, [ratingTarget.id]: vibe }));
  }, [ratingTarget]);

  return {
    ratingsCache, myRatings,
    ratingTarget, setRatingTarget,
    openProfile, sendRating,
  };
}
