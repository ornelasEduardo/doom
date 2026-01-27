import { describe, expect, it } from "vitest";

import { createRoundedTopBarPath } from "./shapes";

describe("shapes utils", () => {
  describe("createRoundedTopBarPath", () => {
    it("creates path for standard bar dimensions", () => {
      const path = createRoundedTopBarPath(10, 20, 40, 100, 5);

      expect(path).toBeTruthy();
      // Should start at bottom left
      expect(path).toContain("M 10,120"); // xPos, yPos + height
      // Should end with Z (close path)
      expect(path.trim()).toMatch(/Z\s*$/);
    });

    it("returns empty string for zero height", () => {
      const path = createRoundedTopBarPath(10, 20, 40, 0, 5);

      expect(path).toBe("");
    });

    it("returns empty string for negative height", () => {
      const path = createRoundedTopBarPath(10, 20, 40, -10, 5);

      expect(path).toBe("");
    });

    it("limits radius to half of width", () => {
      // Width is 20, so max radius should be 10
      const path = createRoundedTopBarPath(0, 0, 20, 100, 15);

      // Arc commands should use r=10, not r=15
      expect(path).toContain("A 10,10");
    });

    it("limits radius to height", () => {
      // Height is 8, so max radius should be 8
      const path = createRoundedTopBarPath(0, 0, 40, 8, 15);

      // Arc commands should use r=8
      expect(path).toContain("A 8,8");
    });

    it("handles bars at origin", () => {
      const path = createRoundedTopBarPath(0, 0, 50, 80, 4);

      expect(path).toBeTruthy();
      expect(path).toContain("M 0,80"); // starts at bottom left
    });

    it("produces valid SVG arc commands", () => {
      const path = createRoundedTopBarPath(10, 20, 40, 100, 5);

      // Should have two arc commands for top corners
      const arcMatches = path.match(/A \d+,\d+ 0 0 1 \d+,\d+/g);
      expect(arcMatches).toHaveLength(2);
    });

    it("uses correct coordinates for path segments", () => {
      const path = createRoundedTopBarPath(10, 20, 40, 100, 5);

      // Bottom left start
      expect(path).toContain("M 10,120");
      // Left side up to radius start
      expect(path).toContain("L 10,25"); // yPos + r = 20 + 5
      // Top left arc ends at
      expect(path).toContain("15,20"); // xPos + r, yPos
      // Top right before arc
      expect(path).toContain("L 45,20"); // xPos + width - r, yPos
      // Bottom right
      expect(path).toContain("L 50,120"); // xPos + width, yPos + height
    });

    it("handles very small dimensions", () => {
      const path = createRoundedTopBarPath(0, 0, 2, 3, 1);

      expect(path).toBeTruthy();
      // Path should be valid even for tiny bars
      expect(path).toContain("A 1,1");
    });
  });
});
