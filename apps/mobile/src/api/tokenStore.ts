// React-Native implementation of @cargo/api's TokenStore (TZ §9).
//
// Split storage by sensitivity + lifetime:
//   • access  — short-lived (15 min), kept ONLY in memory. Never written to disk:
//               a stolen device file must not yield a usable bearer token. Lost
//               on app restart — that's fine, the refresh token re-mints it.
//   • refresh — long-lived, persisted in expo-secure-store (Keychain / Keystore,
//               hardware-backed). This is what survives a cold start and lets the
//               auth gate restore the session without re-login.
//
// The @cargo/api client only ever calls this interface; it has no idea SecureStore
// exists. Swapping storage (e.g. to a web secure store) needs no client change.

import * as SecureStore from 'expo-secure-store';
import type { TokenPair, TokenStore } from '@cargo/api';

const REFRESH_KEY = 'cargo.refreshToken';

export class RnTokenStore implements TokenStore {
  // Volatile half — survives only the current JS runtime.
  private access: string | null = null;

  getAccess(): string | null {
    return this.access;
  }

  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  }

  async setTokens(tokens: TokenPair): Promise<void> {
    this.access = tokens.accessToken;
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  }

  async clear(): Promise<void> {
    this.access = null;
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }

  /** True if a refresh token is on disk — used by the auth gate to restore a session. */
  async hasRefresh(): Promise<boolean> {
    return (await this.getRefresh()) !== null;
  }
}
