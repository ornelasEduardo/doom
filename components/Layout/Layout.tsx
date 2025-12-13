'use client';

'use client';

'use client';

import React from 'react';
import styled from '@emotion/styled';

interface StyledGridProps {
  columns: string;
  rows?: string;
  gap: string;
}

const StyledGrid = styled.div<StyledGridProps>`
  display: grid;
  grid-template-columns: ${props => props.columns};
  grid-template-rows: ${props => props.rows || 'auto'};
  gap: ${props => props.gap};
`;

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: string;
  rows?: string;
  gap?: string;
}

export function Grid({ children, columns = '1fr', rows, gap = '1rem', ...props }: GridProps) {
  return (
    <StyledGrid columns={columns} rows={rows} gap={gap} {...props}>
      {children}
    </StyledGrid>
  );
}

interface StyledFlexProps {
  direction: 'row' | 'column';
  justify: string;
  align: string;
  gap: string;
  $wrap: boolean;
}

const StyledFlex = styled.div<StyledFlexProps>`
  display: flex;
  flex-direction: ${props => props.direction};
  justify-content: ${props => props.justify};
  align-items: ${props => props.align};
  gap: ${props => props.gap};
  flex-wrap: ${props => props.$wrap ? 'wrap' : 'nowrap'};
`;

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: string;
  wrap?: boolean;
}

export function Flex({ 
  children, 
  direction = 'row', 
  justify = 'flex-start', 
  align = 'stretch', 
  gap = '0', 
  wrap = false,
  ...props 
}: FlexProps) {
  return (
    <StyledFlex 
      direction={direction} 
      justify={justify} 
      align={align} 
      gap={gap} 
      $wrap={wrap} 
      {...props}
    >
      {children}
    </StyledFlex>
  );
}
