import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { Proof } from "./Proof";

afterEach(cleanup);
it.each([8, 100000])(
  "keeps default GPU-projected Chart targets aligned through edits and zoom at %s points",
  async (count) => {
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
    const gl = primary().querySelector("canvas")!.getContext("webgl2")!;
    const uploaded = new Float32Array(2);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, uploaded);
    expect(Array.from(uploaded)).toEqual([40, 80]);
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
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, uploaded);
        return uploaded[1];
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
    expect(gl.getError()).toBe(gl.NO_ERROR);
  },
);
