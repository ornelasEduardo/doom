"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import styles from "./Label.module.scss";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  classNames?: ThemeClassNames<"Label">;
  children: React.ReactNode;
  required?: boolean;
}
export function Label({
  classNames,
  children,
  required,
  className,
  ...props
}: LabelProps) {
  const doomPart = useThemeParts("Label", classNames, {});

  return (
    <label
      {...doomPart("root", {
        className: clsx(styles.label, required && styles.required, className),
      })}
      {...props}
    >
      {children}
    </label>
  );
}
