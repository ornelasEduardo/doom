'use client';

import React from 'react';
import styled from '@emotion/styled';

interface StyledContainerProps {
  height: string | number;
}

const StyledContainer = styled.div<StyledContainerProps>`
  height: ${props => typeof props.height === 'number' ? `${props.height}px` : props.height};
  width: 100%;
  background: var(--card-bg);
  border-radius: var(--radius);
  overflow: hidden;
  border: var(--border-width) solid var(--card-border);
  position: relative;
`;

interface StyledFillProps {
  percentage: number;
  color: string;
}

const StyledFill = styled.div<StyledFillProps>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.color};
  border-right: ${props => props.percentage < 100 ? `var(--border-width) solid var(--card-border)` : 'none'};
  transition: width 0.5s ease-out;
`;

const StyledStripes = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(
    45deg, 
    rgba(0, 0, 0, 0.05) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(0, 0, 0, 0.05) 50%, 
    rgba(0, 0, 0, 0.05) 75%, 
    transparent 75%, 
    transparent
  );
  background-size: 20px 20px;
  pointer-events: none;
`;

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  height?: string | number;
  color?: string;
  showStripes?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  height = '24px', 
  color = 'var(--primary)', 
  showStripes = true,
  className,
  style
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <StyledContainer height={height} className={className} style={style}>
      <StyledFill percentage={percentage} color={color} />
      {showStripes && <StyledStripes />}
    </StyledContainer>
  );
}
