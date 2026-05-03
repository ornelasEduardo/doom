import { describe, expect, it } from "vitest";

import { simpleFiltersToFilter } from "./simple";
import { FilterCondition, FilterGroup } from "./types";

describe("simpleFiltersToFilter", () => {
  it("returns null when nothing is selected", () => {
    expect(simpleFiltersToFilter({})).toBeNull();
    expect(simpleFiltersToFilter({ name: "" })).toBeNull();
  });

  it("returns a single condition for one selection", () => {
    const result = simpleFiltersToFilter({ name: "Alice" });
    expect(result?.type).toBe("condition");
    expect((result as FilterCondition).field).toBe("name");
    expect((result as FilterCondition).operator).toBe("eq");
    expect((result as FilterCondition).value).toBe("Alice");
  });

  it("returns an AND group for multiple selections", () => {
    const result = simpleFiltersToFilter({ name: "Alice", role: "Admin" });
    expect(result?.type).toBe("group");
    const group = result as FilterGroup;
    expect(group.conditions).toHaveLength(2);
    expect(group.conditions[1].logic).toBe("and");
  });

  it("filters out null and empty string values", () => {
    const result = simpleFiltersToFilter({
      name: "Alice",
      role: "",
      status: null as unknown as string,
    });
    expect(result?.type).toBe("condition");
    expect((result as FilterCondition).field).toBe("name");
  });
});
