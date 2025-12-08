'use client';

import React from 'react';
import styled from '@emotion/styled';

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--text-base);
  background: var(--card-bg);
  color: var(--foreground);
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-hard);
  outline: none;
  transition: all 0.1s ease;
  font-family: inherit;
  resize: vertical;

  &:focus {
    box-shadow: var(--shadow-hover);
    transform: translate(-2px, -2px);
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--muted);
  }
`;

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea(props: TextareaProps) {
  return <StyledTextarea {...props} />;
}
