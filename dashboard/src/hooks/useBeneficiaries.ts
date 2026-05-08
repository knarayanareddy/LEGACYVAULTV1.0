import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateBeneficiariesCache } from '../config/queryClient';
import { BeneficiaryView } from '../types/api';

export type AssetRuleMode = 'pro-rata' | 'fixed-bps' | 'entire-to-beneficiary';

export function useBeneficiaries() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const query = useQuery<BeneficiaryView[], Error>({
    queryKey: ['vault', 'beneficiaries', vaultPubkey],
    queryFn: () =>
      api.get<BeneficiaryView[]>(`/vaults/${vaultPubkey}/beneficiaries`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const beneficiaries = query.data ?? [];
  const activeBeneficiaries = beneficiaries.filter((b) => b.active);
  const allocatedBps = activeBeneficiaries.reduce((acc, b) => acc + b.shareBps, 0);
  const remainingBps = 10_000 - allocatedBps;
  const planIsValid = allocatedBps === 10_000 && activeBeneficiaries.length > 0;

  const addBeneficiary = useCallback(
    async (beneficiaryWallet: string, shareBps: number, active: boolean = true) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('add-beneficiary', { vault: vaultPubkey, beneficiaryWallet, shareBps, active });
      invalidateBeneficiariesCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const updateBeneficiary = useCallback(
    async (beneficiaryWallet: string, updates: { shareBps?: number; active?: boolean }) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('update-beneficiary', {
        vault: vaultPubkey,
        beneficiaryWallet,
        ...updates,
      });
      invalidateBeneficiariesCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const removeBeneficiary = useCallback(
    async (beneficiaryWallet: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('remove-beneficiary', { vault: vaultPubkey, beneficiaryWallet });
      invalidateBeneficiariesCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const setAssetRule = useCallback(
    async (params: {
      beneficiaryWallet: string,
      mint: string,
      mode: AssetRuleMode,
      fixedBps?: number
    }) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('set-asset-rule', {
        vault: vaultPubkey,
        ...params,
      });
      qc.invalidateQueries({ queryKey: ['vault', 'beneficiaries', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const clearAssetRule = useCallback(
    async (beneficiaryWallet: string, mint: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('clear-asset-rule', { vault: vaultPubkey, beneficiaryWallet, mint });
      qc.invalidateQueries({ queryKey: ['vault', 'beneficiaries', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    beneficiaries,
    data: beneficiaries, // For PanelRenderer
    activeBeneficiaries,
    allocatedBps,
    remainingBps,
    planIsValid,
    addBeneficiary,
    updateBeneficiary,
    removeBeneficiary,
    setAssetRule,
    clearAssetRule,
    isActing,
    txStatus: tx.status,
    txWarnings: tx.warnings,
    txSignature: tx.signature,
    txError: tx.error,
    resetTx: tx.reset,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
