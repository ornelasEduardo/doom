import { axisBottom, axisLeft } from "d3-axis";
import { scaleLog } from "d3-scale";
import { zoom, zoomIdentity, ZoomTransform } from "d3-zoom";

import type { RenderFrame } from "../../components/Chart/Chart";
import type { CompactWorld } from "./compact-world";
import type { Resource } from "./renderer";
import { createMarksSurface } from "./surfaces";

export interface Service {
  label: string;
  requests: number;
  latency: number;
}
export interface ViewControls {
  redraw(): void;
  scale(factor: number): void;
  reset(): void;
}

interface ScatterOptions {
  invalidate(): void;
  connect(controls: ViewControls | null): void;
  report(scale: number): void;
  getWorld(): CompactWorld;
  reportLoading?(message: string | null): void;
  reportError?(message: string | null): void;
  getDetail?(): "exact" | "density";
}

export function scatterResource(
  frame: RenderFrame<Service>,
  {
    invalidate,
    connect,
    report,
    getWorld,
    reportLoading,
    reportError,
    getDetail,
  }: ScatterOptions,
): Resource<RenderFrame<Service>> {
  const group = frame.container;
  const surface = group.append("rect").attr("fill", "transparent");
  const marks = createMarksSurface(frame, getWorld, getDetail, invalidate);
  const bottom = group.append("g").attr("data-proof-axis", "x");
  const left = group.append("g").attr("data-proof-axis", "y");
  let transform: ZoomTransform = zoomIdentity;
  let size = frame.size;
  let latestFrame = frame;
  let linkedWorld: CompactWorld | undefined;
  let drawnWorld: CompactWorld | undefined;
  let publishedWorld: CompactWorld | undefined;
  let source:
    | {
        length: number;
        get: (index: number) => ReturnType<CompactWorld["point"]>;
      }
    | undefined;
  let unsubscribe: (() => void) | undefined;
  const connectWorld = () => {
    const world = getWorld();
    if (world === linkedWorld) {
      return;
    }
    unsubscribe?.();
    linkedWorld = world;
    unsubscribe = world.subscribe((indices) => {
      if (indices.length && drawnWorld === world) {
        marks.patch(indices);
      }
      if (!indices.length || publishedWorld !== world) {
        invalidate();
        return;
      }
      const start = performance.now();
      latestFrame.geometry.patchProjected(indices.map(world.point));
      group.attr("data-proof-patch-ms", performance.now() - start);
      invalidate();
    });
  };
  connectWorld();
  const gesture = zoom<SVGGElement, Service[]>()
    .extent((): [[number, number], [number, number]] => [
      [0, 0],
      [size.width, size.height],
    ])
    .scaleExtent([1, 8])
    // Chart retains pointer and keyboard ownership; D3 handles wheel zoom.
    .filter((event) => event.type === "wheel")
    .on("zoom.proof", (event) => {
      transform = event.transform;
      invalidate();
    });
  // RenderFrame types its selection datum as T, although CustomSeries binds T[].
  const selection = group.datum(frame.data);
  selection.call(gesture);
  connect({
    redraw: invalidate,
    scale: (factor) => selection.call(gesture.scaleBy, factor),
    reset: () => selection.call(gesture.transform, zoomIdentity),
  });
  return {
    draw(next) {
      if (!marks.available && !marks.recover()) {
        publishedWorld = undefined;
        drawnWorld = undefined;
        source = undefined;
        next.geometry.update([]);
        group
          .attr("data-proof-ready-at", null)
          .attr("data-proof-draw-at", null)
          .attr("data-proof-loading", "true");
        reportLoading?.(null);
        reportError?.("GPU rendering unavailable.");
        return;
      }
      reportError?.(null);
      latestFrame = next;
      connectWorld();
      size = next.size;
      surface.attr("width", size.width).attr("height", size.height);
      const x = transform.rescaleX(
        scaleLog().domain([1, 1000]).range([0, size.width]),
      );
      const y = transform.rescaleY(
        scaleLog().domain([1, 1000]).range([size.height, 0]),
      );
      const world = getWorld();
      const changedData = publishedWorld !== world;
      const points = {
        length: world.length,
        firstY: world.length ? world.point(0).y : 0,
      };
      const drawStart = performance.now();
      marks.draw(points, next, transform);
      const drawSubmitMs = performance.now() - drawStart;
      bottom
        .attr("transform", `translate(0,${size.height})`)
        .call(axisBottom(x).ticks(3, "~g"));
      left.call(axisLeft(y).ticks(3, "~g"));
      const geometryStart = performance.now();
      const viewport = () => ({
        scaleX: size.width * transform.k,
        scaleY: size.height * transform.k,
        translateX: transform.x,
        translateY: transform.y,
        clip: { x: 0, y: 0, width: size.width, height: size.height },
      });
      if (changedData && world.ready) {
        source = { length: world.length, get: world.point };
        next.geometry.updatePrepared(source, world.buffers().grid, viewport());
        publishedWorld = world;
        group
          .attr("data-proof-ready-at", performance.now())
          .attr("data-proof-loading", "false");
        reportLoading?.(null);
      } else if (!world.ready) {
        next.geometry.update([]);
        source = undefined;
        publishedWorld = undefined;
        group
          .attr("data-proof-ready-at", null)
          .attr("data-proof-loading", "true");
        reportLoading?.("Points drawn. Preparing interactions…");
      } else if (source) {
        next.geometry.updateProjected(source, viewport());
      }
      group
        .attr("data-proof-preparation-ms", world.timings().preparationMs ?? 0)
        .attr("data-proof-index-ms", world.timings().indexMs ?? null)
        .attr("data-proof-draw-submit-ms", drawSubmitMs)
        .attr("data-proof-geometry-ms", performance.now() - geometryStart);
      if (drawnWorld !== world) {
        drawnWorld = world;
        group.attr("data-proof-draw-at", performance.now());
      }
      report(transform.k);
    },
    dispose() {
      unsubscribe?.();
      gesture.on("zoom.proof", null);
      selection.on(".zoom", null);
      surface.remove();
      marks.dispose();
      bottom.remove();
      left.remove();
      connect(null);
    },
  };
}
