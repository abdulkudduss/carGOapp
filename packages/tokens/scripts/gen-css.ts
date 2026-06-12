// Generates packages/tokens/dist/{variables.css,theme.css} from the TS tokens.
// Run with plain Node (>=22.18 strips TS types): `node scripts/gen-css.ts`.
// The explicit `.ts` import extension is required by Node's type stripping.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokensToCss, tokensToTailwindTheme } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'dist');

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, 'variables.css'), tokensToCss());
writeFileSync(join(distDir, 'theme.css'), tokensToTailwindTheme());

console.log('@cargo/tokens: wrote dist/variables.css and dist/theme.css');
