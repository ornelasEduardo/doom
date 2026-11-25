"use client";
import type { LucideProps } from "lucide-react";
import React, { useContext } from "react";

import { useThemeParts } from "./parts";
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
  ...props
}: ThemedIconProps) {
  const part = useThemeParts("Icon");
  const runtime = useContext(ThemeRuntimeContext);
  const Icon = runtime?.icons?.[iconName] ?? DefaultIcon;
  return (
    <Icon
      {...part("root", props)}
      strokeWidth={
        runtime ? `var(--doom-icons-stroke, ${strokeWidth})` : strokeWidth
      }
    />
  );
}
