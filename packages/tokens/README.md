# @cargo/tokens

The single source of design tokens for all three CARGO apps (`web-ops`, `pvz`,
`mobile`). Pure TypeScript — **zero runtime dependencies**, no React/JSX/DOM. The
package is consumed two ways:

- **TS source directly** (`exports["."] → ./src/index.ts`): web (Vite) and React
  Native (Metro) both import the typed token objects — `import { color, badgeStatus, space } from '@cargo/tokens'`.
- **Generated CSS** (`./theme.css`, `./variables.css`): the web apps `@import`
  these for Tailwind utilities and raw CSS variables.

## Cross-platform value contract

| Group | Stored as | Web (CSS) | React Native |
|---|---|---|---|
| Colors | hex string | raw hex | raw hex |
| Spacing, radii, font sizes, line heights | unitless number | `+ px` | number as-is |
| Durations | unitless number (ms) | `+ ms` | number as-is |
| Font weights, z-index | unitless number | as-is | as-is |
| Shadows | `{ x, y, blur, spread, color, opacity }` | composed `box-shadow` (opacity → rgba) | map to `shadowOffset`/`shadowRadius`/`elevation` |

Shadows are deliberately **structured objects**, never pre-baked CSS strings, so
each platform composes its own form.

## What's in here

- `color` — 6 scales (`accent`, `neutral`, `success`, `warning`, `danger`, `info`), steps 50–950.
- `role` — semantic layer (`bg`, `text`, `border`, `accent`, `focus`, `intent`). **This is the dark-theme seam:** components consume roles, so a future dark theme remaps roles, not raw steps. Dark values are not implemented.
- `badgeStatus` (10) / `badgeClaim` (3) — the two independent status axes (TZ §3). **Literal values**, not derived from the scales (some hues are intentionally absent from the scales). Shape: `{ bg, text, border? }`.
- `fontFamily` (system `sans` / `mono` stacks), `fontWeight` (400/500/600/700), `typeScale` — two density scales (`compact` for web-ops, `comfortable` for mobile/pvz), each `xs`…`2xl` with paired `fontSize`/`lineHeight`.
- `space` (base-4), `radius` (`sm`/`md`/`lg`/`full`), `shadow` (`sm`/`md`/`lg`), `duration` (`fast`/`normal`/`slow`), `zIndex` (`dropdown`/`sticky`/`modal`/`toast`).
- `tokens` — aggregate of all of the above.

## CSS generation

`tokensToCss()` and `tokensToTailwindTheme()` (in `src/index.ts`) turn the TS
tokens into CSS. The `gen:css` script writes both files into `dist/`:

```sh
pnpm --filter @cargo/tokens gen:css   # → dist/variables.css + dist/theme.css
```

It runs with plain Node (≥ 22.18 strips TS types) — no build tool, no extra
dependency. The generated files are **committed** so every app build and dev
server is deterministic with no ordering dependency on a token build step.
Re-run `gen:css` and commit after changing any token value.

- **`dist/variables.css`** — `tokensToCss()`: a full `:root { … }` block with
  every token as a CSS custom property: `--color-accent-600`, `--space-4: 16px`,
  `--badge-DONE-bg`, `--claim-CLAIMED-border`, `--text-compact-md-size`,
  `--shadow-md`, `--duration-fast: 120ms`, `--z-modal`, …
- **`dist/theme.css`** — `tokensToTailwindTheme()`: a Tailwind 4 `@theme { … }`
  block that turns the scales into utilities.

## Tailwind 4 wiring (web-ops, pvz)

Each web app's entry CSS imports Tailwind, then the generated theme, then the
variable export:

```css
@import 'tailwindcss';
@import '@cargo/tokens/theme.css';     /* → utilities */
@import '@cargo/tokens/variables.css'; /* → raw :root vars (badges, shadows, …) */
```

`@theme` makes these utilities available (all from the same tokens):

- Colors: `bg-accent-600`, `text-neutral-900`, `border-info-200`, … (every scale × step).
- Spacing: `--spacing: 4px` drives the numeric scale, so `p-4` = 16px = `space[4]`.
- Radii: `rounded-md`, `rounded-full`, …
- Fonts: `font-sans`, `font-mono`, `font-semibold`, …
- Type scales: `text-compact-md`, `text-comfortable-2xl`, … (each carries its paired line-height).

### Accessing badge colors in Tailwind

Badge/claim colors are **intentionally excluded from `@theme`** — their values
are literal, not scale steps, so keeping them out of the utility namespace avoids
implying they are. They ship as plain CSS variables in `variables.css` and are
reached with arbitrary values (or inline styles / the future `Badge` component):

```tsx
<span className="bg-[var(--badge-DONE-bg)] text-[var(--badge-DONE-text)]">DONE</span>
<span className="bg-[var(--claim-CLAIMED-bg)] border border-[var(--claim-CLAIMED-border)]">CLAIMED</span>
```

## Showcase

`apps/web-ops` renders a token showcase (all 6 scales as labelled swatches, both
badge groups, both type scales, spacing/radii/shadows). `apps/mobile` renders a
few `status` swatches via `StyleSheet` as proof of native consumption.
