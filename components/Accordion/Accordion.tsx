"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { Stack } from "../Layout/Layout";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import styles from "./Accordion.module.scss";
import React, { useState } from "react";

const AccordionContext = React.createContext<{
  value: string | string[];
  onToggle: (value: string) => void;
  type: "single" | "multiple";
} | null>(null);

interface AccordionItemProps {
  value: string;
  trigger: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({
  value,
  trigger,
  children,
  className,
}: AccordionItemProps) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionItem must be used within Accordion");

  const reactId = React.useId();
  const triggerId = `accordion-trigger-${reactId}`;
  const contentId = `accordion-content-${reactId}`;
  const isOpen = Array.isArray(context.value)
    ? context.value.includes(value)
    : context.value === value;

  return (
    <div className={clsx(styles.item, isOpen && styles.isOpen, className)}>
      <Text variant="h3" className={styles.header}>
        <Button
          id={triggerId}
          variant="ghost"
          className={styles.trigger}
          onClick={() => context.onToggle(value)}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          {trigger}
          <ChevronDown size={20} strokeWidth={2.5} className={styles.icon} />
        </Button>
      </Text>
      <div
        id={contentId}
        className={styles.contentWrapper}
        aria-hidden={!isOpen}
        role="region"
        aria-labelledby={triggerId}
      >
        <div className={styles.contentBody}>{children}</div>
      </div>
    </div>
  );
}

interface AccordionProps {
  type?: "single" | "multiple";
  children: React.ReactNode;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
}

export function Accordion({
  type = "single",
  children,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
}: AccordionProps) {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue || (type === "multiple" ? [] : "")
  );

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleToggle = (itemValue: string) => {
    let newValue: string | string[];
    if (type === "single") {
      newValue = currentValue === itemValue ? "" : itemValue;
    } else {
      const arr = Array.isArray(currentValue) ? currentValue : [];
      newValue = arr.includes(itemValue)
        ? arr.filter((v) => v !== itemValue)
        : [...arr, itemValue];
    }

    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <AccordionContext.Provider
      value={{ value: currentValue, onToggle: handleToggle, type }}
    >
      <Stack gap={0} className={clsx(styles.root, className)}>
        {children}
      </Stack>
    </AccordionContext.Provider>
  );
}
