"use client";

import React from "react";

import { componentMap } from "./mapping";

export interface A2UINode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  children?: (A2UINode | string)[];
}

export interface RendererProps {
  data: A2UINode;
}

export function Renderer({ data }: RendererProps) {
  if (!data) {
    return null;
  }

  const { type, props = {}, children } = data;
  const Component = componentMap[type];

  if (!Component) {
    console.warn(`Renderer: Unknown component type "${type}"`);
    return null;
  }

  return (
    <Component {...props}>
      {Array.isArray(children)
        ? children.map((child, index) => {
            if (typeof child === "string") {
              return child;
            }
            return (
              <Renderer key={child.id || index} data={child as A2UINode} />
            );
          })
        : children}
    </Component>
  );
}
