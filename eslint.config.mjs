import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Server Components render per request, so Date.now() is fine there.
  { files: ["src/app/**/*.tsx"], rules: { "react-hooks/purity": "off" } },
  // Static SPA fetches its data in effects (no server components there).
  { files: ["web/**/*.tsx"], rules: { "react-hooks/set-state-in-effect": "off" } },
  // Apps Script source uses Apps Script globals and the `_` suffix convention.
  { files: ["apps-script/src/**/*.js"], languageOptions: { globals: { Lib: "readonly", CONTENT: "readonly", SpreadsheetApp: "readonly", LockService: "readonly", CacheService: "readonly", UrlFetchApp: "readonly", Session: "readonly", PropertiesService: "readonly", DriveApp: "readonly", Utilities: "readonly", ContentService: "readonly", Classroom: "readonly", console: "readonly" } }, rules: { "@typescript-eslint/no-unused-vars": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".data/**",
    "web/dist/**",
    "apps-script/dist/**",
    "web/src/generated/**",
  ]),
]);

export default eslintConfig;
