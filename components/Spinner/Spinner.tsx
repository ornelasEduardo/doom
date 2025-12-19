'use client';

import React from 'react';
import clsx from 'clsx';
import { LoaderCircle } from 'lucide-react';
import styles from './Spinner.module.scss';

export interface SpinnerProps extends React.ComponentProps<typeof LoaderCircle> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Spinner({ 
  size = 'md', 
  className, 
  strokeWidth = 2,
  ...props 
}: SpinnerProps) {
  return (
    <LoaderCircle 
      className={clsx(
        styles.spinner, 
        styles[size], 
        className
      )}
      role="status"
      aria-label="Loading"
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
