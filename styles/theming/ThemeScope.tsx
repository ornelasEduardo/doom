"use client";

import "./scope.scss";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { neubrutalistTheme } from "../themes/presets";
import { compileTheme } from "./compileTheme";
import { legacyAliases } from "./defaults";
import { defineTheme, resolveTheme, tokenVariable } from "./defineTheme";
import type { IconOverrides } from "./ThemedIcon";
import type { ResolvedTheme, SurfaceContext, Theme, ThemePatch } from "./types";

export interface ThemeRuntime {
  theme: Theme;
  resolved: ResolvedTheme;
  mode: string;
  strategy: "runtime" | "external";
  manifest?: readonly string[];
  nonce?: string;
  dir?: "ltr" | "rtl";
  icons?: IconOverrides;
  legacy?: boolean;
  portalContainer?: Element | null;
}
export const ThemeRuntimeContext = createContext<ThemeRuntime | null>(null);

interface ThemeScopeOptions {
  children: React.ReactNode;
  mode?: string;
  surface?: SurfaceContext;
  styleStrategy?: "runtime" | "external";
  styleManifest?: readonly string[];
  nonce?: string;
  dir?: "ltr" | "rtl";
  icons?: IconOverrides;
  asChild?: boolean;
  withBody?: boolean;
  className?: string;
  /** Paint the scope's canvas; scopes otherwise only establish typography and tokens. */
  withBackground?: boolean;
  portalContainer?: Element | null;
  /** @internal Compatibility adapter only. */
  _legacy?: boolean;
}
export type ThemeScopeProps = ThemeScopeOptions &
  (
    | { theme: Theme; overrides?: never }
    | { theme?: never; overrides?: ThemePatch }
  );

