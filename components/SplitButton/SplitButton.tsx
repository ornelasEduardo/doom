'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Popover } from '../..';
import { ChevronDown } from 'lucide-react';

interface StyledContainerProps {
  variant: 'primary' | 'secondary';
}

const StyledContainer = styled.div<StyledContainerProps>`
  display: inline-flex;
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-hard);
  background-color: ${props => props.variant === 'primary' ? 'var(--primary)' : 'var(--secondary)'};
  color: ${props => props.variant === 'primary' ? 'var(--primary-foreground)' : 'var(--secondary-foreground)'};
  transition: all 0.1s ease;
  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-hover);
  }

  &[aria-expanded="true"] {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-hover);
  }
`;

const StyledMainButton = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  padding: 0.75rem 1rem;
  padding-right: 0.75rem;
  font-weight: 700;
  font-size: var(--text-base);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  border-right: 2px solid rgba(0,0,0,0.2);

  &:hover {
    background-color: rgba(0,0,0,0.25);
  }
`;

const StyledDropdownTrigger = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  padding: 0.75rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background-color: rgba(0,0,0,0.25);
  }
`;

const StyledDropdownMenu = styled.div`
  background: var(--card-bg);
  border: var(--border-width) solid var(--primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow-hover);
  min-width: 200px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem;
`;

const StyledDropdownItem = styled.button`
  text-align: left;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--foreground);
  cursor: pointer;
  border-radius: calc(var(--radius) - 2px);
  font-size: var(--text-base);
  font-weight: 600;
  transition: background-color 0.2s;

  &:hover {
    background-color: color-mix(in srgb, var(--primary), transparent 85%);
    color: var(--primary);
  }
`;

interface SplitButtonItem {
  label: string;
  onClick: () => void;
}

interface SplitButtonProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  items: SplitButtonItem[];
  variant?: 'primary' | 'secondary';
}

export function SplitButton({ 
  primaryLabel, 
  onPrimaryClick, 
  items, 
  variant = 'primary' 
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      trigger={
        <StyledContainer variant={variant}>
          <StyledMainButton onClick={onPrimaryClick}>
            {primaryLabel}
          </StyledMainButton>
          <StyledDropdownTrigger onClick={() => setIsOpen(!isOpen)}>
            <ChevronDown size={16} strokeWidth={3} />
          </StyledDropdownTrigger>
        </StyledContainer>
      }
      content={
        <StyledDropdownMenu>
          {items.map((item, index) => (
            <StyledDropdownItem
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </StyledDropdownItem>
          ))}
        </StyledDropdownMenu>
      }
    />
  );
}
