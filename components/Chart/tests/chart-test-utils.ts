import { act, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

const RAF_FRAME_TIME = 16;

interface PointerOptions {
  bubbles?: boolean;
  cancelable?: boolean;
  pointerType?: "mouse" | "touch";
  isPrimary?: boolean;
}

export const movePointer = (
  element: Element,
  x: number,
  y: number,
  options: PointerOptions = {},
) => {
  const {
    bubbles = true,
    cancelable = true,
    pointerType = "mouse",
    isPrimary = true,
  } = options;

  act(() => {
    fireEvent.pointerMove(element, {
      clientX: x,
      clientY: y,
      bubbles,
      cancelable,
      pointerType,
      isPrimary,
    });

    vi.advanceTimersByTime(RAF_FRAME_TIME * 2);
  });
};

export const downPointer = (
  element: Element,
  x: number,
  y: number,
  options: PointerOptions = {},
) => {
  const {
    bubbles = true,
    cancelable = true,
    pointerType = "mouse",
    isPrimary = true,
  } = options;

  act(() => {
    fireEvent.pointerDown(element, {
      clientX: x,
      clientY: y,
      bubbles,
      cancelable,
      pointerType,
      isPrimary,
    });

    vi.advanceTimersByTime(RAF_FRAME_TIME);
  });
};

export const leavePointer = (
  element: Element,
  options: PointerOptions = {},
) => {
  const {
    bubbles = true,
    cancelable = true,
    pointerType = "mouse",
    isPrimary = true,
  } = options;

  act(() => {
    fireEvent.pointerLeave(element, {
      bubbles,
      cancelable,
      pointerType,
      isPrimary,
    });

    vi.advanceTimersByTime(RAF_FRAME_TIME);
  });
};

// =============================================================================
// GEOMETRY
// =============================================================================

export interface StubbedGeometry {
  /** Point this geometry at a chart's container once it has been rendered. */
  attach: (element: Element) => void;
  /**
   * Move the chart on screen without resizing it — a page scroll, a sticky
   * header collapsing, a sibling chart's tooltip reflowing the page. Fires no
   * ResizeObserver, because the browser doesn't either: a position-only change
   * never triggers one.
   */
  moveBy: (dx: number, dy: number) => void;
  /** Viewport coordinates of a point given relative to the chart's top-left. */
  clientPoint: (x: number, y: number) => { x: number; y: number };
  restore: () => void;
}

interface GeometryEntry {
  element: Element | null;
  left: number;
  top: number;
  width: number;
  height: number;
}

const geometryEntries: GeometryEntry[] = [];
let nativeGetBoundingClientRect:
  | typeof Element.prototype.getBoundingClientRect
  | null = null;

const toRect = (entry: GeometryEntry): DOMRect =>
  ({
    left: entry.left,
    top: entry.top,
    width: entry.width,
    height: entry.height,
    x: entry.left,
    y: entry.top,
    right: entry.left + entry.width,
    bottom: entry.top + entry.height,
    toJSON: () => {},
  }) as DOMRect;

/**
 * happy-dom has no layout engine, so every getBoundingClientRect() returns
 * 0x0 at the viewport origin. That silently hides every coordinate-translation
 * bug: an offset can be dropped entirely and the arithmetic still works out,
 * because every term is zero.
 *
 * This gives a chart a real position on screen so those bugs become visible.
 * Every element in an attached chart's subtree reports the same rect, which
 * models a page scroll faithfully (the whole chart moves by one delta) but does
 * not model the plot area being inset from its container.
 *
 * Call once per chart so multiple charts can be positioned independently.
 */
export const stubChartGeometry = ({
  left = 0,
  top = 0,
  width = 500,
  height = 300,
}: Partial<Omit<GeometryEntry, "element">> = {}): StubbedGeometry => {
  const entry: GeometryEntry = { element: null, left, top, width, height };
  geometryEntries.push(entry);

  if (!nativeGetBoundingClientRect) {
    nativeGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const match = geometryEntries.find(
        (e) => e.element && (e.element === this || e.element.contains(this)),
      );
      return match
        ? toRect(match)
        : (
            nativeGetBoundingClientRect as typeof Element.prototype.getBoundingClientRect
          ).call(this);
    };
  }

  return {
    attach: (element) => {
      entry.element = element;
    },
    moveBy: (dx, dy) => {
      entry.left += dx;
      entry.top += dy;
    },
    clientPoint: (x, y) => ({ x: entry.left + x, y: entry.top + y }),
    restore: () => {
      const i = geometryEntries.indexOf(entry);
      if (i !== -1) {
        geometryEntries.splice(i, 1);
      }
      if (geometryEntries.length === 0 && nativeGetBoundingClientRect) {
        Element.prototype.getBoundingClientRect = nativeGetBoundingClientRect;
        nativeGetBoundingClientRect = null;
      }
    },
  };
};
