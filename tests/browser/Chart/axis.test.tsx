import "../../../styles/globals.scss";

import { cleanup, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Chart } from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

const day = 86400000;
const start = Date.UTC(2026, 0, 1);
const data = Array.from({ length: 40 }, (_, i) => ({
  x: start + i * day,
  y: 20 + (i % 7),
}));
const dateLabel = (value: string | number) =>
  new Date(Number(value)).toISOString().slice(0, 10);
const labels = (host: HTMLElement, axis: "X" | "Y" = "X") =>
  Array.from(host.querySelectorAll(`[aria-label="${axis} Axis"] .tick text`));

afterEach(cleanup);

it("formats timestamp ticks and caps their count without changing the data", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        d3Config={{
          showDots: true,
          axes: { x: { tickFormat: dateLabel, maxTicks: 4 } },
        }}
        data={data}
        style={{ width: 1000, height: 360 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>,
  );
  await waitFor(() => {
    expect(labels(container).length).toBeGreaterThan(1);
    expect(labels(container).length).toBeLessThanOrEqual(4);
    expect(
      labels(container).every((label) =>
        /^2026-\d\d-\d\d$/.test(label.textContent ?? ""),
      ),
    ).toBe(true);
    expect(container.querySelectorAll("circle")).toHaveLength(data.length);
  });
});

