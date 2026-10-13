const path = require('path');

module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    localstorage: '',
  },
  rootDir: path.resolve(__dirname),
  transformIgnorePatterns: [
    // The (?:\.bun/[^/]+/node_modules/)? prefix handles bun's symlink-resolved cache paths
    // in monorepo workspaces where node_modules symlinks resolve to the root .bun cache.
    // All exceptions are grouped after the optional prefix so the prefix applies to all of them.
    'node_modules/(?!(?:\\.bun/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler|lucide-react-native|msw|until-async|@mswjs/interceptors|headers-polyfill))',
  ],
  moduleNameMapper: {
    '^@patty/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^assets/(.*)$': '<rootDir>/assets/$1',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|css)$':
      '<rootDir>/src/__mocks__/fileMock.ts',
  },
  setupFiles: [
    '<rootDir>/jest.setup.early.ts',
    '<rootDir>/jest.setup.static.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/utils/test-utils.tsx',
    '<rootDir>/src/__tests__/utils/factories.ts',
    '<rootDir>/src/__tests__/utils/resetStores.ts',
    '<rootDir>/src/__tests__/utils/screenTestStrategy.md',
  ],
};
