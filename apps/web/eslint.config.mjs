import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    ignores: [".next/**", "src/generated/**"],
  },
  {
    rules: {
      // New react-hooks v5 rules — downgrade to warn since pre-existing code doesn't comply
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
];
