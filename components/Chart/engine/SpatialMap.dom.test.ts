import { describe, expect, it, vi } from "vitest";

import { CHART_DATA_ATTRS } from "./index";
import { SpatialMap } from "./SpatialMap";

describe("SpatialMap DOM Hit Testing", () => {
  it("should return candidate when DOM element matches indexed data", () => {
    const map = new SpatialMap({ useDomHitTesting: true });
    const mockData = { id: 1, value: 100 };

    // 1. Populate Index
    map.updateIndex([
      {
        x: 100,
        y: 100,
        data: mockData,
        seriesId: "series-1",
        dataIndex: 0,
      },
    ]);

    // 2. Mock Container
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    map.setContainer(container);

    // 3. Mock Target Element
    const element = document.createElement("div");
    element.setAttribute(CHART_DATA_ATTRS.TYPE, "bar");
    element.setAttribute(CHART_DATA_ATTRS.SERIES_ID, "series-1");
    element.setAttribute(CHART_DATA_ATTRS.INDEX, "0");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 90,
      top: 90,
      width: 20,
      height: 20,
      right: 110,
      bottom: 110,
      x: 90,
      y: 90,
      toJSON: () => {},
    });

    // 4. Mock document.elementsFromPoint
    if (!document.elementsFromPoint) {
      (document as any).elementsFromPoint = vi.fn();
    }
    vi.spyOn(document, "elementsFromPoint").mockReturnValue([element]);
    vi.spyOn(container, "contains").mockReturnValue(true);

    // 5. Test Find
    const candidates = map.find(100, 100);

    expect(candidates.length).toBeGreaterThanOrEqual(1);

    // Find the DOM candidate specifically
    const domCandidate = candidates.find((c) => c.type === "bar");
    expect(domCandidate).toBeDefined();
    expect(domCandidate!.data).toBe(mockData);
    expect(domCandidate!.seriesId).toBe("series-1");
  });

  it("should ignore DOM element if data is not found in index (Fix for Crash)", () => {
    const map = new SpatialMap({ useDomHitTesting: true });

    // 1. Index is empty or has different data
    map.updateIndex([]);

    // 2. Mock Container
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      test: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as any);
    map.setContainer(container);

    // 3. Mock Target Element (Ghost element)
    const element = document.createElement("div");
    element.setAttribute(CHART_DATA_ATTRS.TYPE, "bar");
    element.setAttribute(CHART_DATA_ATTRS.SERIES_ID, "series-1");
    element.setAttribute(CHART_DATA_ATTRS.INDEX, "0");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 90,
      top: 90,
      width: 20,
      height: 20,
      right: 110,
      bottom: 110,
      x: 90,
      y: 90,
      toJSON: () => {},
    });

    // 4. Mock document.elementsFromPoint
    if (!document.elementsFromPoint) {
      (document as any).elementsFromPoint = vi.fn();
    }
    vi.spyOn(document, "elementsFromPoint").mockReturnValue([element]);
    vi.spyOn(container, "contains").mockReturnValue(true);

    // 5. Test Find
    const candidates = map.find(100, 100);

    // Should be empty because data lookup failed
    expect(candidates).toHaveLength(0);
  });

  it("should handle coordinate offsets correctly (Container vs Plot)", () => {
    const map = new SpatialMap({ useDomHitTesting: true });

    // 1. Mock Container (0,0) 500x500
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    map.setContainer(container);

    // 2. Mock Target Element at (50, 50) - inside the margin
    const element = document.createElement("div");
    element.setAttribute(CHART_DATA_ATTRS.TYPE, "bar");
    element.setAttribute(CHART_DATA_ATTRS.SERIES_ID, "s1");
    element.setAttribute(CHART_DATA_ATTRS.INDEX, "0");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 50,
      top: 50,
      width: 20,
      height: 20,
      right: 70,
      bottom: 70,
      x: 50,
      y: 50,
      toJSON: () => {},
    });

    // 3. Mock elementsFromPoint to only return if called with (50, 50)
    // This simulates that the element is physically at 50,50 on screen
    if (!document.elementsFromPoint) {
      (document as any).elementsFromPoint = vi.fn();
    }
    const elementsFromPointSpy = vi
      .spyOn(document, "elementsFromPoint")
      .mockImplementation((x, y) => {
        if (x >= 50 && x <= 70 && y >= 50 && y <= 70) {
          return [element];
        }
        return [];
      });
    vi.spyOn(container, "contains").mockReturnValue(true);

    // 4. Test Find with Offset
    // Scenario: Margin is 40px.
    // User clicks at 55px (Container Relative).
    // Plot Relative X = 55 - 40 = 15.

    const containerX = 55;
    const containerY = 55;
    const plotX = 15;
    const plotY = 15;

    // Call find with plot coords (for quadtree) and container coords (for DOM)
    const candidates = map.find(plotX, plotY, { x: containerX, y: containerY });

    // Verify elementsFromPoint was called with CONTAINER coordinates (55, 55), NOT plot coords (15, 15)
    expect(elementsFromPointSpy).toHaveBeenCalledWith(55, 55);
  });

  it("should fail to find candidate if series ID mismatches (Simulating ID Bug)", () => {
    const map = new SpatialMap({ useDomHitTesting: true });

    // 1. Mock Container
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    map.setContainer(container);

    // 2. Add point to index with ID "series-A"
    map.updateIndex([
      {
        x: 50,
        y: 50,
        data: { value: 100 },
        seriesId: "series-A",
        dataIndex: 0,
      },
    ]);

    // 3. Mock DOM Element with ID "series-B" (Mismatch!)
    const element = document.createElement("div");
    element.setAttribute(CHART_DATA_ATTRS.TYPE, "bar");
    element.setAttribute(CHART_DATA_ATTRS.SERIES_ID, "series-B");
    element.setAttribute(CHART_DATA_ATTRS.INDEX, "0");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 40,
      top: 40,
      width: 20,
      height: 20,
      right: 60,
      bottom: 60,
      x: 40,
      y: 40,
      toJSON: () => {},
    });

    if (!document.elementsFromPoint) {
      (document as any).elementsFromPoint = vi.fn();
    }
    vi.spyOn(document, "elementsFromPoint").mockReturnValue([element]);
    vi.spyOn(container, "contains").mockReturnValue(true);

    // 4. Test Find
    const candidates = map.find(0, 0, { x: 50, y: 50 });

    // Should NOT find the DOM candidate because of ID mismatch
    const domCandidate = candidates.find((c) => c.type === "bar");
    expect(domCandidate).toBeUndefined();
  });
});
