"use client";
import React, { useContext } from "react";

import { ThemeRuntimeContext, ThemeScope } from "./ThemeScope";
import type { SurfaceContext } from "./types";

/** Reuses the finite precompiled surface contexts; no runtime theme derivation. */
export function ThemeSurface({
  surface,
  children,
}: {
  surface?: SurfaceContext;
  children: React.ReactElement;
}) {
  const runtime = useContext(ThemeRuntimeContext);
  return runtime ? (
    <ThemeScope asChild surface={surface}>
      {children}
    </ThemeScope>
  ) : (
    children
  );
}
