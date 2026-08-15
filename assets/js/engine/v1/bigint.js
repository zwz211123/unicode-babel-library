export function mod(value, modulus) {
  const result = value % modulus;
  return result >= 0n ? result : result + modulus;
}

export function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

export function extendedGcd(a, b) {
  let [oldR, r] = [a, b];
  let [oldS, s] = [1n, 0n];
  let [oldT, t] = [0n, 1n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return { gcd: oldR, x: oldS, y: oldT };
}

export function modInverse(value, modulus) {
  const result = extendedGcd(mod(value, modulus), modulus);
  if (result.gcd !== 1n) throw new RangeError('Value has no modular inverse');
  return mod(result.x, modulus);
}

export function bytesToBigInt(bytes) {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

export function toBase36(value) {
  if (value < 0n) throw new RangeError('pageId must be non-negative');
  return value.toString(36);
}

export function fromBase36(text) {
  if (!/^[0-9a-z]+$/i.test(text)) throw new TypeError('Invalid base36 integer');
  let value = 0n;
  for (const char of text.toLowerCase()) {
    const digit = BigInt(parseInt(char, 36));
    value = value * 36n + digit;
  }
  return value;
}
