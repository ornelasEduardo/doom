import { css } from '@emotion/react';

export const resetStyles = css`
  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  html {
    overflow-y: scroll; /* Force scrollbar to prevent layout shift */
    overflow-x: hidden;
    background-color: var(--background);
  }

  body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-montserrat), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;
