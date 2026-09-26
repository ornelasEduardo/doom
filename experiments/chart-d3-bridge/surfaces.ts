import { zoomIdentity, type ZoomTransform } from "d3-zoom";

import type { RenderFrame } from "../../components/Chart/Chart";
import type { CompactWorld } from "./compact-world";
import { createGpuPoints, type DensityFrame } from "./gpu";
import styles from "./Proof.module.scss";
import type { Service } from "./scatter";

export function createMarksSurface(
  frame: RenderFrame<Service>,
  getWorld: () => CompactWorld,
  getDetail: () => "exact" | "density" = () => "exact",
  onStatusChange?: () => void,
) {
  const group = frame.container;
  const marks = group.append("g").attr("data-proof-surface", "webgl");
  const svg = group.node()!.ownerSVGElement!;
  const canvas = document.createElement("canvas");
  canvas.classList.add(styles.canvas);
  canvas.setAttribute("aria-hidden", "true");
  svg.parentElement!.insertBefore(canvas, svg);
  let gpu: ReturnType<typeof createGpuPoints> | undefined;
  let unavailable: HTMLParagraphElement | undefined;
  try {
    gpu = createGpuPoints(canvas, { onStatusChange });
  } catch (error) {
    unavailable = document.createElement("p");
    unavailable.setAttribute("role", "status");
    unavailable.textContent = String(error);
    svg.parentElement!.append(unavailable);
    canvas.dataset.gpuUnavailable = "true";
  }
  const colorContext = document.createElement("canvas").getContext("2d")!;
  let densityKey = "",
    densityWorld: CompactWorld | undefined,
    densityFrame: DensityFrame | undefined;
  return {
    recover() {
      return gpu?.recover() ?? false;
    },
    get available() {
      return gpu?.available ?? false;
    },
    patch(indices: number[]) {
      gpu?.patch(indices);
    },
    draw(
      points: { length: number; firstY: number },
      next: RenderFrame<Service>,
      transform: ZoomTransform = zoomIdentity,
    ) {
      const radius =
        getWorld().length <= 100 ? 7 : getWorld().length <= 1000 ? 3 : 1.5;
      const width = Number(svg.getAttribute("width"));
      const height = Number(svg.getAttribute("height"));
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * ratio)) {
        canvas.width = Math.round(width * ratio);
      }
      if (canvas.height !== Math.round(height * ratio)) {
        canvas.height = Math.round(height * ratio);
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const matrix = svg
        .getScreenCTM()!
        .inverse()
        .multiply(group.node()!.getScreenCTM()!);
      marks.attr("fill", next.theme.colors[0]);
      colorContext.clearRect(0, 0, 1, 1);
      colorContext.fillStyle = getComputedStyle(marks.node()!).fill;
      colorContext.fillRect(0, 0, 1, 1);
      const world = getWorld();
      let density: DensityFrame | undefined;
      if (getDetail() === "density" && world.ready) {
        const start = performance.now();
        const pyramid = world.density();
        const key = [
          pyramid.revision,
          next.size.width,
          next.size.height,
          transform.k,
          transform.x,
          transform.y,
        ].join(":");
        if (densityWorld !== world || densityKey !== key) {
          densityFrame = pyramid.view(
            {
              x: -transform.x / (next.size.width * transform.k),
              y: -transform.y / (next.size.height * transform.k),
              width: 1 / transform.k,
              height: 1 / transform.k,
            },
            Math.max(1, Math.ceil(next.size.width / 8)),
          );
          densityWorld = world;
          densityKey = key;
        }
        density = densityFrame;
        canvas.dataset.densityMs = String(performance.now() - start);
      }
      gpu?.draw(world, {
        axes: world.gpuAxes(),
        density,
        width,
        height,
        plotWidth: next.size.width,
        plotHeight: next.size.height,
        k: transform.k,
        x: transform.x,
        y: transform.y,
        matrix,
        ratio,
        radius,
        color: Array.from(
          colorContext.getImageData(0, 0, 1, 1).data,
          (value) => value / 255,
        ),
      });
      marks
        .attr("data-proof-count", points.length)
        .attr(
          "data-proof-first-y",
          points.firstY * next.size.height * transform.k + transform.y,
        );
    },
    dispose() {
      gpu?.dispose();
      unavailable?.remove();
      marks.remove();
      canvas.remove();
    },
  };
}
