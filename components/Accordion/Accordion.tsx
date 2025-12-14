'use client';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import styles from './Accordion.module.scss';
import React, { useState } from 'react';

interface AccordionItemProps {
  value: string;
  trigger: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AccordionItem({ value, trigger, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className={styles.item}>
      <h3 className={styles.header}>
        <button 
          className={styles.trigger}
          type="button" 
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          {trigger}
          <ChevronDown size={20} strokeWidth={2.5} className={styles.icon} />
        </button>
      </h3>
      <div 
        className={styles.contentWrapper} 
        aria-hidden={!isOpen}
        role="region"
      >
        <div className={styles.contentBody}>{children}</div>
      </div>
    </div>
  );
}

interface AccordionProps {
  type?: 'single' | 'multiple';
  children: React.ReactNode; 
  defaultValue?: string | string[];
  className?: string;
}

export function Accordion({ type = 'single', children, defaultValue, className }: AccordionProps) {
  const [value, setValue] = useState<string | string[]>(defaultValue || (type === 'multiple' ? [] : ''));

  const handleToggle = (itemValue: string) => {
    if (type === 'single') {
      setValue(prev => prev === itemValue ? '' : itemValue);
    } else {
      setValue(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        if (arr.includes(itemValue)) {
          return arr.filter(v => v !== itemValue);
        }
        return [...arr, itemValue];
      });
    }
  };

  return (
    <div className={clsx(styles.root, className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        
        const itemValue = (child as React.ReactElement<AccordionItemProps>).props.value;
        const isOpen = Array.isArray(value) ? value.includes(itemValue) : value === itemValue;
        
        return React.cloneElement(child as React.ReactElement<any>, {
          isOpen,
          onToggle: () => handleToggle(itemValue),
        });
      })}
    </div>
  );
}
