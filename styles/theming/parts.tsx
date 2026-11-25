"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";

import { resolveTheme } from "./defineTheme";
import type { ComponentName, PartName } from "./registry";
import { ThemeRuntimeContext } from "./ThemeScope";

export type ThemeClassNames<C extends ComponentName> = Partial<
  Record<PartName<C>, string>
>;
export interface VisualProps {
  variant?: string;
  size?: string;
  loading?: boolean;
  disabled?: boolean;
}

interface PartOwner {
  classNames?: Readonly<Record<string, string | undefined>>;
  visual?: VisualProps;
}
const PartOwners = createContext<Partial<Record<ComponentName, PartOwner>>>({});
export function ThemePartsBoundary<C extends ComponentName>({
  component,
  classNames,
  visual,
  children,
}: {
  component: C;
  classNames?: ThemeClassNames<C>;
  visual?: VisualProps;
  children: React.ReactNode;
}) {
  const parent = useContext(PartOwners);
  const value = useMemo(
    () => ({ ...parent, [component]: { classNames, visual } }),
    [parent, component, classNames, visual],
  );
  return <PartOwners.Provider value={value}>{children}</PartOwners.Provider>;
}

/** Resolve once per component render; returned getters never call hooks. */
export function useThemeParts<C extends ComponentName>(
  component: C,
  classNames?: ThemeClassNames<C>,
  visual: VisualProps = {},
) {
  const owner = useContext(PartOwners)[component];
  return usePartProps(component, classNames, visual, owner);
}

/** A fresh component instance must not read an enclosing instance's part options. */
export function useOwnedThemeParts<C extends ComponentName>(
  component: C,
  classNames?: ThemeClassNames<C>,
  visual: VisualProps = {},
) {
  return usePartProps(component, classNames, visual);
}

function usePartProps<C extends ComponentName>(
  component: C,
  classNames: ThemeClassNames<C> | undefined,
  visual: VisualProps,
  owner?: PartOwner,
) {
  const runtime = useContext(ThemeRuntimeContext);
  const instanceClasses = classNames ?? owner?.classNames;
  visual = { ...owner?.visual, ...visual };
  const resolved =
    runtime && visual.variant === "solid"
      ? resolveTheme(runtime.theme, runtime.mode, "solid")
      : runtime?.resolved;
  const legacy = runtime?.legacy;
  return useCallback(
    function part<P extends { className?: string }>(
      name: PartName<C>,
      props?: P,
    ) {
      const recipe = resolved?.components[component];
      const baseClass = resolved
        ? `doom-${resolved.id}-${component}-${name}`
        : undefined;
      const themeClass =
        recipe?.classNames?.[name as keyof typeof recipe.classNames];
      return {
        ...props,
        ...(resolved
          ? {
              "data-doom-theme": resolved.id,
              "data-doom-legacy-part": legacy || undefined,
              "data-doom-component": component,
              "data-doom-part": name,
              "data-doom-variant": visual.variant,
              "data-doom-size": visual.size,
            }
          : {}),
        "data-loading": visual.loading || undefined,
        "data-disabled": visual.disabled || undefined,
        className:
          [
            baseClass,
            baseClass &&
              visual.variant &&
              `${baseClass}--variant-${visual.variant}`,
            baseClass && visual.size && `${baseClass}--size-${visual.size}`,
            props?.className,
            themeClass,
            instanceClasses?.[name],
          ]
            .filter(Boolean)
            .join(" ") || undefined,
      };
    },
    [
      resolved,
      legacy,
      component,
      instanceClasses,
      visual.variant,
      visual.size,
      visual.loading,
      visual.disabled,
    ],
  );
}
