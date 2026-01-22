import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  calculateEdgeCorrectedPosition,
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
  toTransformString,
  TOUCH_OFFSET_Y,
  VIEWPORT_MARGIN,
} from "./edgeDetection";

describe("edgeDetection", () => {
  // Mock window dimensions
  beforeEach(() => {
    vi.stubGlobal("window", {
      innerWidth: 1024,
      innerHeight: 768,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("calculateEdgeCorrectedPosition", () => {
    const baseInput = {
      anchorX: 100,
      anchorY: 100,
      tooltipWidth: 150,
      tooltipHeight: 80,
      containerLeft: 50,
      containerWidth: 800,
    };

    it("places tooltip to the right by default", () => {
      const result = calculateEdgeCorrectedPosition(baseInput);

      expect(result.placement).toBe("right");
      expect(result.x).toBe(baseInput.anchorX + TOOLTIP_GAP_X);
      expect(result.y).toBe(baseInput.anchorY + TOOLTIP_GAP_Y);
    });

    it("flips to left when right would overflow viewport", () => {
      // Position where right placement would overflow:
      // containerLeft(100) + anchorX(800) + gapX(12) + tooltipWidth(150) = 1062 > 1024 - 8
      const input = {
        ...baseInput,
        anchorX: 800,
        containerLeft: 100,
      };

      const result = calculateEdgeCorrectedPosition(input);

      expect(result.placement).toBe("left");
      expect(result.x).toBe(input.anchorX - TOOLTIP_GAP_X - input.tooltipWidth);
    });

    it("stays on right when both sides would overflow", () => {
      // Very narrow viewport simulation
      vi.stubGlobal("window", { innerWidth: 200, innerHeight: 768 });

      const input = {
        ...baseInput,
        anchorX: 50,
        tooltipWidth: 100,
        containerLeft: 50,
        containerWidth: 100,
      };

      const result = calculateEdgeCorrectedPosition(input);

      expect(result.placement).toBe("right");
    });

    it("adjusts Y position when tooltip would overflow bottom", () => {
      const input = {
        ...baseInput,
        anchorY: 700, // Near bottom of 768px viewport
      };

      const result = calculateEdgeCorrectedPosition(input);

      expect(result.placement).toBe("above");
      expect(result.y).toBe(
        input.anchorY - input.tooltipHeight - TOOLTIP_GAP_Y,
      );
    });

    it("clamps Y to viewport margin when overflowing top", () => {
      // With touch interaction, baseY = anchorY - touchOffset
      // If anchorY=20, touchOffset=40, baseY=-20 which is < VIEWPORT_MARGIN
      const input = {
        ...baseInput,
        anchorY: 20,
        isTouch: true,
      };

      const result = calculateEdgeCorrectedPosition(input);

      expect(result.y).toBe(VIEWPORT_MARGIN);
    });

    it("applies touch offset when isTouch is true", () => {
      const input = {
        ...baseInput,
        isTouch: true,
      };

      const result = calculateEdgeCorrectedPosition(input);

      expect(result.y).toBe(baseInput.anchorY - TOUCH_OFFSET_Y);
    });

    describe("custom options", () => {
      it("uses custom gapX", () => {
        const customGapX = 24;
        const result = calculateEdgeCorrectedPosition(baseInput, {
          gapX: customGapX,
        });

        expect(result.x).toBe(baseInput.anchorX + customGapX);
      });

      it("uses custom gapY", () => {
        const customGapY = 16;
        const result = calculateEdgeCorrectedPosition(baseInput, {
          gapY: customGapY,
        });

        expect(result.y).toBe(baseInput.anchorY + customGapY);
      });

      it("uses custom touchOffsetY", () => {
        const customTouchOffset = 60;
        const input = { ...baseInput, isTouch: true };

        const result = calculateEdgeCorrectedPosition(input, {
          touchOffsetY: customTouchOffset,
        });

        expect(result.y).toBe(baseInput.anchorY - customTouchOffset);
      });
    });
  });

  describe("toTransformString", () => {
    it("generates correct transform string", () => {
      const position = { x: 100, y: 50, placement: "right" as const };

      const result = toTransformString(position);

      expect(result).toBe("translate(100px, 50px)");
    });

    it("handles negative values", () => {
      const position = { x: -20, y: -10, placement: "left" as const };

      const result = toTransformString(position);

      expect(result).toBe("translate(-20px, -10px)");
    });
  });
});
