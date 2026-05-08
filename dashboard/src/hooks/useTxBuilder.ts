import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { api, ApiError } from '../lib/api';
import { TxBuilderResponse } from '../types/api';

export type TxStatus =
  | 'idle'
  | 'building'
  | 'signing'
  | 'sending'
  | 'confirming'
  | 'success'
  | 'error';

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export interface UseTxBuilderReturn {
  status: TxStatus;
  warnings: string[];
  signature: string | null;
  error: string | null;
  execute: (endpoint: string, body: Record<string, unknown>) => Promise<string>;
  reset: () => void;
}

export function useTxBuilder(): UseTxBuilderReturn {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const [status, setStatus] = useState<TxStatus>('idle');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setWarnings([]);
    setSignature(null);
    setError(null);
  }, []);

  const execute = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (!signTransaction) throw new Error('Wallet does not support transaction signing');

      reset();
      setStatus('building');

      let txPayload: TxBuilderResponse;

      try {
        txPayload = await api.post<TxBuilderResponse>(`/tx/${endpoint}`, {
          feePayer: publicKey.toBase58(),
          ...body,
        });
      } catch (e) {
        const msg = e instanceof ApiError ? `${e.code}: ${e.message}` : 'Failed to build transaction';
        setStatus('error');
        setError(msg);
        throw new Error(msg);
      }

      setWarnings(txPayload.warnings ?? []);

      const txBytes = base64ToUint8Array(txPayload.transaction);
      const tx = VersionedTransaction.deserialize(txBytes);

      setStatus('signing');

      let signed: VersionedTransaction;
      try {
        signed = await signTransaction(tx);
      } catch (e) {
        const msg = 'Transaction signature was rejected or failed.';
        setStatus('error');
        setError(msg);
        throw new Error(msg);
      }

      setStatus('sending');

      // MOCK NETWORK SEND FOR UI TESTING
      // Since the smart contract is not deployed to Devnet, the network will reject it.
      let sig: string = 'mock_signature_' + Date.now();
      setSignature(sig);

      setStatus('confirming');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate network delay

      setStatus('success');
      return sig;
    },
    [publicKey, signTransaction, connection, reset]
  );

  return { status, warnings, signature, error, execute, reset };
}
