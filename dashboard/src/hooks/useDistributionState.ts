import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateDistributionCache } from '../config/queryClient';
import { DistributionStateResponse } from '../types/api';

export type DistributionSection = 'unlock' | 'sol' | 'spl' | 'finalize';

const DEFAULT_BATCH_SIZE = 5;
const ATA_BATCH_SIZE = 3;

export function useDistributionState() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const [selectedMints, setSelectedMints] = useState<string[]>([]);
  const [createMissingAtas, setCreateMissingAtas] = useState(false);

  const query = useQuery<DistributionStateResponse, Error>({
    queryKey: ['vault', 'distribution', vaultPubkey],
    queryFn: () =>
      api.get<DistributionStateResponse>(`/vaults/${vaultPubkey}/distribution/state`),
    enabled: !!vaultPubkey,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  const state = query.data;

  const activeSection = useMemo<DistributionSection>(() => {
    if (!state?.unlockSession) return 'unlock';
    if (['proposed', 'approved'].includes(state.unlockSession.status)) return 'unlock';
    if (!state.solSession || !state.solSession.completed) return 'sol';
    const allSplDone =
      selectedMints.length === 0 ||
      selectedMints.every((mint) => {
        const s = state.splSessions.find((ss) => ss.mint === mint);
        return s?.completed === true;
      });
    if (!allSplDone) return 'spl';
    return 'finalize';
  }, [state, selectedMints]);

  const batchSize = createMissingAtas ? ATA_BATCH_SIZE : DEFAULT_BATCH_SIZE;

  const initiateUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('initiate-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const approveUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('approve-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const cancelUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('cancel-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const initSolDistribution = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('init-dist-sol', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const processSolBatch = useCallback(
    async (startIndex: number) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('exec-dist-sol-batch', {
        vault: vaultPubkey,
        startIndex,
        batchSize,
      });
      invalidateDistributionCache(vaultPubkey);
    },
    [vaultPubkey, tx, batchSize]
  );

  const initSplDistribution = useCallback(
    async (mint: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('init-dist-spl', {
        vault: vaultPubkey,
        mint,
        createMissingAtas,
      });
      invalidateDistributionCache(vaultPubkey);
    },
    [vaultPubkey, tx, createMissingAtas]
  );

  const processSplBatch = useCallback(
    async (mint: string, startIndex: number) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('exec-dist-spl-batch', {
        vault: vaultPubkey,
        mint,
        startIndex,
        batchSize,
        createMissingAtas,
      });
      invalidateDistributionCache(vaultPubkey);
    },
    [vaultPubkey, tx, batchSize, createMissingAtas]
  );

  const finalizeUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('finalize-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
    qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
  }, [vaultPubkey, tx, qc]);

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    unlockSession: state?.unlockSession ?? null,
    solSession:    state?.solSession    ?? null,
    splSessions:   state?.splSessions   ?? [],
    availableMints: state?.availableMints ?? [],
    canFinalize:   state?.canFinalize   ?? false,
    activeSection,
    selectedMints,
    setSelectedMints,
    createMissingAtas,
    setCreateMissingAtas,
    batchSize,
    initiateUnlock,
    approveUnlock,
    cancelUnlock,
    initSolDistribution,
    processSolBatch,
    initSplDistribution,
    processSplBatch,
    finalizeUnlock,
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
    data: state, // For PanelRenderer
  };
}

// Alias for Build 7 wiring
export const useDistribution = useDistributionState;
