import { expectTypeOf, it } from "vitest";

import type { Behavior } from "../types/events";
import type {
  DragInteraction,
  HoverInteraction,
  SelectionInteraction,
} from "../types/interaction";
import { createInteractionChannel } from "../utils/interactionChannels";
import { Cursor, DraggablePuck, Markers, SelectionUpdate, Tooltip } from ".";

it("preserves datum types across owned builtins and rejects incompatible channels", () => {
  type Row = { value: number };
  const hover = createInteractionChannel<HoverInteraction<Row>>("hover");
  const selection =
    createInteractionChannel<SelectionInteraction<Row>>("selection");
  const drag = createInteractionChannel<DragInteraction<Row>>("drag");
  expectTypeOf(Cursor({ on: hover })).toEqualTypeOf<Behavior<Row>>();
  expectTypeOf(Markers({ on: hover })).toEqualTypeOf<Behavior<Row>>();
  expectTypeOf(DraggablePuck({ on: drag })).toEqualTypeOf<Behavior<Row>>();
  Tooltip({
    on: hover,
    render: ({ data, targets }) => {
      expectTypeOf(data).toEqualTypeOf<Row[]>();
      expectTypeOf(targets[0].data).toEqualTypeOf<Row>();
      return data[0].value;
    },
  });
  SelectionUpdate({
    on: selection,
    fn: (elements, data) => {
      expectTypeOf(data).toEqualTypeOf<Row[]>();
      elements.attr("data-value", (datum) => datum.value);
    },
  });
  // @ts-expect-error A selection payload cannot position a cursor.
  Cursor({ on: selection });
  // @ts-expect-error A drag payload cannot supply tooltip targets.
  Tooltip({ on: drag });
  // @ts-expect-error A hover channel cannot drive a drag puck.
  DraggablePuck({ on: hover });
});