export function ThemeScope({
  children,
  theme: suppliedTheme,
  overrides,
  mode: suppliedMode,
  surface,
  styleStrategy,
  styleManifest,
  nonce,
  dir,
  icons,
  asChild = false,
  withBody = false,
  className,
  withBackground = false,
  portalContainer,
  _legacy,
}: ThemeScopeProps) {
  const parent = useContext(ThemeRuntimeContext);
  if (suppliedTheme && overrides) {
    throw new Error("ThemeScope accepts theme or overrides, not both");
  }
  if (asChild && withBody) {
    throw new Error("ThemeScope cannot combine asChild and withBody");
  }
  const strategy = styleStrategy ?? parent?.strategy ?? "runtime";
  if (overrides && strategy === "external") {
    throw new Error(
      "Precompile derived themes instead of using overrides in external mode",
    );
  }
  const legacy =
    _legacy ?? (!suppliedTheme && !overrides ? parent?.legacy : false);
  if (legacy && strategy === "external") {
    throw new Error(
      "External styles require an explicit object theme outside the legacy adapter",
    );
  }
  const base = suppliedTheme ?? parent?.theme ?? neubrutalistTheme;
  const theme = useMemo(
    () =>
      overrides
        ? defineTheme({ ...overrides, name: base.name, extends: base })
        : base,
    [base, overrides],
  );
  const requestedMode =
    suppliedMode ??
    (suppliedTheme ? theme.defaultMode : (parent?.mode ?? theme.defaultMode));
  const [systemDark, setSystemDark] = useState<boolean | null>(null);
  useEffect(() => {
    if (requestedMode !== "system" || typeof matchMedia !== "function") {
      return;
    }
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [requestedMode]);
  if (requestedMode === "system" && (!theme.modes.light || !theme.modes.dark)) {
    throw new Error("System mode requires declared light and dark modes");
  }
  const mode =
    requestedMode === "system"
      ? systemDark === null
        ? theme.defaultMode
        : systemDark
          ? "dark"
          : "light"
      : requestedMode;
  const activeSurface =
    surface ??
    (suppliedTheme ? "default" : (parent?.resolved.surface ?? "default"));
  const resolved = useMemo(
    () => resolveTheme(theme, mode, activeSurface),
    [theme, mode, activeSurface],
  );
  const compiled = useMemo(
    () => (strategy === "runtime" ? compileTheme(theme) : null),
    [theme, strategy],
  );
  const manifest = styleManifest ?? parent?.manifest;
  if (strategy === "external" && !manifest?.includes(resolved.id)) {
    throw new Error(`External theme manifest is missing ${resolved.id}`);
  }
  const effectiveNonce = nonce ?? parent?.nonce;
  const host =
    asChild && React.isValidElement<{ dir?: "ltr" | "rtl" }>(children)
      ? children
      : null;
  const effectiveDir = dir ?? host?.props.dir ?? parent?.dir;
  const effectiveIcons = useMemo(
    () => (icons ? { ...parent?.icons, ...icons } : parent?.icons),
    [parent?.icons, icons],
  );
  const effectiveContainer =
    portalContainer === undefined ? parent?.portalContainer : portalContainer;
  const runtime = useMemo<ThemeRuntime>(
    () => ({
      theme,
      resolved,
      mode,
      strategy,
      manifest,
      nonce: effectiveNonce,
      dir: effectiveDir,
      icons: effectiveIcons,
      legacy,
      portalContainer: effectiveContainer,
    }),
    [
      theme,
      resolved,
      mode,
      strategy,
      manifest,
      effectiveNonce,
      effectiveDir,
      effectiveIcons,
      legacy,
      effectiveContainer,
    ],
  );
  const scopeProps = {
    "data-doom-scope": legacy ? undefined : resolved.id,
    "data-doom-legacy-scope": legacy ? resolved.id : undefined,
    "data-doom-mode": mode,
    "data-doom-background": withBackground || undefined,
    dir: effectiveDir,
    className,
  };
  const legacyCss = useMemo(() => {
    if (!legacy) {
      return "";
    }
    const inverse = Object.fromEntries(
      Object.entries(legacyAliases).map(([old, path]) => [
        tokenVariable(path),
        old,
      ]),
    );
    const values = Object.entries(resolved.variables)
      .filter(([key]) => key.startsWith("--doom-"))
      .map(
        ([key, value]) =>
          `${key}:${inverse[key] ? `var(${inverse[key]}, ${value})` : value}`,
      )
      .join(";");
    return `@layer doom.utilities { :where([data-doom-legacy-scope="${resolved.id}"],[data-doom-theme="${resolved.id}"][data-doom-legacy-part]){${values}} }`;
  }, [legacy, resolved]);
  const needsStyles =
    compiled && !(parent?.strategy === "runtime" && parent.theme === theme);
  const styleNode = (
    <>
      {needsStyles &&
        (effectiveNonce ? (
          <style data-doom-styles={resolved.id} nonce={effectiveNonce}>
            {compiled.css}
          </style>
        ) : (
          <style
            href={`doom-theme-${compiled.manifest.join("-")}`}
            precedence="doom"
          >
            {compiled.css}
          </style>
        ))}
      {legacyCss &&
        (effectiveNonce ? (
          <style nonce={effectiveNonce}>{legacyCss}</style>
        ) : (
          <style href={`doom-legacy-${resolved.id}`} precedence="doom">
            {legacyCss}
          </style>
        ))}
    </>
  );
  let scope: React.ReactNode;
  if (asChild) {
    const child = React.Children.only(children);
    if (
      !React.isValidElement<{ className?: string }>(child) ||
      child.type === React.Fragment
    ) {
      throw new Error("ThemeScope asChild requires one non-Fragment element");
    }
    scope = React.cloneElement(child, {
      ...scopeProps,
      className:
        [child.props.className, className].filter(Boolean).join(" ") ||
        undefined,
    });
  } else {
    scope = withBody ? (
      <body {...scopeProps}>
        {styleNode}
        {children}
      </body>
    ) : (
      <div {...scopeProps}>{children}</div>
    );
  }
  return (
    <ThemeRuntimeContext.Provider value={runtime}>
      {!withBody && styleNode}
      {scope}
    </ThemeRuntimeContext.Provider>
  );
}

export function useResolvedTheme(): ResolvedTheme {
  const runtime = useContext(ThemeRuntimeContext);
  if (!runtime) {
    throw new Error(
      "useResolvedTheme must be used inside DesignSystemProvider or ThemeScope",
    );
  }
  return runtime.resolved;
}
