"use client";

import clsx from "clsx";
import React, { useState } from "react";

import { Button } from "../Button/Button";
import { Popover } from "../Popover/Popover";
import styles from "./Dropdown.module.scss";

interface DropdownItemType {
  label: string;
  onClick: () => void;
}

interface DropdownProps {
  triggerLabel: string;
  items: DropdownItemType[];
  variant?: "primary" | "secondary";
  className?: string; // Add className prop
}

export function Dropdown({
  triggerLabel,
  items,
  variant = "primary",
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      content={
        <div className={styles.menu}>
          {items.map((item, index) => (
            <button
              key={index}
              className={styles.item}
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
      placement="bottom-start"
      trigger={
        <Button
          aria-expanded={isOpen}
          className={clsx(styles.trigger, className)}
          variant={variant}
          onClick={() => setIsOpen(!isOpen)}
        >
          {triggerLabel}{" "}
          <span style={{ marginLeft: "0.5rem", fontSize: "0.8em" }}>▼</span>
        </Button>
      }
      onClose={() => setIsOpen(false)}
    />
  );
}
