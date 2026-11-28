import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { createScenePresentation } from "./scene-presentation";

const decodes: (() => void)[] = [];
beforeEach(() => {
  decodes.length = 0;
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      decode() {
        return new Promise<void>((resolve) => decodes.push(resolve));
      }
    },
  );
  vi.stubGlobal(
    "DOMPoint",
    class {
      constructor(
        public x: number,
        public y: number,
      ) {}
      matrixTransform() {
        return { x: this.x, y: this.y };
      }
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const identity = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
  inverse() {
    return this;
  },
} as DOMMatrix;
const flat = { x: 10, y: 40, width: 120, height: 0 };
function fixture() {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  const parent = document.createElementNS(namespace, "g");
  const layer = document.createElementNS(namespace, "foreignObject");
  const canvas = document.createElement("canvas");
  layer.append(canvas);
  parent.append(layer);
  svg.append(parent);
  const snapshot = vi
    .spyOn(canvas, "toDataURL")
    .mockReturnValue("data:image/png;base64,AA==");
  const presentation = createScenePresentation(svg, {
    canvas,
    parent,
    layer,
    marks: () => new Map(),
  });
  return { svg, layer, snapshot, presentation };
}

it("does not export or wait for the GPU when native foreignObject presentation is valid", () => {
  const { presentation, snapshot, svg } = fixture();
  const wait = vi.fn(async () => {});
  presentation.update({ ...flat, height: 20 }, identity, 160, 100);
  expect(presentation.present(wait)).toBeUndefined();
  expect(snapshot).not.toHaveBeenCalled();
  expect(wait).not.toHaveBeenCalled();
  expect(svg.querySelector("feImage")).toBeNull();
  presentation.dispose();
});

it("keeps the newest decoded GPU image when older frame decoding finishes later", async () => {
  const { presentation, snapshot, svg } = fixture();
  presentation.update(flat, identity, 160, 100);
  const first = presentation.present(async () => {});
  snapshot.mockReturnValue("data:image/png;base64,AQ==");
  const second = presentation.present(async () => {});
  decodes[1]();
  await second;
  const image = svg.querySelector("feImage")!;
  const latest = image.getAttribute("href");
  expect(latest).toContain("AQ%3D%3D");
  expect(image.getAttributeNS("http://www.w3.org/1999/xlink", "href")).toBe(
    latest,
  );
  decodes[0]();
  await first;
  expect(image.getAttribute("href")).toBe(latest);
  presentation.dispose();
});

it.each(["resize", "dispose"] as const)(
  "cannot republish a decoded image after %s removes the degenerate presentation",
  async (change) => {
    const { presentation, svg, layer } = fixture();
    presentation.update(flat, identity, 160, 100);
    const pending = presentation.present(async () => {});
    const image = svg.querySelector("feImage")!;
    if (change === "resize") {
      presentation.update({ ...flat, height: 20 }, identity, 160, 100);
    } else {
      presentation.dispose();
    }
    decodes[0]();
    await pending;
    expect(image.getAttribute("href")).toBeNull();
    expect(svg.querySelector("[data-chart-gpu-presentation]")).toBeNull();
    expect(layer.style.display).toBe("");
    presentation.dispose();
  },
);

it("hides a collapsed transform without requesting an invalid inverse and restores later", () => {
  const { presentation, layer, snapshot } = fixture();
  const inverse = vi.fn(() => {
    throw new Error("singular transform");
  });
  const collapsed = { ...identity, a: 0, inverse } as DOMMatrix;
  presentation.update({ ...flat, height: 20 }, collapsed, 160, 100);
  expect(layer.style.display).toBe("none");
  expect(inverse).not.toHaveBeenCalled();
  expect(presentation.present(async () => {})).toBeUndefined();
  expect(snapshot).not.toHaveBeenCalled();
  presentation.update({ ...flat, height: 20 }, identity, 160, 100);
  expect(layer.style.display).toBe("");
  presentation.dispose();
});
