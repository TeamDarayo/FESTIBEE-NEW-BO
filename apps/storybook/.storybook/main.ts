import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join } from "path";
import tailwindcss from "@tailwindcss/vite";

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: ["../../../packages/ui/stories/**/*.stories.@(ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@chromatic-com/storybook"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite") as "@storybook/react-vite",
    options: {},
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: async (config) => {
    const uiPackagePath = join(__dirname, "../../../packages/ui");

    // Add Tailwind CSS plugin
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());

    // Configure path aliases
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // UI package exports
      "@festibee/ui/styles": join(uiPackagePath, "src/styles.css"),
      "@festibee/ui/tokens": join(uiPackagePath, "src/tokens/index.css"),
      "@festibee/ui/theme": join(uiPackagePath, "src/tokens/theme.css"),
      "@festibee/ui": join(uiPackagePath, "src"),
      // Internal path aliases used by shadcn components
      "@ui": join(uiPackagePath, "src"),
      "src": join(uiPackagePath, "src"),
    };
    return config;
  },
};

export default config;
