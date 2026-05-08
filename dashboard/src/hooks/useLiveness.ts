import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateVaultCache } from '../config/queryClient';
import { LivenessSummaryResponse, LivenessRecord } from '../types/api';

export type LivenessRange = '30d' | '90d' | '1y';

export function useLiveness() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();
  const [historyRange, setHistoryRange] = useState<LivenessRange>('30d');

  const summaryQuery = useQuery<LivenessSummaryResponse, Error>({
    queryKey: ['vault', 'liveness', 'summary', vaultPubkey],
    queryFn: () =>
      api.get<LivenessSummaryResponse>(`/vaults/${vaultPubkey}/liveness/summary`),
    enabled: !!vaultPubkey,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const historyQuery = useQuery<LivenessRecord[], Error>({
    queryKey: ['vault', 'liveness', 'history', vaultPubkey, historyRange],
    queryFn: () =>
      api.get<LivenessRecord[]>(
        `/vaults/${vaultPubkey}/liveness/history?range=${historyRange}`
      ),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const checkIn = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');

    const sig = await tx.execute('check-in', { vault: vaultPubkey });

    qc.invalidateQueries({ queryKey: ['vault', 'liveness', 'summary', vaultPubkey] });
    qc.invalidateQueries({ queryKey: ['vault', 'liveness', 'history', vaultPubkey] });
    invalidateVaultCache(vaultPubkey);

    return sig;
  }, [vaultPubkey, tx, qc]);

  return {
    lastCheckIn:            summaryQuery.data?.lastCheckIn          ?? null,
    daysSinceCheckIn:       summaryQuery.data?.daysSinceCheckIn     ?? 0,
    daysRemaining:          summaryQuery.data?.daysRemaining        ?? 0,
    checkInHealth:          summaryQuery.data?.checkInHealth        ?? 'healthy',
    inactivityThresholdDays: summaryQuery.data?.inactivityThresholdDays ?? 0,
    delegates:              summaryQuery.data?.delegates            ?? [],
    historyRecords: historyQuery.data ?? [],
    data: summaryQuery.data, // For PanelRenderer
    historyRange,
    setHistoryRange,
    checkIn,
    isCheckingIn: tx.status === 'building' ||
                  tx.status === 'awaiting_signature' ||
                  tx.status === 'sending' ||
                  tx.status === 'confirming',
    txStatus: tx.status,
    txError:  tx.error,
    isLoading:  summaryQuery.isLoading,
    isFetching: summaryQuery.isFetching,
    error:      summaryQuery.error,
    refetch:    summaryQuery.refetch,
  };
}
