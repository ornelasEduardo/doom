import { afterEach, describe, expect, it, vi } from "vitest";

import { CoordinateSystem } from "./CoordinateSystem";

const bounds = { x: 40, y: 20, width: 500, height: 200 };

function fixture(scaleX = 0.75, scaleY = scaleX) {
  const container = document.createElement("div");
  const plot = document.createElement("div");
  container.style.cssText =
    "border-left: 4px solid; border-top: 6px solid; padding: 12px";
  container.append(plot);
  document.body.append(container);
  let left = 100;
  let top = 200;
  let width = 800;
  let plotTop = 66;
  Object.defineProperties(container, {
    offsetWidth: { get: () => width },
    offsetHeight: { get: () => 400 },
  });
  vi.spyOn(container, "getBoundingClientRect").mockImplementation(
    () => new DOMRect(left, top, width * scaleX, 400 * scaleY),
  );
  vi.spyOn(plot, "getBoundingClientRect").mockImplementation(
    () =>
      new DOMRect(
        left + 16 * scaleX,
        top + plotTop * scaleY,
        (width - 32) * scaleX,
        300 * scaleY,
      ),
  );
  const coords = new CoordinateSystem();
  coords.setContainer(container, plot, bounds);
  return {
    coords,
    move: () => {
      left = 20;
      top = -100;
    },
    resize: () => {
      width = 1000;
      scaleX = 1.25;
      scaleY = 0.5;
      plotTop = 86;
    },
  };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("viewport to chart coordinates", () => {
  it.each([
    [0.75, 0.75],
    [1.25, 0.5],
    [1, 1],
  ])(
    "maps scale(%s, %s), borders and header offsets to local pixels",
    (sx, sy) => {
      const { coords } = fixture(sx, sy);
      const point = coords.resolvePointerCoordinates(
        100 + 256 * sx,
        200 + 146 * sy,
      )!;
      expect(point).toEqual({ x: 252, y: 140 });
      const offset = coords.getPlotOffset();
      expect(offset).toEqual({ x: 12, y: 60 });
      expect(
        coords.resolveChartCoordinates(point.x - offset.x, point.y - offset.y),
      ).toEqual({ chartX: 200, chartY: 60, isWithinPlot: true });
    },
  );

  it("refreshes viewport geometry after scrolling, resizing and header layout changes", () => {
    const { coords, move, resize } = fixture();
    move();
    expect(coords.resolvePointerCoordinates(212, 9.5)).toEqual({
      x: 252,
      y: 140,
    });
    resize();
    expect(coords.resolvePointerCoordinates(340, -17)).toEqual({
      x: 252,
      y: 160,
    });
    expect(coords.getPlotOffset()).toEqual({ x: 12, y: 80 });
  });

  it("retains explicit-rectangle input without a mounted element", () => {
    const coords = new CoordinateSystem();
    coords.updateBounds(new DOMRect(10, 20, 800, 400));
    expect(coords.resolvePointerCoordinates(50, 80)).toEqual({ x: 40, y: 60 });
  });
});

it.each([
  ["border-box", 1],
  ["content-box", 1],
  ["border-box", 0.75],
  ["content-box", 0.75],
] as const)(
  "preserves exact fractional plot boundaries with %s at scale %s",
  (boxSizing, scale) => {
    const container = document.createElement("div");
    container.style.cssText = `box-sizing: ${boxSizing}; width: ${boxSizing === "border-box" ? 600.25 : 568.75}px; height: ${boxSizing === "border-box" ? 300.25 : 276.75}px; padding: 8.25px 12.25px; border: 3px solid; border-right-width: 4px; border-bottom-width: 4px`;
    document.body.append(container);
    Object.defineProperties(container, {
      offsetWidth: { value: 600 },
      offsetHeight: { value: 300 },
    });
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
      new DOMRect(100, 200, 600.25 * scale, 300.25 * scale),
    );
    const coords = new CoordinateSystem();
    coords.setContainer(container, null, {
      x: 40,
      y: 20,
      width: 500,
      height: 200,
    });
    const resolve = (x: number, y: number) => {
      const point = coords.resolvePointerCoordinates(
        100 + x * scale,
        200 + y * scale,
      )!;
      const offset = coords.getPlotOffset();
      return coords.resolveChartCoordinates(
        point.x - offset.x,
        point.y - offset.y,
      );
    };
    expect(resolve(55.25, 31.25)).toEqual({
      chartX: 0,
      chartY: 0,
      isWithinPlot: true,
    });
    expect(resolve(555.25, 231.25)).toEqual({
      chartX: 500,
      chartY: 200,
      isWithinPlot: true,
    });
    expect(resolve(55.125, 31.25)).toEqual({
      chartX: -0.125,
      chartY: 0,
      isWithinPlot: false,
    });
  },
);
