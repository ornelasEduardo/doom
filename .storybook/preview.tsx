import type { Preview } from "@storybook/react";
import { Montserrat } from "next/font/google";
import React from "react";

import { DesignSystemProvider } from "../DesignSystemProvider";
import { ThemeKey, themes } from "../styles/themes/definitions";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "default",
      toolbar: {
        icon: "paintbrush",
        items: Object.keys(themes).map((theme) => ({
          value: theme,
          title: themes[theme as ThemeKey].name,
        })),
        showName: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as ThemeKey;

      React.useEffect(() => {
        document.body.classList.add(montserrat.variable);
        return () => {
          document.body.classList.remove(montserrat.variable);
        };
      }, []);

      return (
        <DesignSystemProvider initialTheme={theme}>
          <Story />
        </DesignSystemProvider>
      );
    },
  ],
};

export default preview;
