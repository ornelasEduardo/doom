import { describe, expect, it } from "vitest";

import { OPERATORS } from "./operators";

describe("OPERATORS", () => {
  it("provides every operator key with a label and fn", () => {
    for (const def of Object.values(OPERATORS)) {
      expect(def.key).toBeDefined();
      expect(typeof def.label).toBe("string");
      expect(typeof def.fn).toBe("function");
    }
  });

  it("string ops are case insensitive", () => {
    expect(OPERATORS.contains.fn("Alice", "ALI")).toBe(true);
    expect(OPERATORS.startsWith.fn("Alice", "AL")).toBe(true);
    expect(OPERATORS.endsWith.fn("Alice", "ICE")).toBe(true);
  });

  it("numeric ops coerce strings", () => {
    expect(OPERATORS.gt.fn("10", "5")).toBe(true);
    expect(OPERATORS.lte.fn("5", "5")).toBe(true);
  });

  it("isEmpty / isNotEmpty handle null, undefined, empty string", () => {
    expect(OPERATORS.isEmpty.fn(null, undefined)).toBe(true);
    expect(OPERATORS.isEmpty.fn(undefined, undefined)).toBe(true);
    expect(OPERATORS.isEmpty.fn("", undefined)).toBe(true);
    expect(OPERATORS.isEmpty.fn("x", undefined)).toBe(false);
    expect(OPERATORS.isNotEmpty.fn("x", undefined)).toBe(true);
  });

  it("in / notIn require an array filter value", () => {
    expect(OPERATORS.in.fn("a", ["a", "b"])).toBe(true);
    expect(OPERATORS.in.fn("c", ["a", "b"])).toBe(false);
    expect(OPERATORS.in.fn("a", "not an array")).toBe(false);
    expect(OPERATORS.notIn.fn("c", ["a", "b"])).toBe(true);
  });
});
