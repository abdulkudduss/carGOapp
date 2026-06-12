// Cross-platform UUID v4 for Idempotency-Key headers.
//
// Why hand-rolled (no `uuid` dependency): the package runs in three runtimes —
// browsers (Vite), React Native / Hermes, and Node (the smoke script). None of
// them offers a single API present everywhere:
//   - `crypto.randomUUID()` — browsers (secure context) and Node ≥ 19, but NOT
//     Hermes by default.
//   - `crypto.getRandomValues()` — browsers and Node, but Hermes needs the
//     `react-native-get-random-values` polyfill, which apps may not install.
// An Idempotency-Key only needs to be *unique per operation*, not
// cryptographically unpredictable (it is not a secret), so a `Math.random`
// fallback is acceptable when no crypto source exists. The three-tier strategy
// below therefore works with zero dependencies and zero required polyfills.
//
// `globalThis.crypto` is typed by lib.dom as always-present; at runtime it may
// be absent (Hermes), so every access is guarded with `typeof`.

type RandomUuidCrypto = { randomUUID: () => string };
type GetRandomValuesCrypto = {
  getRandomValues: <T extends ArrayBufferView | null>(array: T) => T;
};

function getCrypto(): unknown {
  return typeof globalThis !== 'undefined'
    ? (globalThis as { crypto?: unknown }).crypto
    : undefined;
}

function hasRandomUUID(c: unknown): c is RandomUuidCrypto {
  return typeof (c as RandomUuidCrypto | undefined)?.randomUUID === 'function';
}

function hasGetRandomValues(c: unknown): c is GetRandomValuesCrypto {
  return typeof (c as GetRandomValuesCrypto | undefined)?.getRandomValues === 'function';
}

function bytesToUuid(bytes: Uint8Array): string {
  // RFC 4122 §4.4: set version (4) and variant (10xx) bits.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex: string[] = [];
  for (let i = 0; i < 16; i++) hex.push(bytes[i]!.toString(16).padStart(2, '0'));
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  );
}

/** Generate an RFC 4122 v4 UUID. Works in browsers, RN/Hermes, and Node. */
export function uuidv4(): string {
  const c = getCrypto();

  // Tier 1: native randomUUID (browsers, Node ≥ 19).
  if (hasRandomUUID(c)) return c.randomUUID();

  const bytes = new Uint8Array(16);

  // Tier 2: CSPRNG bytes (browsers, Node, RN with polyfill).
  if (hasGetRandomValues(c)) {
    c.getRandomValues(bytes);
    return bytesToUuid(bytes);
  }

  // Tier 3: Math.random fallback (RN/Hermes without polyfill). Not crypto-grade,
  // but uniqueness is all an Idempotency-Key needs.
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytesToUuid(bytes);
}
