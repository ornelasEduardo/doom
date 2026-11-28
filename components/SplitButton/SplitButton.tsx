"use client";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import React from "react";

import { useMenu } from "../../hooks/useMenu";
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
  disabled?: boolean;
}

interface SplitButtonProps {
  classNames?: ThemeClassNames<"SplitButton">;
  primaryLabel: string;
  onPrimaryClick: () => void;
  items: SplitButtonItem[];
  variant?: "primary" | "secondary";
  size?: ControlSize;
  className?: string;
  disabled?: boolean;
}

export function SplitButton({
  classNames,
  primaryLabel,
  onPrimaryClick,
  items,
  variant = "primary",
  size = "md",
  className,
  disabled = false,
}: SplitButtonProps) {
  const doomPart = useThemeParts("SplitButton", classNames, {
    variant: variant,
    size: size,
  });

  const menu = useMenu();
  const isOpen = menu.open;

  return (
    <Popover
      content={
        <div
          ref={menu.menuRef}
          {...menu.menuProps}
          aria-label={`More ${primaryLabel} options`}
          {...doomPart("menu", { className: styles.menu })}
        >
          {items.map((item, index) => (
            <button
              key={index}
              disabled={disabled || item.disabled}
              role="menuitem"
              tabIndex={-1}
              type="button"
              {...doomPart("item", { className: styles.item })}
              onClick={() => {
                menu.close(true);
                item.onClick();
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
            disabled={disabled}
            type="button"
            onClick={() => {
              menu.close();
              onPrimaryClick();
            }}
          >
            {primaryLabel}
          </button>
          <button
            ref={menu.triggerRef}
            {...menu.triggerProps}
            aria-label={`More ${primaryLabel} options`}
            disabled={disabled}
            type="button"
            {...doomPart("dropdownTrigger", {
              className: styles.dropdownTrigger,
            })}
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
      onClose={() => menu.close()}
    />
  );
}
