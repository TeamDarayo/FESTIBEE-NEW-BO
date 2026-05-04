import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["src/generated/**", "node_modules/**", "dist/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
    rules: {},
  },
];
