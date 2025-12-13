'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Popover } from '../Popover';

const TooltipTriggerWrapper = styled.div`
  display: inline-block;
  cursor: help; /* Optional hint */
`;

const TooltipBody = styled.div`
  padding: 0.5rem 0.75rem;
  background-color: var(--foreground);
  color: var(--background);
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  border-radius: var(--radius);
  border: var(--border-width) solid var(--card-border);
  box-shadow: var(--shadow-sm);
  z-index: var(--z-tooltip);
`;

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
        <TooltipTriggerWrapper 
          onMouseEnter={show} 
          onMouseLeave={hide} 
          onFocus={show} 
          onBlur={hide}
        >
          {children}
        </TooltipTriggerWrapper>
      }
      content={
        <TooltipBody role="tooltip">
          {content}
        </TooltipBody>
      }
    />
  );
}
