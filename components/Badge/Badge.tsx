'use client';

'use client';

'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary';

interface StyledBadgeProps {
  variant: BadgeVariant;
}

const StyledBadge = styled.span<StyledBadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid var(--card-border);
  box-shadow: 2px 2px 0px 0px var(--card-border);

  ${props => props.variant === 'primary' && css`
    background-color: var(--primary);
    color: var(--primary-foreground);
  `}

  ${props => props.variant === 'success' && css`
    background-color: var(--success);
    color: var(--card-bg);
  `}

  ${props => props.variant === 'warning' && css`
    background-color: var(--warning);
    color: var(--card-bg);
  `}

  ${props => props.variant === 'error' && css`
    background-color: var(--error);
    color: var(--card-bg);
  `}

  ${props => props.variant === 'secondary' && css`
    background-color: var(--secondary);
    color: var(--secondary-foreground);
  `}
`;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'primary', children, ...props }: BadgeProps) {
  return (
    <StyledBadge variant={variant} {...props}>
      {children}
    </StyledBadge>
  );
}
