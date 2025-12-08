'use client';

import React, { createContext, useContext, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// --- Context ---
interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

// --- Styled Components ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledTabsList = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0;
  padding-left: 1rem;
  position: relative;
  /* z-index is managed by triggers */
`;

interface StyledTriggerProps {
  isActive: boolean;
}

const StyledTabsTrigger = styled.button<StyledTriggerProps>`
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--primary);
  color: var(--primary-foreground);
  opacity: ${props => props.isActive ? '1' : '0.6'};
  border: var(--border-width) solid var(--card-border);
  border-bottom: var(--border-width) solid var(--card-border);
  border-radius: var(--radius) var(--radius) 0 0;
  cursor: pointer;
  position: relative;
  z-index: ${props => props.isActive ? 'var(--z-elevated)' : 1};
  transition: all 0.2s ease;
  transform: ${props => props.isActive ? 'translateY(0)' : 'translateY(4px)'};

  &:hover {
    ${props => !props.isActive && `
      opacity: 0.8;
      transform: translateY(2px);
    `}
  }
`;

const StyledTabsBody = styled.div`
  background: var(--card-bg);
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  padding: 2.5rem;
  box-shadow: var(--shadow-hard);
  position: relative;
  z-index: 5;
  min-height: 600px;
  margin-top: -3px;
`;

const StyledTabsContent = styled.div`
  animation: ${fadeIn} 0.3s ease-out forwards;
`;

// --- Components ---

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || '');
  
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalActiveTab;

  const setActiveTab = (newValue: string) => {
    if (!isControlled) {
      setInternalActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return <StyledTabsList className={className}>{children}</StyledTabsList>;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TabsTrigger({ value, children, className, onClick }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const isActive = context.activeTab === value;

  return (
    <StyledTabsTrigger 
      isActive={isActive}
      onClick={() => {
        context.setActiveTab(value);
        onClick?.();
      }}
      className={className}
    >
      {children}
    </StyledTabsTrigger>
  );
}

interface TabsBodyProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TabsBody({ children, className, style }: TabsBodyProps) {
  return <StyledTabsBody className={className} style={style}>{children}</StyledTabsBody>;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  if (context.activeTab !== value) return null;

  return <StyledTabsContent className={className}>{children}</StyledTabsContent>;
}
