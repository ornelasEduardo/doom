'use client';

import clsx from 'clsx';
import styles from './Slider.module.scss';
import React from 'react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  showValue?: boolean;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
}

export function Slider({ 
  label, 
  showValue, 
  value, 
  defaultValue, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className,
  ...props 
}: SliderProps) {
  
  const [internalValue, setInternalValue] = React.useState(defaultValue !== undefined ? defaultValue : (min as number));
  
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    if (!isControlled) {
      setInternalValue(newVal);
    }
    onChange?.(newVal);
  };

  const percentage = ((currentValue! - (min as number)) / ((max as number) - (min as number))) * 100;

  return (
    <div className={clsx(styles.container, className)}>
      {(label || showValue) && (
        <div className={styles.labelRow}>
          {label && <span>{label}</span>}
          {showValue && <span className={styles.valueDisplay}>{currentValue}</span>}
        </div>
      )}
      <div className={styles.trackWrapper}>
        <div 
          className={styles.progressFill} 
          style={{ '--percentage': `${percentage}%` } as React.CSSProperties}
        />
        <input
          className={styles.rangeInput}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          {...props}
        />
      </div>
    </div>
  );
}
