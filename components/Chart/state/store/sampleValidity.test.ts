import { expect, it } from "vitest";

import {
  type HoverInteraction,
  InteractionChannel,
} from "../../types/interaction";
import { createInteractionAccess } from "../../utils/interactionChannels";
import {
  createChartStore,
  registerSeries,
  updateChartState,
} from "./chart.store";

it.each([null, undefined, NaN, Infinity])(
  "removes an active target when its value becomes %s",
  (value) => {
    const store = createChartStore({ width: 400, height: 300 }, "x", "y");
    const data = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
    ];
    updateChartState(store, { data, dimensions: store.getState().dimensions });
    registerSeries(store, "series", [
      { id: "series", type: "line", x: "x", y: "y" },
    ]);
    createInteractionAccess(store).upsertHoverInteraction(
      InteractionChannel.PRIMARY_HOVER,
      {
        pointer: { x: 0, y: 0, containerX: 0, containerY: 0, isTouch: false },
        targets: [
          {
            seriesId: "series",
            dataIndex: 0,
            data: data[0],
            coordinate: { x: 0, y: 0 },
          },
        ],
      },
    );
    updateChartState(store, {
      data: [{ x: 0, y: value }, data[1]],
      dimensions: store.getState().dimensions,
    });
    expect(
      store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER),
    ).toBeUndefined();
  },
);

it("retains only the valid sibling at its original index after refresh", () => {
  const store = createChartStore({ width: 400, height: 300 }, "x", "y");
  updateChartState(store, {
    data: [{ x: 0, y: 10 }],
    dimensions: store.getState().dimensions,
  });
  registerSeries(store, "first", [{ id: "first", x: "x", y: "y" }]);
  registerSeries(store, "second", [
    { id: "second", x: "x", y: "y", data: [{ x: 0, y: 0 }] },
  ]);
  createInteractionAccess(store).upsertHoverInteraction(
    InteractionChannel.PRIMARY_HOVER,
    {
      pointer: { x: 0, y: 0, containerX: 0, containerY: 0, isTouch: false },
      targets: [
        {
          seriesId: "first",
          dataIndex: 0,
          data: { x: 0, y: 10 },
          coordinate: { x: 0, y: 0 },
        },
        {
          seriesId: "second",
          dataIndex: 0,
          data: { x: 0, y: 0 },
          coordinate: { x: 0, y: 0 },
        },
      ],
    },
  );
  updateChartState(store, {
    data: [{ x: 0, y: null }],
    dimensions: store.getState().dimensions,
  });
  const hover = store
    .getState()
    .interactions.get(InteractionChannel.PRIMARY_HOVER) as HoverInteraction;
  expect(
    hover.targets.map(({ seriesId, dataIndex }) => [seriesId, dataIndex]),
  ).toEqual([["second", 0]]);
});
