"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../../../styles/theming/parts";
import { Flex, Stack } from "../../../Layout/Layout";
import { Text } from "../../../Text/Text";
import styles from "./Header.module.scss";

export interface HeaderProps {
  classNames?: ThemeClassNames<"Chart">;
  title?: React.ReactNode;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function Header({
  classNames,
  title,
  subtitle,
  className,
  style,
  children,
}: HeaderProps) {
  const doomPart = useThemeParts("Chart", classNames, {});

  const hasTitle = title || subtitle;

  if (!hasTitle && !children) {
    return null;
  }

  return (
    <Flex
      wrap
      align="center"
      {...doomPart("header", { className: clsx(styles.header, className) })}
      gap={4}
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
            <Text
              {...doomPart("subtitle", { className: styles.subtitle })}
              variant="small"
            >
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
