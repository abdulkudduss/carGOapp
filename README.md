# CARGO Frontend

Frontend monorepo for **CARGO** — карго-доставка Япония → Кыргызстан.

> This repository is **infrastructure only**: a skeleton that wires the apps to
> three shared packages across web and React Native. There is no product
> code, design, routing, state management, or real components yet — those arrive
> in later steps.

> **Note on ПВЗ:** the standalone PWA `apps/pvz` has been removed. ПВЗ
> functionality is implemented as a native stack inside `apps/mobile` (role
> `KG_WORKER`); see `CARGO_Frontend_TZ_v1.3.md` §7.

## Requirements

| Tool | Version | Notes |
| ---- | ------- | ----- |
| Node | **22 LTS** (`.nvmrc` → `22`) | `nvm install && nvm use` |
| pnpm | **11.x** | enable via `corepack enable` (it reads `packageManager` in `package.json`) |

This repo uses **pnpm workspaces** (no Turborepo — kept deliberately simple).

## Structure

```
cargo-frontend/
├─ packages/
│  ├─ tokens/   @cargo/tokens  — design tokens   (placeholder: `export const tokens = {} as const`)
│  ├─ api/      @cargo/api     — API client       (placeholder export)
│  └─ ui/       @cargo/ui      — web components    (placeholder export)
└─ apps/
   ├─ web-ops/  Vite + React + TS + Tailwind
   └─ mobile/   Expo (React Native) + TS
```

Internal packages are consumed as `workspace:*` dependencies under the `@cargo/*`
scope. They export their **TypeScript source directly** (`exports → ./src/index.ts`),
so there is no build step — Vite, Metro, and `tsc` each transpile the source.

Every app imports `{ tokens }` from `@cargo/tokens` and renders it on a stub
screen (`CARGO <app>`). That import is the proof that cross-package wiring works
on each platform.

## Commands

Install everything (run once, from the repo root):

```bash
pnpm install
```

Run each app:

```bash
pnpm dev:web-ops   # Vite dev server for apps/web-ops
pnpm dev:mobile    # expo start for apps/mobile
```

Quality gates:

```bash
pnpm typecheck     # tsc --noEmit in every package (pnpm -r typecheck)
pnpm lint          # ESLint (flat config, typescript-eslint recommended)
pnpm format        # Prettier --write .
```

Production build for the web app:

```bash
pnpm --filter web-ops build
```

## Expo in a pnpm monorepo (the important part)

React Native's **Metro** bundler does not understand pnpm's workspace layout out
of the box: by default it only looks inside `apps/mobile`, so it would fail to
resolve `@cargo/tokens` (a symlinked workspace package) and any dependency
hoisted to the repo root. Two pieces of configuration fix this, both following
Expo's official monorepo guide (<https://docs.expo.dev/guides/monorepos/>):

1. **`.npmrc` → `node-linker=hoisted`.** Expo recommends a hoisted `node_modules`
   layout for pnpm so Metro can resolve dependencies the way it expects. This is
   the single most common source of "module not found" pain with Expo + pnpm.

2. **`apps/mobile/metro.config.js`.** It extends Expo's default config to:
   - `watchFolders = [monorepoRoot]` — so edits in `packages/*` trigger rebuilds;
   - `resolver.nodeModulesPaths = [app/node_modules, root/node_modules]` — so
     Metro resolves modules from the app first, then the repo root.

### Verification status of the mobile app

The skeleton's required check for mobile is `tsc --noEmit` (a device/simulator run
is intentionally out of scope). That proves the **type-level** import of
`@cargo/tokens` resolves. Metro's *runtime* resolution is configured per Expo's
guide above but is **not** exercised by `tsc` — to verify it for real, run
`pnpm dev:mobile` (or `pnpm --filter mobile exec expo export`) on a machine with
the Expo toolchain. The web app (`web-ops`), by contrast, is verified
end-to-end because its production build runs as part of the checks below.

## Toolchain notes

- TypeScript **strict** mode everywhere (shared `tsconfig.base.json`).
- Web apps use `moduleResolution: "bundler"`; the mobile app extends
  `expo/tsconfig.base`.
- Node build scripts for native deps (`esbuild`, `@tailwindcss/oxide`,
  `@parcel/watcher`) are allow-listed under `pnpm.onlyBuiltDependencies` in
  `pnpm-workspace.yaml`, because pnpm 10+ blocks dependency build scripts by
  default.
- Two React versions coexist **by design**: the web apps pin `react@19.2.7`
  (matched with `react-dom`), while `apps/mobile` uses `react@19.2.3` — the exact
  version Expo SDK 56 pins for `react-native@0.85.3` (added via `expo install`,
  not by hand). Each app's subtree is internally consistent; this is not a
  version conflict.

## Verified

On Node 22.22.3 / pnpm 11.5.3:

- ✅ `pnpm install` — clean
- ✅ `pnpm typecheck` — green across all packages
- ✅ `pnpm lint` — clean
- ✅ `pnpm --filter web-ops build` — succeeds
- ✅ `pnpm --filter mobile exec tsc --noEmit` — green
