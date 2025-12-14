'use client';

import { Popover } from '../Popover/Popover';
import styles from './Tooltip.module.scss';
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
  placement?: 'top' | 'bottom';
}

export function Tooltip({ content, children, delay = 200, placement = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const show = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hide = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  // Map simplified placement to Popover placement
  const popoverPlacement = placement === 'top' ? 'top-center' : 'bottom-center';

  return (
    <Popover
      isOpen={isVisible}
      onClose={hide}
      placement={popoverPlacement}
      offset={8}
      trigger={
        <div 
          className={styles.triggerWrapper}
          onMouseEnter={show} 
          onMouseLeave={hide} 
          onFocus={show} 
          onBlur={hide}
        >
          {children}
        </div>
      }
      content={
        <div className={styles.tooltipBody} role="tooltip">
          {content}
        </div>
      }
    />
  );
}
