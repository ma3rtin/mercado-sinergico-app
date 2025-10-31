import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "**/*.spec.ts",
      "src/test/**",
       "**/*.html",
    ],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "single"],
      "@typescript-eslint/no-unused-vars": ["warn"],
    },
  },
  {
    files: ["src/**/*.html"],
    rules: {},
  },
];
