"use client";

import React, { ElementType } from "react";
import clsx from "clsx";
import styles from "./Layout.module.scss";

// --- Types ---
interface LayoutProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  as?: ElementType;
}

// --- Grid ---
export interface GridProps extends LayoutProps {
  columns?: string | number;
  gap?: string | number;
}

export function Grid({
  children,
  columns = "1fr",
  gap = "1rem",
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
        gap,
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
  gap?: string | number;
  wrap?: boolean | "wrap" | "nowrap" | "wrap-reverse";
}

export function Flex({
  children,
  direction = "row",
  justify = "flex-start",
  align = "stretch",
  gap = "0",
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
        gap,
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
  gap = "1rem",
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
