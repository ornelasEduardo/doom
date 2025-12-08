'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button, Popover } from '../..';

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

const DropdownItem = styled.button`
  text-align: left;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--foreground);
  cursor: pointer;
  border-radius: calc(var(--radius) - 2px);
  font-size: var(--text-base);
  transition: background-color 0.2s;

  &:hover {
    background-color: color-mix(in srgb, var(--primary), transparent 85%);
    color: var(--primary);
  }
`;

// Create a styled version of Button to handle the active state locally
const TriggerButton = styled(Button)`
  &[aria-expanded="true"] {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-hover);
  }
`;

interface DropdownItemType {
  label: string;
  onClick: () => void;
}

interface DropdownProps {
  triggerLabel: string;
  items: DropdownItemType[];
  variant?: 'primary' | 'secondary';
}

export function Dropdown({ triggerLabel, items, variant = 'primary' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-start"
      trigger={
        <TriggerButton variant={variant} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          {triggerLabel} <span style={{ marginLeft: '0.5rem', fontSize: '0.8em' }}>▼</span>
        </TriggerButton>
      }
      content={
        <StyledDropdownMenu>
          {items.map((item, index) => (
            <DropdownItem
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </DropdownItem>
          ))}
        </StyledDropdownMenu>
      }
    />
  );
}
