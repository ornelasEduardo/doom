"use client";

import "./styles/globals.scss";

import React from "react";

import { ThemeKey, ThemeProvider } from "./styles/themes";
import { ThemeScope, type ThemeScopeProps } from "./styles/theming/ThemeScope";
import type { Theme } from "./styles/theming/types";

interface CommonProps {
  children: React.ReactNode;
  withBody?: boolean;
  className?: string;
  fontClassName?: string;
}
type ObjectThemeProps = Omit<
  ThemeScopeProps,
  "children" | "theme" | "overrides" | "asChild"
> & {
  theme: Theme;
  initialTheme?: never;
};
type LegacyThemeProps = {
  initialTheme?: ThemeKey;
  nonce?: string;
  theme?: never;
};
export type DesignSystemProviderProps = CommonProps &
  (ObjectThemeProps | LegacyThemeProps);

export function DesignSystemProvider(props: DesignSystemProviderProps) {
  const {
    children,
    withBody = false,
    className = "",
    fontClassName = "",
  } = props;
  const combinedClassName = `${fontClassName} ${className}`.trim();
  if (props.theme) {
    if (props.initialTheme) {
      throw new Error("Use theme or initialTheme, not both");
    }
    const { fontClassName: _font, ...scopeProps } = props;
    return (
      <ThemeScope {...scopeProps} className={combinedClassName}>
        {children}
      </ThemeScope>
    );
  }
  const content = (
    <ThemeProvider
      initialTheme={props.initialTheme ?? "default"}
      nonce={props.nonce}
    >
      {children}
    </ThemeProvider>
  );
  return withBody ? (
    <body className={combinedClassName} data-doom-legacy="">
      {content}
    </body>
  ) : (
    <div
      className={combinedClassName}
      data-doom-legacy=""
      style={{ display: "contents" }}
    >
      {content}
    </div>
  );
}
