import "../../../styles/globals.scss";
import "../../../styles/theming/scope.scss";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { Select } from "../../../components/Select/Select";
import { Sheet } from "../../../components/Sheet/Sheet";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});
function Fixture() {
  const [open, setOpen] = useState(false);
  return (
    <DesignSystemProvider>
      <button onClick={() => setOpen(true)}>Open</button>
      <Sheet isOpen={open} title="Review" onClose={() => setOpen(false)}>
        <Select
          label="Choice"
          options={[
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ]}
        />
        <button onClick={() => setOpen(false)}>Done</button>
      </Sheet>
    </DesignSystemProvider>
  );
}
const tick = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
it("animates enter and exit, makes exits inert and cancels stale removal on reopen", async () => {
  await commands.setReducedMotion("no-preference");
  render(<Fixture />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const panel = screen.getByRole("dialog", { name: "Review" });
  expect(panel.getAnimations().length).toBeGreaterThan(0);
  await Promise.all(panel.getAnimations().map((a) => a.finished));
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(panel.hasAttribute("inert")).toBe(true);
  expect(panel.getAttribute("aria-hidden")).toBe("true");
  expect(panel.getAnimations().length).toBeGreaterThan(0);
  expect(panel.isConnected).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Open" }));
  await Promise.allSettled(panel.getAnimations().map((a) => a.finished));
  await tick();
  expect(screen.getByRole("dialog", { name: "Review" })).toBe(panel);
  expect(panel.hasAttribute("inert")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  await expect.poll(() => panel.isConnected).toBe(false);
  expect(document.body.style.overflow).toBe("");
});
it("skips motion when requested and dismisses a nested select before its sheet", async () => {
  await commands.setReducedMotion("reduce");
  render(<Fixture />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const panel = screen.getByRole("dialog", { name: "Review" });
  expect(panel.getAnimations().length).toBe(0);
  await userEvent.click(screen.getByRole("combobox", { name: "Choice" }));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(screen.getByRole("dialog", { name: "Review" })).toBe(panel);
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => panel.isConnected).toBe(false);
});
it("cancels drags without dismissing, ignores header controls, and dismisses completed drags", async () => {
  await commands.setReducedMotion("reduce");
  render(<Fixture />);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  const panel = screen.getByRole("dialog", { name: "Review" });
  const header = panel.querySelector('[data-doom-part="header"]')!;
  const close = screen.getByRole("button", { name: "Close sheet" });
  fireEvent.pointerDown(close, { button: 0, pointerId: 1, clientY: 200 });
  fireEvent.pointerMove(document, { pointerId: 1, clientY: 400 });
  expect(panel.style.transform).toBe("");
  fireEvent.pointerUp(document, { pointerId: 1, clientY: 400 });
  fireEvent.pointerDown(header, { button: 0, pointerId: 2, clientY: 200 });
  fireEvent.pointerMove(document, { pointerId: 2, clientY: 400 });
  expect(panel.style.transform).toBe("translateY(200px)");
  fireEvent.pointerCancel(document, { pointerId: 2, clientY: 400 });
  expect(panel.style.transform).toBe("");
  expect(panel.isConnected).toBe(true);
  fireEvent.pointerDown(header, { button: 0, pointerId: 3, clientY: 200 });
  fireEvent.pointerMove(document, { pointerId: 3, clientY: 400 });
  fireEvent.pointerUp(document, { pointerId: 3, clientY: 400 });
  await expect.poll(() => panel.isConnected).toBe(false);
});
