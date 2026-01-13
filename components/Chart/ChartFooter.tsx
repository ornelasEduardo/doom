"use client";

import clsx from "clsx";
import React from "react";

import { Flex } from "../Layout/Layout";
import styles from "./Chart.module.scss";

export interface ChartFooterProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  align?: "start" | "center" | "end" | "between";
}

export function ChartFooter({
  className,
  style,
  children,
  align = "center",
}: ChartFooterProps) {
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
      className={clsx(styles.chartFooter, className)}
      justify={justifyMap[align]}
      style={{
        width: "100%",
        marginTop: "var(--spacing-4)",
        ...style,
      }}
    >
      {children}
    </Flex>
  );
}
