import { useCallback } from 'react';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useVaultSummary } from './useVaultSummary';
import { useTxBuilder } from './useTxBuilder';
import { invalidateVaultCache } from '../config/queryClient';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

const SECONDS_PER_DAY = 86_400;

export function useSettings() {
  const { vaultPubkey, connectedWallet } = useVault();
  const tx = useTxBuilder();

  const {
    inactivityThreshold,
    timelockDuration,
    guardianThreshold,
    subscriptionTier,
    subscriptionExpiry,
    isLoading,
    error,
    refetch,
  } = useVaultSummary();

  const inactivityDays = inactivityThreshold / SECONDS_PER_DAY;
  const timelockDays   = timelockDuration   / SECONDS_PER_DAY;

  const updateCustodySettings = useCallback(
    async (updates: {
      inactivityDays?: number;
      timelockDays?: number;
      guardianThreshold?: number;
      arbiter?: string;
    }) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      await tx.execute('update-vault-settings', {
        vault: vaultPubkey,
        ...(updates.inactivityDays !== undefined && {
          inactivityThreshold: Math.round(updates.inactivityDays * SECONDS_PER_DAY),
        }),
        ...(updates.timelockDays !== undefined && {
          timelockDuration: Math.round(updates.timelockDays * SECONDS_PER_DAY),
        }),
        ...(updates.guardianThreshold !== undefined && {
          guardianThreshold: updates.guardianThreshold,
        }),
        ...(updates.arbiter !== undefined && {
          arbiter: updates.arbiter,
        }),
      });

      invalidateVaultCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const updateNotificationPrefs = useCallback(
    async (prefs: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
    }) => {
      if (!connectedWallet) throw new Error('Not authenticated');
      await api.put(`/users/${connectedWallet}/notification-preferences`, prefs);
    },
    [connectedWallet]
  );

  const upgradeSubscription = useCallback(
    async (tier: SubscriptionTier, durationDays: number = 30) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      await tx.execute('set-subscription', {
        vault: vaultPubkey,
        tier,
        durationSeconds: Math.round(durationDays * SECONDS_PER_DAY),
      });

      invalidateVaultCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    inactivityDays,
    timelockDays,
    guardianThreshold,
    subscriptionTier,
    subscriptionExpiry,
    updateCustodySettings,
    updateNotificationPrefs,
    upgradeSubscription,
    isActing,
    txStatus: tx.status,
    txWarnings: tx.warnings,
    txSignature: tx.signature,
    txError: tx.error,
    resetTx: tx.reset,
    isLoading,
    error,
    refetch,
    data: { inactivityDays, timelockDays, guardianThreshold, subscriptionTier, subscriptionExpiry }, // For PanelRenderer
  };
}
