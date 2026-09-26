import { useEffect, useMemo, useRef, useState } from "react";

import type {
  CompactMessage,
  CompactRequest,
  CoordinateEncoding,
} from "./compact-protocol";
import {
  adoptCompact,
  adoptDrawing,
  type CompactWorld,
  prepareCompact,
} from "./compact-world";

const EMPTY = adoptCompact(prepareCompact(0));
export function useCompactWorld(
  count: number,
  revision: number,
  encoding: CoordinateEncoding = "projected",
) {
  const small = useMemo(
    () =>
      count < 100000
        ? adoptCompact(prepareCompact(count, revision, encoding))
        : undefined,
    [count, revision, encoding],
  );
  const [prepared, setPrepared] = useState({
    encoding,
    count: -1,
    revision: -1,
    world: EMPTY,
  });
  const previous = useRef(EMPTY);
  const world =
    small ??
    (prepared.count === count &&
    prepared.revision === revision &&
    prepared.encoding === encoding
      ? prepared.world
      : previous.current);
  useEffect(() => {
    previous.current = world;
  }, [world]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    setError(undefined);
    if (small) {
      return;
    }
    let active = true;
    let worker: Worker | undefined;
    let pending: CompactWorld | undefined;
    const stop = () => {
      if (!active) {
        return;
      }
      active = false;
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
    };
    const fail = (cause: unknown) => {
      if (!active) {
        return;
      }
      stop();
      setError(cause instanceof Error ? cause.message : String(cause));
    };
    try {
      worker = new Worker(new URL("./compact.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event: MessageEvent<CompactMessage>) => {
        if (!active) {
          return;
        }
        try {
          const message = event.data;
          if (message.stage === "draw") {
            if (
              pending ||
              message.encoding !== encoding ||
              message.positions.length !== count * 2
            ) {
              throw new Error("Unexpected drawing response");
            }
            pending = adoptDrawing({
              values:
                message.encoding === "raw" ? message.positions : message.values,
              positions: message.positions,
              encoding: message.encoding,
              timings: { preparationMs: message.preparationMs },
            });
            setPrepared({ count, revision, encoding, world: pending });
          } else if (message.stage === "ready" && pending) {
            if (encoding === "raw" && !message.values) {
              throw new Error("Missing exact values");
            }
            pending.attachGrid({
              grid: message.grid,
              indexMs: message.indexMs,
              values: message.values,
            });
            stop();
            setPrepared({ count, revision, encoding, world: pending });
          } else {
            throw new Error("Unexpected worker response");
          }
        } catch (cause) {
          fail(cause);
        }
      };
      worker.onerror = (event) =>
        fail(new Error(event.message || "Worker failed"));
      worker.onmessageerror = () =>
        fail(new Error("Unable to deserialize worker response"));
      worker.postMessage({
        count,
        revision,
        encoding,
      } satisfies CompactRequest);
    } catch (cause) {
      fail(cause);
    }
    return stop;
  }, [count, revision, small, encoding]);
  return {
    world,
    loading:
      !error &&
      !small &&
      (prepared.encoding !== encoding ||
        prepared.count !== count ||
        prepared.revision !== revision ||
        !world.ready),
    error,
  };
}
