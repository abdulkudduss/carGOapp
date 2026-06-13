// i18n entry point (TZ §8.6). EVERY user-facing string goes through t() — no
// literal copy in JSX, ever. RU is the source of truth; KG is laid in as an
// empty structure and falls back to RU per-key. JP is out of scope.
//
// Reference pattern for the frontender:
//   import { t } from '../i18n';
//   t('phone.title')
//   t('code.subtitle', { phone: '99670…' })       // {placeholder} interpolation
//
// The active locale defaults to 'ru' and can be switched from the user's profile
// (`MeResponse.locale`) via setLocale(); components re-read t() on next render.

import { ru } from './ru';
import { ky } from './ky';

export type Locale = 'ru' | 'ky';

const DICTS = { ru, ky } as const;

// Dot-path keys of the RU dictionary, e.g. 'phone.title' | 'errors.INVALID_OTP'.
// Keeps t() call-sites honest — a typo is a compile error.
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Leaves<typeof ru>;

let currentLocale: Locale = 'ru';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

function lookup(dict: unknown, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (acc !== null && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Translate a dot-path key in the active locale, falling back to RU when the
 * active locale lacks it (so a partial KG translation never blanks the UI), then
 * to the key itself as a last resort. `{placeholders}` are filled from `params`.
 */
export function t(key: TKey, params?: Record<string, string | number>): string {
  const active = lookup(DICTS[currentLocale], key);
  const template = active ?? lookup(ru, key) ?? key;
  return interpolate(template, params);
}
