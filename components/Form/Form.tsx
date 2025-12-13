'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';


const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const StyledField = styled.div<{ error?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  
`;


import { Label } from '../Label/Label';
export { Label };

const StyledMessage = styled.span<{ variant: 'error' | 'description' }>`
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => props.variant === 'error' && css`
    color: var(--error);
    font-weight: 700;
    text-transform: uppercase;
    animation: shake 0.3s ease-in-out;
  `}

  ${props => props.variant === 'description' && css`
    color: var(--muted-foreground);
  `}

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
`;


export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ children, ...props }: FormProps) {
  return <StyledForm {...props}>{children}</StyledForm>;
}


export interface FormMessageProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'error' | 'description';
}

export function FormMessage({ children, variant = 'description', ...props }: FormMessageProps) {
  return <StyledMessage variant={variant} {...props}>{children}</StyledMessage>;
}


export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label?: string;
  error?: string | boolean;
  description?: string;
  htmlFor?: string;
  required?: boolean;
}

export function Field({ 
  children, 
  label, 
  error, 
  description, 
  htmlFor, 
  required,
  ...props 
}: FieldProps) {
  return (
    <StyledField error={!!error} {...props}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}

      {description && !error && (
        <FormMessage variant="description">{description}</FormMessage>
      )}

      {error && typeof error === 'string' && (
        <FormMessage variant="error">{error}</FormMessage>
      )}
    </StyledField>
  );
}

export const FormGroup = StyledField;
