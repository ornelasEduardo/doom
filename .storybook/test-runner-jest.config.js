import { getJestConfig } from "@storybook/test-runner";

export default {
  ...getJestConfig(),
  modulePathIgnorePatterns: [
    "<rootDir>/.worktrees/",
    "<rootDir>/dist/",
    "<rootDir>/storybook-static/",
  ],
};
