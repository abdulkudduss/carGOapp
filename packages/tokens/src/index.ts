// @cargo/tokens — single source of design tokens for all three CARGO apps
// (web-ops, pvz, mobile). Pure TypeScript: zero runtime deps, no React/JSX/DOM.
//
// Cross-platform contract:
//   - colors are hex strings;
//   - dimensions (spacing, radii, font sizes, line heights) are unitless numbers
//     — the CSS generator appends `px`, React Native consumes them as-is;
//   - durations are unitless numbers in milliseconds (CSS appends `ms`);
//   - shadows are structured objects { x, y, blur, spread, color, opacity }, never
//     pre-baked CSS strings — RN maps them to shadowOffset/shadowRadius/elevation,
//     the web generator composes a `box-shadow` value.
//
// Dark theme is NOT implemented here, but the structure is laid out: components
// consume the semantic `role` layer (roles → values), so a future dark theme only
// has to remap roles, not every call site.

// ===========================================================================
// Raw color scales (authoritative palette — verbatim, do not re-derive)
// ===========================================================================

export const color = {
  // Accent — vermillion. primary = 600, link/hover = 700.
  accent: {
    50: '#FCF4F2',
    100: '#FAE6E2',
    200: '#F5CDC6',
    300: '#EDA89D',
    400: '#E37B6B',
    500: '#DC5440',
    600: '#D93A2B',
    700: '#B12F21',
    800: '#93291E',
    900: '#7A281F',
    950: '#420F0A',
  },
  // Neutral — warm gray. app-bg = 50, text = 900.
  neutral: {
    50: '#FAF8F5',
    100: '#F3F0EA',
    200: '#E8E3DB',
    300: '#D6CFC4',
    400: '#B1A899',
    500: '#8C8273',
    600: '#6F6557',
    700: '#564E41',
    800: '#3E382E',
    900: '#2A2620',
    950: '#1A1712',
  },
  success: {
    50: '#F0FAF2',
    100: '#DCF4E3',
    200: '#BBE8CA',
    300: '#8CD6A6',
    400: '#57BC7D',
    500: '#339E5D',
    600: '#248049',
    700: '#1F663C',
    800: '#1C5132',
    900: '#18432B',
    950: '#0B2517',
  },
  // Warning — amber.
  warning: {
    50: '#FDF9EB',
    100: '#FBF0C9',
    200: '#F7DF8E',
    300: '#F2C94C',
    400: '#ECB325',
    500: '#D99A12',
    600: '#BB770C',
    700: '#95560E',
    800: '#7B4413',
    900: '#693814',
    950: '#3D1D07',
  },
  // Danger — cold carmine, intentionally offset from accent.
  danger: {
    50: '#FDF2F5',
    100: '#FBE4EA',
    200: '#F8CAD7',
    300: '#F29FB5',
    400: '#E96A8C',
    500: '#DC3B66',
    600: '#C7224E',
    700: '#A8173F',
    800: '#8C163A',
    900: '#781737',
    950: '#43071A',
  },
  // Info — blue-teal.
  info: {
    50: '#EFF9FB',
    100: '#DEF1F7',
    200: '#BCE3EE',
    300: '#8BCEE0',
    400: '#4FB0CA',
    500: '#2D93AF',
    600: '#207690',
    700: '#1E6076',
    800: '#1F4F61',
    900: '#1E4352',
    950: '#0E2733',
  },
} as const;

// ===========================================================================
// Semantic role layer (the dark-theme seam — remap these, not raw steps)
// ===========================================================================

export const role = {
  bg: {
    app: color.neutral[50],
    surface: '#FFFFFF',
    sunken: color.neutral[100],
  },
  text: {
    primary: color.neutral[900],
    secondary: color.neutral[600],
    muted: color.neutral[500],
    inverse: color.neutral[50],
  },
  border: {
    subtle: color.neutral[200],
    default: color.neutral[300],
    strong: color.neutral[400],
  },
  accent: {
    primary: color.accent[600],
    hover: color.accent[700],
    subtle: color.accent[50],
    onAccent: '#FFFFFF',
  },
  focus: color.info[500],
  // Status intents (success/warning/danger/info), independent of badge maps.
  intent: {
    success: { fg: color.success[700], bg: color.success[50], border: color.success[200] },
    warning: { fg: color.warning[800], bg: color.warning[50], border: color.warning[200] },
    danger: { fg: color.danger[700], bg: color.danger[50], border: color.danger[200] },
    info: { fg: color.info[700], bg: color.info[50], border: color.info[200] },
  },
} as const;

