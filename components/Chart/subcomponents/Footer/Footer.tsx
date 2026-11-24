"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../../../styles/theming/parts";
import { Flex } from "../../../Layout/Layout";
import styles from "./Footer.module.scss";

export interface FooterProps {
  classNames?: ThemeClassNames<"Chart">;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  align?: "start" | "center" | "end" | "between";
}

export function Footer({
  classNames,
  className,
  style,
  children,
  align = "center",
}: FooterProps) {
  const doomPart = useThemeParts("Chart", classNames, {});

  if (!children) {
    return null;
  }

  const justifyMap: Record<
    string,
    "center" | "flex-start" | "flex-end" | "space-between"
  > = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
  };

  return (
    <Flex
      align="center"
      {...doomPart("footer", { className: clsx(styles.footer, className) })}
      justify={justifyMap[align]}
      style={{
        width: "100%",
        ...style,
      }}
    >
      {children}
    </Flex>
  );
}
