'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { ChevronDown } from 'lucide-react';


const AccordionRoot = styled.div`
  display: flex;
  flex-direction: column;
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  background-color: var(--card-bg);
  overflow: hidden;
`;

const Item = styled.div`
  border-bottom: var(--border-width) solid var(--card-border);
  &:last-child {
    border-bottom: none;
  }
`;

const Header = styled.h3`
  display: flex;
  margin: 0;
`;

const Trigger = styled.button<{ isOpen: boolean }>`
  all: unset;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--text-base);
  background-color: var(--card-bg);
  color: var(--foreground);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: color-mix(in srgb, var(--primary) 25%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    z-index: 1;
  }

  & > svg {
    transition: transform 0.2s ease;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const ContentWrapper = styled.div<{ isOpen: boolean }>`
  height: ${props => props.isOpen ? 'auto' : '0'};
  overflow: hidden;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const ContentBody = styled.div`
  padding: var(--spacing-md);
  padding-top: 0;
  font-size: var(--text-base);
  color: var(--muted-foreground);
  line-height: 1.6;
`;


interface AccordionItemProps {
  value: string;
  trigger: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AccordionItem({ value, trigger, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <Item>
      <Header>
        <Trigger 
          type="button" 
          isOpen={!!isOpen} 
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          {trigger}
          <ChevronDown size={20} strokeWidth={2.5} />
        </Trigger>
      </Header>
      <ContentWrapper isOpen={!!isOpen} role="region">
        <ContentBody>{children}</ContentBody>
      </ContentWrapper>
    </Item>
  );
}

interface AccordionProps {
  type?: 'single' | 'multiple';
  children: React.ReactNode; 
  defaultValue?: string | string[];
  className?: string;
}

export function Accordion({ type = 'single', children, defaultValue, className }: AccordionProps) {
  const [value, setValue] = useState<string | string[]>(defaultValue || (type === 'multiple' ? [] : ''));

  const handleToggle = (itemValue: string) => {
    if (type === 'single') {
      setValue(prev => prev === itemValue ? '' : itemValue);
    } else {
      setValue(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        if (arr.includes(itemValue)) {
          return arr.filter(v => v !== itemValue);
        }
        return [...arr, itemValue];
      });
    }
  };

  return (
    <AccordionRoot className={className}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        
        const itemValue = (child as React.ReactElement<AccordionItemProps>).props.value;
        const isOpen = Array.isArray(value) ? value.includes(itemValue) : value === itemValue;
        
        return React.cloneElement(child as React.ReactElement<any>, {
          isOpen,
          onToggle: () => handleToggle(itemValue),
        });
      })}
    </AccordionRoot>
  );
}
