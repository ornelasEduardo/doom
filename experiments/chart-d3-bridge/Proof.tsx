"use client";

import { useState } from "react";

import { Button } from "../../components/Button/Button";
import { Select } from "../../components/Select/Select";
import { Text } from "../../components/Text/Text";
import { DesignSystemProvider } from "../../DesignSystemProvider";
import { ChartExample } from "./ChartExample";
import { ColdProbe } from "./ColdProbe";
import type { CoordinateEncoding } from "./compact-protocol";
import styles from "./Proof.module.scss";
import { useCompactWorld } from "./useCompactWorld";

interface ProofProps {
  initialCount?: number;
  initialEncoding?: CoordinateEncoding;
}

export function Proof({
  initialCount = 1000,
  initialEncoding = "raw",
}: ProofProps) {
  const [encoding, setEncoding] = useState(initialEncoding);
  const [detail, setDetail] = useState<"exact" | "density">("exact");
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const [primaryMount, setPrimaryMount] = useState(0);
  const [comparisonMount, setComparisonMount] = useState(0);
  const [comparison, setComparison] = useState(true);
  const [count, setCount] = useState(initialCount);
  const [mounted, setMounted] = useState(true);
  const [revision, setRevision] = useState(0);
  const {
    world,
    loading: preparingData,
    error: preparationError,
  } = useCompactWorld(count, revision, encoding);
  const [patchCount, setPatchCount] = useState(100);
  const [patchResult, setPatchResult] = useState("");
  return (
    <DesignSystemProvider>
      <main className={styles.page}>
        <Text variant="small" weight="bold">
          Chart rendering lab
        </Text>
        <Text variant="h1">Explore the cost of a million points.</Text>
        <Text as="p">
          Compact data powers GPU rendering and SVG interactions. The optional
          second chart checks that zoom, hover, and lifecycle changes stay
          independent. Exact mode draws every point; density mode groups nearby
          points into count markers and refines as you zoom. Tooltips inspect
          the original records.
        </Text>
        <div className={styles.controls}>
          <Text weight="bold">GPU rendering · SVG interaction overlay</Text>
          <Select
            label="Projection"
            options={[
              { value: "projected", label: "CPU prepared" },
              { value: "raw", label: "GPU raw data" },
            ]}
            value={encoding}
            onChange={(event) => {
              setStartedAt(performance.now());
              setEncoding(event.target.value as CoordinateEncoding);
            }}
          />
          <Select
            label="Detail"
            options={[
              { value: "exact", label: "Every point" },
              { value: "density", label: "Adaptive density" },
            ]}
            value={detail}
            onChange={(event) =>
              setDetail(event.target.value as "exact" | "density")
            }
          />
          <Select
            label="Points per chart"
            options={[
              8, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000,
              1000000,
            ].map((value) => ({
              value,
              label: value.toLocaleString(),
            }))}
            value={count}
            onChange={(event) => {
              setStartedAt(performance.now());
              setCount(Number(event.target.value));
            }}
          />
          <Text>
            {(
              world.length *
              (Number(mounted) + Number(comparison))
            ).toLocaleString()}{" "}
            total points
          </Text>
        </div>
        {detail === "density" && (
          <Text role="status">
            Density markers represent bins, with brighter shading for larger
            counts on a logarithmic scale. Bins refine with zoom; bins at
            viewport edges can include points just outside the view. Hover and
            keyboard navigation still inspect exact records.
          </Text>
        )}
        <div className={styles.actions}>
          <>
            <Select
              label="Points to edit"
              options={[1, 100, 10000].map((value) => ({
                value,
                label: value.toLocaleString(),
              }))}
              value={patchCount}
              onChange={(event) => setPatchCount(Number(event.target.value))}
            />
            <Button
              disabled={!world.ready}
              onClick={() => {
                const start = performance.now();
                const changed = world.editSample(patchCount);
                setPatchResult(
                  `${changed.toLocaleString()} points edited · ${(performance.now() - start).toFixed(1)} ms submitted`,
                );
              }}
            >
              Edit points
            </Button>
            <output aria-label="Incremental update result">
              {patchResult}
            </output>
          </>
          <Button
            onClick={() => {
              setStartedAt(performance.now());
              setRevision((value) => value + 1);
            }}
          >
            Update data
          </Button>
          <Button
            onClick={() => {
              setComparisonMount(performance.now());
              setComparison((value) => !value);
            }}
          >
            {comparison ? "Hide comparison" : "Show comparison"}
          </Button>
        </div>
        {(preparingData || preparationError) && (
          <Text role="status">
            {preparationError
              ? `Dataset preparation failed: ${preparationError}`
              : "Preparing the requested dataset… Points appear as soon as drawing buffers arrive; interactions follow when indexing finishes."}
          </Text>
        )}
        <div className={styles.grid} data-comparison={comparison}>
          {mounted ? (
            <ChartExample
              key="Primary"
              detail={detail}
              name="Primary"
              preparationError={preparationError}
              startedAt={Math.max(startedAt, primaryMount)}
              world={world}
            />
          ) : (
            <div className={styles.empty}>
              <Text>Primary is unmounted. Comparison remains interactive.</Text>
            </div>
          )}
          {comparison && (
            <ChartExample
              key="Comparison"
              detail={detail}
              name="Comparison"
              preparationError={preparationError}
              startedAt={Math.max(startedAt, comparisonMount)}
              world={world}
            />
          )}
        </div>
        <details className={styles.lifecycle}>
          <summary>Lifecycle check</summary>
          <Text as="p">
            Remove the primary chart, then restore it to check cleanup and
            interaction recovery.
          </Text>
          <Button
            onClick={() => {
              setPrimaryMount(performance.now());
              setMounted((value) => !value);
            }}
          >
            {mounted ? "Unmount Primary" : "Mount Primary"}
          </Button>
        </details>
        <ColdProbe />
        <Text as="p" variant="small">
          Prototype only. Tests scale projection, wheel integration, instance
          isolation, and renderer teardown. General pan/brush arbitration and
          region geometry are outside this proof.
        </Text>
      </main>
    </DesignSystemProvider>
  );
}
