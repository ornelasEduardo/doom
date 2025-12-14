'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, useId } from 'react';
import clsx from 'clsx';
import { Text } from '../Text/Text';
import { Popover } from '../Popover/Popover';
import { Check, ChevronDown } from 'lucide-react';
import styles from './Select.module.scss';


interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: { value: string | number; label: string }[];
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}

export function Select({ 
  options, 
  className, 
  label, 
  style, 
  value, 
  defaultValue, 
  onChange, 
  placeholder, 
  id, 
  required,
  disabled,
  name,
  form,
  autoFocus,
  ...props 
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const reactId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = id ? `${id}-listbox` : `select-listbox-${reactId}`;
  const labelId = id ? `${id}-label` : `select-label-${reactId}`;

  const currentValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find(opt => String(opt.value) === String(currentValue));

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const index = options.findIndex(opt => String(opt.value) === String(currentValue));
      setHighlightedIndex(index >= 0 ? index : 0);
    }
  }, [isOpen, currentValue, options]);

  const handleSelect = (newValue: string | number) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      const syntheticEvent = {
        target: { value: newValue, name: name },
        currentTarget: { value: newValue, name: name },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      
      onChange(syntheticEvent);
    }
    
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex].value);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  return (
    <div className={clsx(styles.container, className)} style={style}>
      {label && (
        <Text 
          as="label" 
          id={labelId}
          variant="small" 
          weight="bold" 
          color="muted" 
          className="mb-1 block"
          htmlFor={id}
        >
          {label}
        </Text>
      )}
      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-start"
        trigger={
          <button
            ref={triggerRef}
            className={styles.trigger}
            type="button" 
            id={id}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-labelledby={label ? labelId : undefined}
            disabled={disabled}
            autoFocus={autoFocus}
            {...props as any}
          >
            <span>{selectedOption ? selectedOption.label : (placeholder || 'Select...')}</span>
            <ChevronDown size={16} strokeWidth={2.5} style={{ marginLeft: '0.5rem' }} />
          </button>
        }
        content={
          <ul 
            id={listboxId} 
            role="listbox" 
            aria-labelledby={label ? labelId : undefined}
            className={styles.optionsList}
            style={{ width: triggerRef.current?.offsetWidth }}
          >
            {options.map((opt, index) => {
              const isSelected = String(opt.value) === String(currentValue);
              const isHighlighted = index === highlightedIndex;
              
              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={clsx(
                    styles.optionItem,
                    isSelected && styles.selected,
                    isHighlighted && styles.highlighted
                  )}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </li>
              );
            })}
          </ul>
        }
      />
      <input 
        type="text" 
        name={name} 
        value={currentValue} 
        required={required}
        form={form}
        tabIndex={-1}
        readOnly
        style={{
          opacity: 0,
          height: '1px',
          width: '1px',
          position: 'absolute',
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
