import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
  TOUCH_OFFSET_Y,
  VIEWPORT_MARGIN,
} from "./edgeDetection";
import { Reposition } from "./Reposition";

describe("edgeDetection (via Reposition)", () => {
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

  const mockElement = (width: number = 150, height: number = 80) => {
    return {
      getBoundingClientRect: () => ({
        width,
        height,
        left: 0,
        top: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    } as HTMLElement;
  };

  describe("Reposition Edge Detection", () => {
    const tooltipWidth = 150;
    const tooltipHeight = 80;
    const baseAnchor = { x: 100, y: 100 };

    it("places tooltip to the right by default", () => {
      const element = mockElement(tooltipWidth, tooltipHeight);
      const result = new Reposition(element)
        .anchor(baseAnchor)
        .edgeDetect()
        .resolve();

      expect(result.placement).toBe("right");
      expect(result.x).toBe(baseAnchor.x + TOOLTIP_GAP_X);
      expect(result.y).toBe(baseAnchor.y + TOOLTIP_GAP_Y);
    });

    it("flips to left when right would overflow viewport", () => {
      // Right edge would be: 800 + 12 + 150 = 962.
      // Wait, viewport is 1024. 962 is fine.
      // Let's push it further correct.
      // anchorX = 900. Right edge = 900 + 12 + 150 = 1062 > 1024 - 8.

      const element = mockElement(tooltipWidth, tooltipHeight);
      const result = new Reposition(element)
        .anchor({ x: 900, y: 100 })
        .edgeDetect()
        .resolve();

      expect(result.placement).toBe("left");
      // Expected Left X: Anchor (900) - Gap (12) - Width (150) = 738
      expect(result.x).toBe(900 - TOOLTIP_GAP_X - tooltipWidth);
    });

    it("stays on right when both sides would overflow", () => {
      // Very narrow viewport
      vi.stubGlobal("window", { innerWidth: 200, innerHeight: 768 });

      const element = mockElement(100, 80);
      // Anchor at 50.
      // Right: 50 + 12 + 100 = 162 (Valid in 200px viewport? yes)
      // Wait, margin is 8. 200-8 = 192. 162 < 192.
      // We need it to overflow right.
      // Anchor at 100. Right: 100 + 12 + 100 = 212 > 192 (Overflow).
      // Left: 100 - 12 - 100 = -12 < 8 (Overflow).

      const result = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .edgeDetect()
        .resolve();

      // Should prefer right or clamp?
      // Implementation says: if overflow right check left. if overflow left too, clamp to valid boundary.
      // If original direction was right, it tries flip left. If that fails, it clamps X.
      // It stays "right" in terms of logic but coordinates are clamped.

      // Let's check logic:
      // if (primaryStatus.right) { ...
      //   if (this.horizontalAlign === "left") {
      //     check left... if (!flipStatus.left) { placement = left } else { clamp }
      //   }
      // }
      // If it clamps, it doesn't change placement explicitly, so it stays "right".

      expect(result.placement).toBe("right");
    });

    it("adjusts Y position when tooltip would overflow bottom", () => {
      // Viewport height 768.
      // Anchor Y = 700. Tooltip height 80.
      // Bottom Y = 700 + 8 + 80 = 788 > 768 - 8 (760). Overflow!

      const element = mockElement(tooltipWidth, tooltipHeight);
      const result = new Reposition(element)
        .anchor({ x: 100, y: 700 })
        .edgeDetect()
        .resolve();

      expect(result.placement).toBe("above");
      // Above Y: Anchor (700) - Height (80) - Gap (8) = 612
      expect(result.y).toBe(700 - tooltipHeight - TOOLTIP_GAP_Y);
    });

    it("clamps Y to viewport margin when overflowing top", () => {
      // Anchor Y = 20.
      // Height 80.
      // Vertical align top (default) -> Y = 20 + 8 = 28. (Fine)
      // Wait, we need to overflow top.
      // This usually happens with "above" placement or touch offset.

      const element = mockElement(tooltipWidth, tooltipHeight);

      // Force it to go up by using touch offset
      // touchOffset = 40. Anchor Y = 20. Y = 20 - 40 = -20.
      // Margin = 8. Should clamp to 8.

      const result = new Reposition(element)
        .anchor({ x: 100, y: 20 })
        .touchOffset(40, true) // isTouch = true
        .edgeDetect()
        .resolve();

      expect(result.y).toBe(VIEWPORT_MARGIN);
      expect(result.placement).toBe("right"); // Did not flip, just clamped
    });

    describe("Alignment Awareness within Edge Detection", () => {
      it("respects vertical: center alignment with gaps", () => {
        const element = mockElement(tooltipWidth, tooltipHeight); // h=80, half=40
        const result = new Reposition(element)
          .anchor(baseAnchor) // y=100
          .align({ vertical: "center" })
          // gapY is default 8.
          // Center logic: y -= height/2 -> 100 - 40 = 60.
          // Non-touch adds gapY -> 60 + 8 = 68.
          .edgeDetect()
          .resolve();

        expect(result.y).toBe(68);
      });

      it("respects horizontal: center alignment", () => {
        const element = mockElement(tooltipWidth, tooltipHeight); // w=150, half=75
        const result = new Reposition(element)
          .anchor(baseAnchor) // x=100
          .align({ horizontal: "center" })
          // Horizontal center logic: x -= width/2 -> 100 + 12(gap) - 75 = 37.
          .edgeDetect()
          .resolve();

        expect(result.x).toBe(37);
      });
    });

    it("applies touch offset correctly", () => {
      const element = mockElement(tooltipWidth, tooltipHeight);
      const result = new Reposition(element)
        .anchor(baseAnchor)
        .touchOffset(TOUCH_OFFSET_Y, true)
        .edgeDetect()
        .resolve();

      // y = anchorY (100) - touchOffset (40) = 60
      expect(result.y).toBe(baseAnchor.y - TOUCH_OFFSET_Y);
    });

    describe("Custom Options", () => {
      it("uses custom gapX", () => {
        const element = mockElement(tooltipWidth, tooltipHeight);
        const result = new Reposition(element)
          .anchor(baseAnchor)
          .gap({ x: 24 })
          .edgeDetect()
          .resolve();

        expect(result.x).toBe(baseAnchor.x + 24);
      });

      it("uses custom gapY", () => {
        const element = mockElement(tooltipWidth, tooltipHeight);
        const result = new Reposition(element)
          .anchor(baseAnchor)
          .gap({ y: 16 })
          .edgeDetect()
          .resolve();

        expect(result.y).toBe(baseAnchor.y + 16);
      });
    });
  });
});
