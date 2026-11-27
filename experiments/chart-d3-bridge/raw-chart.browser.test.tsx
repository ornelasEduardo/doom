import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { hasWebGpu } from "../../tests/browser/Chart/webgpu-readback";
import { trackPointUploads } from "./gpu-test-uploads";
import { Proof } from "./Proof";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it.each([8, 100000])(
  "keeps default GPU-projected Chart targets aligned through edits and zoom at %s points",
  async (count) => {
    const uploads = trackPointUploads();
    const view = render(<Proof initialCount={count} />);
    const primary = () =>
      view.container.querySelector('[data-proof-chart="Primary"]')!;
    await expect
      .poll(
        () =>
          view.container.querySelectorAll(`[data-proof-count="${count}"]`)
            .length,
      )
      .toBe(2);
    await expect
      .poll(
        () =>
          view.container.querySelectorAll('[data-proof-loading="false"]')
            .length,
      )
      .toBe(2);
    await expect
      .poll(() =>
        uploads.calls.some(
          (call) => call.values[0] === 40 && call.values[1] === 80,
        ),
      )
      .toBe(true);
    primary().querySelector<HTMLElement>("[data-chart-container]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => primary().querySelector("[data-chart-tooltip]")?.textContent)
      .toContain("80");
    const plot = primary().querySelector("[data-proof-surface]")!
      .previousElementSibling as SVGRectElement;
    plot.scrollIntoView({ block: "center" });
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const target = new DOMPoint(
      (Math.log10(40) / 3) * Number(plot.getAttribute("width")),
      (1 - Math.log10(80) / 3) * Number(plot.getAttribute("height")),
    ).matrixTransform(plot.getScreenCTM()!);
    await expect
      .poll(() => {
        const marker = primary()
          .querySelector(".chart-markers-layer circle")!
          .getBoundingClientRect();
        return Math.hypot(
          marker.x + marker.width / 2 - target.x,
          marker.y + marker.height / 2 - target.y,
        );
      })
      .toBeLessThan(1);
    if (count === 8) {
      await userEvent.keyboard("{ArrowRight}");
      await commands.moveChartPointer(0, 0);
      await commands.moveChartPointer(target.x, target.y);
      await expect
        .poll(
          () => primary().querySelector("[data-chart-tooltip]")?.textContent,
        )
        .toContain("80");
    }
    await userEvent.click(view.getByRole("button", { name: "Edit points" }));
    await expect
      .poll(() => {
        return uploads.calls.findLast((call) => call.offset === 0)?.values[1];
      })
      .toBe(92);
    await userEvent.click(
      view.getByRole("button", { name: "Zoom in Primary" }),
    );
    await expect
      .poll(() => primary().querySelector("output")?.textContent)
      .toContain("2.00");
    primary().querySelector<HTMLElement>("[data-chart-container]")!.focus();
    await userEvent.keyboard("{Escape}{ArrowRight}");
    await expect
      .poll(() => primary().querySelector("[data-chart-tooltip]")?.textContent)
      .toContain("92");
  },
);

beforeEach(async ({ skip }) => {
  if (!(await hasWebGpu())) {
    skip();
  }
});
