"use client";

import clsx from "clsx";
import React from "react";

import { Flex, Stack } from "../../../Layout/Layout";
import { Text } from "../../../Text/Text";
import styles from "./Header.module.scss";

export interface HeaderProps {
  title?: React.ReactNode;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  className,
  style,
  children,
}: HeaderProps) {
  const hasTitle = title || subtitle;

  if (!hasTitle && !children) {
    return null;
  }

  return (
    <Flex
      align="center"
      className={clsx(styles.header, className)}
      justify="space-between"
      style={{
        width: "100%",
        ...style,
      }}
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
    </Flex>
  );
}
