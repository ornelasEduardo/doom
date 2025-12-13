'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const AlertContainer = styled.div<{ variant: AlertVariant }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: var(--spacing-md);
  width: 100%;
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  background-color: var(--card-bg);
  box-shadow: var(--shadow-sm); /* Subtle depth, not full hard shadow usually */
  position: relative;
  overflow: hidden;

  /* Left accent border */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 6px;
    background-color: ${props => `var(--${props.variant})`};
  }

  ${props => props.variant === 'info' && css`
    /* Info Styles */
  `}
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const Title = styled.h5`
  margin: 0;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  line-height: 1.5;
`;

const IconWrapper = styled.div<{ variant: AlertVariant }>`
  color: ${props => `var(--${props.variant})`};
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

interface AlertProps {
  variant?: AlertVariant;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

export function Alert({ variant = 'info', title, description, icon, className }: AlertProps) {
  const IconComponent = icons[variant];

  return (
    <AlertContainer variant={variant} className={className} role="alert">
      <IconWrapper variant={variant}>
        {icon || <IconComponent size={20} strokeWidth={2.5} />}
      </IconWrapper>
      <Content>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </Content>
    </AlertContainer>
  );
}
