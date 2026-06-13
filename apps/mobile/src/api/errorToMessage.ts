// The reference error sink for the frontender (TZ §8.2).
//
// RULE: map the machine `code`, NEVER the HTTP status. A `400`/`409`/`422` is a
// business answer, not a system failure — "Ошибка 409" is forbidden. So we read
// `err.code` and look up a localized, actionable message via t('errors.<code>').
//
// Note the union `kind` is deliberately NOT the branch key: a code the shared
// @cargo/api package hasn't enumerated (e.g. INVALID_OTP) arrives as
// `kind:'unknown'`, but we still map it by its `code` string here. The package's
// typed union and the UI's code→message map evolve independently — the UI can
// react to a code before the package adds it to KNOWN_ERROR_CODES.
//
// Anything we don't have a string for falls back to errors.unknown — never a
// crash, never a raw status.

import { isApiError } from '@cargo/api';
import { t, type TKey } from '../i18n';

// Codes we render a tailored message for. Keep in sync with i18n `errors.*`.
const MAPPED_CODES = new Set<string>(['INVALID_OTP', 'NETWORK_ERROR', 'VALIDATION_ERROR']);

export function errorToMessage(err: unknown): string {
  if (!isApiError(err)) return t('errors.unknown');

  const code = err.code;
  if (MAPPED_CODES.has(code)) {
    return t(`errors.${code}` as TKey);
  }
  return t('errors.unknown');
}
