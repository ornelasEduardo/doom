/**
 * KeyboardSensor Tests (Engine Architecture)
 */

import { describe, expect, it, vi } from "vitest";

import { EngineEvent, InputAction } from "../../engine";
import {
  createChartStore,
  registerSeries,
  State,
  updateChartDimensions,
  updateChartMargin,
  updateChartState,
  upsertInteraction,
} from "../../state/store/chart.store";
import { SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { d3 } from "../../utils/d3";
import { KeyboardSensor } from "./KeyboardSensor";

// =============================================================================
// MOCK SETUP
// =============================================================================

const createMockContext = (overrides: Partial<State> = {}): SensorContext => {
  const interactions = new Map<string, unknown>();
  const mockData = [
    { x: 0, y: 10, id: "p0" },
    { x: 1, y: 20, id: "p1" },
    { x: 2, y: 30, id: "p2" },
  ];

  return {
    getChartContext: vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: mockData,
          scales: {
            x: (v: number) => v * 10,
            y: (v: number) => 100 - v,
          },
          config: {},
          x: "x",
          y: "y",
          dimensions: {
            innerWidth: 100,
            innerHeight: 100,
            margin: { left: 0, top: 0 },
          },
          interactions,
          ...overrides,
        }),
      },
    })) as any,
    getInteraction: vi.fn((name: string) => interactions.get(name) || null),
    upsertInteraction: vi.fn((name: string, interaction: unknown) => {
      interactions.set(name, interaction);
    }),
    removeInteraction: vi.fn((name: string) => {
      interactions.delete(name);
    }),
  } as unknown as SensorContext;
};

const createMockEvent = (action: InputAction, key?: string): EngineEvent => ({
  signal: { action, type: "keyboard", key, source: "keyboard" },
  primaryCandidate: null,
  candidates: [],
  sliceCandidates: [],
  chartX: 0,
  chartY: 0,
  isTouch: false,
});

// =============================================================================
// TESTS
// =============================================================================

describe("KeyboardSensor (Engine)", () => {
  it("should not react to non-KEY actions", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    const event = createMockEvent(InputAction.START);
    sensor(event, ctx);

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should focus first point on ArrowRight if no focus", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // 1. ArrowRight
    const event = createMockEvent(InputAction.KEY, "ArrowRight");
    sensor(event, ctx);

    // Initial focus starts at -1, enters at 0
    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 0 }),
      }),
    );
  });

  it("should move focus with ArrowRight/ArrowLeft", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // 1. Focus first point
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);

    // 2. Focus next (index 1)
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 1 }),
      }),
    );

    // 3. Focus prev (index 0)
    sensor(createMockEvent(InputAction.KEY, "ArrowLeft"), ctx);

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 0 }),
      }),
    );
  });

  it("should clear interaction on Escape", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // 1. Focus something
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);

    // 2. Escape
    sensor(createMockEvent(InputAction.KEY, "Escape"), ctx);

    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
  });

  it("should report the focused point's real scale coordinate", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // Two presses lands on p1 { x: 1, y: 20 }. With scales x*10 and 100-y that
    // is (10, 80). A sensor that fails to resolve the accessors reports (0, 0),
    // which pins the cursor line to the plot's top-left corner for every point.
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({
          dataIndex: 1,
          coordinate: { x: 10, y: 80 },
        }),
      }),
    );
  });

  it("should clamp focus to data bounds", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // Data length is 3 (indices 0, 1, 2)
    // Click ArrowRight 5 times
    for (let i = 0; i < 5; i++) {
      sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);
    }

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 2 }),
      }),
    );
  });
});

