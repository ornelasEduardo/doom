import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { Sensor } from "../../../components/Chart/types/events";
import { HoverInteraction } from "../../../components/Chart/types/interaction";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

const actual = [
  { category: "A", value: 10 },
  { category: "B", value: -20 },
  { category: "C", value: 15 },
];
const projection = [
  { category: "C", value: 35 },
  { category: "A", value: 30 },
  { category: "B", value: -40 },
];
const sparse = [{ category: "B", value: -60 }];
const single = () => [
  Chart.sensors.DataHoverSensor({ verticalSlice: false }),
  Chart.sensors.KeyboardSensor(),
];

function Example({
  sensors,
  horizontal = false,
  bars = false,
  custom = false,
}: {
  sensors?: Sensor<(typeof actual)[number]>[];
  horizontal?: boolean;
  bars?: boolean;
  custom?: boolean;
}) {
  return (
    <DesignSystemProvider>
      <Chart
        behaviors={[
          Chart.behaviors.Tooltip({
            render: custom
              ? (rows) => <output>{JSON.stringify(rows)}</output>
              : undefined,
          }),
        ]}
        d3Config={{ showDots: true }}
        data={actual}
        sensors={sensors}
        style={{ width: 650, height: 400 }}
        type={bars ? "bar" : "line"}
        x={horizontal ? "value" : "category"}
        y={horizontal ? "category" : "value"}
        yDomain={bars ? undefined : [-80, 50]}
      >
        <Chart.Plot>
          {[
            { id: "actual", label: "Actual", data: actual },
            { id: "projection", label: "Projection", data: projection },
            { id: "sparse", label: "Sparse", data: sparse },
          ].map((series) => (
            <Chart.Series
              key={series.id}
              {...series}
              barWidth={20}
              orientation={horizontal ? "horizontal" : "vertical"}
              stackId={bars ? "total" : undefined}
              type={bars ? "bar" : "line"}
            />
          ))}
        </Chart.Plot>
      </Chart>
    </DesignSystemProvider>
  );
}

async function mount(props: Parameters<typeof Example>[0] = {}) {
  const { container } = render(<Example {...props} />);
  const marks = () =>
    container.querySelectorAll(props.bars ? ".chart-bar" : "circle");
  await expect.poll(() => marks().length).toBe(7);
  await expect
    .poll(() => marks()[1].getBoundingClientRect().width)
    .toBeGreaterThan(0);
  const text = () =>
    container.querySelector("[data-chart-tooltip]")?.textContent;
  return { container, marks, text };
}

it("shows only the pointer target with verticalSlice:false, including a sparse series", async () => {
  const { marks, text } = await mount({ sensors: single() });
  await userEvent.hover(marks()[1]);
  await expect.poll(text).toBe("BActual:-20");
  await userEvent.hover(marks()[6], {
    position: {
      x: marks()[6].getBoundingClientRect().width / 2,
      y: marks()[6].getBoundingClientRect().height / 2 - 2,
    },
  });
  await expect.poll(text).toBe("BSparse:-60");
});

it("preserves default slices using each series' own row and omits absent sparse rows", async () => {
  const { marks, text } = await mount();
  await userEvent.hover(marks()[1]);
  await expect.poll(text).toBe("BActual:-20Projection:-40Sparse:-60");
  await userEvent.hover(marks()[0], {
    position: {
      x: marks()[0].getBoundingClientRect().width / 2 + 2,
      y: marks()[0].getBoundingClientRect().height / 2,
    },
  });
  await expect.poll(text).toBe("AActual:10Projection:30");
});

it.each([false, true])(
  "restricts signed bars to the target (horizontal=%s)",
  async (horizontal) => {
    const { marks, text } = await mount({
      sensors: single(),
      bars: true,
      horizontal,
    });
    await userEvent.hover(marks()[1]);
    await expect.poll(text).toBe("BActual:-20");
    await userEvent.hover(marks()[4]);
    await expect.poll(text).toBe("AProjection:30");
  },
);

it("preserves keyboard slices and Escape after single-target pointer input", async () => {
  const { container, marks, text } = await mount({ sensors: single() });
  await userEvent.hover(marks()[1]);
  await userEvent.hover(document.body);
  await expect.poll(text).toBeUndefined();
  container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(text).toBe("AActual:10Projection:30");
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(text).toBe("BActual:-20Projection:-40Sparse:-60");
  await userEvent.keyboard("{Escape}");
  await expect.poll(text).toBeUndefined();
});

it.each([false, true])(
  "preserves custom renderer payloads (slice=%s)",
  async (slice) => {
    const { marks, text } = await mount({
      custom: true,
      sensors: slice ? undefined : single(),
    });
    await userEvent.hover(marks()[1]);
    await expect
      .poll(() => JSON.parse(text() ?? "null"))
      .toEqual(slice ? [actual[1], projection[2], sparse[0]] : actual[1]);
  },
);

// Exercise public custom sensors through the real pointer pipeline. The built-in
// producers supply IDs; older/custom sensors may omit them.
function transformTargets(
  transform: (
    targets: HoverInteraction["targets"],
  ) => HoverInteraction["targets"],
  sensor: Sensor<(typeof actual)[number]> = Chart.sensors.DataHoverSensor({
    verticalSlice: true,
  }),
): Sensor<(typeof actual)[number]> {
  return (event, context) =>
    sensor(event, {
      ...context,
      upsertInteraction: (name, interaction) => {
        const state = interaction as HoverInteraction;
        context.upsertInteraction(name, {
          ...state,
          targets: transform(state.targets),
        });
      },
    });
}

it("does not recreate a series excluded from an explicit multi-target slice", async () => {
  const sensors = [
    transformTargets((targets) =>
      targets.filter((target) => target.data !== projection[2]),
    ),
  ];
  const { marks, text } = await mount({ sensors });
  await userEvent.hover(marks()[1]);
  await expect.poll(text).toBe("BActual:-20Sparse:-60");
});

it("keeps legacy category lookup when every target lacks a series ID", async () => {
  const sensors = [
    transformTargets((targets) => [{ ...targets[0], seriesId: undefined }]),
  ];
  const { marks, text } = await mount({ sensors });
  await userEvent.hover(marks()[1]);
  await expect.poll(text).toBe("BActual:-20Projection:-40Sparse:-60");
});

it("does not let an unidentified target expand an otherwise identified slice", async () => {
  const sensors = [
    transformTargets((targets) =>
      targets.map((target) =>
        target.data === projection[2]
          ? { ...target, seriesId: undefined }
          : target,
      ),
    ),
  ];
  const { marks, text } = await mount({ sensors });
  await userEvent.hover(marks()[1]);
  await expect.poll(text).toBe("BActual:-20Sparse:-60");
});

it.each([false, true])(
  "honors a single keyboard target (custom=%s)",
  async (custom) => {
    const sensors = [
      transformTargets(
        (targets) => targets.slice(0, 1),
        Chart.sensors.KeyboardSensor(),
      ),
    ];
    const { container, text } = await mount({ sensors, custom });
    await userEvent.hover(document.body);
    container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(text)
      .toBe(custom ? JSON.stringify(actual[0]) : "AActual:10");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(text)
      .toBe(custom ? JSON.stringify(actual[1]) : "BActual:-20");
  },
);
