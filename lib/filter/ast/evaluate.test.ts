import { describe, expect, it } from "vitest";

import { evaluateFilter } from "./evaluate";
import { Filter, FilterCondition, FilterGroup } from "./types";

describe("evaluateFilter", () => {
  const row = {
    name: "Alice",
    age: 25,
    role: "Admin",
    active: true,
  };

  it("evaluates a passing condition", () => {
    const filter: FilterCondition = {
      type: "condition",
      field: "name",
      operator: "eq",
      value: "Alice",
    };
    expect(evaluateFilter(filter, row)).toBe(true);
  });

  it("evaluates a failing condition", () => {
    const filter: FilterCondition = {
      type: "condition",
      field: "name",
      operator: "eq",
      value: "Bob",
    };
    expect(evaluateFilter(filter, row)).toBe(false);
  });

  it("evaluates each operator correctly", () => {
    const cases: Array<[FilterCondition, boolean]> = [
      [{ type: "condition", field: "age", operator: "gt", value: 20 }, true],
      [{ type: "condition", field: "age", operator: "lt", value: 20 }, false],
      [
        {
          type: "condition",
          field: "name",
          operator: "contains",
          value: "lic",
        },
        true,
      ],
      [
        {
          type: "condition",
          field: "role",
          operator: "in",
          value: ["Admin", "User"],
        },
        true,
      ],
      [
        {
          type: "condition",
          field: "role",
          operator: "notIn",
          value: ["Admin"],
        },
        false,
      ],
    ];
    for (const [filter, expected] of cases) {
      expect(evaluateFilter(filter, row)).toBe(expected);
    }
  });

  it("AND logic in a group requires every condition to pass", () => {
    const group: FilterGroup = {
      type: "group",
      conditions: [
        { type: "condition", field: "name", operator: "eq", value: "Alice" },
        {
          type: "condition",
          field: "age",
          operator: "gt",
          value: 20,
          logic: "and",
        },
      ],
    };
    expect(evaluateFilter(group, row)).toBe(true);
  });

  it("OR logic in a group passes when any condition passes", () => {
    const group: FilterGroup = {
      type: "group",
      conditions: [
        { type: "condition", field: "name", operator: "eq", value: "Bob" },
        {
          type: "condition",
          field: "age",
          operator: "gt",
          value: 20,
          logic: "or",
        },
      ],
    };
    expect(evaluateFilter(group, row)).toBe(true);
  });

  it("recurses into nested groups", () => {
    const nested: FilterGroup = {
      type: "group",
      conditions: [
        { type: "condition", field: "name", operator: "eq", value: "Alice" },
        {
          type: "group",
          logic: "and",
          conditions: [
            { type: "condition", field: "age", operator: "eq", value: 25 },
          ],
        },
      ],
    };
    expect(evaluateFilter(nested, row)).toBe(true);
  });

  it("returns true for empty groups", () => {
    const empty: FilterGroup = { type: "group", conditions: [] };
    expect(evaluateFilter(empty, row)).toBe(true);
  });

  it("warns and returns true on unknown operators", () => {
    const bad = {
      type: "condition",
      field: "name",
      operator: "unknown" as never,
      value: "x",
    } satisfies Filter;
    expect(evaluateFilter(bad, row)).toBe(true);
  });
});
