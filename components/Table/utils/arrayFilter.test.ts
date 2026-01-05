import { describe, expect, it, vi } from "vitest";

import { arrayIncludesFilter } from "./arrayFilter";

describe("arrayIncludesFilter", () => {
  const mockRow = (value: any) => ({
    getValue: () => value,
  });

  it("should return true if filterValue is empty or not an array", () => {
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow("any"), "col1", null)).toBe(true);
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow("any"), "col1", undefined)).toBe(true);
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow("any"), "col1", [])).toBe(true);
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow("any"), "col1", "string")).toBe(true);
  });

  it("should return true if row value matches one of the filter values", () => {
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow("A"), "col1", ["A", "B"])).toBe(true);
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow(10), "col1", ["10", "20"])).toBe(true); // "10" vs 10, logic converts to string
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow(true), "col1", ["true", "false"])).toBe(
      true,
    );
  });

  it("should return false if row value does not match any filter value", () => {
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow("C"), "col1", ["A", "B"])).toBe(false);
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow(30), "col1", ["10", "20"])).toBe(false);
  });

  it("should handle null/undefined row values correctly", () => {
    // If null is in list (as empty string usually in this app logic?)
    // The code says: if cellValue is null/undefined, return filterValue.includes("")
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow(null), "col1", ["", "A"])).toBe(true);
    // @ts-ignore
    expect(arrayIncludesFilter(mockRow(undefined), "col1", ["B"])).toBe(false);
  });

  it("should respond correctly to autoRemove", () => {
    expect(arrayIncludesFilter.autoRemove!(null)).toBe(true);
    expect(arrayIncludesFilter.autoRemove!(undefined)).toBe(true);
    expect(arrayIncludesFilter.autoRemove!([])).toBe(true);
    expect(arrayIncludesFilter.autoRemove!(["A"])).toBe(false);
  });
});