describe("KeyboardSensor plot domains", () => {
  const key = (
    sensor: ReturnType<typeof KeyboardSensor>,
    ctx: SensorContext,
    key = "ArrowRight",
  ) => sensor(createMockEvent(InputAction.KEY, key), ctx);
  const hover = (ctx: SensorContext) =>
    ctx.getInteraction(InteractionChannel.PRIMARY_HOVER);

  it("skips offplot and nonfinite centers in both directions without changing data indices", () => {
    const ctx = createMockContext({
      xDomain: [0, 10],
      yDomain: [0, 100],
      scales: {
        x: d3.scaleLinear().domain([0, 10]).range([0, 100]),
        y: d3.scaleLinear().domain([0, 100]).range([100, 0]),
      },
      data: [
        { x: -1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 200 },
        { x: 4, y: 40 },
        { x: NaN, y: 5 },
      ],
    });
    const sensor = KeyboardSensor();
    key(sensor, ctx);
    expect(hover(ctx)).toMatchObject({ target: { dataIndex: 1 } });
    key(sensor, ctx);
    expect(hover(ctx)).toMatchObject({ target: { dataIndex: 3 } });
    key(sensor, ctx);
    expect(hover(ctx)).toMatchObject({ target: { dataIndex: 3 } });
    key(sensor, ctx, "ArrowLeft");
    expect(hover(ctx)).toMatchObject({ target: { dataIndex: 1 } });
  });

  it("keeps visible members of a slice and categories found only in later series", () => {
    const ctx = createMockContext({
      xDomain: [0, 10],
      yDomain: [0, 100],
      scales: {
        x: d3.scaleLinear().domain([0, 10]).range([0, 100]),
        y: d3.scaleLinear().domain([0, 100]).range([100, 0]),
      },
      processedSeries: [
        {
          id: "first",
          type: "line",
          xAccessor: "x",
          yAccessor: "y",
          data: [
            { x: 1, y: 200 },
            { x: 2, y: 20 },
          ],
        },
        {
          id: "later",
          type: "line",
          xAccessor: "x",
          yAccessor: "y",
          data: [
            { x: 1, y: 10 },
            { x: 3, y: 30 },
          ],
        },
      ],
    });
    const sensor = KeyboardSensor();
    key(sensor, ctx);
    expect(hover(ctx)).toMatchObject({
      targets: [{ seriesId: "later", dataIndex: 0 }],
    });
    key(sensor, ctx);
    expect(hover(ctx)).toMatchObject({
      targets: [{ seriesId: "first", dataIndex: 1 }],
    });
    key(sensor, ctx);
    expect(hover(ctx)).toMatchObject({
      targets: [{ seriesId: "later", dataIndex: 1 }],
    });
  });

  it.each(["vertical", "horizontal"] as const)(
    "uses clipped %s bar centers and skips fully outside stacks",
    (orientation) => {
      const horizontal = orientation === "horizontal";
      const ctx = createMockContext({
        xDomain: [0, 10],
        yDomain: [0, 10],
        scales: {
          x: d3.scaleLinear().domain([0, 10]).range([0, 100]),
          y: d3.scaleLinear().domain([0, 10]).range([100, 0]),
        },
        processedSeries: [
          {
            id: "bars",
            type: "bar",
            orientation,
            xAccessor: "x",
            yAccessor: "y",
            barWidth: 20,
            data: horizontal
              ? [
                  { x: 15, y: 5 },
                  { x: 30, y: 5 },
                ]
              : [
                  { x: 5, y: 15 },
                  { x: 5, y: 30 },
                ],
            stackRanges: [
              [5, 15],
              [20, 30],
            ],
          },
        ],
      });
      const sensor = KeyboardSensor();
      key(sensor, ctx);
      expect(hover(ctx)).toMatchObject({
        target: {
          dataIndex: 0,
          coordinate: horizontal ? { x: 75, y: 50 } : { x: 50, y: 25 },
          suppressMarker: true,
        },
      });
      key(sensor, ctx);
      expect(hover(ctx)).toMatchObject({ target: { dataIndex: 0 } });
    },
  );

  it("clears stale hover when no points remain visible and Escape still works", () => {
    const data = [{ x: 1, y: 10 }];
    const ctx = createMockContext({
      xDomain: [0, 10],
      yDomain: [0, 100],
      scales: {
        x: d3.scaleLinear().domain([0, 10]).range([0, 100]),
        y: d3.scaleLinear().domain([0, 100]).range([100, 0]),
      },
      data,
    });
    const sensor = KeyboardSensor();
    key(sensor, ctx);
    data[0].y = 200;
    key(sensor, ctx);
    expect(hover(ctx)).toBeNull();
    key(sensor, ctx, "Escape");
    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
  });

  it("refreshes an active point against current scales and removes an offplot target", () => {
    const store = createChartStore(
      {
        width: 100,
        height: 100,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      "x",
      "y",
    );
    const datum = { x: 5, y: 5 };
    const scales = {
      x: d3.scaleLinear().domain([0, 10]).range([0, 100]),
      y: d3.scaleLinear().domain([0, 10]).range([100, 0]),
    };
    store.setState({ data: [datum], scales, yDomain: [6, 10] });
    upsertInteraction(store, InteractionChannel.PRIMARY_HOVER, {
      targets: [{ data: datum, dataIndex: 0, coordinate: { x: 50, y: 50 } }],
    });
    scales.y.domain([6, 10]);
    registerSeries(store, "line", [{ type: "line", x: "x", y: "y" }]);
    expect(
      store.getState().interactions.has(InteractionChannel.PRIMARY_HOVER),
    ).toBe(false);
  });
});

describe("hover refresh on domain updates", () => {
  const config = {
    width: 130,
    height: 120,
    margin: { left: 20, right: 10, top: 10, bottom: 10 },
  };

  it("reprojects retained slice members and removes the hover when both axes exclude them", () => {
    const store = createChartStore(config, "x", "y");
    const data = [
      { x: 2, y: 8 },
      { x: 8, y: 2 },
    ];
    const dimensions = store.getState().dimensions;
    updateChartState(store, {
      data,
      dimensions,
      xDomain: [0, 10],
      yDomain: [0, 10],
    });
    upsertInteraction(store, InteractionChannel.PRIMARY_HOVER, {
      targets: data.map((datum, dataIndex) => ({
        data: datum,
        dataIndex,
        coordinate: { x: 0, y: 0 },
      })),
    });
    updateChartState(store, {
      data,
      dimensions,
      xDomain: [0, 10],
      yDomain: [0, 5],
    });
    expect(
      store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER),
    ).toMatchObject({
      targets: [{ dataIndex: 1, coordinate: { x: 100, y: 70 } }],
      target: { dataIndex: 1 },
    });
    updateChartState(store, {
      data,
      dimensions,
      xDomain: [0, 5],
      yDomain: [0, 5],
    });
    expect(
      store.getState().interactions.has(InteractionChannel.PRIMARY_HOVER),
    ).toBe(false);
  });

  it("refreshes a bar at its visible center before removing it outside the domain", () => {
    const store = createChartStore({ ...config, type: "bar" }, "x", "y");
    const data = [{ x: "A", y: 15 }];
    const dimensions = store.getState().dimensions;
    updateChartState(store, { data, dimensions });
    registerSeries(store, "bars", [
      { id: "bars", type: "bar", x: "x", y: "y", barWidth: 20 },
    ]);
    upsertInteraction(store, InteractionChannel.PRIMARY_HOVER, {
      targets: [
        {
          data: data[0],
          dataIndex: 0,
          seriesId: "bars",
          coordinate: { x: 0, y: 0 },
        },
      ],
    });
    updateChartState(store, { data, dimensions, yDomain: [5, 10] });
    expect(
      store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER),
    ).toMatchObject({ target: { coordinate: { x: 70, y: 60 } } });
    updateChartState(store, { data, dimensions, yDomain: [20, 30] });
    expect(
      store.getState().interactions.has(InteractionChannel.PRIMARY_HOVER),
    ).toBe(false);
  });
});

