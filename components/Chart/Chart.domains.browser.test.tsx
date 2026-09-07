import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import { Chart } from "./Chart";
import { useChartContext } from "./context";
import type { Store } from "./state/store/chart.store";

type Domain = readonly [number | null, number | null];
const rows = [
  { x: 0, y: -9 },
  { x: 1, y: -3 },
  { x: 2, y: 4 },
  { x: 3, y: 11 },
];
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));
const tooltip = (host: Element) =>
  host.querySelector("[data-chart-tooltip]")?.textContent ?? "";
const points = (host: Element) =>
  Array.from(
    host.querySelectorAll<SVGCircleElement>(".chart-line-series circle"),
  );
const root = (host: Element) =>
  host.querySelector<HTMLElement>("[data-chart-container]")!;

afterEach(cleanup);

function Capture({ save }: { save: (store: Store) => void }) {
  save(useChartContext().chartStore);
  return null;
}

interface ExampleProps {
  xDomain?: Domain;
  yDomain?: Domain;
  width?: number;
  save: (store: Store) => void;
}
function Example({ width = 600, save, ...domains }: ExampleProps) {
  return (
    <DesignSystemProvider>
      <Chart.Root
        {...domains}
        d3Config={{ showDots: true }}
        data={rows}
        style={{ width, height: 360 }}
        type="line"
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Capture save={save} />
          <Chart.Series type="line" />
          <Chart.Axis />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>
  );
}

