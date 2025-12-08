'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface StyledButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
}

const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.1s ease;
  cursor: pointer;
  border: var(--border-width) solid var(--card-border);
  box-shadow: var(--shadow-hard);
  background-color: var(--card-bg);
  color: var(--foreground);
  font-size: var(--text-base);

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-hover);
  }

  &:active {
    transform: translate(0px, 0px);
    box-shadow: 0px 0px 0px 0px var(--card-border);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-hard);
  }

  /* Variants */
  ${props => props.variant === 'primary' && css`
    background-color: var(--primary);
    color: var(--primary-foreground);
    &:hover {
      filter: brightness(1.1);
    }
  `}

  ${props => props.variant === 'secondary' && css`
    background-color: var(--secondary);
    color: var(--secondary-foreground);
    &:hover {
      filter: brightness(1.1);
    }
  `}

  ${props => props.variant === 'success' && css`
    background-color: var(--success);
    color: var(--card-bg);
    &:hover {
      filter: brightness(1.1);
    }
  `}
  
  ${props => props.variant === 'outline' && css`
    background-color: transparent;
    /* Outline is default style basically */
  `}

  ${props => props.variant === 'ghost' && css`
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;
    &:hover {
      background-color: color-mix(in srgb, var(--primary), transparent 90%);
      color: var(--primary);
      transform: none;
      box-shadow: none;
    }
  `}

  /* Sizes */
  ${props => props.size === 'sm' && css`
    padding: 0.25rem 0.5rem;
    font-size: var(--text-sm);
  `}

  ${props => props.size === 'md' && css`
    padding: 0.75rem 1.5rem;
    font-size: var(--text-base);
  `}

  ${props => props.size === 'lg' && css`
    padding: 1rem 2rem;
    font-size: var(--text-lg);
  `}
`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: ButtonProps) {
  return (
    <StyledButton variant={variant} size={size} {...props}>
      {children}
    </StyledButton>
  );
}