// ===========================================================================
// Status badges — TWO independent axes (TZ §3). Literal values: these are NOT
// derived from the scales above (some hues — blue/violet — are absent on purpose).
// ===========================================================================

// Axis 1 — `status` (where the parcel physically is). 10 values.
export const badgeStatus = {
  AT_JP: { bg: '#DCE7FA', text: '#2C55A5' },
  PACKED: { bg: '#D7ECFA', text: '#135E96' },
  SHIPPED: { bg: '#D2F0F6', text: '#0F6B84' },
  CUSTOMS: { bg: '#E9E4F8', text: '#5847A8' },
  AT_KG: { bg: '#FCE4CB', text: '#91501B' },
  DELIVERY: { bg: '#FBDCD2', text: '#B0371F' },
  DONE: { bg: '#D8F3E0', text: '#1E7142' },
  RETURNED: { bg: '#EAE5DC', text: '#5B5346' },
  LOST: { bg: '#FBE0E8', text: '#A8173F' },
  DISPOSED: { bg: '#DFD9CD', text: '#3E382E' },
} as const;

// Axis 2 — `claim_status` (whose parcel it is). 3 values.
export const badgeClaim = {
  UNCLAIMED: { bg: '#F8ECBC', text: '#7A5B08' },
  CLAIMED: { bg: '#F3F0EA', text: '#6F6557', border: '#E5E0D6' },
  DISPUTED: { bg: '#F9D2DC', text: '#8C163A' },
} as const;

// ===========================================================================
// Typography — system stacks, no custom fonts. Two density scales.
// Line heights are absolute px numbers (cross-platform: RN lineHeight is absolute).
// ===========================================================================

export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const typeScale = {
  // Web Operations: dense tables and forms.
  compact: {
    xs: { fontSize: 11, lineHeight: 16 },
    sm: { fontSize: 12, lineHeight: 16 },
    md: { fontSize: 13, lineHeight: 18 },
    lg: { fontSize: 15, lineHeight: 22 },
    xl: { fontSize: 18, lineHeight: 26 },
    '2xl': { fontSize: 22, lineHeight: 30 },
  },
  // Mobile + PVZ: body ≥ 16, comfortable touch targets.
  comfortable: {
    xs: { fontSize: 13, lineHeight: 18 },
    sm: { fontSize: 14, lineHeight: 20 },
    md: { fontSize: 16, lineHeight: 24 },
    lg: { fontSize: 18, lineHeight: 26 },
    xl: { fontSize: 22, lineHeight: 30 },
    '2xl': { fontSize: 28, lineHeight: 36 },
  },
} as const;

// ===========================================================================
// Spacing / radii / shadows / durations / z-index
// ===========================================================================

// Base-4 scale. Keys are 4px multipliers, values are px.
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

// Structured shadows (NOT CSS strings). color = neutral 950 for a warm shadow.
export const shadow = {
  sm: { x: 0, y: 1, blur: 2, spread: 0, color: '#1A1712', opacity: 0.06 },
  md: { x: 0, y: 4, blur: 12, spread: -2, color: '#1A1712', opacity: 0.1 },
  lg: { x: 0, y: 12, blur: 32, spread: -4, color: '#1A1712', opacity: 0.16 },
} as const;

// Durations in milliseconds.
export const duration = {
  fast: 120,
  normal: 200,
  slow: 320,
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  toast: 1400,
} as const;

// ===========================================================================
// Aggregate (back-compat default consumption + cheap of everything)
// ===========================================================================

export const tokens = {
  color,
  role,
  badgeStatus,
  badgeClaim,
  fontFamily,
  fontWeight,
  typeScale,
  space,
  radius,
  shadow,
  duration,
  zIndex,
} as const;

// ===========================================================================
// CSS generation
// ===========================================================================
//
// Unit rules (keyed by token group):
//   - colors: raw hex
//   - spacing / radii / font sizes / line heights: append `px`
//   - durations: append `ms`
//   - font weights / z-index: unitless
//   - shadows: composed into a `box-shadow`-ready value (opacity folded into rgba)

type ShadowToken = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
};

function rgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function shadowToCss(s: ShadowToken): string {
  return `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${rgba(s.color, s.opacity)}`;
}

