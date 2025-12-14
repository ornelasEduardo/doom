'use client';

import clsx from 'clsx';
import { Button } from '../Button/Button';
import { Popover } from '../Popover/Popover';
import styles from './Dropdown.module.scss';
import React, { useState } from 'react';

interface DropdownItemType {
  label: string;
  onClick: () => void;
}

interface DropdownProps {
  triggerLabel: string;
  items: DropdownItemType[];
  variant?: 'primary' | 'secondary';
  className?: string; // Add className prop
}

export function Dropdown({ triggerLabel, items, variant = 'primary', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-start"
      trigger={
        <Button 
          variant={variant} 
          onClick={() => setIsOpen(!isOpen)} 
          aria-expanded={isOpen}
          className={clsx(styles.trigger, className)}
        >
          {triggerLabel} <span style={{ marginLeft: '0.5rem', fontSize: '0.8em' }}>▼</span>
        </Button>
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
