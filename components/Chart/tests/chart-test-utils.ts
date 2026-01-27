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
