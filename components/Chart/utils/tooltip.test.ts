import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  calculateTooltipTransform,
  TOOLTIP_HORIZONTAL_GAP,
  TOUCH_VERTICAL_OFFSET,
  VIEWPORT_EDGE_MARGIN,
} from "./tooltip";

describe("tooltip utils", () => {
  // Mock window.innerWidth for viewport overflow tests
  beforeEach(() => {
    vi.stubGlobal("window", {
      innerWidth: 1024,
    });
  });

  describe("constants", () => {
    it("exports expected constant values", () => {
      expect(TOOLTIP_HORIZONTAL_GAP).toBe(48);
      expect(VIEWPORT_EDGE_MARGIN).toBe(20);
      expect(TOUCH_VERTICAL_OFFSET).toBe(50);
    });
  });

  describe("calculateTooltipTransform", () => {
    describe("horizontal positioning", () => {
      it("positions tooltip to the right of cursor by default", () => {
        const result = calculateTooltipTransform(
          { cursorX: 100, cursorY: 200, isTouch: false },
          { tooltipWidth: 150, wrapperLeft: 50 },
        );

        // Should be cursorX + TOOLTIP_HORIZONTAL_GAP = 100 + 48 = 148
        expect(result).toBe("translate3d(148px, 200px, 0)");
      });

      it("flips tooltip to left side when it would overflow right edge", () => {
        // Cursor at 900px, wrapper at 0, tooltip 150px wide
        // absoluteX + tooltipWidth + gap = 900 + 150 + 48 = 1098 > 1024 - 20 = 1004
        // So it should flip
        const result = calculateTooltipTransform(
          { cursorX: 900, cursorY: 200, isTouch: false },
          { tooltipWidth: 150, wrapperLeft: 0 },
        );

        // Flipped: cursorX - tooltipWidth
        // 900 - 150 = 750
        expect(result).toBe("translate3d(750px, 200px, 0)");
      });

      it("stays on right side when flipping left would cause left overflow", () => {
        // Cursor at 50px, wrapper at 0
        // If we flip left: 0 + 50 + (-150) = -100 < 20
        // So it should stay on right
        const result = calculateTooltipTransform(
          { cursorX: 50, cursorY: 200, isTouch: false },
          { tooltipWidth: 150, wrapperLeft: 0 },
        );

        // Stays right: cursorX + TOOLTIP_HORIZONTAL_GAP = 50 + 48 = 98
        expect(result).toBe("translate3d(98px, 200px, 0)");
      });

      it("accounts for wrapper left offset in overflow calculations", () => {
        // Wrapper at 200px, cursor at 700px
        // absoluteX = 200 + 700 = 900
        // With tooltip 150 + gap 48 = 1098 > 1004, should flip
        const result = calculateTooltipTransform(
          { cursorX: 700, cursorY: 200, isTouch: false },
          { tooltipWidth: 150, wrapperLeft: 200 },
        );

        // Flipped: 700 - 150 = 550
        expect(result).toBe("translate3d(550px, 200px, 0)");
      });
    });

    describe("vertical positioning", () => {
      it("positions tooltip at cursor Y for mouse interactions", () => {
        const result = calculateTooltipTransform(
          { cursorX: 100, cursorY: 300, isTouch: false },
          { tooltipWidth: 150, wrapperLeft: 0 },
        );

        expect(result).toContain("300px, 0)");
      });

      it("offsets tooltip up for touch interactions to avoid finger occlusion", () => {
        const result = calculateTooltipTransform(
          { cursorX: 100, cursorY: 300, isTouch: true },
          { tooltipWidth: 150, wrapperLeft: 0 },
        );

        // Touch: cursorY - TOUCH_VERTICAL_OFFSET = 300 - 50 = 250
        expect(result).toContain("250px, 0)");
      });

      it("handles touch at top of chart (may result in negative Y)", () => {
        const result = calculateTooltipTransform(
          { cursorX: 100, cursorY: 30, isTouch: true },
          { tooltipWidth: 150, wrapperLeft: 0 },
        );

        // Touch: 30 - 50 = -20 (acceptable - browser clips)
        expect(result).toContain("-20px, 0)");
      });
    });

    describe("edge cases", () => {
      it("handles cursor at origin (0, 0)", () => {
        const result = calculateTooltipTransform(
          { cursorX: 0, cursorY: 0, isTouch: false },
          { tooltipWidth: 100, wrapperLeft: 0 },
        );

        // Should position at gap from origin
        expect(result).toBe("translate3d(48px, 0px, 0)");
      });

      it("handles very wide tooltips", () => {
        const result = calculateTooltipTransform(
          { cursorX: 500, cursorY: 200, isTouch: false },
          { tooltipWidth: 500, wrapperLeft: 0 },
        );

        // 500 + 500 + 48 = 1048 > 1004, should flip
        // Flipped: 500 - 48 - 500 + 12 = -36 < 20, stays right
        // Wait! The logic says if `wouldOverflowLeft` -> stay right.
        // Left Check: 0 + 500 + (-48 - 500 + 12) = -36.
        // -36 < 20. So it overflows left.
        // So logic resets to right.
        // Result: 500 + 48 = 548.
        // This test expectation is UNCHANGED effectively, because it falls back to right.
        expect(result).toBe("translate3d(548px, 200px, 0)");
      });

      it("returns translate3d format for GPU acceleration", () => {
        const result = calculateTooltipTransform(
          { cursorX: 100, cursorY: 200, isTouch: false },
          { tooltipWidth: 100, wrapperLeft: 0 },
        );

        expect(result).toMatch(/^translate3d\(.+px, .+px, 0\)$/);
      });
    });
  });
});
