'use client';

import React from 'react';
import clsx from 'clsx';
import styles from './Label.module.scss';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label 
      className={clsx(styles.label, required && styles.required, className)} 
      {...props}
    >
      {children}
    </label>
  );
}
