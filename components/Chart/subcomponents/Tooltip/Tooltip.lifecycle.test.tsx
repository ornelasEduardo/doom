import { act, cleanup, render } from "@testing-library/react";
import { StrictMode, useRef } from "react";
import { afterEach, expect, it } from "vitest";

import { Cursor, Tooltip as TooltipBehavior } from "../../behaviors";
import { ChartContext } from "../../context";
import { Engine } from "../../engine";
import { useChartBehaviors } from "../../hooks/useChartBehaviors";
import {
  createChartStore,
  upsertInteraction,
} from "../../state/store/chart.store";
import type { ContextValue } from "../../types/context";
import type { Behavior } from "../../types/events";
import { CursorLine } from "../Cursor/Cursor";
import { Tooltip } from "./Tooltip";

afterEach(cleanup);

it("owns simultaneous pinned and remote overlays and removes only the departing owner", () => {
  const chartStore = createChartStore({ type: "line" });
  const plot = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chartStore.setState((s) => ({
    status: "ready",
    elements: { ...s.elements, plot },
    processedSeries: [
      { id: "line", label: "Line", color: "currentColor", hideCursor: false },
    ],
    dimensions: {
      width: 200,
      height: 200,
      innerWidth: 180,
      innerHeight: 180,
      margin: { top: 10, left: 10, right: 10, bottom: 10 },
    },
  }));
  const context: ContextValue<number> = {
    chartStore,
    engine: new Engine<number>(),
    config: {},
    isMobile: false,
    colorPalette: [],
    styles: {},
    resolveInteraction: () => null,
  };
  const publish = (on: string, data: number[]) =>
    upsertInteraction(chartStore, on, {
      targets: data.map((value) => ({
        data: value,
        coordinate: { x: value, y: 50 },
      })),
      pointer: {
        x: data[0],
        y: 50,
        containerX: data[0],
        containerY: 50,
        isTouch: false,
      },
    });
  publish("pinned", [30]);
  publish("remote", [80, 90]);
  const pinnedCursor = Cursor({ on: "pinned" });
  const remoteCursor = Cursor({ on: "remote", showX: false, showY: true });
  const pinnedTooltip = TooltipBehavior<number>({
    on: "pinned",
    render: ({ data, targets, pointer }) =>
      `pinned:${data.join(",")}:${targets.length}:${pointer.x}`,
  });
  const remoteTooltip = TooltipBehavior<number>({
    on: "remote",
    render: ({ data, targets, pointer }) =>
      `remote:${data.join(",")}:${targets.length}:${pointer.x}`,
  });
  function Fixture({ behaviors }: { behaviors: Behavior<number>[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    useChartBehaviors(context, behaviors);
    return (
      <ChartContext.Provider value={context}>
        <div ref={containerRef}>
          <svg>
            <CursorLine />
          </svg>
          <Tooltip containerRef={containerRef} />
        </div>
      </ChartContext.Provider>
    );
  }
  const view = render(
    <StrictMode>
      <Fixture
        behaviors={[pinnedCursor, pinnedTooltip, remoteCursor, remoteTooltip]}
      />
    </StrictMode>,
  );
  expect(view.container.querySelectorAll("line")).toHaveLength(2);
  expect(view.container.textContent).toContain("pinned:30:1:30");
  expect(view.container.textContent).toContain("remote:80,90:2:80");
  const pinned = Array.from(
    view.container.querySelectorAll("[data-chart-tooltip]"),
  ).find((el) => el.textContent?.startsWith("pinned:"));
  view.rerender(
    <StrictMode>
      <Fixture behaviors={[remoteTooltip, pinnedTooltip, pinnedCursor]} />
    </StrictMode>,
  );
  expect(view.container.querySelectorAll("line")).toHaveLength(1);
  expect(view.container.querySelectorAll("[data-chart-tooltip]")).toHaveLength(
    2,
  );
  expect(
    Array.from(view.container.querySelectorAll("[data-chart-tooltip]")).find(
      (el) => el.textContent?.startsWith("pinned:"),
    ),
  ).toBe(pinned);
  act(() => publish("remote", [85]));
  expect(view.container.textContent).toContain("remote:85:1:85");
  view.rerender(
    <StrictMode>
      <Fixture behaviors={[pinnedTooltip, pinnedCursor]} />
    </StrictMode>,
  );
  expect(view.container.querySelectorAll("[data-chart-tooltip]")).toHaveLength(
    1,
  );
  view.unmount();
  expect(
    [...chartStore.getState().interactions.keys()].filter(
      (key) => typeof key === "string" && key.includes("-config"),
    ),
  ).toHaveLength(0);
  context.engine.dispose();
});
