'use client';

import React from 'react';
import styled from '@emotion/styled';

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--foreground);
`;

const ValueDisplay = styled.span`
  font-family: var(--font-mono, monospace);
  font-weight: 700;
  color: var(--primary);
  font-size: var(--text-base);
  min-width: 3ch;
  text-align: right;
`;

const TrackWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: var(--muted);
  overflow: visible;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${props => props.percentage}%;
  background: var(--primary);
  border-radius: 999px;
  z-index: 1;
`;

const RangeInput = styled.input<{ percentage: number }>`
  -webkit-appearance: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  cursor: pointer;
  margin: 0;
  z-index: 10;

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 8px;
    background: transparent;
    border: none;
  }
  
  &::-moz-range-track {
    width: 100%;
    height: 8px;
    background: transparent;
    border: none;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    background: var(--primary);
    border: 3px solid var(--background);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--card-border);
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: -6px;
  }

  &::-moz-range-thumb {
    height: 20px;
    width: 20px;
    background: var(--primary);
    border: 3px solid var(--background);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--card-border);
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover::-webkit-slider-thumb {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent);
  }

  &:hover::-moz-range-thumb {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent);
  }

  &:active::-webkit-slider-thumb {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 6px color-mix(in srgb, var(--primary) 25%, transparent);
  }

  &:active::-moz-range-thumb {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 6px color-mix(in srgb, var(--primary) 25%, transparent);
  }

  &:focus {
    outline: none;
  }

  &:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  &:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:disabled::-webkit-slider-thumb {
    background: var(--muted-foreground);
    cursor: not-allowed;
  }

  &:disabled::-moz-range-thumb {
    background: var(--muted-foreground);
    cursor: not-allowed;
  }
`;

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

  const percentage = ((currentValue - (min as number)) / ((max as number) - (min as number))) * 100;

  return (
    <SliderContainer className={className}>
      {(label || showValue) && (
        <LabelRow>
          {label && <span>{label}</span>}
          {showValue && <ValueDisplay>{currentValue}</ValueDisplay>}
        </LabelRow>
      )}
      <TrackWrapper>
        <ProgressFill percentage={percentage} />
        <RangeInput
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          percentage={percentage}
          {...props}
        />
      </TrackWrapper>
    </SliderContainer>
  );
}
