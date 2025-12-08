'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

const StyledSkeleton = styled.div<{ $width?: string; $height?: string; $variant?: string }>`
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.06) 25%,
    rgba(0, 0, 0, 0.12) 37%,
    rgba(0, 0, 0, 0.06) 63%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  /* Dimensions */
  width: ${props => props.$width || '100%'};
  height: ${props => props.$height || 'auto'};

  /* Variant Styles */
  ${props => {
    switch (props.$variant) {
      case 'circular':
        return `
          border-radius: 50%;
          height: ${props.$height || props.$width || '3rem'};
          width: ${props.$width || props.$height || '3rem'};
        `;
      case 'text':
        return `
          height: ${props.$height || '1em'};
          border-radius: var(--radius);
          margin-bottom: 0.5rem;
        `;
      case 'rectangular':
      default:
        return `
          height: ${props.$height || '10rem'};
          border-radius: var(--radius);
        `;
    }
  }}
`;

export function Skeleton({ 
  width, 
  height, 
  variant = 'rectangular', 
  className, 
  style,
  ...props 
}: SkeletonProps) {
  return (
    <StyledSkeleton 
      $width={width} 
      $height={height} 
      $variant={variant} 
      className={className} 
      style={style}
      {...props} 
    />
  );
}
