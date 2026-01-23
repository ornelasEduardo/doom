/**
 * Unit tests for Reposition class
 */

import { beforeAll, describe, expect, it, vi } from "vitest";

import { Reposition } from "./Reposition";

// Mock getBoundingClientRect for element dimensions
const mockElement = (width: number, height: number): HTMLElement => {
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
  } as unknown as HTMLElement;
};

describe("Reposition", () => {
  // Set up window dimensions for edge detection tests
  beforeAll(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  describe("constructor", () => {
    it("handles null element gracefully", () => {
      const pos = new Reposition(null).anchor({ x: 100, y: 100 }).resolve();

      expect(pos).toHaveProperty("x");
      expect(pos).toHaveProperty("y");
      expect(pos).toHaveProperty("placement");
    });

    it("extracts dimensions from element", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .align({ vertical: "center" })
        .resolve();

      // With vertical center, y should be offset by half the height
      // baseY = 100, then -50 (half height) + 8 (default gapY) = 58
      expect(pos.y).toBe(58);
    });
  });

  describe("anchor", () => {
    it("warns when no anchor is set", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const pos = new Reposition(null).resolve();

      expect(warnSpy).toHaveBeenCalledWith(
        "Reposition: No anchor point set. Call .anchor() first.",
      );
      expect(pos).toEqual({ x: 0, y: 0, placement: "right" });

      warnSpy.mockRestore();
    });

    it("sets anchor point correctly", () => {
      const pos = new Reposition(null).anchor({ x: 150, y: 200 }).resolve();

      // Default gap is 12 horizontal, 8 vertical
      expect(pos.x).toBe(150 + 12); // anchor + gapX
      expect(pos.y).toBe(200 + 8); // anchor + gapY
    });
  });

  describe("gap", () => {
    it("applies custom horizontal gap", () => {
      const pos = new Reposition(null)
        .anchor({ x: 100, y: 100 })
        .gap({ x: 20 })
        .resolve();

      expect(pos.x).toBe(120); // 100 + 20
    });

    it("applies custom vertical gap", () => {
      const pos = new Reposition(null)
        .anchor({ x: 100, y: 100 })
        .gap({ y: 16 })
        .resolve();

      expect(pos.y).toBe(116); // 100 + 16
    });

    it("applies both gaps", () => {
      const pos = new Reposition(null)
        .anchor({ x: 100, y: 100 })
        .gap({ x: 24, y: 0 })
        .resolve();

      expect(pos.x).toBe(124);
      expect(pos.y).toBe(100); // no vertical gap
    });
  });

  describe("align", () => {
    it("vertical top alignment (default)", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .align({ vertical: "top" })
        .resolve();

      // y = anchorY + gapY = 100 + 8 = 108
      expect(pos.y).toBe(108);
    });

    it("vertical center alignment", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .align({ vertical: "center" })
        .resolve();

      // y = anchorY - (height/2) + gapY = 100 - 50 + 8 = 58
      expect(pos.y).toBe(58);
    });

    it("vertical bottom alignment", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .align({ vertical: "bottom" })
        .resolve();

      // y = anchorY - height + gapY = 100 - 100 + 8 = 8
      expect(pos.y).toBe(8);
    });

    it("horizontal center alignment", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .align({ horizontal: "center" })
        .resolve();

      // x = anchorX + gapX - (width/2) = 100 + 12 - 100 = 12
      expect(pos.x).toBe(12);
    });

    it("horizontal right alignment", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .align({ horizontal: "right" })
        .resolve();

      // x = anchorX + gapX - width = 100 + 12 - 200 = -88
      expect(pos.x).toBe(-88);
    });
  });

  describe("touchOffset", () => {
    it("applies touch offset when isTouch is true", () => {
      const pos = new Reposition(null)
        .anchor({ x: 100, y: 200 })
        .touchOffset(40, true)
        .resolve();

      // y = anchorY - touchOffset = 200 - 40 = 160
      expect(pos.y).toBe(160);
    });

    it("does not apply touch offset when isTouch is false", () => {
      const pos = new Reposition(null)
        .anchor({ x: 100, y: 200 })
        .touchOffset(40, false)
        .resolve();

      // y = anchorY + gapY = 200 + 8 = 208
      expect(pos.y).toBe(208);
    });

    it("applies custom touch offset value", () => {
      const pos = new Reposition(null)
        .anchor({ x: 100, y: 200 })
        .touchOffset(60, true)
        .resolve();

      expect(pos.y).toBe(140); // 200 - 60
    });
  });

  describe("edgeDetect", () => {
    it("enables edge detection", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 1800, y: 100 })
        .edgeDetect()
        .resolve();

      // Should flip to left since right would overflow
      expect(pos.placement).toBe("left");
    });

    it("returns right placement when no overflow", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .edgeDetect()
        .resolve();

      expect(pos.placement).toBe("right");
    });
  });

  describe("method chaining", () => {
    it("supports full chain", () => {
      const element = mockElement(200, 100);
      const pos = new Reposition(element)
        .anchor({ x: 100, y: 100 })
        .gap({ x: 16, y: 4 })
        .align({ vertical: "center" })
        .edgeDetect()
        .resolve();

      expect(pos).toHaveProperty("x");
      expect(pos).toHaveProperty("y");
      expect(pos).toHaveProperty("placement");
    });

    it("returns same instance for chaining", () => {
      const reposition = new Reposition(null);
      const afterAnchor = reposition.anchor({ x: 0, y: 0 });
      const afterGap = afterAnchor.gap({ x: 10 });
      const afterAlign = afterGap.align({ vertical: "center" });

      expect(afterAnchor).toBe(reposition);
      expect(afterGap).toBe(reposition);
      expect(afterAlign).toBe(reposition);
    });
    it("maintains vertical center alignment when edge detection is enabled", () => {
      // Regression test for bug where edge detection would reset vertical alignment
      const element = mockElement(200, 100);
      const anchor = { x: 500, y: 500 }; // Center of screen, no overflow risk

      const pos = new Reposition(element)
        .anchor(anchor)
        .align({ vertical: "center" })
        .edgeDetect()
        .resolve();

      // Expected: y = anchorY - height/2 + gapY(8) = 500 - 50 + 8 = 458
      expect(pos.y).toBe(458);
    });
  });
});
