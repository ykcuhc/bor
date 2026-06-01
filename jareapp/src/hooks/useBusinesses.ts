'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Business } from '@/lib/types';

export function useBusinesses(
  neighborhoodId: string,
  governorateId:  string,
  options: { category?: string; search?: string } = {},
  isDemoMode = false
) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isDemoMode) { setLoading(false); return; }
    setLoading(true);

    const params = new URLSearchParams({
      neighborhoodId,
      governorateId,
      ...(options.category && options.category !== 'all' ? { category: options.category } : {}),
      ...(options.search ? { search: options.search } : {}),
    });

    try {
      const res  = await fetch(`/api/businesses?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setBusinesses(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [neighborhoodId, governorateId, options.category, options.search, isDemoMode]);

  useEffect(() => { load(); }, [load]);

  return { businesses, loading, error, reload: load };
}
