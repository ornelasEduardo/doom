'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

const StyledLabel = styled.label<{ required?: boolean }>`
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  ${props => props.required && css`
    &::after {
      content: '*';
      color: var(--error);
      margin-left: 0.25rem;
    }
  `}
`;

export function Label({ children, required, ...props }: LabelProps) {
  return <StyledLabel required={required} {...props}>{children}</StyledLabel>;
}
