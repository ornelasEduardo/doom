"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "../../components/Button/Button";
import { Chart } from "../../components/Chart/Chart";
import { Text } from "../../components/Text/Text";
import { DesignSystemProvider } from "../../DesignSystemProvider";
import styles from "./Dashboards.module.scss";
import type { RequestRow, TimelineRow } from "./data";
import {
  createRequests,
  createTimeline,
  latencyBuckets,
  regions,
  summarizeRegions,
} from "./data";
import { FrameMeter } from "./FrameMeter";

const integer = new Intl.NumberFormat("en-US");
const milliseconds = (value: string | number) => `${value} ms`;
const config = { grid: true, axes: { x: { maxTicks: 6 }, y: { maxTicks: 5 } } };
const latencyConfig = {
  ...config,
  axes: { ...config.axes, y: { maxTicks: 5, valueFormat: milliseconds } },
};

function Stat({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div className={styles.stat}>
      <Text variant="caption">{label}</Text>
      <Text data-testid={testId} variant="h2">
        {value}
      </Text>
    </div>
  );
}

function Operations() {
  const [tick, setTick] = useState(0);
  const [live, setLive] = useState(false);
  const [inspected, setInspected] = useState<TimelineRow | null>(null);
  const rows = useMemo(() => createTimeline(tick), [tick]);
  const current = inspected ?? rows[rows.length - 1];
  useEffect(() => {
    if (!live) {
      return;
    }
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [live]);
  return (
    <>
      <div className={styles.toolbar}>
        <Text as="p">
          A shared 60-second window. Inspect latency to read the same sample
          across the three metrics.
        </Text>
        <Button onClick={() => setLive((value) => !value)}>
          {live ? "Pause stream" : "Start stream"}
        </Button>
        <Button onClick={() => setTick((value) => value + 1)}>
          Advance one second
        </Button>
      </div>
      <div className={styles.stats}>
        <Stat
          label={`P99 latency · second ${current.second}`}
          value={`${current.p99} ms`}
        />
        <Stat
          label="Requests / second"
          value={integer.format(current.requests)}
        />
        <Stat
          label="Error rate"
          value={`${((100 * current.errors) / current.requests).toFixed(2)}%`}
        />
      </div>
      <div className={styles.charts}>
        <Chart.Root
          withLegend
          className={styles.wideChart}
          d3Config={latencyConfig}
          data={rows}
          data-dashboard-chart="latency"
          subtitle="P50 and P99 · milliseconds · synthetic incident around second 42"
          title="Tail latency"
          x="second"
          y="p99"
          onValueChange={setInspected}
        >
          <Chart.Grid />
          <Chart.Axis />
          <Chart.Cursor mode="line" />
          <Chart.Series
            color="var(--primary)"
            label="P50"
            type="line"
            x="second"
            y="p50"
          />
          <Chart.Series
            color="var(--error)"
            label="P99"
            type="line"
            x="second"
            y="p99"
          />
          <Chart.Cursor mode="dots" />
        </Chart.Root>
        <Chart
          className={styles.chart}
          d3Config={{ ...config, withGradient: true }}
          data={rows}
          data-dashboard-chart="traffic"
          subtitle="Requests per second"
          title="Traffic"
          type="area"
          x="second"
          y="requests"
        />
        <Chart
          className={styles.chart}
          d3Config={config}
          data={rows}
          data-dashboard-chart="errors"
          subtitle="Count per second · same time window"
          title="Failed requests"
          type="bar"
          x={(row) => String(row.second)}
          y="errors"
        />
      </div>
      <Text variant="small">
        Hover between charts, scroll, use arrow keys, then switch dashboards and
        come back. Streaming starts only when requested.
      </Text>
    </>
  );
}

function Explorer() {
  const [count, setCount] = useState(10000);
  const [region, setRegion] = useState("All regions");
  const [inspected, setInspected] = useState<RequestRow | null>(null);
  const all = useMemo(() => createRequests(count), [count]);
  const rows = useMemo(
    () =>
      region === "All regions"
        ? all
        : all.filter((row) => row.region === region),
    [all, region],
  );
  const buckets = useMemo(() => latencyBuckets(rows), [rows]);
  const breakdown = useMemo(() => summarizeRegions(rows), [rows]);
  const mean = useMemo(
    () =>
      Math.round(rows.reduce((sum, row) => sum + row.latency, 0) / rows.length),
    [rows],
  );
  return (
    <>
      <div className={styles.toolbar}>
        <div aria-label="Region filter" className={styles.filters}>
          {["All regions", ...regions].map((name) => (
            <Button
              key={name}
              aria-pressed={name === region}
              onClick={() => {
                setRegion(name);
                setInspected(null);
              }}
            >
              {name}
            </Button>
          ))}
        </div>
        <label className={styles.size}>
          <Text variant="small">Request sample size</Text>
          <select
            aria-label="Request sample size"
            value={count}
            onChange={(event) => {
              setCount(Number(event.target.value));
              setInspected(null);
            }}
          >
            <option value={10000}>10,000</option>
            <option value={50000}>50,000</option>
            <option value={100000}>100,000</option>
          </select>
        </label>
      </div>
      <div className={styles.stats}>
        <Stat
          label="Requests in all three charts"
          testId="request-count"
          value={integer.format(rows.length)}
        />
        <Stat label="Mean latency" value={`${mean} ms`} />
        <Stat
          label={
            inspected
              ? `Inspecting request #${inspected.id} · ${inspected.region}`
              : "Inspect a point with pointer or keyboard"
          }
          value={
            inspected
              ? `${inspected.kb} KB / ${inspected.latency} ms`
              : "Ready to explore"
          }
        />
      </div>
      <div className={styles.charts}>
        <Chart.Root
          className={styles.wideChart}
          d3Config={{
            ...latencyConfig,
            xAxisLabel: "Payload (KB)",
            yAxisLabel: "Latency (ms)",
          }}
          data={rows}
          data-dashboard-chart="requests"
          subtitle={`${integer.format(rows.length)} individual requests · shared regional filter`}
          title="Payload size × response time"
          type="scatter"
          x="kb"
          xDomain={[0, 500]}
          y="latency"
          yDomain={[0, 500]}
          onValueChange={setInspected}
        >
          <Chart.Grid />
          <Chart.Axis />
          <Chart.Series label="Requests" type="scatter" />
          <Chart.Cursor mode="dots" />
        </Chart.Root>
        <Chart
          className={styles.chart}
          d3Config={config}
          data={buckets}
          data-dashboard-chart="distribution"
          subtitle="Requests in each latency bucket (ms)"
          title="Latency distribution"
          type="bar"
          x="label"
          y="count"
        />
        <Chart
          className={styles.chart}
          d3Config={config}
          data={breakdown}
          data-dashboard-chart="regions"
          subtitle="Counts reconcile with the scatter and distribution"
          title="Regional coverage"
          type="bar"
          x="label"
          y="count"
        />
      </div>
      <Text variant="small">
        Every dot represents one request. Filters apply to all three charts; the
        domains stay fixed for fair comparisons. This exercises the public
        row-data API.
      </Text>
    </>
  );
}

export function Dashboards() {
  const [view, setView] = useState<"operations" | "explorer">("operations");
  return (
    <DesignSystemProvider>
      <main className={styles.page}>
        <header className={styles.header}>
          <Text variant="caption">Doom / Chart field lab / Synthetic data</Text>
          <Text variant="h1">
            Real workloads.
            <br />
            One chart engine.
          </Text>
          <Text as="p">
            Two small dashboards to test composition, responsiveness and
            interaction continuity.
          </Text>
          <nav aria-label="Dashboard" className={styles.filters}>
            <Button
              aria-pressed={view === "operations"}
              onClick={() => setView("operations")}
            >
              Live operations
            </Button>
            <Button
              aria-pressed={view === "explorer"}
              onClick={() => setView("explorer")}
            >
              Request explorer
            </Button>
          </nav>
        </header>
        {view === "operations" ? <Operations /> : <Explorer />}
        <footer className={styles.footer}>
          <FrameMeter />
          <Text variant="small">
            WebGL2 marks · SVG axes labels and interaction · Baseline keyboard
            access
          </Text>
        </footer>
      </main>
    </DesignSystemProvider>
  );
}
