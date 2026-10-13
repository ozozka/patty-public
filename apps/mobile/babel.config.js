module.exports = function (api) {
  const isTest =
    process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  api.cache.using(() => (isTest ? 'test' : 'default'));

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            src: './src',
            assets: './assets',
          },
        },
      ],
      ...(isTest ? [] : [['react-native-unistyles/plugin', { root: 'src' }]]),
      'react-native-reanimated/plugin',
    ],
  };
};
