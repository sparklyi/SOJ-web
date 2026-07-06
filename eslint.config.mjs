import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "archive/v1-vue/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
