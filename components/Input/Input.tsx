'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import {  Text  } from '../..';

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

const StyledInput = styled.input<{ hasStartAdornment?: boolean; hasEndAdornment?: boolean; isError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: ${props => props.hasStartAdornment ? '2rem' : '1rem'};
  padding-right: ${props => props.hasEndAdornment ? '2rem' : '1rem'};
  font-size: var(--text-base);
  background: var(--card-bg);
  color: var(--foreground);
  border: var(--border-width) solid ${props => props.isError ? 'var(--error)' : 'var(--card-border)'};
  border-radius: var(--radius);
  box-shadow: var(--shadow-hard);
  outline: none;
  transition: all 0.1s ease;

  &:focus {
    box-shadow: var(--shadow-hover);
    transform: translate(-2px, -2px);
    border-color: ${props => props.isError ? 'var(--error)' : 'var(--primary)'};
  }

  &::placeholder {
    color: var(--muted);
  }

  &::-webkit-calendar-picker-indicator {
    background-color: var(--muted-foreground);
    cursor: pointer;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E");
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-position: center;
    mask-size: contain;
    -webkit-mask-size: contain;
    transition: background-color 0.2s;
    width: 1em;
    height: 1em;

    &:hover {
      background-color: var(--foreground);
    }
  }

  &[type="time"]::-webkit-calendar-picker-indicator {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolyline points='12 6 12 12 16 14'%3E%3C/polyline%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolyline points='12 6 12 12 16 14'%3E%3C/polyline%3E%3C/svg%3E");
  }

  &::-webkit-search-cancel-button {
    -webkit-appearance: none;
    background-color: var(--muted-foreground);
    cursor: pointer;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E");
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-position: center;
    mask-size: contain;
    -webkit-mask-size: contain;
    transition: background-color 0.2s;
    width: 1em;
    height: 1em;

    &:hover {
      background-color: var(--foreground);
    }
  }
`;

const Adornment = styled.span<{ position: 'start' | 'end' }>`
  position: absolute;
  ${props => props.position === 'start' ? 'left: 0.75rem;' : 'right: 0.75rem;'}
  color: var(--muted-foreground);
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 1;
`;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  format?: (value: string | number | readonly string[] | undefined) => string;
  validate?: (value: string | number | readonly string[] | undefined) => string | undefined;
}

export function Input({ 
  label, 
  error: errorProp, 
  helperText, 
  startAdornment, 
  endAdornment, 
  style, 
  className, 
  format,
  validate,
  onBlur,
  onFocus,
  value,
  ...props 
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>(undefined);

  const error = errorProp || internalError;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (validate) {
      setInternalError(validate(e.target.value));
    }
    if (onBlur) onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  // Use formatted value when not focused, otherwise raw value
  const displayValue = (!isFocused && format && value !== undefined) 
    ? format(value) 
    : value;

  return (
    <InputContainer style={style} className={className}>
      {label && (
        <Text as="label" variant="small" weight="bold" color="muted" className="mb-1 block">
          {label}
        </Text>
      )}
      
      <InputWrapper>
        {startAdornment && <Adornment position="start">{startAdornment}</Adornment>}
        <StyledInput 
          {...props} 
          value={displayValue}
          hasStartAdornment={!!startAdornment}
          hasEndAdornment={!!endAdornment}
          isError={!!error}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        {endAdornment && <Adornment position="end">{endAdornment}</Adornment>}
      </InputWrapper>

      {error && (
        <Text variant="caption" color="error" className="mt-1">
          {error}
        </Text>
      )}
      {!error && helperText && (
        <Text variant="caption" color="muted" className="mt-1">
          {helperText}
        </Text>
      )}
    </InputContainer>
  );
}
