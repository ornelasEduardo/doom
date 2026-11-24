"use client";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import {
  type ThemeClassNames,
  ThemePartsBoundary,
  useOwnedThemeParts,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
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
  classNames?: ThemeClassNames<"Accordion">;
  value: string;
  trigger: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({
  classNames,
  value,
  trigger,
  children,
  className,
}: AccordionItemProps) {
  const doomPart = useThemeParts("Accordion", classNames, {});

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
    <div
      {...doomPart("item", {
        "data-expanded": isOpen || undefined,
        className: clsx(styles.item, isOpen && styles.isOpen, className),
      })}
    >
      <Text
        {...doomPart("header", {
          "data-expanded": isOpen || undefined,
          className: styles.header,
        })}
        variant="h3"
      >
        <Button
          aria-controls={contentId}
          aria-expanded={isOpen}
          {...doomPart("trigger", { className: styles.trigger })}
          id={triggerId}
          variant="ghost"
          onClick={() => context.onToggle(value)}
        >
          {trigger}
          <ThemedIcon
            icon={ChevronDown}
            iconName="chevronDown"
            {...doomPart("icon", {
              "data-expanded": isOpen || undefined,
              className: styles.icon,
            })}
            size={20}
            strokeWidth={2.5}
          />
        </Button>
      </Text>
      <div
        aria-hidden={!isOpen}
        aria-labelledby={triggerId}
        {...doomPart("contentWrapper", {
          "data-expanded": isOpen || undefined,
          className: styles.contentWrapper,
        })}
        id={contentId}
        role="region"
      >
        <div
          {...doomPart("contentBody", {
            "data-expanded": isOpen || undefined,
            className: styles.contentBody,
          })}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface AccordionProps {
  classNames?: ThemeClassNames<"Accordion">;
  type?: "single" | "multiple";
  children: React.ReactNode;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
}

export function Accordion({
  classNames,
  type = "single",
  children,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
}: AccordionProps) {
  const doomPart = useOwnedThemeParts("Accordion", classNames, {});

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
    <ThemePartsBoundary
      classNames={classNames}
      component="Accordion"
      visual={{}}
    >
      {
        <AccordionContext.Provider
          value={{ value: currentValue, onToggle: handleToggle, type }}
        >
          <Stack
            {...doomPart("root", { className: clsx(styles.root, className) })}
            gap={0}
          >
            {children}
          </Stack>
        </AccordionContext.Provider>
      }
    </ThemePartsBoundary>
  );
}
