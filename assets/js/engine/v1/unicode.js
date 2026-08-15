export const UNICODE_COUNT = 1_112_064n;
export const PAGE_LENGTH = 3_200;
export const ROWS = 40;
export const COLUMNS = 80;
export const SURROGATE_START = 0xd800;
export const SURROGATE_END = 0xdfff;

export function digitToCodePoint(digit) {
  const value = Number(digit);
  if (!Number.isInteger(value) || value < 0 || value >= Number(UNICODE_COUNT)) {
    throw new RangeError('Unicode digit outside scalar-value space');
  }
  return value < SURROGATE_START ? value : value + 0x800;
}

export function codePointToDigit(codePoint) {
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff ||
      (codePoint >= SURROGATE_START && codePoint <= SURROGATE_END)) {
    throw new RangeError('Not a Unicode scalar value');
  }
  return BigInt(codePoint < SURROGATE_START ? codePoint : codePoint - 0x800);
}

export function stringToCodePoints(text) {
  return Array.from(text, char => char.codePointAt(0));
}

export function codePointsToString(codePoints) {
  const chunks = [];
  for (let i = 0; i < codePoints.length; i += 256) {
    chunks.push(String.fromCodePoint(...codePoints.slice(i, i + 256)));
  }
  return chunks.join('');
}

export function formatCodePoint(codePoint) {
  return `U+${codePoint.toString(16).toUpperCase().padStart(codePoint > 0xffff ? 6 : 4, '0')}`;
}

export function inspectCodePoints(codePoints) {
  return codePoints.map(formatCodePoint).join(' ');
}
