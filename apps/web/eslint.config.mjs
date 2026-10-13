import nextPlugin from "@next/eslint-plugin-next";
import { baseConfig } from "@patty/config/eslint/base.mjs";

export default [
  ...baseConfig,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "tailwind.config.js",
      "postcss.config.mjs",
    ],
  },
];
