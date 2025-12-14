'use client';

import clsx from 'clsx';
import styles from './ProgressBar.module.scss';
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  height?: string | number;
  color?: string;
  showStripes?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  height = '24px', 
  color = 'var(--primary)', 
  showStripes = true,
  className,
  style
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={clsx(styles.container, className)} 
      style={{
        '--height': heightStyle,
        ...style 
      } as React.CSSProperties}
    >
      <div 
        className={styles.fill} 
        style={{ 
          '--percentage': `${percentage}%`,
          '--color': color
        } as React.CSSProperties}
        data-complete={percentage >= 100}
      />
      {showStripes && <div className={styles.stripes} />}
    </div>
  );
}
