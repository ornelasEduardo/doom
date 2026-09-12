import type { Engine } from "../engine/Engine";
import type { IndexedPoint } from "../engine/SpatialMap";

export type CustomGeometryPoint<T = unknown> = Omit<
  IndexedPoint<T>,
  "seriesId"
> & {
  /** Optional nested SVG element whose local coordinates contain this point. */
  element?: SVGGraphicsElement;
};

export interface CustomGeometry<T = unknown> {
  /** Replaces this owner's points. Coordinates are local to the render group or point.element. */
  update(points: CustomGeometryPoint<T>[]): void;
  dispose(): void;
}

export function createCustomGeometry<T>(
  engine: Pick<Engine<T>, "registerGeometry">,
  group: SVGGElement,
  seriesId: string,
): CustomGeometry<T> {
  const registration = engine.registerGeometry();
  return {
    update(points) {
      const svg = group.ownerSVGElement;
      const svgMatrix = svg?.getScreenCTM?.();
      if (!svg || !svgMatrix) {
        registration.update([]);
        return;
      }
      const inverse = svgMatrix.inverse();
      registration.update(
        points.flatMap(({ element = group, ...point }) => {
          if (element !== group && !group.contains(element)) {
            return [];
          }
          const matrix = element.getScreenCTM?.();
          if (!matrix) {
            return [];
          }
          // Convert through the viewport so nested SVG transforms, CSS scale and
          // chart margins all produce the same SVG coordinates as built-in marks.
          const position = new DOMPoint(point.x, point.y)
            .matrixTransform(matrix)
            .matrixTransform(inverse);
          if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
            return [];
          }
          return [{ ...point, x: position.x, y: position.y, seriesId }];
        }),
      );
    },
    dispose: () => registration.dispose(),
  };
}
