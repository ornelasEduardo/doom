import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { Proof } from "./Proof";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("keeps current charts available during preparation and allows a newer selection", async () => {
  const view = render(<Proof initialCount={1000} />);
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="false"]').length,
    )
    .toBe(2);
  const post = vi
    .spyOn(Worker.prototype, "postMessage")
    .mockImplementation(() => {});
  await userEvent.click(
    view.getByRole("combobox", { name: "Points per chart" }),
  );
  await userEvent.click(
    view.getByRole("option", { name: (100000).toLocaleString() }),
  );
  await expect.poll(() => post.mock.calls.length).toBe(1);
  expect(
    view.container.querySelectorAll('[data-proof-count="1000"]').length,
  ).toBe(2);
  expect(view.getByText(/Preparing the requested dataset/)).toBeTruthy();
  post.mockRestore();
  await userEvent.click(
    view.getByRole("combobox", { name: "Points per chart" }),
  );
  await userEvent.click(
    view.getByRole("option", { name: (10000).toLocaleString() }),
  );
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-count="10000"]').length,
    )
    .toBe(2);
  expect(view.queryByText(/Preparing the requested dataset/)).toBeNull();
});
it("adopts worker-generated data with working keyboard targets", async () => {
  const view = render(<Proof initialCount={100000} />);
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-count="100000"]').length,
    )
    .toBe(2);
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="false"]').length,
    )
    .toBe(2);
  view.container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(
      () => view.container.querySelector("[data-chart-tooltip]")?.textContent,
    )
    .toContain("80");
});
it("uses built-in keyboard navigation for the entire compact dataset and announces its real count", async () => {
  const view = render(<Proof initialCount={8} />);
  await expect
    .poll(
      () => view.container.querySelectorAll('[data-proof-count="8"]').length,
    )
    .toBe(2);
  expect(view.getAllByText(/Scatter chart with 8 services/)).toHaveLength(2);
  expect(view.queryByRole("combobox", { name: "Renderer" })).toBeNull();
  view.container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  await expect
    .poll(
      () => view.container.querySelector("[data-chart-tooltip]")?.textContent,
    )
    .toContain("100");
  await userEvent.keyboard(
    "{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}",
  );
  await expect
    .poll(
      () => view.container.querySelector("[data-chart-tooltip]")?.textContent,
    )
    .toContain("700");
});

it("draws before the worker index arrives and enables keyboard targets afterward", async () => {
  const { prepareCompact } = await import("./compact-world");
  const buffers = prepareCompact(100000, 0, "raw");
  let deliver: ((event: MessageEvent) => void) | undefined;
  vi.stubGlobal(
    "Worker",
    class {
      onmessage: ((event: MessageEvent) => void) | undefined;
      postMessage() {
        deliver = (event) => this.onmessage?.(event);
      }
      terminate() {}
    },
  );
  const view = render(<Proof initialCount={100000} />);
  await expect.poll(() => !!deliver).toBe(true);
  deliver!(
    new MessageEvent("message", {
      data: {
        stage: "draw",
        encoding: "raw",
        positions: buffers.positions,
        preparationMs: 1,
      },
    }),
  );
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-count="100000"]').length,
    )
    .toBe(2);
  expect(
    view.container.querySelectorAll('[data-proof-loading="true"]'),
  ).toHaveLength(2);
  expect(view.container.querySelectorAll("[data-proof-ready-at]")).toHaveLength(
    0,
  );
  deliver!(
    new MessageEvent("message", {
      data: {
        stage: "ready",
        grid: buffers.grid,
        values: buffers.values,
        indexMs: 1,
      },
    }),
  );
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="false"]').length,
    )
    .toBe(2);
  view.container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(
      () => view.container.querySelector("[data-chart-tooltip]")?.textContent,
    )
    .toContain("80");
  vi.unstubAllGlobals();
});
