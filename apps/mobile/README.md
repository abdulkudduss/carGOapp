# CARGO Mobile (Expo / React Native)

Client app. The OTP-login flow is the reference implementation for all client
screens — see [PATTERNS.md](./PATTERNS.md) before adding a screen.

## Run

From the repo root (Node 22 + pnpm — see the repo README):

```bash
pnpm --filter mobile start          # Metro + Expo dev server
pnpm --filter mobile android        # build/open on Android emulator or device
pnpm --filter mobile ios            # iOS simulator (macOS only)
```

Open in **Expo Go** (SDK 56) by scanning the QR, or press `a`/`i` in the Metro
terminal for an emulator/simulator. The native modules used (`react-native-screens`,
`react-native-safe-area-context`, `expo-secure-store`) are pinned to SDK 56 via
`expo install` and are available in Expo Go SDK 56 — no custom dev client needed.

## API addressing — read this before the device smoke

The base URL is **config, not hardcoded** (TZ §9). Resolution order
(`src/config/env.ts`):

1. `EXPO_PUBLIC_API_BASE_URL` — env var, inlined by Expo at bundle time. Set this
   per machine/CI. Example: `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:8080 pnpm --filter mobile start`
2. `expo.extra.apiBaseUrl` in `app.json` — committed default (`http://localhost:8080`).
3. Platform fallback — `10.0.2.2:8080` on Android, `localhost:8080` otherwise.

**`localhost` means the phone, not your machine.** Address the host backend by target:

| Target | Backend URL |
|---|---|
| iOS simulator | `http://localhost:8080` (host = localhost) |
| Android emulator | `http://10.0.2.2:8080` (host alias) |
| **Real device (any OS)** | `http://<your-LAN-IP>:8080` — same Wi-Fi as the dev machine |

To find your LAN IP: `hostname -I` (Linux) / `ipconfig getifaddr en0` (macOS).
Then `EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:8080 pnpm --filter mobile start`.

## Dev OTP (no SMS is sent)

The backend writes the OTP code to the `notifications` outbox instead of sending
SMS. After requesting a code, read it from Postgres (port 5433):

```bash
PGPASSWORD=cargo psql -h localhost -p 5433 -U cargo -d cargo_db -tAc \
  "SELECT payload->>'code' FROM notifications n JOIN users u ON u.id=n.client_id \
   WHERE u.phone='996700000001' AND n.template='OTP' ORDER BY n.id DESC LIMIT 1"
```

Canonical test client: phone `996700000001` (client `C1003`, room `Room C1003`).
