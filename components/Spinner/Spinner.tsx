"use client";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import styles from "./Spinner.module.scss";

export interface SpinnerProps extends React.ComponentProps<
  typeof LoaderCircle
> {
  classNames?: ThemeClassNames<"Spinner">;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Spinner({
  classNames,
  size = "md",
  className,
  strokeWidth = 2,
  ...props
}: SpinnerProps) {
  const doomPart = useThemeParts("Spinner", classNames, { size: size });

  return (
    <ThemedIcon
      aria-label="Loading"
      icon={LoaderCircle}
      iconName="loaderCircle"
      {...doomPart("root", {
        className: clsx(styles.spinner, styles[size], className),
      })}
      role="status"
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