it("updates formatting and categorical tick limits after a parent rerender", async () => {
  const rows = data.map((d, i) => ({ ...d, x: `Day ${i + 1}` }));
  const example = (prefix: string, count: number) => (
    <DesignSystemProvider>
      <Chart
        d3Config={{
          axes: {
            x: {
              tickFormat: (value) => `${prefix}${value}`,
              maxTicks: count,
            },
          },
        }}
        data={rows}
        style={{ width: 1400, height: 360 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const { container, rerender } = render(example("Before ", 5));
  await waitFor(() => {
    expect(labels(container)).toHaveLength(5);
    expect(labels(container)[0].textContent).toBe("Before Day 1");
    expect(labels(container).at(-1)?.textContent).toBe("Before Day 40");
  });
  rerender(example("After ", 2));
  await waitFor(() => {
    expect(labels(container).map((label) => label.textContent)).toEqual([
      "After Day 1",
      "After Day 40",
    ]);
  });
});

it("keeps long formatted labels from overlapping in a narrow chart", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        d3Config={{ axes: { x: { tickFormat: dateLabel, maxTicks: 20 } } }}
        data={data}
        style={{ width: 360, height: 360 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>,
  );
  await waitFor(() => {
    const ticks = labels(container);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks.every((tick) => /^2026-/.test(tick.textContent ?? ""))).toBe(
      true,
    );
    const bounds = ticks.map((tick) => tick.getBoundingClientRect());
    for (let i = 1; i < bounds.length; i++) {
      expect(bounds[i].left).toBeGreaterThanOrEqual(bounds[i - 1].right);
    }
  });
});

it("handles one tick and ignores invalid tick limits", async () => {
  const example = (limit: number) => (
    <DesignSystemProvider>
      <Chart
        d3Config={{ axes: { x: { maxTicks: limit } } }}
        data={data}
        style={{ width: 1000, height: 360 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const { container, rerender } = render(example(1));
  await waitFor(() => expect(labels(container)).toHaveLength(1));
  for (const invalid of [0, -2, NaN, Infinity]) {
    rerender(example(invalid));
    await waitFor(() => expect(labels(container).length).toBeGreaterThan(1));
  }
});

it.each([240, 500, 800])(
  "keeps formatted ticks separated at %ipx",
  async (width) => {
    const { container } = render(
      <DesignSystemProvider>
        <Chart
          d3Config={{ axes: { x: { tickFormat: dateLabel, maxTicks: 6 } } }}
          data={data}
          style={{ width, height: 360 }}
          type="line"
          x="x"
          y="y"
        />
      </DesignSystemProvider>,
    );
    await waitFor(() => {
      const ticks = labels(container);
      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks.length).toBeLessThanOrEqual(6);
      const bounds = ticks.map((tick) => tick.getBoundingClientRect());
      for (let i = 1; i < bounds.length; i++) {
        expect(bounds[i].left).toBeGreaterThanOrEqual(bounds[i - 1].right);
      }
    });
  },
);

it.each([500, 640, 680])(
  "does not overlap capped category labels at %ipx",
  async (width) => {
    const rows = Array.from({ length: 8 }, (_, i) => ({
      x: `Category ${i + 1}`,
      y: i + 1,
    }));
    const { container } = render(
      <DesignSystemProvider>
        <Chart
          d3Config={{ axes: { x: { maxTicks: 6 } } }}
          data={rows}
          style={{ width, height: 360 }}
          type="bar"
          x="x"
          y="y"
        />
      </DesignSystemProvider>,
    );
    await waitFor(() => {
      const ticks = labels(container);
      expect(ticks.length).toBeGreaterThan(1);
      const boxes = ticks.map((tick) => tick.getBoundingClientRect());
      for (let i = 1; i < boxes.length; i++) {
        expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i - 1].right + 7);
      }
    });
  },
);

it("keeps huge finite tick limits bounded by available display space", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        d3Config={{ axes: { x: { maxTicks: Number.MAX_SAFE_INTEGER } } }}
        data={[
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ]}
        style={{ width: 500, height: 360 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>,
  );
  await waitFor(() => {
    expect(labels(container).length).toBeGreaterThan(0);
    expect(labels(container).length).toBeLessThan(100);
  });
});

it("formats both numeric axes independently and restores Y defaults after rerender", async () => {
  const example = (customY: boolean) => (
    <DesignSystemProvider>
      <Chart
        d3Config={{
          axes: {
            x: { tickFormat: dateLabel, maxTicks: 4 },
            y: customY
              ? {
                  tickFormat: (value) =>
                    `$${Number(value).toLocaleString("en-US")}`,
                  maxTicks: 3,
                }
              : undefined,
          },
        }}
        data={data.map((row) => ({ ...row, y: row.y * 1000 }))}
        style={{ width: 1000, height: 400 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const { container, rerender } = render(example(true));
  await waitFor(() => {
    expect(
      labels(container).every((label) =>
        /^2026-/.test(label.textContent ?? ""),
      ),
    ).toBe(true);
    expect(labels(container, "Y").length).toBeGreaterThan(1);
    expect(labels(container, "Y").length).toBeLessThanOrEqual(3);
    expect(
      labels(container, "Y").every((label) =>
        label.textContent?.startsWith("$"),
      ),
    ).toBe(true);
  });
  rerender(example(false));
  await waitFor(() => {
    expect(
      labels(container, "Y").some((label) => label.textContent?.includes("k")),
    ).toBe(true);
    expect(
      labels(container, "Y").every(
        (label) => !label.textContent?.startsWith("$"),
      ),
    ).toBe(true);
  });
});

it("formats and thins Y categories on horizontal bars without omitting bars", async () => {
  const rows = Array.from({ length: 18 }, (_, i) => ({
    category: `Team ${i + 1}`,
    value: i + 10,
  }));
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        d3Config={{
          axes: {
            y: { tickFormat: (value) => `Group: ${value}`, maxTicks: 7 },
          },
        }}
        data={rows}
        style={{ width: 600, height: 320 }}
        type="bar"
        x="value"
        y="category"
      >
        <Chart.Plot>
          <Chart.Series orientation="horizontal" type="bar" />
          <Chart.Axis />
        </Chart.Plot>
      </Chart>
    </DesignSystemProvider>,
  );
  await waitFor(() => {
    const ticks = labels(container, "Y");
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks.length).toBeLessThanOrEqual(7);
    expect(ticks.every((tick) => tick.textContent?.startsWith("Group:"))).toBe(
      true,
    );
    const boxes = ticks
      .map((t) => t.getBoundingClientRect())
      .sort((a, b) => a.top - b.top);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom + 7);
    }
    expect(container.querySelectorAll(".chart-bar")).toHaveLength(18);
  });
});

it.each([1, 2.9, Number.MAX_SAFE_INTEGER, 0, -1, NaN, Infinity])(
  "validates Y tick limits consistently (%s)",
  async (maxTicks) => {
    const { container } = render(
      <DesignSystemProvider>
        <Chart
          d3Config={{ axes: { y: { maxTicks } } }}
          data={data}
          style={{ width: 500, height: 250 }}
          type="line"
          x="x"
          y="y"
        />
      </DesignSystemProvider>,
    );
    await waitFor(() => {
      const ticks = labels(container, "Y");
      expect(ticks.length).toBeGreaterThan(0);
      if (Number.isFinite(maxTicks) && maxTicks >= 1) {
        expect(ticks.length).toBeLessThanOrEqual(Math.floor(maxTicks));
      }
      if (maxTicks === 1) {
        expect(ticks).toHaveLength(1);
      }
      const boxes = ticks
        .map((t) => t.getBoundingClientRect())
        .sort((a, b) => a.top - b.top);
      for (let i = 1; i < boxes.length; i++) {
        expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
      }
    });
  },
);

it.each([false, true])(
  "aligns grid lines with configured numeric ticks (horizontal=%s)",
  async (horizontal) => {
    const rows = [
      { category: "A", value: 25 },
      { category: "B", value: 75 },
    ];
    const { container } = render(
      <DesignSystemProvider>
        <Chart
          d3Config={{ axes: { [horizontal ? "x" : "y"]: { maxTicks: 3 } } }}
          data={rows}
          style={{ width: 600, height: 360 }}
          type={horizontal ? "bar" : "line"}
          x={horizontal ? "value" : "category"}
          xDomain={horizontal ? [0, 100] : undefined}
          y={horizontal ? "category" : "value"}
          yDomain={horizontal ? undefined : [0, 100]}
        >
          <Chart.Plot>
            <Chart.Grid />
            <Chart.Axis />
            <Chart.Series
              orientation={horizontal ? "horizontal" : "vertical"}
              type={horizontal ? "bar" : "line"}
            />
          </Chart.Plot>
        </Chart>
      </DesignSystemProvider>,
    );
    await waitFor(() => {
      const axis = horizontal ? "X" : "Y";
      const ticks = Array.from(
        container.querySelectorAll<SVGGElement>(
          `[aria-label="${axis} Axis"] .tick`,
        ),
      );
      const positions = ticks.map((tick) => {
        const matrix = tick.transform.baseVal.consolidate()!.matrix;
        return horizontal ? matrix.e : matrix.f;
      });
      const grid = Array.from(
        container.querySelectorAll("[data-chart-grid] line"),
        (line) => Number(line.getAttribute(horizontal ? "x1" : "y1")),
      );
      expect(positions).toHaveLength(3);
      expect(grid).toHaveLength(3);
      positions.forEach((position, i) =>
        expect(grid[i]).toBeCloseTo(position - 0.5, 3),
      );
    });
  },
);

it.each(["x", "y"] as const)(
  "retains regular numeric intervals when capping %s ticks",
  async (direction) => {
    const { container } = render(
      <DesignSystemProvider>
        <Chart
          d3Config={{
            axes: {
              [direction]: {
                maxTicks: 5,
                tickFormat: (value: string | number) => String(value),
              },
            },
          }}
          data={[
            { x: 0, y: 0 },
            { x: 1000, y: 1000 },
          ]}
          style={{ width: 1000, height: 500 }}
          type="line"
          x="x"
          xDomain={[0, 1000]}
          y="y"
          yDomain={[0, 1000]}
        />
      </DesignSystemProvider>,
    );
    await waitFor(() => {
      const values = labels(container, direction === "x" ? "X" : "Y").map(
        (label) => Number(label.textContent),
      );
      expect(values.length).toBeGreaterThan(2);
      expect(values.length).toBeLessThanOrEqual(5);
      const step = values[1] - values[0];
      for (let i = 2; i < values.length; i++) {
        expect(values[i] - values[i - 1]).toBe(step);
      }
    });
  },
);
