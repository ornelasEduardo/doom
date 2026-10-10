"use client";

import { useEffect, useRef } from "react";

import { registerGpuMark } from "./scene";

interface GpuLineProps {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  strokeOpacity?: number;
}

export function GpuLine({ x1, x2, y1, y2, strokeOpacity = 1 }: GpuLineProps) {
  const node = useRef<SVGLineElement>(null);
  useEffect(() => {
    if (!node.current) {
      return;
    }
    return registerGpuMark(node.current, {
      kind: "path",
      strokeOpacity,
      contours: [
        {
          points: [
            { x: x1, y: y1 },
            { x: x2, y: y2 },
          ],
          closed: false,
        },
      ],
    });
  }, [x1, x2, y1, y2, strokeOpacity]);
  return (
    <line
      ref={node}
      data-chart-gpu-mark="path"
      fill="none"
      strokeOpacity={0}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
    />
  );
}
