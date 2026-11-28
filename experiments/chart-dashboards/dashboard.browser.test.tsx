import "../../styles/globals.scss";

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { Dashboards } from "./Dashboards";

afterEach(cleanup);

it("restores independent GPU charts and keyboard tooltips after dashboard navigation", async () => {
  const view = render(<Dashboards />);
  await expect
    .poll(
      () => view.container.querySelectorAll('[data-chart-gpu="ready"]').length,
    )
    .toBe(3);
  const navigate = async () => {
    await userEvent.click(
      view.getByRole("button", { name: "Request explorer" }),
    );
    await expect
      .poll(
        () =>
          view.container.querySelectorAll('[data-chart-gpu="ready"]').length,
      )
      .toBe(3);
    await userEvent.click(
      view.getByRole("button", { name: "Live operations" }),
    );
    await expect
      .poll(
        () =>
          view.container.querySelectorAll('[data-chart-gpu="ready"]').length,
      )
      .toBe(3);
  };
  await navigate();
  await navigate();
  for (const chart of view.container.querySelectorAll<HTMLElement>(
    "[data-dashboard-chart]",
  )) {
    chart.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => chart.querySelector("[data-chart-tooltip]")?.textContent)
      .toBeTruthy();
    await userEvent.keyboard("{Escape}");
    chart.scrollIntoView({ block: "center", behavior: "instant" });
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const mark = chart.querySelector<SVGPathElement>("path[data-chart-type]")!;
    const local =
      mark.getAttribute("data-chart-type") === "bar"
        ? new DOMPoint(
            mark.getBBox().x + mark.getBBox().width / 2,
            mark.getBBox().y + mark.getBBox().height / 2,
          )
        : mark.getPointAtLength(mark.getTotalLength() / 2);
    const point = new DOMPoint(local.x, local.y).matrixTransform(
      mark.getScreenCTM()!,
    );
    await commands.moveChartPointer(point.x, point.y);
    await expect
      .poll(() => chart.querySelector("[data-chart-tooltip]")?.textContent)
      .toBeTruthy();
  }
  expect(view.container.querySelectorAll("canvas")).toHaveLength(3);
});

it("keeps shared filters, summaries and dense chart data consistent", async () => {
  const view = render(<Dashboards />);
  await userEvent.click(view.getByRole("button", { name: "Request explorer" }));
  await userEvent.click(view.getByRole("button", { name: "Europe" }));
  await expect
    .poll(() => view.getByTestId("request-count").textContent)
    .toBe("3,333");
  await expect
    .poll(
      () => view.container.querySelectorAll('[data-chart-gpu="ready"]').length,
    )
    .toBe(3);
  expect(
    view.container.querySelector('[data-chart-gpu-mark="cloud"]'),
  ).not.toBeNull();
  expect(
    view.container.querySelectorAll('[data-chart-type="scatter"] circle')
      .length,
  ).toBeLessThan(10);
  await userEvent.click(view.getByRole("button", { name: "All regions" }));
  expect(view.getByTestId("request-count").textContent).toBe("10,000");
  fireEvent.change(view.getByLabelText("Request sample size"), {
    target: { value: "50000" },
  });
  await expect
    .poll(() => view.getByTestId("request-count").textContent)
    .toBe("50,000");
  const scatter = view.container.querySelector<HTMLElement>(
    '[data-dashboard-chart="requests"]',
  )!;
  scatter.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => scatter.querySelector("[data-chart-tooltip]")?.textContent)
    .toBeTruthy();
  await expect
    .poll(() => view.queryByText(/Inspecting request #/))
    .not.toBeNull();
});

it("advances all operations charts and resumes keyboard inspection after streaming", async () => {
  const view = render(<Dashboards />);
  await userEvent.click(
    view.getByRole("button", { name: "Advance one second" }),
  );
  expect(view.getByText("P99 latency · second 60")).toBeTruthy();
  await userEvent.click(view.getByRole("button", { name: "Start stream" }));
  await expect
    .poll(() => view.queryByText("P99 latency · second 61"), { timeout: 3000 })
    .not.toBeNull();
  await userEvent.click(view.getByRole("button", { name: "Pause stream" }));
  const chart = view.container.querySelector<HTMLElement>(
    '[data-dashboard-chart="latency"]',
  )!;
  chart.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => chart.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("P99");
});
