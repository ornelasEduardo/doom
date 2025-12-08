import { css } from '@emotion/react';
import { themes } from './themes';

// Use the default theme as the baseline for the design system
const defaultTheme = themes.default.variables;

export const themeDefaults = css`
  :root {
    ${Object.entries(defaultTheme)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ')}
  }
`;
