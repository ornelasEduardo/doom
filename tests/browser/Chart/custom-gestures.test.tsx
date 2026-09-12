import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import {
  type Behavior,
  Chart,
  createInteractionChannel,
  type Sensor,
} from "../../../components/Chart/Chart";
import {
  InputAction,
  InputSignal,
  InputSource,
} from "../../../components/Chart/engine";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);
type Row = { x: number; y: number };
const pinchChannel = createInteractionChannel<{ distance: number }>("pinch");
const shortcutChannel = createInteractionChannel<{ active: boolean }>(
  "shortcut",
);
const rows = [
  { x: 0, y: 10 },
  { x: 1, y: 20 },
];
const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

it("synthetic concurrent pointers drive a custom pinch sensor and subscribed behavior", async () => {
  const points = new Map<number, number>();
  const observed: string[] = [];
  const sensor: Sensor<Row> = ({ signal }, context) => {
    if (signal.action === InputAction.START && points.size < 2) {
      points.set(signal.id, signal.x);
    } else if (signal.action === InputAction.MOVE && points.has(signal.id)) {
      points.set(signal.id, signal.x);
    } else if (
      (signal.action === InputAction.END ||
        signal.action === InputAction.CANCEL) &&
      points.has(signal.id)
    ) {
      points.delete(signal.id);
    } else {
      return;
    }
    if (points.size === 2) {
      const [a, b] = [...points.values()];
      context.upsertInteraction(pinchChannel, { distance: Math.abs(b - a) });
    } else {
      context.removeInteraction(pinchChannel);
    }
  };
  const behavior: Behavior<Row> = ({ getChartContext, getInteraction }) => {
    const { g, chartStore } = getChartContext();
    const label = g!.append("text").attr("data-pinch-result", "");
    const update = () => {
      const pinch = getInteraction(pinchChannel);
      const value = pinch ? String(pinch.distance) : "idle";
      label.text(value);
      observed.push(value);
    };
    update();
    const unsubscribe = chartStore.subscribe(update);
    return () => {
      unsubscribe();
      label.remove();
    };
  };
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        behaviors={[behavior]}
        data={rows}
        sensors={[sensor]}
        style={{ width: 600, height: 360 }}
        x="x"
        y="y"
      />
    </DesignSystemProvider>,
  );
  const root = container.querySelector<HTMLElement>("[data-chart-container]")!;
  await expect
    .poll(() => container.querySelector("[data-pinch-result]")?.textContent)
    .toBe("idle");
  const box = root.getBoundingClientRect();
  const pointer = (type: string, id: number, x: number) =>
    root.dispatchEvent(
      new PointerEvent(type, {
        pointerId: id,
        pointerType: "touch",
        clientX: box.left + x,
        clientY: box.top + 100,
        bubbles: true,
      }),
    );
  pointer("pointerdown", 1, 100);
  pointer("pointerdown", 2, 200);
  pointer("pointermove", 1, 80);
  pointer("pointermove", 2, 240);
  pointer("pointerup", 3, 300);
  await frame();
  expect(container.querySelector("[data-pinch-result]")?.textContent).toBe(
    "160",
  );
  pointer("pointerup", 3, 300);
  expect(container.querySelector("[data-pinch-result]")?.textContent).toBe(
    "160",
  );
  const previousSecond = points.get(2)!;
  pointer("pointermove", 1, 70);
  pointer("pointermove", 2, 270);
  pointer("pointercancel", 1, 70);
  await frame();
  expect(container.querySelector("[data-pinch-result]")?.textContent).toBe(
    "idle",
  );
  expect(observed).toContain("160");
  expect([...points.entries()]).toEqual([[2, previousSecond + 30]]);
});

it("native arbitrary shortcut claims ownership independently of default prevention, with baseline fallback", async () => {
  const phases: string[] = [];
  const sensor: Sensor<Row> = (event, context) => {
    if (event.signal.action !== InputAction.KEY) {
      return;
    }
    if (event.signal.key === "z") {
      phases.push(event.signal.keyPhase ?? "missing");
      event.claimed = true;
      context.upsertInteraction(shortcutChannel, {
        active: event.signal.keyPhase === "down",
      });
      event.signal.native?.preventDefault();
    }
    if (event.signal.key === "ArrowLeft") {
      event.claimed = true;
    }
  };
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        data={rows}
        sensors={[sensor]}
        style={{ width: 600, height: 360 }}
        x="x"
        y="y"
      />
    </DesignSystemProvider>,
  );
  const root = container.querySelector<HTMLElement>("[data-chart-container]")!;
  await frame();
  const nativeDefaults = new Map<string, boolean>();
  root.addEventListener("keydown", (event) =>
    nativeDefaults.set(event.key, event.defaultPrevented),
  );
  root.focus();
  await userEvent.keyboard("z");
  expect(phases).toEqual(["down", "up"]);
  expect(nativeDefaults.get("z")).toBe(true);
  await userEvent.keyboard("{ArrowLeft}");
  expect(nativeDefaults.get("ArrowLeft")).toBe(false);
  expect(container.querySelector("[data-chart-tooltip]")).toBeNull();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("10");
});

