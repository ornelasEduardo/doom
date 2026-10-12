import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Metrics } from "./Metrics";
import { Proof } from "./Proof";

afterEach(cleanup);
it("reports measured render timings and makes the isolation chart optional", async () => {
  const view = render(<Proof initialCount={1000} />);
  await expect
    .poll(() =>
      view
        .getAllByLabelText("Interaction readiness")
        .every((node) => /\d.*ms/.test(node.textContent || "")),
    )
    .toBe(true);
  expect(view.getAllByText("Latest draw submission")).toHaveLength(2);
  await userEvent.click(view.getByRole("button", { name: "Hide comparison" }));
  expect(view.container.querySelectorAll("[data-proof-chart]")).toHaveLength(1);
  expect(
    view.getByText(`${(1000).toLocaleString()} total points`),
  ).toBeTruthy();
});

it("keeps metrics scoped to their chart when separate labs reuse display names", async () => {
  function Fixture({ elapsed }: { elapsed: number }) {
    const container = useRef<HTMLElement>(null);
    return (
      <section ref={container} data-proof-chart="Primary">
        <svg data-proof-draw-at={elapsed} data-proof-ready-at={elapsed} />
        <Metrics container={container} startedAt={0} />
      </section>
    );
  }
  const first = render(<Fixture elapsed={12} />);
  const second = render(<Fixture elapsed={45} />);
  await expect
    .poll(() => first.container.querySelector("dd")?.textContent)
    .toBe("12.0 ms");
  await expect
    .poll(() => second.container.querySelector("dd")?.textContent)
    .toBe("45.0 ms");
});
