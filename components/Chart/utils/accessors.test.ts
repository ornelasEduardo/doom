import { describe, expect, it } from "vitest";

import { resolveAccessor } from "./accessors";

describe("resolveAccessor", () => {
  it("resolves string key to function", () => {
    const accessor = resolveAccessor<{ val: number }, number>("val");
    expect(accessor({ val: 123 })).toBe(123);
  });

  it("returns function as is", () => {
    const fn = (d: { val: number }) => d.val * 2;
    const accessor = resolveAccessor(fn);
    expect(accessor({ val: 10 })).toBe(20);
  });
});
