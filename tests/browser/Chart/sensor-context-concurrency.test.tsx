import { act, cleanup, render } from "@testing-library/react";
import { startTransition, Suspense, useLayoutEffect, useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import {
  Engine,
  InputAction,
  InputSource,
} from "../../../components/Chart/engine";
import { SensorManager } from "../../../components/Chart/sensors/SensorManager/SensorManager";
import { createChartStore } from "../../../components/Chart/state/store/chart.store";
import type { ContextValue, Sensor } from "../../../components/Chart/types";

afterEach(cleanup);

it.each(["commit", "abandon"])(
  "keeps sensor context committed when a suspended update will %s",
  async (outcome) => {
    interface Row {
      value: number;
    }
    const chartStore = createChartStore<Row>({ type: "line" });
    chartStore.setState({ status: "ready", data: [{ value: 1 }] });
    const engine = new Engine<Row>();
    const registrations = vi.spyOn(engine, "setHandler");
    const observed: Array<ContextValue<Row>["variant"]> = [];
    const sensor: Sensor<Row> = (_, context) => {
      observed.push(context.getChartContext().variant);
    };
    const sensors = [sensor];
    const commits: Array<ContextValue<Row>["variant"]> = [];
    let update: (pending: boolean) => void = () => {
      throw new Error("Not mounted");
    };
    let blocked = true;
    let suspended = false;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    function Block({ pending }: { pending: boolean }) {
      if (pending && blocked) {
        suspended = true;
        throw gate;
      }
      return null;
    }

    function CommittedLabel({
      variant,
    }: {
      variant: ContextValue<Row>["variant"];
    }) {
      useLayoutEffect(() => {
        commits.push(variant);
      }, [variant]);
      return <span data-testid="committed">{variant}</span>;
    }

    function Harness() {
      const [pending, setPending] = useState(false);
      update = setPending;
      const value: ContextValue<Row> = {
        chartStore,
        engine,
        config: { type: "line" },
        colorPalette: [],
        styles: {},
        isMobile: false,
        resolveInteraction: () => null,
        variant: pending ? "solid" : "default",
      };
      return (
        <>
          <button
            onClick={() =>
              engine.input({
                id: 1,
                action: InputAction.START,
                source: InputSource.MOUSE,
                x: 0,
                y: 0,
                timestamp: performance.now(),
                userId: "local",
              })
            }
          >
            Sample context
          </button>
          <Suspense fallback={<span>Loading</span>}>
            <SensorManager sensors={sensors} value={value} />
            <CommittedLabel variant={value.variant} />
            <Block pending={pending} />
          </Suspense>
        </>
      );
    }

    const view = render(<Harness />);
    const sample = async () => {
      await userEvent.click(
        view.getByRole("button", { name: "Sample context" }),
      );
    };
    try {
      await sample();
      expect(observed).toEqual(["default"]);
      await act(async () => {
        startTransition(() => update(true));
      });
      expect(suspended).toBe(true);
      expect(view.getByTestId("committed").textContent).toBe("default");
      expect(commits).toEqual(["default"]);
      expect(registrations).toHaveBeenCalledTimes(1);
      await sample();
      expect(observed).toEqual(["default", "default"]);

      await act(async () => {
        if (outcome === "abandon") {
          update(false);
        } else {
          blocked = false;
          release();
          await gate;
        }
      });
      const finalVariant = outcome === "commit" ? "solid" : "default";
      expect(view.getByTestId("committed").textContent).toBe(finalVariant);
      expect(commits).toEqual(
        outcome === "commit" ? ["default", "solid"] : ["default"],
      );
      await sample();
      expect(observed).toEqual(["default", "default", finalVariant]);
      expect(registrations).toHaveBeenCalledTimes(1);
    } finally {
      view.unmount();
      engine.dispose();
    }
  },
);
