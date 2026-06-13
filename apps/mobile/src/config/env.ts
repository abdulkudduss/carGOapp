// API addressing is CONFIG, never hardcoded in feature code (TZ §9 — the base
// URL is environment-specific). Resolution order:
//
//   1. EXPO_PUBLIC_API_BASE_URL  — env var, inlined by Expo at bundle time. This
//      is the override you set per machine / CI (`.env`, shell, EAS secret).
//   2. expo.extra.apiBaseUrl     — committed default in app.json.
//   3. a platform fallback       — so a clean clone runs against a local backend.
//
// IMPORTANT for device/emulator smoke (see apps/mobile/README.md):
//   • iOS simulator         → http://localhost:8080 resolves to the host.
//   • Android emulator      → host is reachable as http://10.0.2.2:8080.
//   • Real device (any OS)  → use the host machine's LAN IP, e.g.
//                             http://192.168.x.x:8080 (localhost is the phone).
// Set EXPO_PUBLIC_API_BASE_URL accordingly; the fallback below only covers the
// emulator/simulator cases.

import Constants from 'expo-constants';
import { Platform } from 'react-native';

function platformFallback(): string {
  // Android emulator cannot see the host as `localhost`; it maps the host to
  // the special 10.0.2.2 alias. Everything else (iOS sim) sees localhost.
  return Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
}

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (fromExtra && fromExtra.length > 0) return fromExtra;

  return platformFallback();
}

export const API_BASE_URL = resolveBaseUrl();
