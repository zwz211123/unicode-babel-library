import { gcd, modInverse } from './bigint.js';
import { sha256Bytes } from './hash.js';
import { Xoshiro256StarStar } from './prng.js';
import { UNICODE_COUNT, PAGE_LENGTH } from './unicode.js';

export const ENGINE_VERSION = 'ubabel-v1';
export const A_DOMAIN_PREFIX = `UnicodeBabel|${ENGINE_VERSION}|seed|A|`;
export const B_DOMAIN_PREFIX = `UnicodeBabel|${ENGINE_VERSION}|seed|B|`;
export const MODULUS = UNICODE_COUNT ** BigInt(PAGE_LENGTH);

const cache = new Map();

async function deriveBaseNValue(domainPrefix, seed) {
  const digest = await sha256Bytes(domainPrefix + seed);
  const prng = new Xoshiro256StarStar(digest);
  let value = 0n;
  for (let index = 0; index < PAGE_LENGTH; index += 1) {
    value = value * UNICODE_COUNT + prng.nextBelow(UNICODE_COUNT);
  }
  return value;
}

export async function deriveSeed(seed) {
  if (cache.has(seed)) return cache.get(seed);
  let A = await deriveBaseNValue(A_DOMAIN_PREFIX, seed);
  if (A === 0n) A = 1n;
  while (gcd(A, MODULUS) !== 1n) A += 1n;
  const B = await deriveBaseNValue(B_DOMAIN_PREFIX, seed);
  const result = Object.freeze({ A, B, A_INV: modInverse(A, MODULUS) });
  cache.set(seed, result);
  return result;
}
