"use client";

import clsx from "clsx";
import React from "react";

import { Stack, Switcher } from "../Layout/Layout";
import { Text } from "../Text/Text";
// Use relative import for styles to ensure sharing
import styles from "./Chart.module.scss";

export interface ChartHeaderProps {
  title?: React.ReactNode;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function ChartHeader({
  title,
  subtitle,
  className,
  style,
  children,
}: ChartHeaderProps) {
  const hasTitle = title || subtitle;

  if (!hasTitle && !children) {
    return null;
  }

  return (
    <Switcher
      align="center"
      className={clsx(styles.chartHeader, className)}
      justify="space-between"
      style={{
        width: "100%",
        ...style,
      }}
      threshold="xs"
    >
      {hasTitle ? (
        <Stack gap={2}>
          {title && (
            <div>
              {typeof title === "string" ? (
                <Text style={{ margin: 0 }} variant="h5">
                  {title}
                </Text>
              ) : (
                title
              )}
            </div>
          )}
          {subtitle && (
            <Text className={styles.subtitle} variant="small">
              {subtitle}
            </Text>
          )}
        </Stack>
      ) : (
        <div />
      )}
      {children}
    </Switcher>
  );
}
