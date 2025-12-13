'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Label } from '../Label/Label';
import { baseInteractiveStyles, focusStyles, errorStyles } from '../../styles/mixins';

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  
  ${baseInteractiveStyles}
  ${focusStyles}

  &::placeholder {
    color: var(--muted);
  }

  ${props => props.isError && errorStyles}
`;

const Adornment = styled.span<{ position: 'start' | 'end' }>`
  position: absolute;
  ${props => props.position === 'start' ? 'left: 0.75rem;' : 'right: 0.75rem;'}
  color: var(--muted-foreground);
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 1;
`;

const HelperText = styled.span<{ isError?: boolean }>`
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: ${props => props.isError ? 'var(--error)' : 'var(--muted-foreground)'};
  
  ${props => props.isError && css`
    font-weight: var(--font-bold);
    text-transform: uppercase;
    animation: input-shake 0.3s ease-in-out;
  `}

  @keyframes input-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
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
  id,
  required,
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

  const displayValue = (!isFocused && format && value !== undefined) 
    ? format(value) 
    : value;

  return (
    <InputContainer style={style} className={className}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      
      <InputWrapper>
        {startAdornment && <Adornment position="start">{startAdornment}</Adornment>}
        <StyledInput 
          id={id}
          required={required}
          value={displayValue}
          hasStartAdornment={!!startAdornment}
          hasEndAdornment={!!endAdornment}
          isError={!!error}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props} 
        />
        {endAdornment && <Adornment position="end">{endAdornment}</Adornment>}
      </InputWrapper>

      {helperText && !error && (
        <HelperText>{helperText}</HelperText>
      )}

      {error && (
        <HelperText isError>{error}</HelperText>
      )}
    </InputContainer>
  );
}
