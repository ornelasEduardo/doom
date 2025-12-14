'use client';

import clsx from 'clsx';
import styles from './Tabs.module.scss';
import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

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
  return <div className={clsx(styles.tabsList, className)}>{children}</div>;
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
    <button 
      className={clsx(styles.tabsTrigger, isActive && styles.active, className)}
      onClick={() => {
        context.setActiveTab(value);
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

interface TabsBodyProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TabsBody({ children, className, style }: TabsBodyProps) {
  return <div className={clsx(styles.tabsBody, className)} style={style}>{children}</div>;
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

  return <div className={clsx(styles.tabsContent, className)}>{children}</div>;
}
