"use client";

import { type RefObject, useEffect, useState } from "react";

import { Text } from "../../components/Text/Text";
import styles from "./Proof.module.scss";

interface MetricsProps {
  container: RefObject<HTMLElement | null>;
  startedAt: number;
  interactionUnavailable?: boolean;
}

export function Metrics({
  container,
  startedAt,
  interactionUnavailable,
}: MetricsProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const node = container.current?.querySelector("[data-proof-draw-at]");
      const duration = (attribute: string, origin = 0) => {
        const raw = node?.getAttribute(attribute);
        const value =
          raw === null || raw === undefined ? NaN : Number(raw) - origin;
        return Number.isFinite(value) && value >= 0
          ? `${value.toFixed(1)} ms`
          : "Preparing…";
      };
      const canvas =
        container.current?.querySelector<HTMLCanvasElement>("canvas");
      setValues({
        submitted: duration("data-proof-draw-at", startedAt),
        ready: duration("data-proof-ready-at", startedAt),
        draw: duration("data-proof-draw-submit-ms"),
        preparation: duration("data-proof-preparation-ms"),
        index: duration("data-proof-index-ms"),
        marks: canvas?.dataset.gpuDrawn
          ? Number(canvas.dataset.gpuDrawn).toLocaleString()
          : "Preparing…",
      });
    };
    read();
    const timer = window.setInterval(read, 500);
    return () => window.clearInterval(timer);
  }, [container, startedAt]);
  return (
    <div className={styles.performance}>
      <dl className={styles.metrics}>
        <div>
          <dt>Data → draw</dt>
          <dd>{values.submitted || "Preparing…"}</dd>
        </div>
        <div>
          <dt>Interaction readiness</dt>
          <dd aria-label="Interaction readiness">
            {interactionUnavailable
              ? "Unavailable"
              : values.ready || "Preparing…"}
          </dd>
        </div>
        <div>
          <dt>Latest draw submission</dt>
          <dd>{values.draw || "Preparing…"}</dd>
        </div>
        <div>
          <dt>Marks submitted</dt>
          <dd>{values.marks || "Preparing…"}</dd>
        </div>
        <div>
          <dt>Data preparation</dt>
          <dd>{values.preparation || "Preparing…"}</dd>
        </div>
        <div>
          <dt>Interaction preparation</dt>
          <dd>{values.index || "Preparing…"}</dd>
        </div>
      </dl>
      <Text as="p" variant="small">
        Data → draw ends at CPU draw submission, not visible paint. Interaction
        readiness measures the full load from dataset selection. Drawing-buffer
        preparation is reported separately from interaction preparation, which
        includes any deferred CPU projection and index construction. Both
        exclude worker startup and transport. Latest draw submission describes
        one render; they do not measure GPU completion or FPS.
      </Text>
    </div>
  );
}
