import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { VaultSummaryResponse } from '../types/api';

export function useVaultSummary(options: { enabled?: boolean } = {}) {
  const { vaultPubkey } = useVault();

  const query = useQuery<VaultSummaryResponse, Error>({
    queryKey: ['vault', 'summary', vaultPubkey],
    queryFn: () => api.get<VaultSummaryResponse>(`/vaults/${vaultPubkey}/summary`),
    enabled: options.enabled !== false && !!vaultPubkey,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  return {
    summary: query.data ?? null,
    status:               query.data?.status             ?? 'locked',
    ownerPubkey:          query.data?.ownerPubkey        ?? null,
    createdAt:            query.data?.createdAt          ?? null,
    lastCheckIn:          query.data?.lastCheckIn        ?? null,
    timelockStart:        query.data?.timelockStart      ?? null,
    inactivityThreshold:  query.data?.inactivityThreshold ?? 0,
    timelockDuration:     query.data?.timelockDuration   ?? 0,
    guardianThreshold:    query.data?.guardianThreshold  ?? 0,
    totalGuardians:       query.data?.totalGuardians     ?? 0,
    totalBeneficiaries:   query.data?.totalBeneficiaries ?? 0,
    totalBps:             query.data?.totalBps           ?? 0,
    subscriptionTier:     query.data?.subscriptionTier   ?? 'free',
    subscriptionExpiry:   query.data?.subscriptionExpiry ?? null,
    daysSinceCheckIn:     query.data?.daysSinceCheckIn   ?? 0,
    daysRemaining:        query.data?.daysRemaining      ?? 0,
    checkInHealth:        query.data?.checkInHealth      ?? 'healthy',
    approvedGuardians:    query.data?.approvedGuardians  ?? 0,
    totalUsdValue:        query.data?.totalUsdValue      ?? 0,
    unlockSession:        query.data?.unlockSession      ?? null,
    vaultAddress:         query.data?.pubkey             ?? null,
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    isSuccess:  query.isSuccess,
    error:      query.error,
    refetch:    query.refetch,
    data:       query.data,
  };
}
