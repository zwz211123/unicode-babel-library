import { mod } from './bigint.js';
import { deriveSeed, MODULUS } from './seed.js';
import { UNICODE_COUNT, PAGE_LENGTH, digitToCodePoint, codePointToDigit, codePointsToString } from './unicode.js';

export function integerToDigits(value) {
  let current = value;
  const digits = new Array(PAGE_LENGTH).fill(0n);
  for (let index = PAGE_LENGTH - 1; index >= 0; index -= 1) {
    digits[index] = current % UNICODE_COUNT;
    current /= UNICODE_COUNT;
  }
  if (current !== 0n) throw new RangeError('Page integer outside page space');
  return digits;
}

export function digitsToInteger(digits) {
  if (digits.length !== PAGE_LENGTH) throw new RangeError(`Page must contain ${PAGE_LENGTH} digits`);
  let value = 0n;
  for (const digit of digits) {
    if (digit < 0n || digit >= UNICODE_COUNT) throw new RangeError('Invalid base-N digit');
    value = value * UNICODE_COUNT + digit;
  }
  return value;
}

export function codePointsToInteger(codePoints) {
  return digitsToInteger(codePoints.map(codePointToDigit));
}

export async function generatePage(seed, pageId) {
  const normalizedId = mod(pageId, MODULUS);
  const { A, B } = await deriveSeed(seed);
  const X = mod(A * normalizedId + B, MODULUS);
  const codePoints = integerToDigits(X).map(digitToCodePoint);
  return { seed, pageId: normalizedId, X, codePoints, text: codePointsToString(codePoints) };
}
