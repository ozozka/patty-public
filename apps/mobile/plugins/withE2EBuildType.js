const { withAppBuildGradle, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const E2E_BUILD_TYPE = `
        e2e {
            initWith release
            matchingFallbacks = ['release']
            signingConfig signingConfigs.debug
        }`;

// Uses a proper network-security-config instead of relying solely on
// usesCleartextTraffic. Android ignores that attribute when a networkSecurityConfig
// is present (which Expo/RNGP adds for production builds), so cleartext to the
// emulator loopback (10.0.2.2) would otherwise be silently blocked.
const E2E_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <application
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config"
        tools:replace="android:usesCleartextTraffic,android:networkSecurityConfig" />
</manifest>
`;

const E2E_NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">10.0.2.2</domain>
    </domain-config>
</network-security-config>
`;

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withE2EBuildType = (config) => {
  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('e2e {')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /buildTypes\s*\{/,
        `buildTypes {${E2E_BUILD_TYPE}`,
      );
    }
    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    (mod) => {
      const manifestDir = path.join(
        mod.modRequest.platformProjectRoot,
        'app/src/e2e',
      );
      fs.mkdirSync(manifestDir, { recursive: true });
      fs.writeFileSync(
        path.join(manifestDir, 'AndroidManifest.xml'),
        E2E_MANIFEST,
      );

      const resXmlDir = path.join(manifestDir, 'res', 'xml');
      fs.mkdirSync(resXmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(resXmlDir, 'network_security_config.xml'),
        E2E_NETWORK_SECURITY_CONFIG,
      );

      return mod;
    },
  ]);

  return config;
};

module.exports = withE2EBuildType;