/**
 * Emit every token as a CSS custom property inside a `:root { ... }` block.
 * This is the full variable export (colors, badges, spacing, type, shadows, …)
 * consumed by the web apps; badge/claim colors live here because they are NOT
 * part of the Tailwind utility namespace (see tokensToTailwindTheme).
 */
export function tokensToCss(): string {
  const lines: string[] = [];

  // Colors: --color-{scale}-{step}
  for (const [scale, steps] of Object.entries(color)) {
    for (const [step, hex] of Object.entries(steps)) {
      lines.push(`  --color-${scale}-${step}: ${hex};`);
    }
  }

  // Status badges (axis `status`): --badge-{NAME}-{bg|text}
  for (const [name, v] of Object.entries(badgeStatus)) {
    lines.push(`  --badge-${name}-bg: ${v.bg};`);
    lines.push(`  --badge-${name}-text: ${v.text};`);
  }

  // Claim badges (axis `claim_status`): --claim-{NAME}-{bg|text|border}
  for (const [name, v] of Object.entries(badgeClaim)) {
    lines.push(`  --claim-${name}-bg: ${v.bg};`);
    lines.push(`  --claim-${name}-text: ${v.text};`);
    if ('border' in v) {
      lines.push(`  --claim-${name}-border: ${v.border};`);
    }
  }

  // Typography
  lines.push(`  --font-sans: ${fontFamily.sans};`);
  lines.push(`  --font-mono: ${fontFamily.mono};`);
  for (const [name, weight] of Object.entries(fontWeight)) {
    lines.push(`  --weight-${name}: ${weight};`);
  }
  for (const [density, steps] of Object.entries(typeScale)) {
    for (const [step, v] of Object.entries(steps)) {
      lines.push(`  --text-${density}-${step}-size: ${v.fontSize}px;`);
      lines.push(`  --text-${density}-${step}-line: ${v.lineHeight}px;`);
    }
  }

  // Spacing / radii
  for (const [step, n] of Object.entries(space)) {
    lines.push(`  --space-${step}: ${n}px;`);
  }
  for (const [name, n] of Object.entries(radius)) {
    lines.push(`  --radius-${name}: ${n}px;`);
  }

  // Shadows (composed, ready for `box-shadow: var(--shadow-md)`)
  for (const [name, s] of Object.entries(shadow)) {
    lines.push(`  --shadow-${name}: ${shadowToCss(s)};`);
  }

  // Durations / z-index
  for (const [name, ms] of Object.entries(duration)) {
    lines.push(`  --duration-${name}: ${ms}ms;`);
  }
  for (const [name, z] of Object.entries(zIndex)) {
    lines.push(`  --z-${name}: ${z};`);
  }

  return `:root {\n${lines.join('\n')}\n}\n`;
}

/**
 * Emit the Tailwind 4 `@theme { ... }` block that turns scales into utilities
 * (bg-accent-600, text-neutral-900, rounded-md, text-comfortable-md, …).
 * Badges are intentionally excluded — their literal values are not scale steps,
 * so they stay out of the utility namespace and are reached via var(--badge-*).
 */
export function tokensToTailwindTheme(): string {
  const lines: string[] = [];

  // Colors → bg-*/text-*/border-* utilities
  for (const [scale, steps] of Object.entries(color)) {
    for (const [step, hex] of Object.entries(steps)) {
      lines.push(`  --color-${scale}-${step}: ${hex};`);
    }
  }

  // Spacing base — drives the numeric scale (p-4 = calc(var(--spacing) * 4) = 16px)
  lines.push(`  --spacing: ${space[1]}px;`);

  // Radii → rounded-* utilities
  for (const [name, n] of Object.entries(radius)) {
    lines.push(`  --radius-${name}: ${n}px;`);
  }

  // Fonts → font-sans / font-mono and font-{weight} utilities
  lines.push(`  --font-sans: ${fontFamily.sans};`);
  lines.push(`  --font-mono: ${fontFamily.mono};`);
  for (const [name, weight] of Object.entries(fontWeight)) {
    lines.push(`  --font-weight-${name}: ${weight};`);
  }

  // Type scales → text-{density}-{step} utilities (with paired line-height)
  for (const [density, steps] of Object.entries(typeScale)) {
    for (const [step, v] of Object.entries(steps)) {
      lines.push(`  --text-${density}-${step}: ${v.fontSize}px;`);
      lines.push(`  --text-${density}-${step}--line-height: ${v.lineHeight}px;`);
    }
  }

  return `@theme {\n${lines.join('\n')}\n}\n`;
}
