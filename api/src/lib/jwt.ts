import jwt from 'jsonwebtoken';
import { config } from '../config/constants';

export interface JWTPayload {
  wallet: string;
  vaultPubkey?: string;
  role?: 'owner' | 'guardian' | 'beneficiary' | 'viewer';
  iat?: number;
  exp?: number;
}

export function signJWT(payload: JWTPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function signRefreshToken(wallet: string): string {
  const options: jwt.SignOptions = {
    expiresIn: config.jwtRefreshExpiresIn as any,
  };
  return jwt.sign({ wallet }, config.jwtRefreshSecret, options);
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, config.jwtSecret) as JWTPayload;
}

export function verifyRefreshToken(token: string): { wallet: string } {
  return jwt.verify(token, config.jwtRefreshSecret) as { wallet: string };
}
