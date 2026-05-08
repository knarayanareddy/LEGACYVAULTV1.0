export interface SIWSMessageParams {
  address: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  domain?: string;
  statement?: string;
  uri?: string;
}

export function buildSIWSMessage(params: SIWSMessageParams): string {
  const {
    address,
    nonce,
    issuedAt,
    expirationTime,
    domain = window.location.host,
    statement = 'Sign in to LegacyVault to manage your digital estate.',
    uri = window.location.origin,
  } = params;

  let message = `${domain} wants you to sign in with your Solana account:\n`;
  message += `${address}\n\n`;
  message += `${statement}\n\n`;
  message += `URI: ${uri}\n`;
  message += `Version: 1\n`;
  message += `Chain ID: mainnet\n`; // Or devnet
  message += `Nonce: ${nonce}\n`;
  message += `Issued At: ${issuedAt}`;
  message += `\nExpiration Time: ${expirationTime}`;

  return message;
}
