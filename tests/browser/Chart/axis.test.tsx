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
const labels = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('[aria-label="X Axis"] .tick text'));

afterEach(cleanup);

it("formats timestamp ticks and caps their count without changing the data", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        d3Config={{ showDots: true, xTickFormat: dateLabel, xMaxTicks: 4 }}
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
          xTickFormat: (value) => `${prefix}${value}`,
          xMaxTicks: count,
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
        d3Config={{ xTickFormat: dateLabel, xMaxTicks: 20 }}
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
        d3Config={{ xMaxTicks: limit }}
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
          d3Config={{ xTickFormat: dateLabel, xMaxTicks: 6 }}
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
          d3Config={{ xMaxTicks: 6 }}
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
        d3Config={{ xMaxTicks: Number.MAX_SAFE_INTEGER }}
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
