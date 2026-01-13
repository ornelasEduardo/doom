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
    const resolvedStyle: React.CSSProperties = {
      width: resolveSize(width),
      minWidth: resolveSize(minWidth),
      maxWidth: resolveSize(maxWidth),
      height: resolveSize(height),
      minHeight: resolveSize(minHeight),
      maxHeight: resolveSize(maxHeight),
      flex: typeof flex === "boolean" ? (flex ? "1" : "0") : flex,
      flexGrow: typeof grow === "boolean" ? (grow ? 1 : 0) : grow,
      flexShrink: typeof shrink === "boolean" ? (shrink ? 1 : 0) : shrink,
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
