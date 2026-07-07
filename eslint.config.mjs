import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Flat config is the only format ESLint 10 will support, and it's what
// eslint-config-next ships natively as of Next.js 16 (next lint itself was
// removed — see package.json's "lint" script, which now calls eslint
// directly and gates the production build on it).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'prisma/dev.db']),
]);

export default eslintConfig;
