"use client";

import clsx from "clsx";
import React from "react";

import { Flex } from "../../../Layout/Layout";
import styles from "./Footer.module.scss";

export interface FooterProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  align?: "start" | "center" | "end" | "between";
}

export function Footer({
  className,
  style,
  children,
  align = "center",
}: FooterProps) {
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
      className={clsx(styles.footer, className)}
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
