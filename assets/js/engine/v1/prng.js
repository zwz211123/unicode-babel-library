const MASK_64 = (1n << 64n) - 1n;

function rotateLeft(value, shift) {
  return ((value << shift) | (value >> (64n - shift))) & MASK_64;
}

export class Xoshiro256StarStar {
  constructor(seedBytes) {
    if (!(seedBytes instanceof Uint8Array) || seedBytes.length !== 32) throw new TypeError('xoshiro256** needs 32 seed bytes');
    const view = new DataView(seedBytes.buffer, seedBytes.byteOffset, seedBytes.byteLength);
    this.state = [0, 8, 16, 24].map(offset => view.getBigUint64(offset, false));
    if (this.state.every(value => value === 0n)) this.state[0] = 1n;
  }

  next64() {
    const result = (rotateLeft((this.state[1] * 5n) & MASK_64, 7n) * 9n) & MASK_64;
    const t = (this.state[1] << 17n) & MASK_64;
    this.state[2] ^= this.state[0];
    this.state[3] ^= this.state[1];
    this.state[1] ^= this.state[2];
    this.state[0] ^= this.state[3];
    this.state[2] ^= t;
    this.state[3] = rotateLeft(this.state[3], 45n);
    return result;
  }

  nextBelow(limit) {
    if (limit <= 0n || limit > (1n << 64n)) throw new RangeError('limit must fit in 64 bits');
    const range = 1n << 64n;
    const ceiling = range - (range % limit);
    let value;
    do value = this.next64(); while (value >= ceiling);
    return value % limit;
  }
}
