"use client";
import clsx from "clsx";
import type { LucideProps } from "lucide-react";
import React, { useContext } from "react";

import { useThemeParts } from "./parts";
import styles from "./ThemedIcon.module.scss";
import { ThemeRuntimeContext } from "./ThemeScope";

export type IconName =
  | "fileImage"
  | "fileVideo"
  | "fileAudio"
  | "fileCode"
  | "fileArchive"
  | "fileSpreadsheet"
  | "asterisk"
  | "externalLink"
  | "moreHorizontal"
  | "loaderCircle"
  | "listFilter"
  | "close"
  | "check"
  | "minus"
  | "chevronDown"
  | "chevronUp"
  | "chevronLeft"
  | "chevronRight"
  | "search"
  | "filter"
  | "upload"
  | "info"
  | "alertTriangle"
  | "checkCircle2"
  | "xCircle"
  | "copy"
  | "checkCheck"
  | "star"
  | "file"
  | "fileText"
  | "trash2"
  | "menu"
  | "panelLeftClose"
  | "panelLeftOpen"
  | "arrowUp"
  | "arrowDown"
  | "arrowUpDown"
  | "loader2"
  | "download";
export type IconOverrides = Partial<
  Record<IconName, React.ComponentType<LucideProps>>
>;
export interface ThemedIconProps extends LucideProps {
  icon: React.ComponentType<LucideProps>;
  iconName: IconName;
}
/** Built-in decorative icons preserve their original fallback and accessible props. */
export function ThemedIcon({
  icon: DefaultIcon,
  iconName,
  strokeWidth = 2.5,
  size = 24,
  absoluteStrokeWidth,
  ...props
}: ThemedIconProps) {
  const part = useThemeParts("Icon");
  const runtime = useContext(ThemeRuntimeContext);
  const Icon = runtime?.icons?.[iconName] ?? DefaultIcon;
  return (
    <Icon
      {...part("root", {
        ...props,
        className: clsx(
          props.className,
          absoluteStrokeWidth && styles.absoluteStroke,
        ),
      })}
      // Built-in sizes are authored against a 16px root. CSS recipes and
      // explicit width/height props can still override these SVG attributes.
      size={typeof size === "number" ? `${size / 16}rem` : size}
      // Lucide divides absolute strokes by Number(size), which cannot resolve
      // rem lengths or theme variables. SVG keeps the stroke constant directly.
      strokeWidth={
        runtime ? `var(--doom-icons-stroke, ${strokeWidth})` : strokeWidth
      }
      vectorEffect={
        absoluteStrokeWidth ? "non-scaling-stroke" : props.vectorEffect
      }
    />
  );
}
