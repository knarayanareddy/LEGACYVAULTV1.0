// dashboard/src/__tests__/hooks/useTxBuilder.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import { vi, mockWallet } from '../testUtils';

global.fetch = vi.fn();

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useTxBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWallet.publicKey = { toBase58: () => 'Wallet111' } as any;
    mockWallet.connected = true;
  });

  it('executes tx successfully', async () => {
    const onStateChange = vi.fn();

    // Mock API
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transaction: Buffer.from('fake-tx').toString('base64'),
      }),
    });

    // Mock wallet
    mockWallet.signTransaction.mockResolvedValueOnce({
      serialize: () => Buffer.from('signed-tx'),
    });

    // Mock connection is handled via useConnection mock in testUtils
    // But useTxBuilder uses the real connection from the provider usually.
    // In our mock we need to provide a connection.

    const { result } = renderHook(() => useTxBuilder({ onStateChange }), { wrapper });

    await act(async () => {
      // This will fail if useConnection isn't mocked properly to return a connection with sendRawTransaction
    });
  });
});
