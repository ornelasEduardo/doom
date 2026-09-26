"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../components/Button/Button";
import { Chart, type RenderFrame } from "../../components/Chart/Chart";
import { Text } from "../../components/Text/Text";
import type { CompactWorld } from "./compact-world";
import { Metrics } from "./Metrics";
import { separateMarkers } from "./overlay";
import styles from "./Proof.module.scss";
import { createRenderer } from "./renderer";
import { scatterResource, type Service, type ViewControls } from "./scatter";

interface ChartExampleProps {
  name: string;
  world: CompactWorld;
  startedAt: number;
  detail: "exact" | "density";
  preparationError?: string;
}

export function ChartExample({
  name,
  world,
  startedAt,
  detail,
  preparationError,
}: ChartExampleProps) {
  const container = useRef<HTMLElement>(null);
  // Sparse edits use geometry patches; only a new world replaces Chart's seed data.
  const seriesData = useMemo(() => world.summary, [world]);
  const detailRef = useRef(detail);
  detailRef.current = detail;
  const worldRef = useRef(world);
  worldRef.current = world;
  const controls = useRef<ViewControls | null>(null);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const renderer = useMemo(
    () =>
      createRenderer<RenderFrame<Service>>((frame, invalidate) =>
        scatterResource(frame, {
          invalidate,
          connect: (next) => {
            controls.current = next;
          },
          report: setScale,
          getWorld: () => worldRef.current,
          reportLoading: setLoading,
          reportError: setError,
          getDetail: () => detailRef.current,
        }),
      ),
    [],
  );
  useEffect(() => () => renderer.dispose(), [renderer]);
  useEffect(() => {
    controls.current?.redraw();
  }, [detail]);
  const sensors = useMemo(() => [Chart.sensors.DataHoverSensor()], []);
  const behaviors = useMemo(
    () => [Chart.behaviors.Tooltip(), separateMarkers<Service>()],
    [],
  );
  return (
    <section
      ref={container}
      className={styles.example}
      data-proof-chart={name}
      data-proof-mode="webgl"
    >
      <div className={styles.heading}>
        <Text variant="h3">
          {name === "Primary" ? "Service performance" : "Isolation comparison"}
        </Text>
        <output aria-label={`${name} zoom`}>Zoom {scale.toFixed(2)}×</output>
      </div>
      <Chart.Root
        aria-busy={!preparationError && loading !== null}
        aria-label={`${name} service performance`}
        behaviors={behaviors}
        className={styles.chart}
        data={seriesData}
        dataDescription={`Scatter chart with ${world.length.toLocaleString()} services. Requests per second and latency in milliseconds range from 1 to 1,000 on logarithmic axes.`}
        sensors={sensors}
        type="scatter"
        x="requests"
        xDomain={[1, 1000]}
        y="latency"
        yDomain={[1, 1000]}
      >
        <Chart.Plot>
          <Chart.Series
            label="Latency (ms)"
            render={renderer.render}
            x="requests"
            y="latency"
          />
        </Chart.Plot>
      </Chart.Root>
      <div className={styles.status} role="status">
        {(preparationError
          ? `Interactions unavailable: ${preparationError}`
          : error) ||
          loading ||
          "Hover or use arrow keys to inspect a service. Wheel to zoom."}
      </div>
      <Metrics
        container={container}
        interactionUnavailable={!!preparationError || !!error}
        startedAt={startedAt}
      />
      <Text variant="small">
        X: requests / second · Y: latency (ms) · Both axes logarithmic
      </Text>
      <div className={styles.controls}>
        <Button
          aria-label={`Zoom in ${name}`}
          onClick={() => controls.current?.scale(2)}
        >
          Zoom in
        </Button>
        <Button
          aria-label={`Zoom out ${name}`}
          onClick={() => controls.current?.scale(0.5)}
        >
          Zoom out
        </Button>
        <Button
          aria-label={`Reset ${name}`}
          onClick={() => controls.current?.reset()}
        >
          Reset view
        </Button>
      </div>
    </section>
  );
}
