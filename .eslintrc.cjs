/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module", project: true },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/stylistic",
    "prettier",
  ],
  ignorePatterns: ["node_modules", "dist", ".next", "coverage", "*.cjs", "**/prisma/migrations/**"],
  overrides: [
    { files: ["**/*.test.ts", "**/*.spec.ts"], env: { jest: true } },
  ],
};
