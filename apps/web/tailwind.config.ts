import type { Config } from "tailwindcss";
import uiConfig from "@festibee/ui/tailwind-config";

const config: Config = {
  presets: [uiConfig],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
};

export default config;
