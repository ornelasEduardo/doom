'use client';

import clsx from 'clsx';
import { Popover } from '../Popover/Popover';
import { ChevronDown } from 'lucide-react';
import styles from './SplitButton.module.scss';
import React, { useState } from 'react';

interface SplitButtonItem {
  label: string;
  onClick: () => void;
}

interface SplitButtonProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  items: SplitButtonItem[];
  variant?: 'primary' | 'secondary';
  className?: string; // Add className prop
}

export function SplitButton({ 
  primaryLabel, 
  onPrimaryClick, 
  items, 
  variant = 'primary',
  className
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      trigger={
        <div className={clsx(styles.container, styles[variant], className)} aria-expanded={isOpen}>
          <button className={styles.mainButton} onClick={onPrimaryClick}>
            {primaryLabel}
          </button>
          <button className={styles.dropdownTrigger} onClick={() => setIsOpen(!isOpen)}>
            <ChevronDown size={16} strokeWidth={3} />
          </button>
        </div>
      }
      content={
        <div className={styles.menu}>
          {items.map((item, index) => (
            <button
              key={index}
              className={styles.item}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    />
  );
}
