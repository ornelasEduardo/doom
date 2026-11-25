"use client";

import React, { useContext, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ThemeRuntimeContext, ThemeScope } from "./ThemeScope";
import type { SurfaceContext } from "./types";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export interface ThemedPortalProps {
  children: React.ReactNode;
  surface?: SurfaceContext;
  container?: Element | null;
}
/** A CSS boundary accompanies the React context across the portal. */
export function ThemedPortal({
  children,
  container,
  surface,
}: ThemedPortalProps) {
  const runtime = useContext(ThemeRuntimeContext);
  const mounted = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  if (!mounted) {
    return null;
  }
  const host = container ?? runtime?.portalContainer ?? document.body;
  if (!(host instanceof Element) || host.getRootNode() !== document) {
    throw new Error(
      "portalContainer must be a connected element in the current document’s light DOM. Shadow trees, iframe documents and detached hosts are unsupported.",
    );
  }
  return createPortal(
    runtime ? (
      <ThemeScope className="doom-portal-scope" surface={surface}>
        {children}
      </ThemeScope>
    ) : (
      children
    ),
    host,
  );
}
