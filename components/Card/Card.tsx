'use client';

import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.scss';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  disabled?: boolean;
}

export function Card({ children, className, as: Component = 'div', ...props }: CardProps) {
  return (
    <Component className={clsx(styles.card, className)} {...props}>
      {children}
    </Component>
  );
}
