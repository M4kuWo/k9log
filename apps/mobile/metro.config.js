const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// expo/metro-config handles npm-workspaces monorepo resolution automatically
// (SDK 52+) — no manual watchFolders/nodeModulesPaths needed.
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
