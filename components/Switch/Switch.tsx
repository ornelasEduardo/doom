"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import styles from "./Switch.module.scss";

export interface SwitchProps {
  classNames?: ThemeClassNames<"Switch">;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
  readOnly?: boolean;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      classNames,
      checked = false,
      onChange,
      disabled,
      label,
      id,
      className,
      ...props
    },
    ref,
  ) => {
    const doomPart = useThemeParts("Switch", classNames, {
      disabled: disabled,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
      onChange?.(e.target.checked);
    };

    return (
      <label
        {...doomPart("root", {
          className: clsx(
            styles.switchContainer,
            disabled && styles.disabled,
            className,
          ),
        })}
      >
        <input
          ref={ref}
          aria-checked={checked}
          checked={checked}
          {...doomPart("input", { className: styles.input })}
          disabled={disabled}
          id={id}
          readOnly={props.readOnly}
          role="switch"
          type="checkbox"
          onChange={handleChange}
          {...props}
        />
        <div
          {...doomPart("toggle", {
            className: clsx(styles.toggle, checked && styles.checked),
          })}
        />
        {label && (
          <span {...doomPart("label", { className: styles.label })}>
            {label}
          </span>
        )}
      </label>
    );
  },
);

Switch.displayName = "Switch";
