import React from "react";
import { describe, expect, it } from "vitest";

import { hasChildOfType, hasChildOfTypeDeep } from "./componentDetection";

// Test components
function ComponentA() {
  return <div>A</div>;
}

function ComponentB({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>;
}

function ComponentC() {
  return <span>C</span>;
}

describe("componentDetection", () => {
  describe("hasChildOfType", () => {
    it("returns true when direct child matches", () => {
      const children = [<ComponentA key="a" />, <ComponentB key="b" />];

      expect(hasChildOfType(children, ComponentA)).toBe(true);
      expect(hasChildOfType(children, ComponentB)).toBe(true);
    });

    it("returns false when component is not a direct child", () => {
      const children = (
        <ComponentB>
          <ComponentA />
        </ComponentB>
      );

      expect(hasChildOfType(children, ComponentA)).toBe(false);
      expect(hasChildOfType(children, ComponentB)).toBe(true);
    });

    it("returns false when component is not present", () => {
      const children = (
        <>
          <ComponentA />
          <ComponentB />
        </>
      );

      expect(hasChildOfType(children, ComponentC)).toBe(false);
    });

    it("handles null children", () => {
      expect(hasChildOfType(null, ComponentA)).toBe(false);
    });

    it("handles undefined children", () => {
      expect(hasChildOfType(undefined, ComponentA)).toBe(false);
    });
  });

  describe("hasChildOfTypeDeep", () => {
    it("returns true when direct child matches", () => {
      const children = (
        <>
          <ComponentA />
        </>
      );

      expect(hasChildOfTypeDeep(children, ComponentA)).toBe(true);
    });

    it("returns true when nested child matches", () => {
      const children = (
        <ComponentB>
          <ComponentA />
        </ComponentB>
      );

      expect(hasChildOfTypeDeep(children, ComponentA)).toBe(true);
    });

    it("returns true when deeply nested child matches", () => {
      const children = (
        <ComponentB>
          <div>
            <ComponentB>
              <ComponentA />
            </ComponentB>
          </div>
        </ComponentB>
      );

      expect(hasChildOfTypeDeep(children, ComponentA)).toBe(true);
    });

    it("returns false when component is not present at any level", () => {
      const children = (
        <ComponentB>
          <ComponentB />
        </ComponentB>
      );

      expect(hasChildOfTypeDeep(children, ComponentC)).toBe(false);
    });

    it("handles null children", () => {
      expect(hasChildOfTypeDeep(null, ComponentA)).toBe(false);
    });
  });
});
