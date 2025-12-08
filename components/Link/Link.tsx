'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

export type LinkVariant = 'default' | 'button' | 'subtle';

interface StyledLinkProps {
  variant?: LinkVariant;
}

const StyledLink = styled.a<StyledLinkProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
  
  /* Default Variant */
  ${props => (!props.variant || props.variant === 'default') && css`
    color: var(--foreground);
    border-bottom: 2px solid transparent;
    
    &:hover {
      color: var(--primary);
      border-bottom-color: var(--primary);
      transform: translateY(-1px);
    }
  `}

  /* Subtle Variant */
  ${props => props.variant === 'subtle' && css`
    color: var(--muted-foreground);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    
    &:hover {
      color: var(--foreground);
      text-decoration: underline;
    }
  `}

  /* Button-like Variant */
  ${props => props.variant === 'button' && css`
    background-color: var(--primary);
    color: var(--primary-foreground);
    border: var(--border-width) solid var(--card-border);
    border-radius: var(--radius);
    padding: 0.75rem 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: var(--shadow-hover);
    font-size: 0.75rem;
    
    &:hover {
      filter: brightness(1.1);
      transform: translate(-2px, -2px);
      box-shadow: var(--shadow-hover);
    }
    
    &:active {
      transform: translate(0, 0);
      box-shadow: none;
    }
  `}
`;

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  variant?: LinkVariant;
}

export function Link({ children, variant = 'default', ...props }: LinkProps) {
  return (
    <StyledLink variant={variant} {...props}>
      {children}
    </StyledLink>
  );
}
