'use client';

import React, { createContext, useContext } from 'react';
import styled from '@emotion/styled';

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ItemLabel = styled.label<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  position: relative;
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  transition: all 0.15s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not([aria-disabled="true"]) {
    background-color: var(--muted);
    background-color: color-mix(in srgb, var(--primary) 8%, transparent);
  }
`;

const RadioCircle = styled.div<{ checked: boolean }>`
  width: 22px;
  height: 22px;
  border: 2px solid ${props => props.checked ? 'var(--primary)' : 'var(--foreground)'};
  border-radius: 50%;
  background: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;

  ${props => props.checked && `
    border-color: var(--primary);
    background: var(--primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 15%, transparent);
  `}
`;

const InnerDot = styled.div`
  width: 10px;
  height: 10px;
  background: var(--primary-foreground);
  border-radius: 50%;
  transform: scale(0);
  animation: radioScale 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;

  @keyframes radioScale {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;

  &:focus-visible ~ div {
    outline: var(--outline-width) solid var(--primary);
    outline-offset: var(--outline-offset);
  }
`;

const LabelText = styled.span`
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--text-base);
  color: var(--foreground);
  user-select: none;
`;

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
      <Group role="radiogroup" className={className}>
        {children}
      </Group>
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
    <ItemLabel disabled={isDisabled} aria-disabled={isDisabled} className={className}>
      <HiddenInput 
        type="radio" 
        name={context.name} 
        value={value} 
        checked={checked} 
        onChange={() => !isDisabled && context.onChange(value)}
        disabled={isDisabled}
      />
      <RadioCircle checked={checked} aria-hidden="true">
        {checked && <InnerDot />}
      </RadioCircle>
      <LabelText>{children}</LabelText>
    </ItemLabel>
  );
}
