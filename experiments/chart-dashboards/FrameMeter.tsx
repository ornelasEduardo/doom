"use client";
import { useEffect, useState } from "react";

import { Text } from "../../components/Text/Text";

export function FrameMeter() {
  const [reading, setReading] = useState("Sampling…");
  useEffect(() => {
    let frame = 0;
    let last = 0;
    let published = 0;
    let samples: number[] = [];
    const sample = (now: number) => {
      if (document.hidden) {
        samples = [];
        last = 0;
        published = now;
      } else {
        if (last) {
          samples.push(now - last);
        }
        last = now;
        if (now - published >= 1000 && samples.length) {
          const sorted = [...samples].sort((a, b) => a - b);
          const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
          const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
          setReading(
            `${Math.round(1000 / mean)} fps · ${p95.toFixed(1)} ms p95 frame interval`,
          );
          samples = [];
          published = now;
        }
      }
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <Text variant="small">
      {reading} · Last second · Browser scheduling, not GPU timing
    </Text>
  );
}