describe("hover refresh on plot resizing", () => {
  const setup = (width = 100) => {
    const store = createChartStore(
      { width, height: 100, margin: { left: 0, right: 0, top: 0, bottom: 0 } },
      "x",
      "y",
    );
    const data = [{ x: 8, y: 5 }];
    updateChartState(store, {
      data,
      dimensions: store.getState().dimensions,
      xDomain: [0, 10],
      yDomain: [0, 10],
    });
    upsertInteraction(store, InteractionChannel.PRIMARY_HOVER, {
      targets: [
        { data: data[0], dataIndex: 0, coordinate: { x: width * 0.8, y: 50 } },
      ],
    });
    return { store, data };
  };

  it("retains a visible point using expanded dimensions during a domain change", () => {
    const { store, data } = setup();
    updateChartState(store, {
      data,
      dimensions: { ...store.getState().dimensions, width: 200 },
      xDomain: [0, 8],
      yDomain: [0, 10],
    });
    expect(
      store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER),
    ).toMatchObject({ target: { coordinate: { x: 200, y: 50 } } });
  });

  it("removes a point outside the smaller plot during a domain change", () => {
    const { store, data } = setup(200);
    updateChartState(store, {
      data,
      dimensions: { ...store.getState().dimensions, width: 100 },
      xDomain: [0, 5],
      yDomain: [0, 10],
    });
    expect(
      store.getState().interactions.has(InteractionChannel.PRIMARY_HOVER),
    ).toBe(false);
  });

  it("reprojects active hover when dimensions change and clears it for an unavailable plot", () => {
    const { store } = setup();
    updateChartDimensions(store, 200, 200);
    expect(
      store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER),
    ).toMatchObject({ target: { coordinate: { x: 160, y: 100 } } });
    updateChartDimensions(store, 0, 0);
    expect(
      store.getState().interactions.has(InteractionChannel.PRIMARY_HOVER),
    ).toBe(false);
  });

  it("reprojects hover with the new margins and inner dimensions", () => {
    const { store } = setup();
    updateChartMargin(store, { left: 20, right: 10, top: 10, bottom: 10 });
    expect(
      store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER),
    ).toMatchObject({ target: { coordinate: { x: 76, y: 50 } } });
  });
});

