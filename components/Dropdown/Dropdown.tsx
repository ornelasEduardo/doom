"use client";
import clsx from "clsx";
import React from "react";

import { useMenu } from "../../hooks/useMenu";
import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import type { ControlSize } from "../../styles/types";
import { Button } from "../Button/Button";
import { Popover } from "../Popover/Popover";
import styles from "./Dropdown.module.scss";

interface DropdownItemType {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownProps {
  classNames?: ThemeClassNames<"Dropdown">;
  triggerLabel: string;
  items: DropdownItemType[];
  variant?: "primary" | "secondary";
  size?: ControlSize;
  className?: string;
  disabled?: boolean;
}

export function Dropdown({
  classNames,
  triggerLabel,
  items,
  variant = "primary",
  size = "md",
  className,
  disabled = false,
}: DropdownProps) {
  const doomPart = useThemeParts("Dropdown", classNames, {
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
          aria-label={triggerLabel}
          {...doomPart("menu", {
            className: clsx(styles.menu, size !== "md" && styles[size]),
          })}
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
      placement="bottom-start"
      trigger={
        <span ref={menu.triggerRef}>
          <Button
            {...menu.triggerProps}
            {...doomPart("root", {
              className: clsx(styles.trigger, className),
            })}
            disabled={disabled}
            size={size}
            variant={variant}
          >
            {triggerLabel}{" "}
            <span style={{ marginLeft: "0.5rem", fontSize: "0.8em" }}>▼</span>
          </Button>
        </span>
      }
      onClose={() => menu.close()}
    />
  );
}
