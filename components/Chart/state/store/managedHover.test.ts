import { describe, expect, it } from "vitest";

import { HoverInteraction } from "../../types/interaction";
import {
  createInteractionAccess,
  createInteractionChannel,
} from "../../utils/interactionChannels";
import * as chart from "./chart.store";

interface Row {
  x: number;
  y: number;
}
const rows: Row[] = [
  { x: 1, y: 1 },
  { x: 2, y: 2 },
];
const setup = (type = "line") => {
  const store = chart.createChartStore<Row>({ type: "line" }, "x", "y");
  chart.updateChartDimensions(store, 500, 300);
  chart.updateChartData(store, rows);
  chart.registerSeries(store, "owner", [
    { id: "series", type, x: "x", y: "y" },
  ]);
  return { store, access: createInteractionAccess(store) };
};
const hover = (): HoverInteraction<Row> => ({
  pointer: { x: 50, y: 50, containerX: 50, containerY: 50, isTouch: false },
  targets: [
    {
      data: rows[0],
      dataIndex: 0,
      seriesId: "series",
      coordinate: { x: 72, y: 83 },
    },
  ],
});

describe("managed hover refresh", () => {
  it("refreshes typed managed hover channels while leaving arbitrary payloads unchanged", () => {
    const { store, access } = setup();
    const channel =
      createInteractionChannel<HoverInteraction<Row>>("typed-hover");
    const unmanaged =
      createInteractionChannel<HoverInteraction<Row>>("custom-policy");
    const original = hover();
    access.upsertHoverInteraction(channel, original);
    access.upsertInteraction(unmanaged, original);
    const next = [{ x: 1, y: 4 }, rows[1]];
    chart.updateChartData(store, next);
    const value = access.getInteraction(channel);
    expect(value?.target?.data).toBe(next[0]);
    expect(value?.target?.coordinate.y).toBe(
      store.getState().scales.y!(4)! + store.getState().dimensions.margin.top,
    );
    expect(access.getInteraction(unmanaged)).toBe(original);
  });

  it.each(["line", "custom", "bar"])(
    "clears removed %s series rather than rebinding to root data",
    (type) => {
      const { store, access } = setup(type);
      access.upsertHoverInteraction("primary-hover", hover());
      chart.unregisterSeries(store, "owner");
      expect(access.getInteraction("primary-hover")).toBeNull();
    },
  );

  it("preserves custom coordinates during streaming then resolves live custom geometry", () => {
    const { store, access } = setup("custom");
    const channel =
      createInteractionChannel<HoverInteraction<Row>>("custom-hover");
    access.upsertHoverInteraction(channel, hover());
    chart.updateChartData(store, [{ x: 1, y: 90 }, rows[1]]);
    expect(access.getInteraction(channel)?.targets[0].coordinate).toEqual({
      x: 72,
      y: 83,
    });
    const current = {
      data: { x: 1, y: 90 },
      dataIndex: 0,
      seriesId: "series",
      coordinate: { x: 111, y: 222 },
    };
    const dispose = chart.installManagedHoverResolver(store, () => current);
    chart.refreshManagedHover(store);
    expect(access.getInteraction(channel)?.target).toEqual(current);
    dispose();
  });

  it("clears a managed hover whose geometry resolver reports removal", () => {
    const { store, access } = setup("custom");
    const channel =
      createInteractionChannel<HoverInteraction<Row>>("removed-geometry");
    access.upsertHoverInteraction(channel, hover());
    chart.installManagedHoverResolver(store, () => null);
    chart.refreshManagedHover(store);
    expect(access.getInteraction(channel)).toBeNull();
  });

  it("commits and rolls back managed metadata with the interaction batch", () => {
    const { store, access } = setup();
    const channel =
      createInteractionChannel<HoverInteraction<Row>>("batch-hover");
    expect(() =>
      access.batchInteractions((batch) => {
        batch.upsertHoverInteraction(channel, hover());
        throw new Error("rollback");
      }),
    ).toThrow("rollback");
    expect(store.getState().managedHoverChannels.size).toBe(0);
    access.batchInteractions((batch) =>
      batch.upsertHoverInteraction(channel, hover()),
    );
    expect(store.getState().managedHoverChannels.has(channel.key)).toBe(true);
    access.upsertInteraction(channel, hover());
    expect(store.getState().managedHoverChannels.has(channel.key)).toBe(false);
    access.upsertHoverInteraction(channel, hover());
    access.removeInteraction(channel);
    expect(store.getState().managedHoverChannels.has(channel.key)).toBe(false);
  });
});

it("does not implicitly manage primary hover and opts out even when its payload is unchanged", () => {
  const { store, access } = setup();
  const value = hover();
  access.upsertHoverInteraction("primary-hover", value);
  access.upsertInteraction("primary-hover", value);
  chart.updateChartData(store, [{ x: 1, y: 500 }, rows[1]]);
  expect(access.getInteraction("primary-hover")).toBe(value);
  expect(store.getState().managedHoverChannels.size).toBe(0);
});

it("preserves standalone owned geometry until publication and releases its registry entry on disposal", () => {
  const { store, access } = setup();
  const channel = createInteractionChannel<HoverInteraction<Row>>("standalone");
  const geometryOwner = {};
  const value = hover();
  value.targets[0] = { ...value.targets[0], geometryOwner };
  access.upsertHoverInteraction(channel, value);
  let resolutions = 0;
  chart.installManagedHoverResolver(store, () => {
    resolutions++;
    return null;
  });
  chart.updateChartData(store, [{ x: 1, y: 300 }, rows[1]]);
  expect(resolutions).toBe(0);
  expect(access.getInteraction(channel)?.targets[0].coordinate).toEqual({
    x: 72,
    y: 83,
  });
  expect(access.getInteraction(channel)?.targets[0].geometryOwner).toBe(
    geometryOwner,
  );
  chart.refreshManagedHover(store);
  expect(resolutions).toBe(1);
  expect(access.getInteraction(channel)).toBeNull();
  expect(store.getState().managedHoverChannels.has(channel.key)).toBe(false);
});
