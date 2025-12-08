import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../components/**/*.mdx", "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs",
    options: {
      builder: {
        useSWC: true,
        lazyCompilation: false,
      },
      nextConfigPath: undefined,
    },
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};
export default config;
