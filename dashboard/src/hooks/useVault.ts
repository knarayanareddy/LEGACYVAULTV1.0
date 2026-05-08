import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

const VAULT_KEY = 'legacyvault_active_vault';

export function useVault() {
  const { wallet } = useAuth();

  const [vaultPubkey, setVaultPubkeyState] = useState<string | null>(
    () => sessionStorage.getItem(VAULT_KEY)
  );

  const setVaultPubkey = useCallback((pubkey: string | null) => {
    if (pubkey) {
      sessionStorage.setItem(VAULT_KEY, pubkey);
    } else {
      sessionStorage.removeItem(VAULT_KEY);
    }
    setVaultPubkeyState(pubkey);
  }, []);

  const hasVault = !!vaultPubkey;

  return {
    vaultPubkey,
    setVaultPubkey,
    hasVault,
    connectedWallet: wallet,
  };
}
