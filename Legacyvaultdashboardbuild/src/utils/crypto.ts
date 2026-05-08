/**
 * WebCrypto AES-GCM Client-Side Symmetric Document Encryption Utility
 */

/**
 * Derives a 256-bit AES-GCM key from a shared secret string (e.g. wallet-signed message).
 */
export async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = enc.encode(secret);
  
  // Use PBKDF2 to derive a strong AES key from the secret
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const salt = enc.encode('legacyvault_salt_constant');
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a File or Blob using AES-GCM.
 * Returns the encrypted Blob (with IV prepended) and the hex SHA-256 hash.
 */
export async function encryptFile(file: File | Blob, secret: string): Promise<{ ciphertextBlob: Blob; hash: string }> {
  const key = await deriveKey(secret);
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  
  // Generate a cryptographically secure 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBytes
  );
  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  
  // Prepend the 12-byte IV to the ciphertext so we can retrieve it during decryption
  const resultBytes = new Uint8Array(iv.length + ciphertextBytes.length);
  resultBytes.set(iv, 0);
  resultBytes.set(ciphertextBytes, iv.length);
  
  const ciphertextBlob = new Blob([resultBytes], { type: 'application/octet-stream' });
  
  // Calculate the SHA-256 hash of the ciphertext
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', resultBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { ciphertextBlob, hash: hashHex };
}

/**
 * Decrypts an encrypted Blob using AES-GCM.
 * Returns the decrypted Blob with the specified mime type.
 */
export async function decryptBlob(encryptedBlob: Blob, secret: string, originalMimeType: string): Promise<Blob> {
  const key = await deriveKey(secret);
  const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());
  
  // Extract the 12-byte IV prepended at the start
  const iv = encryptedBytes.slice(0, 12);
  const ciphertextBytes = encryptedBytes.slice(12);
  
  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertextBytes
  );
  
  return new Blob([plaintextBuffer], { type: originalMimeType });
}
