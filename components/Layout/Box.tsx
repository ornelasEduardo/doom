import React, { ElementType, forwardRef } from "react";

// Map semantic keys to CSS variables
const SIZING_MAP = {
  // Fractionals
  full: "var(--width-full)",
  screen: "var(--width-screen)",
  "screen-w": "var(--width-screen)",
  "screen-h": "var(--height-screen)",
  min: "var(--width-min)",
  max: "var(--width-max)",
  fit: "var(--width-fit)",

  // Prose
  "prose-narrow": "var(--width-prose-narrow)",
  prose: "var(--width-prose)",
  "prose-wide": "var(--width-prose-wide)",

  // Structural
  sidebar: "var(--width-sidebar)",
  panel: "var(--width-panel)",
  "panel-wide": "var(--width-panel-wide)",

  // Modal
  "modal-sm": "var(--width-modal-sm)",
  "modal-md": "var(--width-modal-md)",
  "modal-lg": "var(--width-modal-lg)",
  "modal-xl": "var(--width-modal-xl)",

  // Controls
  "control-sm": "var(--width-control-sm)",
  "control-md": "var(--width-control-md)",
  "control-lg": "var(--width-control-lg)",
  "control-xl": "var(--width-control-xl)",
} as const;

export type SemanticSize = keyof typeof SIZING_MAP;
export type SizingProp = SemanticSize | number | string;

function resolveSize(size?: SizingProp): string | undefined {
  if (size === undefined) {
    return undefined;
  }
  if (typeof size === "number") {
    return `${size}px`; // crude fallback, or could map to spacing
  }
  if (size in SIZING_MAP) {
    return SIZING_MAP[size as SemanticSize];
  }
  return size as string;
}

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: ElementType;
  width?: SizingProp;
  minWidth?: SizingProp;
  maxWidth?: SizingProp;
  height?: SizingProp;
  minHeight?: SizingProp;
  maxHeight?: SizingProp;

  // Flex shortcuts since Box is often a flex child
  flex?: string | number | boolean;
  grow?: boolean | number;
  shrink?: boolean | number;
}

export const Box = forwardRef<HTMLElement, BoxProps>(
  (
    {
      as: Component = "div",
      width,
      minWidth,
      maxWidth,
      height,
      minHeight,
      maxHeight,
      flex,
      grow,
      shrink,
      style,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Build base style, filtering out undefined values
    const baseStyle: React.CSSProperties = {};

    const resolvedWidth = resolveSize(width);
    const resolvedMinWidth = resolveSize(minWidth);
    const resolvedMaxWidth = resolveSize(maxWidth);
    const resolvedHeight = resolveSize(height);
    const resolvedMinHeight = resolveSize(minHeight);
    const resolvedMaxHeight = resolveSize(maxHeight);
    const resolvedFlex = typeof flex === "boolean" ? (flex ? "1" : "0") : flex;
    const resolvedGrow = typeof grow === "boolean" ? (grow ? 1 : 0) : grow;
    const resolvedShrink =
      typeof shrink === "boolean" ? (shrink ? 1 : 0) : shrink;

    if (resolvedWidth !== undefined) {
      baseStyle.width = resolvedWidth;
    }
    if (resolvedMinWidth !== undefined) {
      baseStyle.minWidth = resolvedMinWidth;
    }
    if (resolvedMaxWidth !== undefined) {
      baseStyle.maxWidth = resolvedMaxWidth;
    }
    if (resolvedHeight !== undefined) {
      baseStyle.height = resolvedHeight;
    }
    if (resolvedMinHeight !== undefined) {
      baseStyle.minHeight = resolvedMinHeight;
    }
    if (resolvedMaxHeight !== undefined) {
      baseStyle.maxHeight = resolvedMaxHeight;
    }
    if (resolvedFlex !== undefined) {
      baseStyle.flex = resolvedFlex;
    }
    if (resolvedGrow !== undefined) {
      baseStyle.flexGrow = resolvedGrow;
    }
    if (resolvedShrink !== undefined) {
      baseStyle.flexShrink = resolvedShrink;
    }

    const resolvedStyle: React.CSSProperties = {
      ...baseStyle,
      ...style,
    };

    return (
      <Component
        ref={ref}
        className={className}
        style={resolvedStyle}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Box.displayName = "Box";
