import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

export interface SIWSMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

export function buildSIWSMessage(params: Omit<SIWSMessage, 'version' | 'chainId'>): string {
  const { domain, address, statement, uri, nonce, issuedAt, expirationTime } = params;
  
  let message = `${domain} wants you to sign in with your Solana account:\n`;
  message += `${address}\n\n`;
  message += `${statement}\n\n`;
  message += `URI: ${uri}\n`;
  message += `Version: 1\n`;
  message += `Chain ID: mainnet\n`;
  message += `Nonce: ${nonce}\n`;
  message += `Issued At: ${issuedAt}`;
  
  if (expirationTime) {
    message += `\nExpiration Time: ${expirationTime}`;
  }
  
  return message;
}

export function verifySIWSSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('SIWS verification error:', error);
    return false;
  }
}
