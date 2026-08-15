import { bytesToBigInt, gcd, modInverse } from './bigint.js';
import { sha256Bytes } from './hash.js';
import { Xoshiro256StarStar } from './prng.js';
import { UNICODE_COUNT, PAGE_LENGTH } from './unicode.js';

export const ENGINE_VERSION = 'ubabel-v1';
export const DOMAIN_PREFIX = `UnicodeBabel|${ENGINE_VERSION}|seed|`;
export const MODULUS = UNICODE_COUNT ** BigInt(PAGE_LENGTH);

const cache = new Map();

export async function deriveSeed(seed) {
  if (cache.has(seed)) return cache.get(seed);
  const digest = await sha256Bytes(DOMAIN_PREFIX + seed);
  let A = bytesToBigInt(digest.slice(0, 16)) % MODULUS;
  if (A === 0n) A = 1n;
  while (gcd(A, MODULUS) !== 1n) A += 1n;
  const prng = new Xoshiro256StarStar(digest);
  let B = 0n;
  for (let index = 0; index < PAGE_LENGTH; index += 1) {
    B = B * UNICODE_COUNT + prng.nextBelow(UNICODE_COUNT);
  }
  const result = Object.freeze({ A, B, A_INV: modInverse(A, MODULUS) });
  cache.set(seed, result);
  return result;
}
