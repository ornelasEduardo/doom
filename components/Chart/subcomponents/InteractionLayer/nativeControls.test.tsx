import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { ChartContext } from "../../context";
import { Engine, InputSignal } from "../../engine";
import { ContextValue } from "../../types/context";
import { InteractionLayer } from "./InteractionLayer";

afterEach(cleanup);
it("provides opt-in native controls only during dispatch and preserves pen metadata", () => {
  let saved: InputSignal["native"];
  let observed: InputSignal | undefined;
  const engine = new Engine({
    onEvent: ({ signal }) => {
      saved = signal.native;
      observed = signal;
      saved?.preventDefault();
    },
  });
  const { container } = render(
    <ChartContext.Provider value={{ engine } as ContextValue}>
      <div data-chart-container>
        <InteractionLayer />
      </div>
    </ChartContext.Provider>,
  );
  const root = container.firstElementChild!;

  engine.updateBounds({ left: 0, top: 0, width: 200, height: 200 } as DOMRect);
  const event = new PointerEvent("pointerdown", {
    pointerId: 7,
    pointerType: "pen",
    button: 0,
    buttons: 1,
    pressure: 0.6,
    cancelable: true,
  });
  fireEvent(root, event);
  expect(event.defaultPrevented).toBe(true);
  expect(observed).toMatchObject({
    source: "pen",
    pointerType: "pen",
    buttons: 1,
    pressure: 0.6,
  });
  const later = new KeyboardEvent("keydown", { key: "z", cancelable: true });
  saved?.preventDefault();
  expect(later.defaultPrevented).toBe(false);
  expect(observed?.native).toBeUndefined();
});

it("saved capabilities expire when the native listener returns", () => {
  let saved: InputSignal["native"];
  const engine = new Engine({
    onEvent: ({ signal }) => {
      saved = signal.native;
    },
  });
  const { container } = render(
    <ChartContext.Provider value={{ engine } as ContextValue}>
      <div data-chart-container>
        <InteractionLayer />
      </div>
    </ChartContext.Provider>,
  );
  const key = new KeyboardEvent("keydown", { key: "z", cancelable: true });
  fireEvent(container.firstElementChild!, key);
  expect(saved).toBeDefined();
  saved!.preventDefault();
  expect(key.defaultPrevented).toBe(false);
});
