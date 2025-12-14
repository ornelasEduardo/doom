'use client';

import clsx from 'clsx';
import styles from './Switch.module.scss';
import React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
  readOnly?: boolean;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked = false, onChange, disabled, label, id, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onChange?.(e.target.checked);
    };

    return (
      <label className={clsx(styles.switchContainer, disabled && styles.disabled, className)}>
        <input
          className={styles.input}
          type="checkbox"
          role="switch"
          id={id}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          readOnly={props.readOnly}
          aria-checked={checked}
          {...props}
        />
        <div className={clsx(styles.toggle, checked && styles.checked)} />
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
