import { Row } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

import { arrayIncludesFilter } from "./arrayFilter";

describe("arrayIncludesFilter", () => {
  const mockRow = (value: unknown) =>
    ({
      getValue: () => value,
    }) as unknown as Row<unknown>;

  it("should return true if filterValue is empty or not an array", () => {
    expect(
      arrayIncludesFilter(
        mockRow("any"),
        "col1",
        null as unknown as string[],
        () => {},
      ),
    ).toBe(true);
    expect(
      arrayIncludesFilter(
        mockRow("any"),
        "col1",
        undefined as unknown as string[],
        () => {},
      ),
    ).toBe(true);
    expect(arrayIncludesFilter(mockRow("any"), "col1", [], () => {})).toBe(
      true,
    );
    expect(
      arrayIncludesFilter(
        mockRow("any"),
        "col1",
        "string" as unknown as string[],
        () => {},
      ),
    ).toBe(true);
  });

  it("should return true if row value matches one of the filter values", () => {
    expect(
      arrayIncludesFilter(mockRow("A"), "col1", ["A", "B"], () => {}),
    ).toBe(true);
    expect(
      arrayIncludesFilter(mockRow(10), "col1", ["10", "20"], () => {}),
    ).toBe(true); // "10" vs 10, logic converts to string
    expect(
      arrayIncludesFilter(mockRow(true), "col1", ["true", "false"], () => {}),
    ).toBe(true);
  });

  it("should return false if row value does not match any filter value", () => {
    expect(
      arrayIncludesFilter(mockRow("C"), "col1", ["A", "B"], () => {}),
    ).toBe(false);
    expect(
      arrayIncludesFilter(mockRow(30), "col1", ["10", "20"], () => {}),
    ).toBe(false);
  });

  it("should handle null/undefined row values correctly", () => {
    expect(
      arrayIncludesFilter(mockRow(null), "col1", ["", "A"], () => {}),
    ).toBe(true);
    expect(
      arrayIncludesFilter(mockRow(undefined), "col1", ["B"], () => {}),
    ).toBe(false);
  });

  it("should respond correctly to autoRemove", () => {
    expect(arrayIncludesFilter.autoRemove!(null)).toBe(true);
    expect(arrayIncludesFilter.autoRemove!(undefined)).toBe(true);
    expect(arrayIncludesFilter.autoRemove!([])).toBe(true);
    expect(arrayIncludesFilter.autoRemove!(["A"])).toBe(false);
  });
});
