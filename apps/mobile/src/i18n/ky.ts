// Kyrgyz dictionary — STRUCTURE ONLY, intentionally empty (TZ §8.6: KG is laid
// in from day one but not translated for the MVP). When KG ships, mirror the
// keys of `ru` here; the t() helper falls back to `ru` for any missing key, so a
// partial translation never shows a blank string.
//
// Typed as a deep-partial of the ru dictionary so the compiler keeps it in sync.

import type { ru } from './ru';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const ky: DeepPartial<typeof ru> = {
  // (no translations yet — falls back to ru)
};
