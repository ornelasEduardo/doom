import { describe, expect, it } from "vitest";

import {
  evaluateFilter,
  FilterCondition,
  FilterGroup,
  simpleFiltersToAST,
} from "./filterAst";

describe("evaluateFilter", () => {
  const row = {
    name: "Alice",
    age: 25,
    role: "Admin",
    active: true,
  };

  it("should evaluate simple condition correctly", () => {
    const condition: FilterCondition = {
      type: "condition",
      field: "name",
      operator: "eq",
      value: "Alice",
    };
    expect(evaluateFilter(condition, row)).toBe(true);

    const conditionFail: FilterCondition = {
      type: "condition",
      field: "name",
      operator: "eq",
      value: "Bob",
    };
    expect(evaluateFilter(conditionFail, row)).toBe(false);
  });

  it("should evaluate operators correctly", () => {
    expect(
      evaluateFilter(
        { type: "condition", field: "age", operator: "gt", value: 20 },
        row,
      ),
    ).toBe(true);
    expect(
      evaluateFilter(
        { type: "condition", field: "age", operator: "lt", value: 20 },
        row,
      ),
    ).toBe(false);
    expect(
      evaluateFilter(
        {
          type: "condition",
          field: "name",
          operator: "contains",
          value: "lic",
        },
        row,
      ),
    ).toBe(true);
    expect(
      evaluateFilter(
        {
          type: "condition",
          field: "role",
          operator: "in",
          value: ["Admin", "User"],
        },
        row,
      ),
    ).toBe(true);
  });

  it("should evaluate group with AND logic", () => {
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

  it("should evaluate group with OR logic", () => {
    const group: FilterGroup = {
      type: "group",
      conditions: [
        { type: "condition", field: "name", operator: "eq", value: "Bob" }, // False
        {
          type: "condition",
          field: "age",
          operator: "gt",
          value: 20,
          logic: "or",
        }, // True
      ],
    };
    expect(evaluateFilter(group, row)).toBe(true);
  });

  it("should handle nested groups (conceptually, though function is recursive)", () => {
    // The type definition allows nesting, let's verify recursion works
    const nestedGroup: FilterGroup = {
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
    expect(evaluateFilter(nestedGroup, row)).toBe(true);
  });
});

describe("simpleFiltersToAST", () => {
  it("should return null for empty selections", () => {
    expect(simpleFiltersToAST({})).toBeNull();
    expect(simpleFiltersToAST({ name: "" })).toBeNull();
  });

  it("should return single condition for one selection", () => {
    const result = simpleFiltersToAST({ name: "Alice" });
    expect(result?.type).toBe("condition");
    expect((result as FilterCondition).field).toBe("name");
    expect((result as FilterCondition).value).toBe("Alice");
  });

  it("should return group for multiple selections (default AND)", () => {
    const result = simpleFiltersToAST({ name: "Alice", role: "Admin" });
    expect(result?.type).toBe("group");
    const group = result as FilterGroup;
    expect(group.conditions).toHaveLength(2);
    expect(group.conditions[1].logic).toBe("and");
  });
});
