import { useEffect } from "react";

import { Cursor, Dim, Markers, Tooltip } from "../behaviors";
import {
  removeInteraction,
  upsertInteraction,
} from "../state/store/chart.store";
import { ContextValue } from "../types/context";
import { Behavior } from "../types/events";
import { InteractionChannel } from "../types/interaction";
import { d3 } from "../utils/d3";

export const useChartBehaviors = <T>(
  chartContext: ContextValue<T>,
  userBehaviors?: Behavior<T>[],
) => {
  const status = chartContext.chartStore.useStore((s: any) => s.status);
  const elements = chartContext.chartStore.useStore((s: any) => s.elements);

  useEffect(() => {
    // PROTECT: behaviors should not run until the chart has valid dimensions and data.
    if (status !== "ready") {
      return;
    }

    // 1. Determine active behaviors
    let behaviors = userBehaviors;

    // Default behaviors if none provided
    if (!behaviors) {
      behaviors = [
        Tooltip({
          on: InteractionChannel.PRIMARY_HOVER,
        }),
        Cursor({
          on: InteractionChannel.PRIMARY_HOVER,
          showX: true,
        }),
      ];

      const type = chartContext.config.type;

      switch (type) {
        case "line":
        case "area":
          behaviors.push(
            Markers({
              on: InteractionChannel.PRIMARY_HOVER,
              radius: 8,
            }) as Behavior<T>,
          );
          break;
        case "bar":
        case "scatter":
          behaviors.push(
            Dim({
              on: InteractionChannel.PRIMARY_HOVER,
              selector:
                ".chart-bar-series .chart-bar, .chart-scatter-series circle",
            }) as Behavior<T>,
          );
          break;
        default:
          break;
      }
    }

    if (!behaviors) {
      return;
    }

    // 2. Setup behaviors
    const state = chartContext.chartStore.getState();
    const gSelection = state.elements.plot
      ? d3.select(state.elements.plot)
      : null;

    const cleanups = behaviors.map((behavior) => {
      return behavior({
        getChartContext: () =>
          ({
            ...chartContext,
            g: gSelection,
          }) as any,
        getInteraction: (name: string) => {
          return (
            chartContext.chartStore.getState().interactions.get(name) || null
          );
        },
        upsertInteraction: (name: string, value: any) => {
          upsertInteraction(chartContext.chartStore, name, value);
        },
        removeInteraction: (name: string) => {
          removeInteraction(chartContext.chartStore, name);
        },
      });
    });

    // 3. Teardown
    return () => {
      cleanups.forEach((cleanup) => {
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
    };
  }, [
    status,
    userBehaviors,
    chartContext.config.type,
    chartContext.chartStore,
    chartContext.chartStore.getState().processedSeries.length,
    elements.plot,
  ]);
};
