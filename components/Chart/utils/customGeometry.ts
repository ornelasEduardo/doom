import type { Engine } from "../engine/Engine";
import type { GridBuffers, PointSource } from "../engine/PreparedGrid";
import type { GeometryViewport, IndexedPoint } from "../engine/SpatialMap";

export type CustomGeometryPoint<T = unknown> = Omit<
  IndexedPoint<T>,
  "seriesId"
> & {
  /** Optional nested SVG element whose local coordinates contain this point. */
  element?: SVGGraphicsElement;
};

export interface CustomGeometry<T = unknown> {
  updatePrepared(
    points:
      | Omit<CustomGeometryPoint<T>, "element">[]
      | Omit<PointSource<T>, "seriesId">,
    grid: GridBuffers,
    viewport: GeometryViewport,
  ): void;
  /** Patch existing identities in the retained index coordinate space. */
  patchProjected(points: Omit<CustomGeometryPoint<T>, "element">[]): void;
  /** Replaces this owner's points. Coordinates are local to the render group or point.element. */
  update(points: CustomGeometryPoint<T>[]): void;
  /** Retains points in index coordinates; only the viewport changes between draws. */
  updateProjected(
    points:
      | Omit<CustomGeometryPoint<T>, "element">[]
      | Omit<PointSource<T>, "seriesId">,
    viewport: GeometryViewport,
  ): void;
  dispose(): void;
}

export function createCustomGeometry<T>(
  engine: Pick<Engine<T>, "registerGeometry">,
  group: SVGGElement,
  seriesId: string,
): CustomGeometry<T> {
  const registration = engine.registerGeometry();
  let projectedSource:
    | Omit<CustomGeometryPoint<T>, "element">[]
    | Omit<PointSource<T>, "seriesId">
    | undefined;
  const publishProjected = (
    points:
      | Omit<CustomGeometryPoint<T>, "element">[]
      | Omit<PointSource<T>, "seriesId">,
    viewport: GeometryViewport,
    grid?: GridBuffers,
  ) => {
    const svg = group.ownerSVGElement;
    const svgMatrix = svg?.getScreenCTM();
    const groupMatrix = group.getScreenCTM();
    if (!svgMatrix || !groupMatrix) {
      registration.update([]);
      projectedSource = undefined;
      return;
    }
    const matrix = svgMatrix.inverse().multiply(groupMatrix);
    if (
      matrix.is2D === false ||
      matrix.b !== 0 ||
      matrix.c !== 0 ||
      matrix.a <= 0 ||
      matrix.d <= 0
    ) {
      throw new RangeError(
        "Projected geometry requires a positive axis-aligned plot transform",
      );
    }
    const projectedViewport = {
      scaleX: matrix.a * viewport.scaleX,
      scaleY: matrix.d * viewport.scaleY,
      translateX: matrix.a * viewport.translateX + matrix.e,
      translateY: matrix.d * viewport.translateY + matrix.f,
      clip: viewport.clip
        ? {
            x: matrix.a * viewport.clip.x + matrix.e,
            y: matrix.d * viewport.clip.y + matrix.f,
            width: matrix.a * viewport.clip.width,
            height: matrix.d * viewport.clip.height,
          }
        : undefined,
    };
    if (grid) {
      registration.updatePrepared(
        Array.isArray(points)
          ? points.map((point) => ({ ...point, seriesId }))
          : {
              length: points.length,
              seriesId,
              get: (index: number) => ({ ...points.get(index), seriesId }),
            },
        grid,
        projectedViewport,
      );
      projectedSource = points;
    } else if (points !== projectedSource && Array.isArray(points)) {
      registration.update(
        points.map((point) => ({ ...point, seriesId })),
        projectedViewport,
      );
      projectedSource = points;
    } else {
      registration.setViewport(projectedViewport);
    }
  };
  return {
    patchProjected(points) {
      if (!projectedSource) {
        throw new Error("Publish projected geometry before patching it");
      }
      registration.patch(points.map((point) => ({ ...point, seriesId })));
    },
    update(points) {
      projectedSource = undefined;
      const svg = group.ownerSVGElement;
      const svgMatrix = svg?.getScreenCTM?.();
      if (!svg || !svgMatrix) {
        registration.update([]);
        return;
      }
      const inverse = svgMatrix.inverse();
      const transforms = new Map<SVGGraphicsElement, DOMMatrix | null>();
      const converted: IndexedPoint<T>[] = [];
      for (const { element = group, ...point } of points) {
        if (!transforms.has(element)) {
          const matrix =
            element === group || group.contains(element)
              ? element.getScreenCTM?.()
              : null;
          transforms.set(element, matrix ? inverse.multiply(matrix) : null);
        }
        const matrix = transforms.get(element);
        if (!matrix) {
          continue;
        }
        const position = matrix.is2D
          ? {
              x: matrix.a * point.x + matrix.c * point.y + matrix.e,
              y: matrix.b * point.x + matrix.d * point.y + matrix.f,
            }
          : new DOMPoint(point.x, point.y).matrixTransform(matrix);
        if (Number.isFinite(position.x) && Number.isFinite(position.y)) {
          converted.push({ ...point, x: position.x, y: position.y, seriesId });
        }
      }
      registration.update(converted, null);
    },
    updateProjected: (points, viewport) => publishProjected(points, viewport),
    updatePrepared: (points, grid, viewport) =>
      publishProjected(points, viewport, grid),
    dispose: () => {
      projectedSource = undefined;
      registration.dispose();
    },
  };
}
