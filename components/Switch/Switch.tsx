'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
  readOnly?: boolean;
}

const SwitchContainer = styled.label<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  user-select: none;
`;

const Input = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Toggle = styled.div<{ checked?: boolean }>`
  position: relative;
  width: 58px;
  height: 32px;
  background-color: ${props => props.checked ? 'var(--primary)' : 'var(--card-bg)'};
  border: var(--border-width) solid var(--card-border);
  border-radius: 9999px;
  transition: background-color var(--duration-normal) var(--ease-in-out), transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
  box-shadow: ${props => props.checked ? 'var(--shadow-sm-checked)' : 'var(--shadow-sm)'};
  box-sizing: border-box;

  &::after {
    content: '';
    display: block;
    position: absolute;
    top: 50%;
    left: 4px;
    width: 24px;
    height: 24px;
    background-color: ${props => props.checked ? 'var(--primary-foreground)' : 'var(--muted)'};
    border: var(--border-width) solid var(--card-border);
    border-radius: 50%;
    transform: translateY(-50%) translateX(${props => props.checked ? '20px' : '0'});
    transition: transform var(--duration-normal) var(--ease-in-out), background-color var(--duration-normal) var(--ease-in-out);
    box-sizing: border-box;
  }

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: ${props => props.checked ? 'var(--shadow-sm-checked-hover)' : 'var(--shadow-sm-hover)'};
  }

  &:active {
    transform: translate(0, 0);
    box-shadow: none;
  }
`;

const Label = styled.span`
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--foreground);
`;

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked = false, onChange, disabled, label, id, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onChange?.(e.target.checked);
    };

    return (
      <SwitchContainer disabled={disabled} className={className}>
        <Input
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
        <Toggle checked={checked} />
        {label && <Label>{label}</Label>}
      </SwitchContainer>
    );
  }
);

Switch.displayName = 'Switch';
