"use client";

import React, { ElementType } from "react";
import clsx from "clsx";
import styles from "./Layout.module.scss";

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

export interface LayoutProps extends React.HTMLAttributes<HTMLElement> {
  /** The content to be rendered inside the layout container. */
  children?: React.ReactNode;
  /**
   * The HTML element or React component to render as the root node.
   * @default "div"
   */
  as?: ElementType;
}

export interface GridProps extends LayoutProps {
  /**
   * Defines the columns of the grid.
   * Accepts a number (e.g., `3` for 3 equal columns) or a CSS string (e.g., `"1fr 2fr"`).
   * @default "1fr"
   */
  columns?: string | number;
  /**
   * Spacing between grid items.
   * Maps to the design system spacing tokens (e.g., `4` = 1rem).
   * @default 4
   */
  gap?: Spacing;
}

/**
 * A CSS Grid container for creating two-dimensional layouts.
 * Use this when you need precise control over columns and rows, or complex grid placements.
 */
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

  const gridClasses = clsx(styles.grid, className);

  return (
    <Component
      className={gridClasses}
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

export interface FlexProps extends LayoutProps {
  /**
   * The direction in which flex items are placed in the flex container.
   * @default "row"
   */
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  /**
   * Alignment of items along the main axis.
   * @default "flex-start"
   */
  justify?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  /**
   * Alignment of items along the cross axis.
   * @default "stretch"
   */
  align?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  /**
   * Spacing between flex items.
   * Maps to the design system spacing tokens.
   * @default 0
   */
  gap?: Spacing;
  /**
   * Controls whether flex items are forced onto one line or can wrap onto multiple lines.
   * @default false
   */
  wrap?: boolean | "wrap" | "nowrap" | "wrap-reverse";
}

/**
 * A flexible box container for one-dimensional layouts.
 * Use this as your primary layout tool for aligning items in a row or column,
 * distributing space, and handling wrapping.
 */
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

  const flexClasses = clsx(
    styles.flex,
    styles[`direction-${direction}`],
    justify && styles[`justify-${justify}`],
    align && styles[`align-${align}`],
    className
  );

  return (
    <Component
      className={flexClasses}
      style={{
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

export interface StackProps extends Omit<FlexProps, "direction"> {
  /**
   * The direction to stack items. Defaults to vertical ("column").
   * Can be overridden to "row" for semantic or responsive adjustments.
   * @default "column"
   */
  direction?: "column" | "column-reverse" | "row" | "row-reverse";
}

/**
 * A specialized Flex container explicitly optimized for vertical stacking.
 * Use this for lists, form fields, card content, or any group of elements
 * that should be arranged vertically with consistent spacing.
 * Note: While it defaults to column, `direction="row"` is supported for semantic overrides.
 */
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

export interface SwitcherProps extends FlexProps {
  /**
   * The breakpoint threshold at which the layout switches from horizontal to vertical.
   * e.g., "xs" means it will be horizontal on screens larger than "xs" (480px), and vertical below.
   * @default "xs"
   */
  threshold?: "xxs" | "xs" | "sm" | "md";
}

/**
 * A responsive layout component that switches from horizontal to vertical layout
 * based on a container query or breakpoint threshold.
 * Use this for "sidebar + main content" layouts or any pattern that needs
 * to stack on smaller screens but sit side-by-side on larger ones.
 */
export function Switcher({
  children,
  threshold = "xs",
  className,
  ...props
}: SwitcherProps) {
  const switcherClasses = clsx(
    styles.switcher,
    styles[`switch-${threshold}`],
    className
  );

  return (
    <Flex className={switcherClasses} {...props}>
      {children}
    </Flex>
  );
}

export interface ContainerProps extends LayoutProps {
  /**
   * The maximum width of the container.
   * - `sm`: 640px
   * - `md`: 768px
   * - `lg`: 1024px
   * - `xl`: 1280px
   * - `fluid`: 100%
   * @default "xl"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "fluid";
}

/**
 * A specific layout component for centering content horizontally on the page.
 * Use this to constrain the maximum width of your page content or sections,
 * ensuring consistent margins and readability on large screens.
 */
export function Container({
  children,
  maxWidth = "xl",
  className,
  as: Component = "div",
  ...props
}: ContainerProps) {
  const containerClasses = clsx(styles.container, styles[maxWidth], className);

  return (
    <Component className={containerClasses} {...props}>
      {children}
    </Component>
  );
}
