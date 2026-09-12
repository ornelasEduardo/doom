import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { Cursor, Dim, Markers, Tooltip } from "../behaviors";
import { ContextValue } from "../types/context";
import { Behavior, Cleanup } from "../types/events";
import { InteractionChannel } from "../types/interaction";
import { d3 } from "../utils/d3";
import { createInteractionAccess } from "../utils/interactionChannels";

function releaseBehavior(cleanup: Cleanup | void) {
  try {
    cleanup?.();
  } catch (error) {
    console.error("Chart behavior cleanup failed", error);
  }
}

export const useChartBehaviors = <T>(
  chartContext: ContextValue<T>,
  userBehaviors?: Behavior<T>[],
) => {
  const contextRef = useRef(chartContext);
  useLayoutEffect(() => {
    contextRef.current = chartContext;
  });

  const { chartStore } = chartContext;
  const status = chartStore.useStore((s) => s.status);
  const plot = chartStore.useStore((s) => s.elements.plot);
  const active = useRef(new Map<Behavior<T>, Cleanup | void>());
  const defaults = useMemo(() => {
    const behaviors: Behavior<T>[] = [
      Tooltip({ on: InteractionChannel.PRIMARY_HOVER }),
      Cursor({ on: InteractionChannel.PRIMARY_HOVER, showX: true }),
    ];
    switch (chartContext.config.type) {
      case "line":
      case "area":
        behaviors.push(
          Markers({ on: InteractionChannel.PRIMARY_HOVER, radius: 8 }),
        );
        break;
      case "bar":
      case "scatter":
        behaviors.push(
          Dim({
            on: InteractionChannel.PRIMARY_HOVER,
            selector:
              ".chart-bar-series .chart-bar, .chart-scatter-series circle",
          }),
        );
        break;
    }
    return behaviors;
  }, [chartContext.config.type]);

  // A behavior owns resources on one ready plot. Only replacing that owner or
  // unmounting the hook releases all resources, including StrictMode replay.
  useEffect(() => {
    const mounted = active.current;
    return () => {
      const cleanups = [...mounted.values()];
      mounted.clear();
      cleanups.forEach(releaseBehavior);
    };
  }, [chartStore, plot, status]);

  // Reconcile after every committed render; a fresh array or a series update
  // must not discard a retained behavior's closure or DOM layer.
  useEffect(() => {
    if (status !== "ready" || !plot) {
      return;
    }
    const wanted = new Set(userBehaviors ?? defaults);
    const mounted = active.current;
    for (const [behavior, cleanup] of mounted) {
      if (!wanted.has(behavior)) {
        mounted.delete(behavior);
        releaseBehavior(cleanup);
      }
    }
    const g = d3.select(plot);
    const access = createInteractionAccess(chartStore);
    for (const behavior of wanted) {
      if (!mounted.has(behavior)) {
        // Record the attempt before setup so a broken extension cannot retry
        // on every unrelated render or prevent its siblings from attaching.
        mounted.set(behavior, undefined);
        try {
          mounted.set(
            behavior,
            behavior({
              getChartContext: () => ({ ...contextRef.current, g }),
              ...access,
            }),
          );
        } catch (error) {
          console.error("Chart behavior setup failed", error);
        }
      }
    }
  });
};
