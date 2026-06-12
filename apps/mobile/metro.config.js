// Metro configuration for Expo inside a pnpm workspaces monorepo.
//
// Without this, Metro only looks inside apps/mobile and will NOT find workspace
// packages such as @cargo/tokens, nor dependencies hoisted to the repo root.
// This is the configuration recommended by Expo's official monorepo guide:
//   https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so edits in workspace packages trigger rebuilds.
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve modules from the app first, then from the repo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
