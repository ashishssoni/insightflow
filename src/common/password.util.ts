import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  const derivedBuffer = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');

  if (derivedBuffer.length !== keyBuffer.length) return false;

  return timingSafeEqual(derivedBuffer, keyBuffer);
}
