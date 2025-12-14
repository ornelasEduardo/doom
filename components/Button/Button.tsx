'use client';

import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className,
  ...props 
}: ButtonProps) {
  const buttonClass = clsx(
    styles.button,
    styles[variant],
    styles[size],
    className
  );

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
}
