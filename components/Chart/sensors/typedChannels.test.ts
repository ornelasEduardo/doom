import ts from "typescript";
import { expect, it } from "vitest";

import { type EngineEvent, InputAction, InputSource } from "../engine";
import {
  createChartStore,
  registerSeries,
  unregisterSeries,
  updateChartState,
} from "../state/store/chart.store";
import type { ContextValue } from "../types/context";
import type { GenericSensor, Sensor, SensorContext } from "../types/events";
import type {
  DragInteraction,
  HoverInteraction,
  SelectionInteraction,
} from "../types/interaction";
import {
  createInteractionAccess,
  createInteractionChannel,
} from "../utils/interactionChannels";
import { DragSensor } from "./DragSensor";
import { KeyboardSensor } from "./KeyboardSensor";
import { SelectionSensor } from "./SelectionSensor";

type Row = { x: number; y: number };
const drag = createInteractionChannel<DragInteraction<Row>>("shared-name");
const hover = createInteractionChannel<HoverInteraction<Row>>("shared-name");
const selection =
  createInteractionChannel<SelectionInteraction<Row>>("shared-name");

function contracts() {
  const typedDrag: Sensor<Row> = DragSensor({ name: drag });
  const typedKeyboard: Sensor<Row> = KeyboardSensor({ name: hover });
  const typedSelection: Sensor<Row> = SelectionSensor({ name: selection });
  const genericDrag: GenericSensor = DragSensor({ name: "custom" });
  const genericKeyboard: GenericSensor = KeyboardSensor();
  const genericSelection: GenericSensor = SelectionSensor({ name: "custom" });
  // @ts-expect-error A hover channel cannot store drag payloads.
  DragSensor({ name: hover });
  // @ts-expect-error A selection channel cannot store hover payloads.
  KeyboardSensor({ name: selection });
  // @ts-expect-error A drag channel cannot store selection payloads.
  SelectionSensor({ name: drag });
  // @ts-expect-error Datum contracts are invariant across typed channel handles.
  const wrong: Sensor<{ id: string }> = KeyboardSensor({ name: hover });
  return [
    typedDrag,
    typedKeyboard,
    typedSelection,
    genericDrag,
    genericKeyboard,
    genericSelection,
    wrong,
  ];
}
void contracts;

it("checks built-in sensor handle payloads and generic string factories", () => {
  const file = "components/Chart/sensors/typedChannels.test.ts";
  const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd(),
  );
  const program = ts.createProgram(
    [file, "types/css.d.ts", "types/declarations.d.ts"],
    { ...parsed.options, incremental: false, noEmit: true },
  );
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName.endsWith("sensors/typedChannels.test.ts"));
  expect(
    diagnostics.map((d) =>
      ts.flattenDiagnosticMessageText(d.messageText, "\n"),
    ),
  ).toEqual([]);
}, 20000);

it("writes, reads, toggles and clears isolated typed channels through built-in sensors", () => {
  const row: Row = { x: 1, y: 10 };
  const chartStore = createChartStore<Row>({}, "x", "y");
  updateChartState(chartStore, {
    data: [row],
    dimensions: {
      width: 200,
      height: 200,
      innerWidth: 160,
      innerHeight: 160,
      margin: { left: 20, right: 20, top: 20, bottom: 20 },
    },
  });
  const context: SensorContext<Row> = {
    ...createInteractionAccess(chartStore),
    getChartContext: () => ({ chartStore, config: {} }) as ContextValue<Row>,
  };
  const start: EngineEvent<Row> = {
    signal: {
      id: 1,
      action: InputAction.START,
      source: InputSource.MOUSE,
      userId: "local",
      timestamp: 0,
      x: 50,
      y: 50,
    },
    chartX: 50,
    chartY: 50,
    isWithinPlot: true,
    candidates: [],
    sliceCandidates: [],
    primaryCandidate: {
      type: "data-point",
      data: row,
      coordinate: { x: 50, y: 50 },
      distance: 0,
    },
  };
  const dragging = DragSensor({ name: drag });
  const selecting = SelectionSensor({ name: selection });
  const keyboard = KeyboardSensor({ name: hover });
  dragging(start, context);
  selecting(start, context);
  const key = {
    ...start,
    signal: {
      ...start.signal,
      action: InputAction.KEY,
      key: "ArrowRight",
      keyPhase: "down" as const,
    },
  };
  let keyboardWrites = 0;
  const unsubscribe = context.subscribeInteraction(hover, () => {
    keyboardWrites += 1;
  });
  keyboard(key, context);
  KeyboardSensor({ name: { ...hover } })(key, context);
  expect(keyboardWrites).toBe(1);
  unsubscribe();
  expect(context.getInteraction(drag)?.target.data).toEqual(row);
  expect(context.getInteraction(selection)?.selection).toEqual([row]);
  expect(context.getInteraction(hover)?.target?.data).toEqual(row);
  selecting(start, context);
  expect(context.getInteraction(selection)?.selection).toEqual([]);
  dragging(
    { ...start, signal: { ...start.signal, action: InputAction.CANCEL } },
    context,
  );
  keyboard({ ...key, signal: { ...key.signal, key: "Escape" } }, context);
  expect(context.getInteraction(drag)).toBeNull();
  expect(context.getInteraction(hover)).toBeNull();
});

it("refreshes a stationary typed keyboard reading after streaming data and clears it on series removal", () => {
  const chartStore = createChartStore<Row>(
    { width: 300, height: 200 },
    "x",
    "y",
  );
  const initial = [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
  ];
  updateChartState(chartStore, {
    data: initial,
    dimensions: chartStore.getState().dimensions,
  });
  registerSeries(chartStore, "series", [
    { id: "series", type: "line", x: "x", y: "y" },
  ]);
  const context: SensorContext<Row> = {
    ...createInteractionAccess(chartStore),
    getChartContext: () => ({ chartStore, config: {} }) as ContextValue<Row>,
  };
  const keyboard = KeyboardSensor({ name: hover });
  keyboard(
    {
      signal: {
        action: InputAction.KEY,
        key: "ArrowRight",
        keyPhase: "down",
        id: 0,
        source: InputSource.KEYBOARD,
        userId: "local",
        timestamp: 0,
        x: 0,
        y: 0,
      },
      chartX: 0,
      chartY: 0,
      isWithinPlot: true,
      candidates: [],
      sliceCandidates: [],
    },
    context,
  );
  expect(context.getInteraction(hover)?.target?.data).toEqual(initial[0]);
  const updated = [
    { x: 0, y: 30 },
    { x: 1, y: 40 },
  ];
  updateChartState(chartStore, {
    data: updated,
    dimensions: chartStore.getState().dimensions,
  });
  expect(context.getInteraction(hover)?.target?.data).toEqual(updated[0]);
  unregisterSeries(chartStore, "series");
  expect(context.getInteraction(hover)).toBeNull();
});
