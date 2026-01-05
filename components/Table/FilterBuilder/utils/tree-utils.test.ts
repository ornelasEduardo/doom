import { describe, expect, it } from "vitest";

import type { FilterGroupItem, FilterItem } from "../FilterGroup";
import { getItemDepth, getMaxRelativeDepth, insertItem } from "./tree-utils";

describe("tree-utils", () => {
  describe("getItemDepth", () => {
    it("should return 0 for root ID", () => {
      const root: FilterGroupItem = {
        type: "group",
        id: "root",
        children: [],
      };
      expect(getItemDepth(root, "root")).toBe(0);
    });

    it("should return 1 for direct child", () => {
      const root: FilterGroupItem = {
        type: "group",
        id: "root",
        children: [
          {
            type: "condition",
            id: "c1",
            field: "f",
            operator: "eq",
            value: "",
          },
        ],
      };
      expect(getItemDepth(root, "c1")).toBe(1);
    });

    it("should return 2 for nested child", () => {
      const root: FilterGroupItem = {
        type: "group",
        id: "root",
        children: [
          {
            type: "group",
            id: "g1",
            children: [
              {
                type: "condition",
                id: "c2",
                field: "f",
                operator: "eq",
                value: "",
              },
            ],
          },
        ],
      };
      expect(getItemDepth(root, "c2")).toBe(2);
    });

    it("should return -1 for non-existent item", () => {
      const root: FilterGroupItem = {
        type: "group",
        id: "root",
        children: [],
      };
      expect(getItemDepth(root, "fake")).toBe(-1);
    });
  });

  describe("getMaxRelativeDepth", () => {
    it("should return 0 for condition", () => {
      const item: FilterItem = {
        type: "condition",
        id: "c1",
        field: "f",
        operator: "eq",
        value: "",
      };
      expect(getMaxRelativeDepth(item)).toBe(0);
    });

    it("should return 0 for empty group", () => {
      const item: FilterItem = {
        type: "group",
        id: "g1",
        children: [],
      };
      expect(getMaxRelativeDepth(item)).toBe(0);
    });

    it("should return 0 for group with only conditions", () => {
      const item: FilterItem = {
        type: "group",
        id: "g1",
        children: [
          {
            type: "condition",
            id: "c1",
            field: "f",
            operator: "eq",
            value: "",
          },
        ],
      };
      expect(getMaxRelativeDepth(item)).toBe(0);
    });

    it("should return 1 for group with nested group", () => {
      const item: FilterItem = {
        type: "group",
        id: "g1",
        children: [{ type: "group", id: "g2", children: [] }],
      };
      expect(getMaxRelativeDepth(item)).toBe(1);
    });

    it("should return 2 for group -> group -> group", () => {
      const item: FilterItem = {
        type: "group",
        id: "g1",
        children: [
          {
            type: "group",
            id: "g2",
            children: [{ type: "group", id: "g3", children: [] }],
          },
        ],
      };
      expect(getMaxRelativeDepth(item)).toBe(2);
    });
  });

  describe("insertItem", () => {
    it("should insert 'inside' a group by appending to children", () => {
      const root: FilterGroupItem = {
        type: "group",
        id: "root",
        children: [{ type: "group", id: "g1", children: [] }],
      };

      const newItem: FilterItem = {
        type: "condition",
        id: "new",
        field: "f",
        operator: "eq",
        value: "",
      };

      const res = insertItem(root, newItem, "g1", "inside");

      const g1 = res.children.find((c) => c.id === "g1") as FilterGroupItem;
      expect(g1.children).toHaveLength(1);
      expect(g1.children[0].id).toBe("new");
    });

    it("should create new group when inserting 'inside' a condition", () => {
      const root: FilterGroupItem = {
        type: "group",
        id: "root",
        children: [
          {
            type: "condition",
            id: "c1",
            field: "f",
            operator: "eq",
            value: "",
          },
        ],
      };

      const newItem: FilterItem = {
        type: "condition",
        id: "new",
        field: "f",
        operator: "eq",
        value: "",
      };

      const res = insertItem(root, newItem, "c1", "inside");

      expect(res.children).toHaveLength(1);
      const newGroup = res.children[0] as FilterGroupItem;
      expect(newGroup.type).toBe("group");
      expect(newGroup.children).toHaveLength(2);
      expect(newGroup.children[0].id).toBe("c1");
      expect(newGroup.children[1].id).toBe("new");
    });
  });
});
