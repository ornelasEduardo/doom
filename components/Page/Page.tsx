'use client';

import React from 'react';
import styled from '@emotion/styled';

interface PageProps {
  children: React.ReactNode;
  /**
   * 'default': Constrained width (65vw) with standard padding.
   * 'fullWidth': Spans the entire viewport width with no default padding.
   */
  variant?: 'default' | 'fullWidth';
  className?: string;
  style?: React.CSSProperties;
}

const PageContainer = styled.main<{ variant: 'default' | 'fullWidth' }>`
  flex: 1;
  width: 100%;
  
  /* Variant Styles */
  ${props => props.variant === 'default' ? `
    width: 90%;
    max-width: 1920px;
    margin: 0 auto;
    padding: 2rem 1rem;

    @media (max-width: 1024px) {
      width: 95%;
      padding: 1rem;
    }
  ` : `
    max-width: 100%;
    margin: 0;
    padding: 0;
  `}
`;

export function Page({ 
  children, 
  variant = 'default',
  className,
  style 
}: PageProps) {
  return (
    <PageContainer variant={variant} className={className} style={style}>
      {children}
    </PageContainer>
  );
}
