import { expectTypeOf, it } from "vitest";

import type { GenericSensor, Sensor } from "../../types/events";
import type { HoverInteraction } from "../../types/interaction";
import { createInteractionChannel } from "../../utils/interactionChannels";
import { DataHoverSensor } from "./DataHoverSensor";

it("infers a row-specific sensor from its hover channel", () => {
  const channel =
    createInteractionChannel<HoverInteraction<{ amount: number }>>(
      "custom-hover",
    );
  expectTypeOf(DataHoverSensor({ name: channel })).toEqualTypeOf<
    Sensor<{ amount: number }>
  >();
  expectTypeOf(DataHoverSensor()).toEqualTypeOf<GenericSensor>();
  // @ts-expect-error A non-hover payload cannot receive hover targets.
  DataHoverSensor({ name: createInteractionChannel<number>("count") });
});
