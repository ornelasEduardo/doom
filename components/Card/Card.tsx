'use client';

'use client';

'use client';

import React from 'react';
import styled from '@emotion/styled';

const StyledCard = styled.div`
  background-color: var(--card-bg);
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-hard);
  min-width: 0; /* Safe default for grid/flex items */
`;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  disabled?: boolean;
}

export function Card({ children, className, as, ...props }: CardProps) {
  return (
    <StyledCard as={as} className={className} {...props}>
      {children}
    </StyledCard>
  );
}
