import { expect, it, vi } from "vitest";

import {
  readGpuEmphasis,
  subscribeGpuEffects,
  updateGpuDimming,
} from "./gpu-effects";

function scene() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const root = document.createElementNS(svg.namespaceURI, "g") as SVGGElement;
  const cloud = document.createElementNS(svg.namespaceURI, "g") as SVGGElement;
  const proxy = document.createElementNS(svg.namespaceURI, "circle");
  proxy.setAttribute("data-chart-gpu-selector-proxy", "");
  root.classList.add("scatter");
  cloud.append(proxy);
  root.append(cloud);
  svg.append(root);
  const indices = new Int32Array([0, 2, 5]);
  return { svg, root, cloud, indices };
}
it("composes independent dim owners per point and restores each in detach order", () => {
  const { root, cloud, indices } = scene();
  updateGpuDimming(root, 1, {
    selector: ".scatter circle",
    targets: [
      { seriesId: "a", dataIndex: 0, data: 0, coordinate: { x: 0, y: 0 } },
    ],
    opacity: 0.3,
  });
  updateGpuDimming(root, 2, {
    selector: ".scatter circle",
    targets: [
      { seriesId: "a", dataIndex: 2, data: 2, coordinate: { x: 0, y: 0 } },
    ],
    opacity: 0.6,
  });
  expect(readGpuEmphasis(cloud, "a", indices)).toEqual({
    opacity: 0.6,
    indices: [],
    overrides: [
      { index: 0, opacity: 0.6 },
      { index: 1, opacity: 0.3 },
    ],
  });
  updateGpuDimming(root, 2);
  expect(readGpuEmphasis(cloud, "a", indices)).toEqual({
    opacity: 0.3,
    indices: [],
    overrides: [{ index: 0, opacity: 1 }],
  });
  updateGpuDimming(root, 1);
  expect(readGpuEmphasis(cloud, "a", indices)).toBeUndefined();
});
it("only hydrates candidate slots for identity-free targets and keeps charts isolated", () => {
  const a = scene(),
    b = scene(),
    datum = { value: 2 },
    dataAt = vi.fn(() => datum),
    changed = vi.fn();
  const release = subscribeGpuEffects(a.svg, changed);
  const state = {
    selector: "circle",
    targets: [{ dataIndex: 2, data: datum, coordinate: { x: 0, y: 0 } }],
    opacity: 0.4,
  };
  updateGpuDimming(a.root, 1, state);
  updateGpuDimming(a.root, 1, state);
  expect(changed).toHaveBeenCalledTimes(1);
  expect(readGpuEmphasis(a.cloud, "a", a.indices, dataAt)?.overrides).toEqual([
    { index: 1, opacity: 1 },
  ]);
  expect(dataAt.mock.calls).toEqual([[1]]);
  expect(readGpuEmphasis(b.cloud, "a", b.indices, dataAt)).toBeUndefined();
  release();
  updateGpuDimming(a.root, 1);
  expect(changed).toHaveBeenCalledTimes(1);
});
