'use client';

import React from 'react';
import styles from './Layout.module.scss';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: string;
  gap?: string;
}

export function Grid({ children, columns = '1fr', gap = '1rem', className, style, ...props }: GridProps) {
  return (
    <div 
      className={`${styles.grid} ${className || ''}`}
      style={{ 
        gridTemplateColumns: columns,
        gap,
        ...style 
      }}
      {...props}
    >
      {children}
    </div>
  );
}

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: string;
  wrap?: boolean;
}

export function Flex({ 
  children, 
  direction = 'row', 
  justify = 'flex-start', 
  align = 'stretch', 
  gap = '0', 
  wrap = false,
  className,
  style,
  ...props 
}: FlexProps) {
  return (
    <div 
      className={`${styles.flex} ${className || ''}`}
      style={{
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        gap,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
