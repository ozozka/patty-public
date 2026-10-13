const { withGradleProperties } = require('expo/config-plugins');

const GRADLE_OPTIMIZATIONS = {
  'org.gradle.jvmargs': '-Xmx6g -XX:+UseParallelGC -XX:MaxMetaspaceSize=1g',
  'org.gradle.caching': 'true',
  'org.gradle.daemon': 'true',
  'org.gradle.parallel': 'true',
  'org.gradle.vfs.watch': 'true',
  reactNativeArchitectures: 'x86_64',
};

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withGradleOptimizations = (config) =>
  withGradleProperties(config, (mod) => {
    for (const [key, value] of Object.entries(GRADLE_OPTIMIZATIONS)) {
      const existing = mod.modResults.find(
        (item) => item.type === 'property' && item.key === key,
      );
      if (existing) {
        existing.value = value;
      } else {
        mod.modResults.push({ type: 'property', key, value });
      }
    }
    return mod;
  });

module.exports = withGradleOptimizations;
