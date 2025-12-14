'use client';

import React from 'react';
import clsx from 'clsx';
import styles from './Text.module.scss';

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
  const Component = as || (variant?.startsWith('h') ? variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' : 'span');

  return (
    <Component
      className={clsx(
        styles.text,
        styles[variant],
        weight && styles[`weight-${weight}`],
        color ? styles[`color-${color}`] : (!variant?.startsWith('caption') && styles['color-foreground']),
        align && styles[`align-${align}`],
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}
