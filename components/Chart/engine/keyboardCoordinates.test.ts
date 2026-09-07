import { expect, it, vi } from "vitest";

import { CoordinateSystem } from "./CoordinateSystem";

it("maps plot coordinates into the container after a position-only layout change", () => {
  const container = document.createElement("div");
  const plot = document.createElement("div");
  document.body.append(container);
  container.style.border = "2px solid black";
  vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
    new DOMRect(100, 200, 600, 400),
  );
  const rect = vi
    .spyOn(plot, "getBoundingClientRect")
    .mockReturnValue(new DOMRect(120, 280, 560, 300));
  const coords = new CoordinateSystem();
  coords.setContainer(container, plot, {
    x: 50,
    y: 20,
    width: 490,
    height: 240,
  });
  expect(coords.resolveContainerCoordinates(90, 60)).toEqual({
    x: 158,
    y: 158,
  });
  rect.mockReturnValue(new DOMRect(135, 310, 560, 300));
  expect(coords.resolveContainerCoordinates(90, 60)).toEqual({
    x: 173,
    y: 188,
  });
  container.remove();
});
