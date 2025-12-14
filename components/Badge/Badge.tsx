'use client';

import React from 'react';
import clsx from 'clsx';
import styles from './Badge.module.scss';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'primary', children, className, ...props }: BadgeProps) {
  return (
    <span 
      className={clsx(styles.badge, styles[variant], className)} 
      {...props}
    >
      {children}
    </span>
  );
}
