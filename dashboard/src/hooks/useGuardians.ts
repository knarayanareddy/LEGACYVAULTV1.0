import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateGuardiansCache } from '../config/queryClient';
import { GuardianView } from '../types/api';

export type GuardianRole = 'personal' | 'professional' | 'delegate';

export function useGuardians() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const query = useQuery<GuardianView[], Error>({
    queryKey: ['vault', 'guardians', vaultPubkey],
    queryFn: () =>
      api.get<GuardianView[]>(`/vaults/${vaultPubkey}/guardians`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const guardians = query.data ?? [];
  const approvedCount = guardians.filter((g) => g.approved).length;
  const activeCount = guardians.filter((g) => g.status === 'active').length;
  const approvedGuardians = guardians.filter((g) => g.approved);

  const addGuardian = useCallback(
    async (guardianWallet: string, role: GuardianRole) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('add-guardian', { vault: vaultPubkey, guardianWallet, role });
      invalidateGuardiansCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const removeGuardian = useCallback(
    async (guardianWallet: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('remove-guardian', { vault: vaultPubkey, guardianWallet });
      invalidateGuardiansCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const setThreshold = useCallback(
    async (threshold: number) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('set-guardian-threshold', { vault: vaultPubkey, threshold });
      invalidateGuardiansCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const approveUnlock = useCallback(
    async () => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('approve-unlock', { vault: vaultPubkey });
      qc.invalidateQueries({ queryKey: ['vault', 'distribution', vaultPubkey] });
      qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
      qc.invalidateQueries({ queryKey: ['vault', 'guardians', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const initiateUnlock = useCallback(
    async () => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('initiate-unlock', { vault: vaultPubkey });
      qc.invalidateQueries({ queryKey: ['vault', 'distribution', vaultPubkey] });
      qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    guardians,
    data: guardians, // For PanelRenderer
    approvedCount,
    activeCount,
    approvedGuardians,
    addGuardian,
    removeGuardian,
    setThreshold,
    approveUnlock,
    initiateUnlock,
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
