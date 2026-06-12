// Integration smoke for @cargo/api against a LOCAL running backend.
// Run with plain Node (>=22.18 strips TS types): `pnpm --filter @cargo/api smoke`.
// NOT wired into typecheck/build/lint — those gates run without a backend/DB.
//
// Full cycle exercised (TZ "готово, когда"):
//   1. POST /auth/otp/request
//   2. fetch the OTP code via the dev mechanism (see below)
//   3. POST /auth/otp/verify           → access + refresh
//   4. GET  /api/v1/me through ApiClient (role + context visible)
//   5. corrupt the access token, fire N concurrent /me → ONE single-flight
//      refresh kicks in, every request retries and succeeds.
//
// Dev OTP mechanism: the backend never sends SMS in dev — `OutboxDispatcher` is
// a stub and `NikitaSmsAdapter` is never called. The plaintext code is written
// to the `notifications` outbox row (payload `{"code":"…"}`, template `OTP`).
// We read it straight from Postgres via `psql`. `requestOtp` auto-creates a
// CLIENT for any unknown phone, so no seeded user is required.

import { execFileSync } from 'node:child_process';
import { ApiClient, MemoryTokenStore, isApiError } from '../src/index.ts';
import type { FetchLike, TokenPair } from '../src/index.ts';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8080';
const PHONE = process.env.SMOKE_PHONE ?? '+996700999001';
const PG = {
  host: process.env.PGHOST ?? 'localhost',
  port: process.env.PGPORT ?? '5433',
  user: process.env.PGUSER ?? 'cargo',
  db: process.env.PGDATABASE ?? 'cargo_db',
  password: process.env.PGPASSWORD ?? 'cargo',
};

function log(step: string, detail = ''): void {
  console.log(`  ${step}${detail ? ' — ' + detail : ''}`);
}
function fail(msg: string): never {
  console.error(`\n✗ SMOKE FAILED: ${msg}`);
  process.exit(1);
}

/** Read the latest plaintext OTP code for `phone` from the notifications outbox. */
function readOtpFromDb(phone: string): string {
  const sql =
    "SELECT payload->>'code' FROM notifications n " +
    'JOIN users u ON u.id = n.client_id ' +
    `WHERE u.phone = '${phone}' AND n.template = 'OTP' ` +
    'ORDER BY n.id DESC LIMIT 1';
  const out = execFileSync(
    'psql',
    ['-h', PG.host, '-p', PG.port, '-U', PG.user, '-d', PG.db, '-tA', '-c', sql],
    { env: { ...process.env, PGPASSWORD: PG.password }, encoding: 'utf8' },
  ).trim();
  if (!out) fail('no OTP row in notifications outbox — is the backend writing it?');
  return out;
}

async function main(): Promise<void> {
  console.log(`\n@cargo/api smoke → ${BASE_URL} (phone ${PHONE})\n`);

  // 1. request OTP -------------------------------------------------------------
  const reqRes = await fetch(`${BASE_URL}/api/v1/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE }),
  });
  if (!reqRes.ok) fail(`otp/request → HTTP ${reqRes.status}`);
  log('1. otp/request', `HTTP ${reqRes.status}`);

  // 2. obtain the dev OTP code -------------------------------------------------
  const code = readOtpFromDb(PHONE);
  log('2. OTP from outbox', `code=${code}`);

  // 3. verify → tokens ---------------------------------------------------------
  const verifyRes = await fetch(`${BASE_URL}/api/v1/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, code }),
  });
  if (!verifyRes.ok) fail(`otp/verify → HTTP ${verifyRes.status}`);
  const tokens = (await verifyRes.json()).data as TokenPair;
  if (!tokens?.accessToken || !tokens?.refreshToken) fail('verify returned no token pair');
  log('3. otp/verify', 'access + refresh received');

  // 4. GET /me through the client ----------------------------------------------
  const store = new MemoryTokenStore(tokens);
  let refreshCalls = 0;
  let authFailures = 0;
  const countingFetch: FetchLike = (input, init) => {
    if (input.includes('/api/v1/auth/refresh')) refreshCalls++;
    return fetch(input, init);
  };
  const client = new ApiClient({
    baseUrl: BASE_URL,
    tokenStore: store,
    fetch: countingFetch,
    onAuthFailure: () => {
      authFailures++;
    },
  });

  const me = await client.get<{ id: number; role: string; phone: string }>('/api/v1/me');
  if (!me?.role) fail('/me returned no role');
  log('4. GET /me', `id=${me.id} role=${me.role} phone=${me.phone}`);

  // 5. stale access → single-flight refresh + retry ----------------------------
  // Corrupt the access token but keep the valid refresh token, then fire several
  // /me requests at once. They all 401, exactly ONE refresh runs, all retry OK.
  store.setTokens({ accessToken: 'stale.invalid.token', refreshToken: tokens.refreshToken });
  refreshCalls = 0;
  const N = 5;
  const results = await Promise.all(
    Array.from({ length: N }, () => client.get<{ role: string }>('/api/v1/me')),
  );
  if (results.some((r) => !r?.role)) fail('one of the retried /me requests returned no role');
  if (refreshCalls !== 1) fail(`expected exactly 1 refresh for ${N} concurrent 401s, got ${refreshCalls}`);
  if (authFailures !== 0) fail('onAuthFailure fired despite a valid refresh token');
  log('5. stale-access refresh', `${N} concurrent 401s → ${refreshCalls} refresh → all retried OK`);

  // Sanity: a stored refreshed access token now works on its own.
  const meAgain = await client.get<{ role: string }>('/api/v1/me');
  if (!meAgain?.role) fail('post-refresh /me failed');

  // Bonus: a totally bad refresh token → onAuthFailure path, no crash.
  const deadStore = new MemoryTokenStore({ accessToken: 'stale', refreshToken: 'dead' });
  let failed = false;
  const deadClient = new ApiClient({
    baseUrl: BASE_URL,
    tokenStore: deadStore,
    fetch: countingFetch,
    onAuthFailure: () => {
      failed = true;
    },
  });
  try {
    await deadClient.get('/api/v1/me');
    fail('expected ApiError when refresh token is dead');
  } catch (e) {
    if (!isApiError(e)) fail('non-ApiError thrown on auth failure');
    if (!failed) fail('onAuthFailure did not fire on dead refresh token');
    log('6. dead refresh', `onAuthFailure fired, threw ApiError code=${e.code}`);
  }

  console.log('\n✓ SMOKE PASSED — full auth cycle + single-flight refresh verified.\n');
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
