import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const invalidateVaultCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
};

export const invalidateGuardiansCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'guardians', vaultPubkey] });
};

export const invalidateBeneficiariesCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'beneficiaries', vaultPubkey] });
};

export const invalidateDistributionCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'distribution', vaultPubkey] });
};
