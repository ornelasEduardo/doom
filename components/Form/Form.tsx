import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ children, className = '', style, ...props }: FormProps) {
  return (
    <form 
      className={className}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        ...style 
      }}
      {...props}
    >
      {children}
    </form>
  );
}

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FormGroup({ children, className = '', style, ...props }: FormGroupProps) {
  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem',
        ...style 
      }}
      {...props}
    >
      {children}
    </div>
  );
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children, className = '', style, ...props }: LabelProps) {
  return (
    <label 
      className={className}
      style={{ 
        fontWeight: 700, 
        fontSize: '0.9rem',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style 
      }}
      {...props}
    >
      {children}
    </label>
  );
}
