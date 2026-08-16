import { gcd, mod, modInverse, fromBase36, toBase36 } from '../assets/js/engine/v1/bigint.js';
import { hashCodePoints, sha256Hex } from '../assets/js/engine/v1/hash.js';
import { generatePage } from '../assets/js/engine/v1/page.js';
import { locateText } from '../assets/js/engine/v1/search.js';
import { deriveSeed, ENGINE_VERSION, MODULUS } from '../assets/js/engine/v1/seed.js';
import { codePointToDigit, digitToCodePoint, stringToCodePoints } from '../assets/js/engine/v1/unicode.js';

const lines = [];
let passed = 0;
function assert(condition, message) { if (!condition) throw new Error(message); passed += 1; lines.push(`PASS ${message}`); }

try {
  assert(mod(-1n, 7n) === 6n, 'positive modular reduction');
  assert(gcd(54n, 24n) === 6n, 'BigInt gcd');
  assert(modInverse(3n, 11n) === 4n, 'modular inverse');
  assert(fromBase36(toBase36(12345678901234567890n)) === 12345678901234567890n, 'base36 round trip');
  for (const cp of [0x0000, 0xd7ff, 0xe000, 0x10ffff]) assert(digitToCodePoint(codePointToDigit(cp)) === cp, `Unicode scalar round trip U+${cp.toString(16).toUpperCase()}`);
  assert(stringToCodePoints('😀').length === 1, 'emoji counts as one scalar value');
  assert(stringToCodePoints('文\u0301\u200dא').length === 4, 'CJK, combining mark, ZWJ and RTL scalar count');
  assert(await sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'WebCrypto SHA-256 known vector');
  const derived = await deriveSeed('敦煌');
  assert(derived.A >= 1n && derived.A < MODULUS, 'derived A is in [1, M)');
  assert(gcd(derived.A, MODULUS) === 1n, 'derived A is invertible modulo M');
  assert(mod(derived.A * derived.A_INV, MODULUS) === 1n, 'A inverse verifies');
  const page = await generatePage('敦煌', 0n);
  assert(page.codePoints.length === 3200, 'page contains exactly 3200 scalar values');
  const adjacentPage = await generatePage(page.seed, page.pageId + 1n);
  const changedCodePoints = page.codePoints.reduce(
    (count, codePoint, index) => count + Number(codePoint !== adjacentPage.codePoints[index]),
    0,
  );
  assert(changedCodePoints >= 3000, `adjacent PageID diffusion changes ${changedCodePoints}/3200 scalar values`);
  const hash = await hashCodePoints(page.codePoints);
  const expected = 'f4d917e9b04c0b991116c245785bb6ea51d31e6768faed9555f073f3c25a8381';
  assert(hash === expected, `golden vector ${ENGINE_VERSION}/敦煌/0 = ${hash}`);
  const result0 = await locateText('敦煌', '藏经洞 🌌', 0);
  assert(result0.text.includes('藏经洞 🌌'), 'inverse search result contains Unicode query');
  const regenerated = await generatePage('敦煌', result0.pageId);
  assert(await hashCodePoints(regenerated.codePoints) === await hashCodePoints(result0.codePoints), 'inverse-search page regenerates exactly');
  const result1 = await locateText('敦煌', '藏经洞 🌌', 1);
  assert(result1.pageId !== result0.pageId, 'occurrenceIndex selects a distinct page');
  lines.push(`\n${passed} tests passed`);
  document.documentElement.dataset.status = 'passed';
} catch (error) {
  lines.push(`\nFAIL ${error.stack || error}`);
  document.documentElement.dataset.status = 'failed';
}
document.querySelector('#output').textContent = lines.join('\n');
