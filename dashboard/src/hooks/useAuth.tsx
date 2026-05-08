import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { api, ApiError } from '../lib/api';
import { buildSIWSMessage } from '../lib/siws';

type Role = 'owner' | 'guardian' | 'beneficiary' | 'viewer';

type AuthState = {
  isAuthenticated: boolean;
  wallet: string | null;
  role: Role | null;
  isSigningIn: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  signIn: () => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
  getAccessToken: () => string | null;
};

const ACCESS_TOKEN_KEY = 'legacyvault_access_token';
const REFRESH_TOKEN_KEY = 'legacyvault_refresh_token';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'legacyvault_access_expires_at';

const AuthContext = createContext<AuthContextValue | null>(null);

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected, disconnecting } = useWallet();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: !!sessionStorage.getItem(ACCESS_TOKEN_KEY),
    wallet: publicKey?.toBase58() ?? null,
    role: null,
    isSigningIn: false,
    error: null,
  });

  const refreshInFlight = useRef<Promise<void> | null>(null);

  const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

  const setTokens = (accessToken: string, refreshToken: string, expiresInSec: number) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(nowSec() + expiresInSec));
  };

  const clearTokens = () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  };

  const signOut = () => {
    clearTokens();
    setState((s) => ({
      ...s,
      isAuthenticated: false,
      role: null,
      isSigningIn: false,
      error: null,
    }));
  };

  const refresh = async () => {
    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        signOut();
        return;
      }

      try {
        const res = await api.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
          '/auth/refresh',
          { refreshToken }
        );

        setTokens(res.accessToken, res.refreshToken, res.expiresIn);

        setState((s) => ({ ...s, isAuthenticated: true, error: null }));
      } catch (e) {
        signOut();
      } finally {
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
  };

  const signIn = async () => {
    if (!publicKey || !signMessage) {
      setState((s) => ({ ...s, error: 'Wallet not connected or does not support message signing.' }));
      return;
    }

    setState((s) => ({ ...s, isSigningIn: true, error: null }));

    try {
      const nonceRes = await api.get<{ nonce: string; expiresAt: number }>(
        `/auth/nonce?wallet=${publicKey.toBase58()}`
      );

      const message = buildSIWSMessage({
        address: publicKey.toBase58(),
        nonce: nonceRes.nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(nonceRes.expiresAt * 1000).toISOString(),
      });

      const signatureBytes = await signMessage(new TextEncoder().encode(message));
      const signature = bs58.encode(signatureBytes);

      const verifyRes = await api.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        wallet: string;
      }>('/auth/verify', {
        pubkey: publicKey.toBase58(),
        signature,
        message,
      });

      setTokens(verifyRes.accessToken, verifyRes.refreshToken, verifyRes.expiresIn);

      setState((s) => ({
        ...s,
        isAuthenticated: true,
        wallet: verifyRes.wallet,
        isSigningIn: false,
        error: null,
      }));
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.code}: ${e.message}` : 'Sign-in failed.';
      setState((s) => ({ ...s, isSigningIn: false, error: msg, isAuthenticated: false }));
      clearTokens();
    }
  };

  useEffect(() => {
    setState((s) => ({ ...s, wallet: publicKey?.toBase58() ?? null }));
  }, [publicKey]);

  useEffect(() => {
    if (!connected && !disconnecting) {
      signOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, disconnecting]);

  useEffect(() => {
    const timer = setInterval(async () => {
      const expStr = sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
      if (!expStr) return;

      const exp = parseInt(expStr, 10);
      const remaining = exp - nowSec();

      if (remaining < 60 && sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
        await refresh();
      }
    }, 10_000);

    return () => clearInterval(timer);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      refresh,
      getAccessToken,
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
