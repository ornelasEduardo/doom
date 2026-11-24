"use client";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import type { ControlSize } from "../../styles/types";
import { Popover } from "../Popover/Popover";
import styles from "./SplitButton.module.scss";

interface SplitButtonItem {
  label: string;
  onClick: () => void;
}

interface SplitButtonProps {
  classNames?: ThemeClassNames<"SplitButton">;
  primaryLabel: string;
  onPrimaryClick: () => void;
  items: SplitButtonItem[];
  variant?: "primary" | "secondary";
  size?: ControlSize;
  className?: string;
}

export function SplitButton({
  classNames,
  primaryLabel,
  onPrimaryClick,
  items,
  variant = "primary",
  size = "md",
  className,
}: SplitButtonProps) {
  const doomPart = useThemeParts("SplitButton", classNames, {
    variant: variant,
    size: size,
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      content={
        <div {...doomPart("menu", { className: styles.menu })}>
          {items.map((item, index) => (
            <button
              key={index}
              {...doomPart("item", { className: styles.item })}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      isOpen={isOpen}
      placement="bottom-end"
      trigger={
        <div
          {...doomPart("root", {
            className: clsx(
              styles.container,
              styles[variant],
              size !== "md" && styles[size],
              className,
            ),
          })}
          data-state={isOpen ? "open" : "closed"}
        >
          <button
            {...doomPart("mainButton", { className: styles.mainButton })}
            onClick={onPrimaryClick}
          >
            {primaryLabel}
          </button>
          <button
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label={`More ${primaryLabel} options`}
            {...doomPart("dropdownTrigger", {
              className: styles.dropdownTrigger,
            })}
            onClick={() => setIsOpen(!isOpen)}
          >
            <ThemedIcon
              aria-hidden="true"
              icon={ChevronDown}
              iconName="chevronDown"
              size={20}
              strokeWidth={3}
            />
          </button>
        </div>
      }
      onClose={() => setIsOpen(false)}
    />
  );
}
