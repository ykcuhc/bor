'use client';

import { useState, useEffect } from 'react';
import { DUMMY_USERS, DUMMY_BUSINESSES } from '@/lib/data/dummy-data';
import { IS_DEMO } from '@/lib/constants';

interface NeighborhoodStats {
  member_count:   number;
  business_count: number;
}

export function useNeighborhoodStats(neighborhoodId: string): NeighborhoodStats {
  const [stats, setStats] = useState<NeighborhoodStats>({
    member_count:   IS_DEMO ? DUMMY_USERS.filter(u => u.neighborhood_id === neighborhoodId).length || DUMMY_USERS.length : 0,
    business_count: IS_DEMO ? DUMMY_BUSINESSES.filter(b => b.neighborhood_id === neighborhoodId).length || DUMMY_BUSINESSES.length : 0,
  });

  useEffect(() => {
    if (IS_DEMO || !neighborhoodId) return;
    fetch(`/api/neighborhood/stats?neighborhoodId=${neighborhoodId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => null);
  }, [neighborhoodId]);

  return stats;
}
