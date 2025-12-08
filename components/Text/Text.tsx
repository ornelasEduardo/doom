'use client';

import React from 'react';
import styled from '@emotion/styled';

// Use ComponentPropsWithoutRef for better type safety with HTML attributes
type BaseProps = Omit<React.ComponentPropsWithoutRef<'span'>, 'color'>;

interface CustomTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small' | 'caption';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  color?: 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'warning';
  align?: 'left' | 'center' | 'right';
  as?: React.ElementType; // Allow any valid React element type
  htmlFor?: string;
}

// Merge types
export interface TextProps extends BaseProps, CustomTextProps {}

// Use transient props for styled component
interface StyledTextProps {
  $variant?: TextProps['variant'];
  $weight?: TextProps['weight'];
  $color?: TextProps['color'];
  $align?: TextProps['align'];
}

const StyledText = styled.span<StyledTextProps>`
  /* Variant styles */
  ${props => {
    switch (props.$variant) {
      case 'h1':
        return `
          font-size: var(--text-5xl);
          font-weight: var(--font-black);
          line-height: 1.1;
          letter-spacing: -0.02em;
        `;
      case 'h2':
        return `
          font-size: var(--text-4xl);
          font-weight: var(--font-black);
          line-height: 1.1;
          letter-spacing: -0.02em;
        `;
      case 'h3':
        return `
          font-size: var(--text-3xl);
          font-weight: var(--font-black);
          line-height: 1.1;
        `;
      case 'h4':
        return `
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          line-height: 1.2;
        `;
      case 'h5':
        return `
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          line-height: 1.3;
        `;
      case 'h6':
        return `
          font-size: var(--text-lg);
          font-weight: var(--font-bold);
          line-height: 1.4;
        `;
      case 'small':
        return `
          font-size: var(--text-xs);
          line-height: 1.5;
        `;
      case 'caption':
        return `
          font-size: var(--text-xs);
          line-height: 1.5;
          color: var(--muted-foreground);
        `;
      case 'body':
      default:
        return `
          font-size: var(--text-base);
          line-height: 1.6;
        `;
    }
  }}

  /* Weight styles */
  ${props => {
    switch (props.$weight) {
      case 'normal':
        return 'font-weight: var(--font-regular);';
      case 'medium':
        return 'font-weight: var(--font-medium);';
      case 'semibold':
        return 'font-weight: var(--font-bold);'; // Mapping semibold to bold
      case 'bold':
        return 'font-weight: var(--font-bold);';
      case 'black':
        return 'font-weight: var(--font-black);';
      default:
        return '';
    }
  }}

  /* Color styles */
  ${props => {
    switch (props.$color) {
      case 'primary':
        return 'color: var(--primary);';
      case 'secondary':
        return 'color: var(--secondary);';
      case 'muted':
        return 'color: var(--muted-foreground);';
      case 'error':
        return 'color: var(--error);';
      case 'success':
        return 'color: var(--success);';
      case 'warning':
        return 'color: var(--warning);';
      default:
        return 'color: var(--foreground);';
    }
  }}

  /* Alignment */
  text-align: ${props => props.$align || 'left'};
`;

export function Text({
  variant = 'body',
  weight,
  color,
  align,
  className,
  style,
  children,
  as,
  ...props
}: TextProps) {
  // Determine the HTML element to use
  const element = as || (variant?.startsWith('h') ? variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' : 'span');

  return (
    <StyledText
      as={element}
      $variant={variant}
      $weight={weight}
      $color={color}
      $align={align}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </StyledText>
  );
}
