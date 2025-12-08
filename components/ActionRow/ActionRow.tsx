'use client';

import React from 'react';
import styled from '@emotion/styled';
import { Text } from '../Text/Text';
import { Flex } from '../Layout/Layout';
import { ChevronRight } from 'lucide-react';

// Extend Flex to add interactive styles
const StyledActionRow = styled(Flex)`
  padding: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: var(--border-width) solid var(--card-border);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(var(--muted-rgb, 113, 128, 150), 0.1);
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  flex-shrink: 0;
`;

interface ActionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
}

export function ActionRow({ icon, title, description, onClick, className, ...props }: ActionRowProps) {
  return (
    <StyledActionRow 
      align="center" 
      gap="1.5rem" 
      onClick={onClick} 
      className={className}
      {...props}
    >
      <IconWrapper>
        {icon}
      </IconWrapper>
      <Flex direction="column" gap="0.25rem" style={{ flex: 1 }}>
        <Text variant="h6" weight="bold">
          {title}
        </Text>
        {description && (
          <Text color="muted" variant="small">
            {description}
          </Text>
        )}
      </Flex>
      <ChevronRight size={20} strokeWidth={2.5} style={{ color: 'var(--muted-foreground)' }} />
    </StyledActionRow>
  );
}
