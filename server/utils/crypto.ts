import crypto from 'crypto';
import { promisify } from 'util';


const pbkdf2 = promisify(crypto.pbkdf2);
const randomBytes = promisify(crypto.randomBytes);

// Number of iterations for PBKDF2
const ITERATIONS = 10000;
// Key length for the derived key
const KEY_LENGTH = 64;
// Salt length
const SALT_LENGTH = 16;
// Digest algorithm
const DIGEST = 'sha512';

/**
 * Hash a password with PBKDF2
 * @param password The password to hash
 * @returns A Promise resolving to a string with format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = await randomBytes(SALT_LENGTH);
  
  // Hash the password
  const hash = await pbkdf2(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );
  
  // Return as salt:hash
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a password against a hash
 * @param password The password to verify
 * @param storedHash The stored hash to verify against
 * @returns A Promise resolving to a boolean
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Split the stored hash into salt and hash
  const [salt, hash] = storedHash.split(':');
  
  // Hash the password with the stored salt
  const derivedKey = await pbkdf2(
    password,
    Buffer.from(salt, 'hex'),
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );
  
  // Compare the hashes
  return crypto.timingSafeEqual(
    derivedKey,
    Buffer.from(hash, 'hex')
  );
}

/**
 * Generate a random API key
 * @returns A random API key
 */
export function generateApiKey(): string {
  return `sk_live_${crypto.randomBytes(32).toString('hex')}`;
}
