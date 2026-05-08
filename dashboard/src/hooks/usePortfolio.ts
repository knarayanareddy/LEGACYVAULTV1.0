import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import {
  PortfolioSummaryResponse,
  PortfolioSnapshotView,
  AssetDistributionSlice,
} from '../types/api';

export type PortfolioRange = '30d' | '90d' | '1y';

export function usePortfolio() {
  const { vaultPubkey } = useVault();
  const [historyRange, setHistoryRange] = useState<PortfolioRange>('30d');

  const summaryQuery = useQuery<PortfolioSummaryResponse, Error>({
    queryKey: ['vault', 'portfolio', 'summary', vaultPubkey],
    queryFn: () =>
      api.get<PortfolioSummaryResponse>(`/vaults/${vaultPubkey}/portfolio/summary`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const historyQuery = useQuery<PortfolioSnapshotView[], Error>({
    queryKey: ['vault', 'portfolio', 'history', vaultPubkey, historyRange],
    queryFn: () =>
      api.get<PortfolioSnapshotView[]>(
        `/vaults/${vaultPubkey}/portfolio/history?range=${historyRange}`
      ),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const distributionQuery = useQuery<AssetDistributionSlice[], Error>({
    queryKey: ['vault', 'portfolio', 'distribution', vaultPubkey],
    queryFn: () =>
      api.get<AssetDistributionSlice[]>(
        `/vaults/${vaultPubkey}/portfolio/distribution`
      ),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  return {
    totalUsdValue: summaryQuery.data?.totalUsdValue ?? 0,
    breakdown: summaryQuery.data?.breakdown ?? { sol: 0, spl: 0, nft: 0, position: 0 },
    historyData: historyQuery.data ?? [],
    data: historyQuery.data ?? [], // For backward compat with PanelRenderer
    historyRange,
    setHistoryRange,
    distributionData: distributionQuery.data ?? [],
    isLoading:
      summaryQuery.isLoading || historyQuery.isLoading || distributionQuery.isLoading,
    isSummaryFetching: summaryQuery.isFetching,
    isHistoryFetching: historyQuery.isFetching,
    isDistributionFetching: distributionQuery.isFetching,
    error: summaryQuery.error ?? historyQuery.error ?? distributionQuery.error,
  };
}

// Alias for Build 7 wiring
export const usePortfolioHistory = usePortfolio;
