import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { ActivityLogView } from '../types/api';

const PAGE_SIZE = 10;

interface ActivityPage {
  activities: ActivityLogView[];
  total: number;
}

export function useActivity(activityType?: string) {
  const { vaultPubkey } = useVault();
  const [offset, setOffset] = useState(0);

  const query = useQuery<ActivityPage, Error>({
    queryKey: ['vault', 'activity', vaultPubkey, offset, activityType],
    queryFn: () =>
      api.get<ActivityPage>(
        `/vaults/${vaultPubkey}/activity?limit=${PAGE_SIZE}&offset=${offset}${
          activityType ? `&type=${activityType}` : ''
        }`
      ),
    enabled: !!vaultPubkey,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const activities = query.data?.activities ?? [];
  const total = query.data?.total ?? 0;
  const hasMore = offset + PAGE_SIZE < total;

  const loadMore = useCallback(() => {
    if (hasMore) setOffset((o) => o + PAGE_SIZE);
  }, [hasMore]);

  const loadPrev = useCallback(() => {
    setOffset((o) => Math.max(0, o - PAGE_SIZE));
  }, []);

  const reset = useCallback(() => setOffset(0), []);

  return {
    activities,
    data: activities, // For PanelRenderer
    total,
    hasMore,
    offset,
    loadMore,
    loadPrev,
    reset,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

// Alias for Build 7 wiring
export const useActivityLog = useActivity;