describe("KeyboardSensor category lookup cost", () => {
  it("keeps accessor work linear while constructing visible multi-series slices", () => {
    const count = 200;
    let categoryReads = 0;
    const xAccessor = (datum: { x: number }) => {
      categoryReads++;
      return datum.x;
    };
    const data = Array.from({ length: count }, (_, x) => ({ x, y: 5 }));
    const ctx = createMockContext({
      scales: {
        x: d3.scaleLinear().domain([0, count]).range([0, 100]),
        y: d3.scaleLinear().domain([0, 10]).range([100, 0]),
      },
      processedSeries: [
        { id: "first", type: "line", xAccessor, yAccessor: "y", data },
        { id: "second", type: "line", xAccessor, yAccessor: "y", data },
      ],
    });
    KeyboardSensor()(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);
    expect(ctx.getInteraction(InteractionChannel.PRIMARY_HOVER)).toMatchObject({
      targets: [
        { seriesId: "first", dataIndex: 0 },
        { seriesId: "second", dataIndex: 0 },
      ],
    });
    expect(categoryReads).toBeLessThan(count * 20);
  });
});

describe("legacy keyboard and hover without domain overrides", () => {
  it.each(
    ([undefined, [null, null], [NaN, Infinity]] as const).map((yDomain) => ({
      yDomain,
    })),
  )(
    "retains an own-series point above the automatic root domain with $yDomain",
    ({ yDomain }) => {
      const store = createChartStore(
        {
          width: 100,
          height: 100,
          margin: { left: 0, right: 0, top: 0, bottom: 0 },
        },
        "x",
        "y",
      );
      const data = [
        { x: "A", y: 10 },
        { x: "B", y: 20 },
      ];
      updateChartState(store, {
        data,
        dimensions: store.getState().dimensions,
        yDomain,
      });
      expect(store.getState().scales.y!.domain()).toEqual([0, 22]);
      registerSeries(store, "own", [
        {
          id: "own",
          type: "line",
          x: "x",
          y: "y",
          data: [
            { x: "A", y: 23 },
            { x: "B", y: 20 },
          ],
        },
      ]);
      const ctx = createMockContext(store.getState());
      KeyboardSensor()(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);
      const hover = ctx.getInteraction(InteractionChannel.PRIMARY_HOVER);
      expect(hover).toMatchObject({
        target: { data: { x: "A", y: 23 }, dataIndex: 0 },
      });
      upsertInteraction(store, InteractionChannel.PRIMARY_HOVER, hover);
      updateChartState(store, {
        data,
        dimensions: store.getState().dimensions,
        yDomain,
      });
      expect(
        store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER),
      ).toMatchObject({ target: { data: { x: "A", y: 23 }, dataIndex: 0 } });
    },
  );
});
