import CryptoJS from 'crypto-js';

const getKey = (): string => {
  const key = process.env.ADDRESS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ADDRESS_ENCRYPTION_KEY environment variable is not set');
  }
  return key;
};

export function encryptAddress(plainText: string): string {
  const key = getKey();
  const encrypted = CryptoJS.AES.encrypt(plainText, key);
  return encrypted.toString();
}

export function decryptAddress(cipherText: string): string {
  const key = getKey();
  const decrypted = CryptoJS.AES.decrypt(cipherText, key);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptIfPresent(value: string | null | undefined): string | null {
  if (!value) return null;
  return encryptAddress(value);
}

export function decryptIfPresent(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return decryptAddress(value);
  } catch {
    return null;
  }
}
