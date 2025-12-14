'use client';

import React from 'react';
import clsx from 'clsx';
import { Label } from '../Label/Label';
import styles from './Form.module.scss';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ children, className, ...props }: FormProps) {
  return <form className={clsx(styles.form, className)} {...props}>{children}</form>;
}


export interface FormMessageProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'error' | 'description';
}

export function FormMessage({ children, variant = 'description', className, ...props }: FormMessageProps) {
  return (
    <span 
      className={clsx(
        styles.message, 
        variant === 'error' && styles.error,
        variant === 'description' && styles.description,
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
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
  className,
  ...props 
}: FieldProps) {
  return (
    <div className={clsx(styles.field, className)} {...props}>
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
    </div>
  );
}

export const FormGroup = Field;
