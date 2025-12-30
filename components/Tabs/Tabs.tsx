"use client";

import clsx from "clsx";
import React, { createContext, useContext, useId, useState } from "react";

import styles from "./Tabs.module.scss";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextType | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultValue || "",
  );
  const reactId = useId();

  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalActiveTab;

  const setActiveTab = (newValue: string) => {
    if (!isControlled) {
      setInternalActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId: reactId }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: "left" | "right";
}

export function TabsList({
  children,
  className,
  align = "left",
  ...props
}: TabsListProps) {
  return (
    <div
      aria-label={props["aria-label"] || "Tabs"}
      aria-orientation="horizontal"
      className={clsx(styles.tabsList, styles[`align-${align}`], className)}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsTrigger({
  value,
  children,
  className,
  onClick,
  ...props
}: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const isActive = context.activeTab === value;
  const triggerId = `tabs-trigger-${context.baseId}-${value}`;
  const contentId = `tabs-content-${context.baseId}-${value}`;

  return (
    <button
      aria-controls={isActive ? contentId : undefined}
      aria-selected={isActive}
      className={clsx(styles.tabsTrigger, isActive && styles.active, className)}
      id={triggerId}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      type="button"
      onClick={(e) => {
        context.setActiveTab(value);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TabsBody({
  children,
  className,
  style,
  ...props
}: TabsBodyProps) {
  return (
    <div className={clsx(styles.tabsBody, className)} style={style} {...props}>
      {children}
    </div>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within Tabs");
  }

  const isActive = context.activeTab === value;
  const triggerId = `tabs-trigger-${context.baseId}-${value}`;
  const contentId = `tabs-content-${context.baseId}-${value}`;

  if (!isActive) {
    return null;
  }

  return (
    <div
      aria-labelledby={triggerId}
      className={clsx(styles.tabsContent, className)}
      id={contentId}
      role="tabpanel"
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
}
