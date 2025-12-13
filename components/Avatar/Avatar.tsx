'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: React.ReactNode;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

const sizeMap = {
  sm: '32px',
  md: '48px',
  lg: '64px',
  xl: '96px',
};

const fontSizeMap = {
  sm: 'var(--text-xs)',
  md: 'var(--text-base)',
  lg: 'var(--text-lg)',
  xl: 'var(--text-2xl)',
};

const AvatarContainer = styled.div<{ size: AvatarSize; shape: AvatarShape }>`
  position: relative;
  width: ${props => sizeMap[props.size]};
  height: ${props => sizeMap[props.size]};
  border: var(--border-width) solid var(--card-border);
  border-radius: ${props => props.shape === 'circle' ? '50%' : 'var(--radius)'};
  overflow: hidden;
  background-color: var(--card-bg); /* Fallback bg */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Fallback = styled.span<{ size: AvatarSize }>`
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: ${props => fontSizeMap[props.size]};
  color: var(--primary-foreground);
  background-color: var(--primary);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
`;

export function Avatar({ 
  src, 
  alt = 'Avatar', 
  fallback, 
  size = 'md', 
  shape = 'circle', 
  className 
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <AvatarContainer size={size} shape={shape} className={className}>
      {src && !hasError ? (
        <AvatarImage 
          src={src} 
          alt={alt} 
          onError={() => setHasError(true)} 
        />
      ) : (
        <Fallback size={size}>
          {typeof fallback === 'string' ? fallback.slice(0, 2) : fallback}
        </Fallback>
      )}
    </AvatarContainer>
  );
}
