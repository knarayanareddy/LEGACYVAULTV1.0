import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { VaultAssetView } from '../types/api';

export type AssetFilter = 'all' | 'SOL' | 'SPL' | 'NFT' | 'POSITION';

export function useAssets() {
  const { vaultPubkey } = useVault();
  const [filter, setFilter] = useState<AssetFilter>('all');

  const query = useQuery<VaultAssetView[], Error>({
    queryKey: ['vault', 'assets', vaultPubkey, filter],
    queryFn: () =>
      api.get<VaultAssetView[]>(
        `/vaults/${vaultPubkey}/assets?filter=${filter}`
      ),
    enabled: !!vaultPubkey,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const assets = query.data ?? [];
  const totalUsdValue = assets.reduce((acc, a) => acc + a.usdValue, 0);
  const solAsset = assets.find((a) => a.type === 'SOL') ?? null;
  const splAssets = assets.filter((a) => a.type === 'SPL');
  const nftAssets = assets.filter((a) => a.type === 'NFT');
  const positionAssets = assets.filter((a) => a.type === 'POSITION');

  return {
    assets,
    data: assets,
    filter,
    setFilter,
    totalUsdValue,
    solAsset,
    splAssets,
    nftAssets,
    positionAssets,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
