'use client';

import React from 'react';
import styled from '@emotion/styled';

import { baseInteractiveStyles, focusStyles } from '../../styles/mixins';

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--text-base);
  background: var(--card-bg);
  color: var(--foreground);
  font-family: inherit;
  resize: vertical;

  ${baseInteractiveStyles}
  ${focusStyles}

  &::placeholder {
    color: var(--muted);
  }
`;

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea(props: TextareaProps) {
  return <StyledTextarea {...props} />;
}
