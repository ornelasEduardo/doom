'use client';

import clsx from 'clsx';
import styles from './Link.module.scss';
import React from 'react';

export type LinkVariant = 'default' | 'button' | 'subtle';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  variant?: LinkVariant;
  className?: string; // Explicitly add className to props
}

export function Link({ children, variant = 'default', className, ...props }: LinkProps) {
  return (
    <a 
      className={clsx(styles.link, styles[variant], className)} 
      {...props}
    >
      {children}
    </a>
  );
}
