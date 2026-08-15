import { mod } from './bigint.js';
import { sha256Bytes } from './hash.js';
import { Xoshiro256StarStar } from './prng.js';
import { codePointsToInteger, generatePage } from './page.js';
import { deriveSeed, MODULUS, ENGINE_VERSION } from './seed.js';
import { PAGE_LENGTH, UNICODE_COUNT, stringToCodePoints, digitToCodePoint } from './unicode.js';

export async function locateText(seed, query, occurrenceIndex = 0) {
  const target = stringToCodePoints(query);
  if (target.length === 0) throw new RangeError('Search text cannot be empty');
  if (target.length > PAGE_LENGTH) throw new RangeError(`Search text exceeds ${PAGE_LENGTH} Unicode scalar values`);
  if (!Number.isSafeInteger(occurrenceIndex) || occurrenceIndex < 0) throw new RangeError('occurrenceIndex must be a non-negative safe integer');

  const material = `UnicodeBabel|${ENGINE_VERSION}|search|${seed}|${occurrenceIndex}|${query}`;
  const prng = new Xoshiro256StarStar(await sha256Bytes(material));
  const codePoints = Array.from({ length: PAGE_LENGTH }, () => digitToCodePoint(prng.nextBelow(UNICODE_COUNT)));
  const slots = PAGE_LENGTH - target.length + 1;
  const offset = Number(prng.nextBelow(BigInt(slots)));
  codePoints.splice(offset, target.length, ...target);

  const X = codePointsToInteger(codePoints);
  const { B, A_INV } = await deriveSeed(seed);
  const pageId = mod(A_INV * (X - B), MODULUS);
  const generated = await generatePage(seed, pageId);
  if (!generated.text.includes(query)) throw new Error('Inverse-search verification failed');
  return { ...generated, query, occurrenceIndex, offset };
}
