import { bytesToBigInt } from './bigint.js';

const encoder = new TextEncoder();

export async function sha256Bytes(input) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input;
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

export function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input) {
  return bytesToHex(await sha256Bytes(input));
}

export async function hashCodePoints(codePoints) {
  const bytes = new Uint8Array(codePoints.length * 4);
  const view = new DataView(bytes.buffer);
  codePoints.forEach((codePoint, index) => view.setUint32(index * 4, codePoint, false));
  return sha256Hex(bytes);
}

export async function sha256BigInt(input) {
  return bytesToBigInt(await sha256Bytes(input));
}
