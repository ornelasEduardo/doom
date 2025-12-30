"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { Button } from "../Button/Button";
import { Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import styles from "./Accordion.module.scss";

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
  if (!context) {
    throw new Error("AccordionItem must be used within Accordion");
  }

  const reactId = React.useId();
  const triggerId = `accordion-trigger-${reactId}`;
  const contentId = `accordion-content-${reactId}`;
  const isOpen = Array.isArray(context.value)
    ? context.value.includes(value)
    : context.value === value;

  return (
    <div className={clsx(styles.item, isOpen && styles.isOpen, className)}>
      <Text className={styles.header} variant="h3">
        <Button
          aria-controls={contentId}
          aria-expanded={isOpen}
          className={styles.trigger}
          id={triggerId}
          variant="ghost"
          onClick={() => context.onToggle(value)}
        >
          {trigger}
          <ChevronDown className={styles.icon} size={20} strokeWidth={2.5} />
        </Button>
      </Text>
      <div
        aria-hidden={!isOpen}
        aria-labelledby={triggerId}
        className={styles.contentWrapper}
        id={contentId}
        role="region"
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
    defaultValue || (type === "multiple" ? [] : ""),
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
      <Stack className={clsx(styles.root, className)} gap={0}>
        {children}
      </Stack>
    </AccordionContext.Provider>
  );
}
