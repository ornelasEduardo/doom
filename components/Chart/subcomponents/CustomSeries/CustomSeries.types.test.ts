import { expectTypeOf, it } from "vitest";

import { registerSeries } from "../../state/store/chart.store";

it("accepts registration accessors only under x and y", () => {
  type Registration = Parameters<typeof registerSeries>[2][number];
  expectTypeOf<Registration>().not.toBeAny();
  expectTypeOf<{ x: "time"; y: "value" }>().toExtend<Registration>();
  // Hydration reads x/y; accepting the output field names loses accessors.
  // @ts-expect-error xAccessor is a hydrated field, not a registration input.
  const invalidX: Registration = { xAccessor: "time" };
  // @ts-expect-error yAccessor is a hydrated field, not a registration input.
  const invalidY: Registration = { yAccessor: "value" };
  void invalidX;
  void invalidY;
});
