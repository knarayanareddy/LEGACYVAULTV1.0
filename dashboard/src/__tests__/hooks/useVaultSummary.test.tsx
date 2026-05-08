// dashboard/src/__tests__/hooks/useVaultSummary.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVaultSummary } from '../../hooks/useVaultSummary';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useVaultSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches vault summary successfully', async () => {
    const mockData = {
      vaultAddress: 'Vault111',
      owner: 'Owner111',
      status: 'active',
      totalValue: 1000,
      guardianThreshold: 2,
      inactivityThreshold: 90 * 86400,
      timelockDuration: 30 * 86400,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useVaultSummary(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});
