"use client";

import { type Ref, type SVGProps, useEffect, useRef } from "react";

import { registerGpuMark } from "./scene";
import type { VectorContour } from "./vector-path";

export interface GpuPathProps extends SVGProps<SVGPathElement> {
  contours: readonly VectorContour[];
  gradient?: { startOpacity: number; endOpacity: number };
  ref?: Ref<SVGPathElement>;
}

export function GpuPath({ contours, gradient, ref, ...props }: GpuPathProps) {
  const node = useRef<SVGPathElement>(null);
  const startOpacity = gradient?.startOpacity;
  const endOpacity = gradient?.endOpacity;
  useEffect(() => {
    if (!node.current) {
      return;
    }
    return registerGpuMark(node.current, {
      kind: "path",
      contours,
      gradient:
        startOpacity === undefined || endOpacity === undefined
          ? undefined
          : { startOpacity, endOpacity },
    });
  }, [contours, startOpacity, endOpacity]);
  return (
    <path
      {...props}
      ref={(element) => {
        node.current = element;
        if (typeof ref === "function") {
          return ref(element);
        }
        if (ref) {
          ref.current = element;
        }
      }}
      data-chart-gpu-mark="path"
      fillOpacity={0}
      strokeOpacity={0}
    />
  );
}
