import { Row } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

import { arrayIncludesFilter } from "./array-filter";

describe("arrayIncludesFilter", () => {
  const mockRow = (value: unknown) =>
    ({
      getValue: () => value,
    }) as unknown as Row<unknown>;

  it("returns true when filterValue is empty or not an array", () => {
    const cases = [null, undefined, [], "string"];
    for (const c of cases) {
      expect(
        arrayIncludesFilter(mockRow("any"), "col1", c as unknown, () => {}),
      ).toBe(true);
    }
  });

  it("returns true when the row value matches a filter value", () => {
    expect(
      arrayIncludesFilter(mockRow("A"), "col1", ["A", "B"], () => {}),
    ).toBe(true);
    expect(
      arrayIncludesFilter(mockRow(10), "col1", ["10", "20"], () => {}),
    ).toBe(true);
    expect(
      arrayIncludesFilter(mockRow(true), "col1", ["true", "false"], () => {}),
    ).toBe(true);
  });

  it("returns false when no match is found", () => {
    expect(
      arrayIncludesFilter(mockRow("C"), "col1", ["A", "B"], () => {}),
    ).toBe(false);
    expect(
      arrayIncludesFilter(mockRow(30), "col1", ["10", "20"], () => {}),
    ).toBe(false);
  });

  it("treats null cells as the empty string for matching", () => {
    expect(
      arrayIncludesFilter(mockRow(null), "col1", ["", "A"], () => {}),
    ).toBe(true);
    expect(
      arrayIncludesFilter(mockRow(undefined), "col1", ["B"], () => {}),
    ).toBe(false);
  });

  it("autoRemove drops empty/non-array values", () => {
    expect(arrayIncludesFilter.autoRemove!(null)).toBe(true);
    expect(arrayIncludesFilter.autoRemove!(undefined)).toBe(true);
    expect(arrayIncludesFilter.autoRemove!([])).toBe(true);
    expect(arrayIncludesFilter.autoRemove!(["A"])).toBe(false);
  });
});
