"use client";

import React, { ElementType } from "react";
import clsx from "clsx";
import styles from "./Layout.module.scss";

// --- Tokens ---
const SPACING_MAP = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export type Spacing = keyof typeof SPACING_MAP;

function resolveGap(gap?: Spacing): string | undefined {
  if (gap === undefined) return undefined;
  return SPACING_MAP[gap];
}

// --- Types ---
interface LayoutProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  as?: ElementType;
}

// --- Grid ---
export interface GridProps extends LayoutProps {
  columns?: string | number;
  gap?: Spacing;
}

export function Grid({
  children,
  columns = "1fr",
  gap = 4,
  className,
  style,
  as: Component = "div",
  ...props
}: GridProps) {
  const gridTemplateColumns =
    typeof columns === "number" ? `repeat(${columns}, 1fr)` : columns;

  return (
    <Component
      className={clsx(styles.grid, className)}
      style={{
        gridTemplateColumns,
        gap: resolveGap(gap),
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

// --- Flex ---
export interface FlexProps extends LayoutProps {
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  justify?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  align?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  gap?: Spacing;
  wrap?: boolean | "wrap" | "nowrap" | "wrap-reverse";
}

export function Flex({
  children,
  direction = "row",
  justify = "flex-start",
  align = "stretch",
  gap = 0,
  wrap = false,
  className,
  style,
  as: Component = "div",
  ...props
}: FlexProps) {
  const flexWrap =
    typeof wrap === "boolean" ? (wrap ? "wrap" : "nowrap") : wrap;

  return (
    <Component
      className={clsx(styles.flex, className)}
      style={{
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        gap: resolveGap(gap),
        flexWrap,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

// --- Stack (Vertical Flex) ---
export interface StackProps extends Omit<FlexProps, "direction"> {
  direction?: "column" | "column-reverse" | "row" | "row-reverse"; // Allow override but default to column
}

export function Stack({
  children,
  direction = "column",
  gap = 4,
  align = "stretch",
  ...props
}: StackProps) {
  return (
    <Flex direction={direction} gap={gap} align={align} {...props}>
      {children}
    </Flex>
  );
}

// --- Switcher ---
export interface SwitcherProps extends FlexProps {
  threshold?: "xxs" | "xs" | "sm" | "md";
}

export function Switcher({
  children,
  threshold = "xs",
  className,
  ...props
}: SwitcherProps) {
  return (
    <Flex
      className={clsx(
        styles.switcher,
        styles[`switch-${threshold}`],
        className
      )}
      {...props}
    >
      {children}
    </Flex>
  );
}

// --- Container ---
export interface ContainerProps extends LayoutProps {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "fluid";
}

export function Container({
  children,
  maxWidth = "xl",
  className,
  as: Component = "div",
  ...props
}: ContainerProps) {
  return (
    <Component
      className={clsx(styles.container, styles[maxWidth], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