describe("Chart axis domains in a real browser", () => {
  it.each([
    ["mixed", [-9, -3, 4, 11]],
    ["negative-only", [-19, -13, -7, -1]],
  ] as const)(
    "keeps default %s line geometry visible and hoverable",
    async (_, values) => {
      const { container } = render(
        <DesignSystemProvider>
          <Chart
            d3Config={{ showDots: true }}
            data={values.map((y, x) => ({ x, y }))}
            style={{ width: 600, height: 360 }}
            type="line"
            x="x"
            y="y"
          />
        </DesignSystemProvider>,
      );
      await settle();
      const svg = container.querySelector<SVGSVGElement>("[data-chart-plot]")!;
      const bounds = svg.getBoundingClientRect();
      const marks = points(container);
      expect(marks).toHaveLength(4);
      const centers = marks.map((mark) => {
        const box = mark.getBoundingClientRect();
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      });
      for (const center of centers) {
        expect(center.x).toBeGreaterThanOrEqual(bounds.left);
        expect(center.x).toBeLessThanOrEqual(bounds.right);
        expect(center.y).toBeGreaterThanOrEqual(bounds.top);
        expect(center.y).toBeLessThanOrEqual(bounds.bottom);
      }
      expect(centers[0].y - centers[3].y).toBeGreaterThan(100);
      const line = container.querySelector<SVGPathElement>(
        'path[aria-roledescription="line"]',
      )!;
      expect(line.getTotalLength()).toBeGreaterThan(100);
      await userEvent.hover(marks[1]);
      await expect.poll(() => tooltip(container)).toContain(`:${values[1]}`);
    },
  );

  it("uses exact explicit endpoints, null auto endpoints, and automatic fallback for invalid domains", async () => {
    let store!: Store;
    const save = (value: Store) => {
      store = value;
    };
    const { rerender } = render(<Example save={save} />);
    await settle();
    const automaticX = store.getState().scales.x!.domain();
    const automaticY = store.getState().scales.y!.domain();
    rerender(
      <Example save={save} xDomain={[-0.35, 2.65]} yDomain={[-7.25, 8.75]} />,
    );
    await expect
      .poll(() => store.getState().scales.x!.domain())
      .toEqual([-0.35, 2.65]);
    expect(store.getState().scales.y!.domain()).toEqual([-7.25, 8.75]);
    rerender(
      <Example save={save} xDomain={[null, 2.65]} yDomain={[-7.25, null]} />,
    );
    await expect
      .poll(() => store.getState().scales.y!.domain())
      .toEqual([-7.25, automaticY[1]]);
    expect(store.getState().scales.x!.domain()).toEqual([automaticX[0], 2.65]);
    for (const invalid of [
      [4, -4],
      [2, 2],
      [NaN, 10],
      [-10, Infinity],
    ] as const) {
      rerender(<Example save={save} xDomain={invalid} yDomain={invalid} />);
      await expect
        .poll(() => store.getState().scales.x!.domain())
        .toEqual(automaticX);
      expect(store.getState().scales.y!.domain()).toEqual(automaticY);
    }
  });

  it("drops offplot hover and keyboard targets when domains change, then restores them", async () => {
    let store!: Store;
    const save = (value: Store) => {
      store = value;
    };
    const { container, rerender } = render(
      <Example save={save} xDomain={[-1, 4]} yDomain={[-12, 12]} />,
    );
    await settle();
    await userEvent.hover(points(container)[0]);
    await expect.poll(() => tooltip(container)).toContain(":-9");
    // One point is outside x, another is inside x but outside y.
    rerender(<Example save={save} xDomain={[0.5, 3.5]} yDomain={[-5, 6]} />);
    await expect.poll(() => tooltip(container)).not.toContain(":-9");
    await userEvent.hover(points(container)[1]);
    await expect.poll(() => tooltip(container)).toContain(":-3");
    root(container).focus();
    for (let i = 0; i < 6; i++) {
      await userEvent.keyboard("{ArrowRight}");
      const text = tooltip(container);
      expect(text).toMatch(/:(-3|4)(?:\D|$)/);
      expect(text).not.toContain(":-9");
      expect(text).not.toContain(":11");
    }
    // Real hit-testing must respect the SVG clip, even though the path and
    // circle geometry may legitimately extend beyond it.
    const offplot = points(container)[3];
    const box = offplot.getBoundingClientRect();
    expect(
      document.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2),
    ).not.toContain(offplot);
    expect(store.getState().scales.x!.domain()).toEqual([0.5, 3.5]);
    rerender(<Example save={save} xDomain={[-1, 4]} yDomain={[-12, 12]} />);
    await settle();
    await userEvent.hover(points(container)[3]);
    await expect.poll(() => tooltip(container)).toContain(":11");
    root(container).focus();
    await userEvent.keyboard("{Escape}{ArrowRight}");
    await expect.poll(() => tooltip(container)).toContain(":-9");
  });

  it("keeps domains and hover independent across charts, resize, and remount", async () => {
    let first!: Store;
    let second!: Store;
    const saveFirst = (value: Store) => {
      first = value;
    };
    const saveSecond = (value: Store) => {
      second = value;
    };
    const dashboard = (width: number, key = "original") => (
      <div style={{ display: "flex" }}>
        <Example
          key={key}
          save={saveFirst}
          width={width}
          xDomain={[-1, 4]}
          yDomain={[-12, 12]}
        />
        <Example
          save={saveSecond}
          width={550}
          xDomain={[-2, 5]}
          yDomain={[-20, 20]}
        />
      </div>
    );
    const { container, rerender } = render(dashboard(600));
    await settle();
    const initialWidth = first.getState().dimensions.innerWidth;
    for (const [width, key] of [
      [500, "original"],
      [600, "remounted"],
    ] as const) {
      rerender(dashboard(width, key));
      await settle();
      if (width === 500) {
        expect(first.getState().dimensions.innerWidth).toBeLessThan(
          initialWidth,
        );
      }
      expect(first.getState().scales.x!.domain()).toEqual([-1, 4]);
      expect(first.getState().scales.y!.domain()).toEqual([-12, 12]);
      expect(second.getState().scales.x!.domain()).toEqual([-2, 5]);
      expect(second.getState().scales.y!.domain()).toEqual([-20, 20]);
      const charts = container.querySelectorAll<HTMLElement>(
        "[data-chart-container]",
      );
      const clipIds = Array.from(charts, (chart, index) => {
        const clipped = points(chart)[1].closest("[clip-path]")!;
        expect(clipped).not.toBeNull();
        expect(getComputedStyle(clipped).clipPath).not.toBe("none");
        const reference = clipped.getAttribute("clip-path")!;
        const id = reference.match(/url\(#(.+)\)/)![1];
        const clip = chart.querySelector<SVGClipPathElement>(
          `clipPath[id="${id}"]`,
        )!;
        expect(clip).not.toBeNull();
        expect(document.getElementById(id)).toBe(clip);
        const rect = clip.querySelector("rect")!;
        const dimensions = (index === 0 ? first : second).getState().dimensions;
        expect(Number(rect.getAttribute("width"))).toBeCloseTo(
          dimensions.innerWidth,
        );
        expect(Number(rect.getAttribute("height"))).toBeCloseTo(
          dimensions.innerHeight,
        );
        return id;
      });
      expect(new Set(clipIds).size).toBe(2);
      await userEvent.hover(points(charts[0])[1]);
      await expect.poll(() => tooltip(charts[0])).toContain(":-3");
      expect(tooltip(charts[1])).toBe("");
      await userEvent.hover(points(charts[1])[2]);
      await expect.poll(() => tooltip(charts[1])).toContain(":4");
      await expect.poll(() => tooltip(charts[0])).toBe("");
      await userEvent.unhover(points(charts[1])[2]);
    }
  });

  it("does not include an offplot series candidate in the default shared tooltip", async () => {
    const { container } = render(
      <DesignSystemProvider>
        <Chart.Root
          d3Config={{ showDots: true }}
          data={[{ x: 1, y: 2 }]}
          style={{ width: 600, height: 360 }}
          type="line"
          x="x"
          xDomain={[0, 2]}
          y="y"
          yDomain={[-5, 6]}
        >
          <Chart.Plot>
            <Chart.Series label="Visible" type="line" />
            <Chart.Series
              data={[{ x: 1, y: 20 }]}
              label="Outside"
              type="line"
            />
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>,
    );
    await settle();
    await userEvent.hover(points(container)[0]);
    await expect.poll(() => tooltip(container)).toContain("Visible:2");
    expect(tooltip(container)).not.toContain("Outside");
    root(container).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => tooltip(container)).toContain("Visible:2");
    expect(tooltip(container)).not.toContain("Outside");
  });

  it.each([false, true])(
    "ignores category bounds and applies exact numeric bounds to signed bars (horizontal=%s)",
    async (horizontal) => {
      let store!: Store;
      const { container } = render(
        <DesignSystemProvider>
          <Chart.Root
            data={[
              { category: "A", value: -8 },
              { category: "B", value: 12 },
            ]}
            style={{ width: 600, height: 360 }}
            type="bar"
            x={horizontal ? "value" : "category"}
            xDomain={horizontal ? [-10.5, 2.5] : [100, 200]}
            y={horizontal ? "category" : "value"}
            yDomain={horizontal ? [100, 200] : [-10.5, 2.5]}
          >
            <Chart.Plot>
              <Capture
                save={(value) => {
                  store = value;
                }}
              />
              <Chart.Series
                orientation={horizontal ? "horizontal" : "vertical"}
                type="bar"
              />
              <Chart.Axis />
            </Chart.Plot>
          </Chart.Root>
        </DesignSystemProvider>,
      );
      await settle();
      const scales = store.getState().scales;
      expect((horizontal ? scales.x : scales.y)!.domain()).toEqual([
        -10.5, 2.5,
      ]);
      expect((horizontal ? scales.y : scales.x)!.domain()).toEqual(["A", "B"]);
      const bars = container.querySelectorAll<SVGPathElement>(".chart-bar");
      expect(bars).toHaveLength(2);
      const [negative, positive] = Array.from(bars, (bar) =>
        bar.getBoundingClientRect(),
      );
      expect(horizontal ? negative.right : negative.top).toBeCloseTo(
        horizontal ? positive.left : positive.bottom,
      );
      expect(
        (horizontal ? positive.width : positive.height) /
          (horizontal ? negative.width : negative.height),
      ).toBeCloseTo(1.5);
      await userEvent.hover(bars[0]);
      await expect.poll(() => tooltip(container)).toContain(":-8");
      // The positive bar's original center (value 6) lies beyond the upper
      // bound 2.5. Its visible truncated portion must remain interactive.
      expect(
        document.elementsFromPoint(
          positive.x + positive.width / 2,
          positive.y + positive.height / 2,
        ),
      ).not.toContain(bars[1]);
      // Aim at value 1.25, halfway through the visible [0, 2.5] portion;
      // Playwright's default center lands in the clipped-out geometry.
      await userEvent.hover(bars[1], {
        position: {
          x: horizontal ? positive.width * (1.25 / 12) : positive.width / 2,
          y: horizontal
            ? positive.height / 2
            : positive.height * (1 - 1.25 / 12),
        },
      });
      await expect.poll(() => tooltip(container)).toContain(":12");
      root(container).focus();
      await userEvent.keyboard(
        horizontal
          ? "{Escape}{ArrowDown}{ArrowDown}"
          : "{Escape}{ArrowRight}{ArrowRight}",
      );
      await expect.poll(() => tooltip(container)).toContain(":12");
    },
  );
});

it.each([
  ["automatic", { yDomain: [null, null] as const }],
  ["invalid", { yDomain: [5, 5] as const }],
  ["Y-only", { yDomain: [-20, 20] as const }],
])(
  "preserves full endpoint marks on the unaffected X axis with %s bounds",
  async (_, domains) => {
    const { container } = render(<Example save={() => {}} {...domains} />);
    await settle();
    const point = points(container)[0];
    const box = point.getBoundingClientRect();
    expect(
      document.elementsFromPoint(box.left + 2, box.top + box.height / 2),
    ).toContain(point);
  },
);

it("keeps series identity stable when adding and removing axis bounds", async () => {
  let store!: Store;
  const save = (value: Store) => {
    store = value;
  };
  const { rerender } = render(<Example save={save} />);
  await settle();
  const id = store.getState().processedSeries[0].id;
  rerender(<Example save={save} yDomain={[-20, 20]} />);
  await settle();
  expect(store.getState().processedSeries[0].id).toBe(id);
  rerender(<Example save={save} />);
  await settle();
  expect(store.getState().processedSeries[0].id).toBe(id);
});
