'use client';

import React, { createContext, useContext } from 'react';
import clsx from 'clsx';
import styles from './RadioGroup.module.scss';


interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({ 
  name, 
  value: controlledValue, 
  defaultValue, 
  onValueChange, 
  disabled, 
  children, 
  className 
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <RadioGroupContext.Provider value={{ name, value: currentValue, onChange: handleChange, disabled }}>
      <div role="radiogroup" className={clsx(styles.group, className)}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RadioGroupItem({ value, children, disabled, className }: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext);
  if (!context) throw new Error('RadioGroupItem must be used within RadioGroup');

  const checked = context.value === value;
  const isDisabled = disabled || context.disabled;

  return (
    <label 
      className={clsx(styles.itemLabel, isDisabled && styles.disabled, className)}
      aria-disabled={isDisabled} 
    >
      <input 
        className={styles.hiddenInput}
        type="radio" 
        name={context.name} 
        value={value} 
        checked={checked} 
        onChange={() => !isDisabled && context.onChange(value)}
        disabled={isDisabled}
      />
      <div 
        className={clsx(styles.radioCircle, checked && styles.checked)} 
        aria-hidden="true"
      >
        {checked && <div className={styles.innerDot} />}
      </div>
      <span className={styles.labelText}>{children}</span>
    </label>
  );
}