it.skipIf(!navigator.userAgent.includes("Chrome"))(
  "native CDP mouse capture delivers drag moves outside while touch scrolling remains enabled",
  async () => {
    const positions: number[] = [];
    let captured = false;
    const sensor: Sensor<Row> = ({ signal }) => {
      if (signal.action === InputAction.START) {
        signal.native?.capturePointer();
        captured = true;
      }
      if (signal.action === InputAction.MOVE && captured) {
        positions.push(signal.x);
      }
      if (signal.action === InputAction.END) {
        signal.native?.releasePointer();
        captured = false;
      }
    };
    const { container } = render(
      <DesignSystemProvider>
        <Chart
          data={rows}
          sensors={[sensor]}
          style={{ width: 300, height: 250 }}
          x="x"
          y="y"
        />
      </DesignSystemProvider>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    await frame();
    expect(getComputedStyle(root).touchAction).not.toBe("none");

    const box = root.getBoundingClientRect();
    const x = box.left + 100,
      y = box.top + 100;
    await cdp().send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      buttons: 1,
      clickCount: 1,
    });
    expect(captured).toBe(true);
    await cdp().send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: box.right + 80,
      y,
      button: "left",
      buttons: 1,
    });
    await frame();
    expect(positions.some((position) => position > box.width)).toBe(true);
    await cdp().send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: box.right + 80,
      y,
      button: "left",
      buttons: 0,
      clickCount: 1,
    });
    expect(captured).toBe(false);
  },
);

it
  .skipIf(!navigator.userAgent.includes("Chrome"))
  .each(["keyboard", "retained-engine", "stream", "dispose"])(
  "native capture releases on cancellation from %s",
  async (producer) => {
    let pointerId = -1;
    let cancel = (
      _scope: "chart" | "stream" = "chart",
      _patch: Partial<InputSignal> = {},
    ) => {};
    let dispose = () => {};
    const sensor: Sensor<Row> = ({ signal }, context) => {
      if (signal.action === InputAction.START) {
        pointerId = signal.id;
        signal.native?.capturePointer();
        const engine = context.getChartContext().engine!;
        cancel = (scope = "chart", patch = {}) => {
          engine.input({
            ...signal,
            action: InputAction.CANCEL,
            cancelScope: scope,
            ...patch,
          });
        };
        dispose = () => engine.dispose();
      }
      if (
        signal.action === InputAction.KEY &&
        signal.key === "x" &&
        signal.keyPhase === "down"
      ) {
        cancel();
      }
    };
    const { container } = render(
      <DesignSystemProvider>
        <Chart
          data={rows}
          sensors={[sensor]}
          style={{ width: 300, height: 250 }}
          x="x"
          y="y"
        />
      </DesignSystemProvider>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    await frame();
    root.focus();
    const box = root.getBoundingClientRect();
    const x = box.left + 100,
      y = box.top + 100;
    await cdp().send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      buttons: 1,
      clickCount: 1,
    });
    try {
      expect(root.hasPointerCapture(pointerId)).toBe(true);
      if (producer === "keyboard") {
        await userEvent.keyboard("x");
      } else if (producer === "dispose") {
        dispose();
      } else if (producer === "stream") {
        for (const patch of [
          { id: 99 },
          { source: InputSource.REMOTE },
          { userId: "other" },
        ]) {
          cancel("stream", patch);
          expect(root.hasPointerCapture(pointerId)).toBe(true);
        }
        cancel("stream");
      } else {
        cancel("chart", { id: 99, source: InputSource.REMOTE });
      }
      expect(root.hasPointerCapture(pointerId)).toBe(false);
    } finally {
      await cdp().send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        buttons: 0,
        clickCount: 1,
      });
    }
  },
);
