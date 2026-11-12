/**
 * Pure TypeScript NIST FIPS 180-4 SHA-256 Cryptographic Hash Implementation.
 * Zero external dependencies, fully cross-runtime compatible (Node, Edge, Browser).
 * Provides true 256-bit collision resistance for academic Sanads and certificates.
 */

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);

  const K: number[] = [];
  const H: number[] = [];

  let isPrime = (n: number) => {
    for (let factor = 2, max = Math.sqrt(n); factor <= max; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  let candidate = 2;
  while (H.length < 8) {
    if (isPrime(candidate)) {
      H.push(((mathPow(candidate, 1 / 2) * maxWord) | 0) >>> 0);
    }
    candidate++;
  }

  candidate = 2;
  while (K.length < 64) {
    if (isPrime(candidate)) {
      K.push(((mathPow(candidate, 1 / 3) * maxWord) | 0) >>> 0);
    }
    candidate++;
  }

  const words: number[] = [];
  const asciiLength = ascii.length;

  for (let i = 0; i < asciiLength; i++) {
    const code = ascii.charCodeAt(i);
    if (code > 255) {
      // UTF-8 encode
      const utf8 = unescape(encodeURIComponent(ascii));
      return sha256(utf8);
    }
    words[i >> 2] |= code << ((3 - (i % 4)) * 8);
  }

  // Padding
  words[asciiLength >> 2] |= 0x80 << ((3 - (asciiLength % 4)) * 8);
  words[(((asciiLength + 8) >> 6) << 4) + 15] = asciiLength * 8;

  const w: number[] = new Array(64);

  for (let chunk = 0; chunk < words.length; chunk += 16) {
    let [a, b, c, d, e, f, g, h] = H;

    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        w[i] = words[chunk + i] | 0;
      } else {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0)) | 0;
      }

      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = ((((h + S1) | 0) + ((ch + K[i]) | 0)) | 0) + w[i];
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  let hex = '';
  for (let i = 0; i < 8; i++) {
    const word = H[i] >>> 0;
    hex += word.toString(16).padStart(8, '0');
  }

  return hex;
}

