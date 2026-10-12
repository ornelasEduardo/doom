import { afterEach, expect, it, vi } from "vitest";

import { Engine } from "../../../components/Chart/engine";
import { createCustomGeometry } from "../../../components/Chart/utils/customGeometry";

afterEach(() => {
  document
    .querySelectorAll("[data-transform-fixture]")
    .forEach((node) => node.remove());
  vi.restoreAllMocks();
});
it("reads each coordinate transform once per geometry update and refreshes changed transforms", () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-transform-fixture", "");
  svg.setAttribute("width", "600");
  svg.setAttribute("height", "400");
  const group = document.createElementNS(svg.namespaceURI, "g") as SVGGElement;
  const nested = document.createElementNS(svg.namespaceURI, "g") as SVGGElement;
  group.setAttribute("transform", "translate(30 40)");
  nested.setAttribute("transform", "rotate(20) scale(2 3)");
  svg.append(group);
  group.append(nested);
  document.body.append(svg);
  const engine = new Engine<number>();
  const geometry = createCustomGeometry(engine, group, "s");
  const points = Array.from({ length: 1000 }, (_, dataIndex) => ({
    x: dataIndex % 100,
    y: dataIndex % 30,
    data: dataIndex,
    dataIndex,
    element: dataIndex % 2 ? nested : group,
  }));
  const groupReads = vi.spyOn(group, "getScreenCTM"),
    nestedReads = vi.spyOn(nested, "getScreenCTM");
  geometry.update(points);
  expect(groupReads).toHaveBeenCalledTimes(1);
  expect(nestedReads).toHaveBeenCalledTimes(1);
  for (const index of [0, 1, 500, 999]) {
    const point = points[index];
    const expected = new DOMPoint(point.x, point.y)
      .matrixTransform(point.element.getScreenCTM()!)
      .matrixTransform(svg.getScreenCTM()!.inverse());
    const target = engine.resolveTarget({ seriesId: "s", dataIndex: index })!;
    expect(target.coordinate.x).toBeCloseTo(expected.x, 8);
    expect(target.coordinate.y).toBeCloseTo(expected.y, 8);
  }
  nested.setAttribute("transform", "translate(90 80) scale(0.5)");
  groupReads.mockClear();
  nestedReads.mockClear();
  geometry.update(points);
  expect(groupReads).toHaveBeenCalledTimes(1);
  expect(nestedReads).toHaveBeenCalledTimes(1);
  expect(
    engine.resolveTarget({ seriesId: "s", dataIndex: 1 })?.coordinate,
  ).toEqual({ x: 120.5, y: 120.5 });
  geometry.dispose();
  engine.dispose();
});

it("reprojects retained geometry through plot margins and clipping without reading all points again", () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-transform-fixture", "");
  const group = document.createElementNS(svg.namespaceURI, "g") as SVGGElement;
  group.setAttribute("transform", "translate(30 40)");
  svg.append(group);
  document.body.append(svg);
  const engine = new Engine<number>({ useDomHitTesting: false });
  const geometry = createCustomGeometry(engine, group, "retained");
  const point = {
    get x() {
      return 0.25;
    },
    y: 0.5,
    data: 1,
    dataIndex: 0,
  };
  const points = [point];
  const viewport = {
    scaleX: 100,
    scaleY: 100,
    translateX: 0,
    translateY: 0,
    clip: { x: 0, y: 0, width: 100, height: 100 },
  };
  geometry.updateProjected(points, viewport);
  const reads = vi.spyOn(point, "x", "get");
  geometry.updateProjected(points, {
    ...viewport,
    scaleX: 200,
    translateY: 10,
  });
  expect(reads).not.toHaveBeenCalled();
  expect(
    engine.resolveTarget({ seriesId: "retained", dataIndex: 0 })?.coordinate,
  ).toEqual({ x: 80, y: 100 });
  geometry.updateProjected(points, { ...viewport, translateY: 200 });
  expect(
    engine.resolveTarget({ seriesId: "retained", dataIndex: 0 }),
  ).toBeNull();
  geometry.updateProjected(points, viewport);
  expect(
    engine.resolveTarget({ seriesId: "retained", dataIndex: 0 })?.coordinate,
  ).toEqual({ x: 55, y: 90 });
  geometry.dispose();
  engine.dispose();
});
