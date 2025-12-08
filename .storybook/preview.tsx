import type { Preview } from "@storybook/react";
import React from 'react';
import { DesignSystemProvider } from '../DesignSystemProvider';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
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
  decorators: [
    (Story) => {
      React.useEffect(() => {
        document.body.classList.add(montserrat.variable);
        return () => {
          document.body.classList.remove(montserrat.variable);
        };
      }, []);

      return (
        <DesignSystemProvider>
          <Story />
        </DesignSystemProvider>
      );
    },
  ],
};

export default preview;
