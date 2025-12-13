import { css } from '@emotion/react';

export const baseInteractiveStyles = css`
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-hard);
  transition: all 0.1s ease;
  outline: none;
`;

export const focusStyles = css`
  &:focus, &:focus-visible, &[aria-expanded="true"] {
    outline: none;
    transform: translate(-2px, -2px);
    box-shadow: 7px 7px 0px 0px var(--shadow-primary);
    border-color: var(--primary);
  }
`;

export const errorStyles = css`
  border-color: var(--error);
  box-shadow: 5px 5px 0px 0px var(--shadow-error);

  &:focus, &:focus-visible {
    border-color: var(--error);
    box-shadow: 7px 7px 0px 0px var(--shadow-error);
  }
`;
