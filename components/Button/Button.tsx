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
  --btn-focus-border: var(--primary);
  --btn-focus-shadow: var(--shadow-primary);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: 
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
    box-shadow 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  cursor: pointer;
  border: var(--border-width) solid var(--card-border);
  box-shadow: var(--shadow-hard);
  background-color: var(--card-bg);
  color: var(--foreground);
  font-size: var(--text-base);
  position: relative;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-hover);
  }

  &:focus {
    outline: none;
    box-shadow: 7px 7px 0px 0px var(--btn-focus-shadow);
    transform: translate(-2px, -2px);
    border-color: var(--btn-focus-border);
  }

  &:active {
    transition: none;
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-hard);
  }

  /* Variants */
  ${props => props.variant === 'primary' && css`
    /* Contrast Override */
    --btn-focus-border: var(--card-border);
    --btn-focus-shadow: #000000;

    background-color: var(--primary);
    color: var(--primary-foreground);
    &:hover {
      filter: brightness(1.1);
    }
  `}

  ${props => props.variant === 'secondary' && css`
    /* Contrast Override */
    --btn-focus-border: var(--card-border);
    --btn-focus-shadow: #000000;

    background-color: var(--secondary);
    color: var(--secondary-foreground);
    &:hover {
      filter: brightness(1.1);
    }
  `}

  ${props => props.variant === 'success' && css`
    /* Contrast Override */
    --btn-focus-border: var(--card-border);
    --btn-focus-shadow: #000000;

    background-color: var(--success);
    color: var(--card-bg);
    &:hover {
      filter: brightness(1.1);
    }
  `}
  
  ${props => props.variant === 'outline' && css`
    background-color: transparent;
  `}

  ${props => props.variant === 'ghost' && css`
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;
    &:hover, &:focus {
      background-color: color-mix(in srgb, var(--primary), transparent 90%);
      color: var(--primary);
      transform: none;
      box-shadow: none;
      border-color: transparent;
      outline: none;
    }
    &:active {
      transform: scale(0.95);
      transition: none;
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
