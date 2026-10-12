"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/Button/Button";
import { Text } from "../../components/Text/Text";
import { runCold } from "./cold";
import styles from "./Proof.module.scss";

export function ColdProbe() {
  const host = useRef<HTMLDivElement>(null);
  const result = useRef<Awaited<ReturnType<typeof runCold>> | undefined>(
    undefined,
  );
  const active = useRef<AbortController | undefined>(undefined);
  const [message, setMessage] = useState("Not run");
  const [point, setPoint] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    return () => {
      active.current?.abort();
      active.current = undefined;
      result.current?.dispose();
      result.current = undefined;
    };
  }, []);
  return (
    <details className={styles.lifecycle}>
      <summary>Compact cold-start probe</summary>
      <Text as="p">
        Creates 1,000,000 synthetic XY points, a hover index, and a fresh WebGL
        context on each run. No cached dataset or row objects. This lower-bound
        probe excludes Chart, axes, full keyboard navigation, network transfer,
        and page/module loading.
      </Text>
      <Button
        disabled={busy}
        onClick={async () => {
          if (active.current || !host.current) {
            return;
          }
          const controller = new AbortController();
          active.current = controller;
          setBusy(true);
          setMessage("Running cold start…");
          setPoint("");
          result.current?.dispose();
          result.current = undefined;
          const canvas = document.createElement("canvas");
          canvas.width = 1000;
          canvas.height = 400;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", "Compact synthetic point cloud");
          host.current.replaceChildren(canvas);
          try {
            const next = await runCold(canvas, 1000000, {
              signal: controller.signal,
            });
            if (active.current !== controller) {
              next.dispose();
              return;
            }
            result.current = next;
            setMessage(
              `Data + hover index: ${next.timings.preparationMs.toFixed(1)} ms\nGPU setup: ${next.timings.initializationMs.toFixed(1)} ms\nUpload + submission: ${next.timings.uploadAndSubmitMs.toFixed(1)} ms\nGPU complete at frame: ${next.timings.gpuCompletionAtFrameMs.toFixed(1)} ms\n${next.backend}`,
            );
          } catch (error) {
            if (active.current === controller) {
              canvas.remove();
              setMessage(
                error instanceof Error ? error.message : String(error),
              );
            }
          } finally {
            if (active.current === controller) {
              active.current = undefined;
              setBusy(false);
            }
          }
        }}
      >
        Run cold start
      </Button>
      <pre
        aria-atomic="true"
        aria-label="Cold start results"
        role="status"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {message}
      </pre>
      <Text as="p">
        Completion is checked with a GPU fence on an animation frame; it is not
        an exact compositor paint timestamp.
      </Text>
      <div
        ref={host}
        onPointerLeave={() => setPoint("")}
        onPointerMove={(event) => {
          const bounds = event.currentTarget
            .querySelector("canvas")
            ?.getBoundingClientRect();
          if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            return;
          }
          const index = result.current?.nearest(
            (event.clientX - bounds.left) / bounds.width,
            1 - (event.clientY - bounds.top) / bounds.height,
            6,
            bounds.width,
            bounds.height,
          );
          setPoint(
            index === undefined
              ? ""
              : JSON.stringify(result.current!.point(index)),
          );
        }}
      />
      <label>
        <Text>Inspect point index (0–999,999)</Text>
        <input
          disabled={busy || !result.current}
          max={999999}
          min={0}
          step={1}
          type="number"
          onChange={(event) => {
            const index = event.currentTarget.valueAsNumber;
            setPoint(
              Number.isInteger(index) &&
                index >= 0 &&
                index < 1000000 &&
                result.current
                ? JSON.stringify(result.current.point(index))
                : "",
            );
          }}
        />
      </label>
      <output aria-label="Compact hover point" aria-live="off">
        {point}
      </output>
    </details>
  );
}
