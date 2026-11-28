import "../../../styles/globals.scss";
import "../../../styles/theming/scope.scss";

import { cleanup, render as rtlRender, screen } from "@testing-library/react";
import React, { useRef, useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { Dropdown } from "../../../components/Dropdown/Dropdown";
import { Modal } from "../../../components/Modal/Modal";
import { Popover } from "../../../components/Popover/Popover";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../components/RadioGroup/RadioGroup";
import { Select } from "../../../components/Select/Select";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

const render = (ui: React.ReactNode) =>
  rtlRender(<DesignSystemProvider>{ui}</DesignSystemProvider>);
afterEach(cleanup);
// Native dialogs restore the previously focused element. WebKit does not
// focus a button on pointer activation, so keyboard invocation is explicit.
function Fixture() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Edit setup</button>
      <button>Background</button>
      <Modal isOpen={open} title="Setup" onClose={() => setOpen(false)}>
        <Select
          label="Date format"
          options={[
            { value: "ymd", label: "Year first" },
            { value: "mdy", label: "Month first" },
          ]}
        />
        <button>Review</button>
      </Modal>
    </>
  );
}
it("contains focus, keeps nested options reachable, dismisses one layer and returns to the invoker", async () => {
  render(<Fixture />);
  screen.getByRole("button", { name: "Edit setup" }).focus();
  await userEvent.keyboard("{Enter}");
  const dialog = screen.getByRole("dialog", { name: "Setup" });
  expect((dialog as HTMLDialogElement).matches(":modal")).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Edit setup" }),
  );
  screen.getByRole("button", { name: "Edit setup" }).focus();
  await userEvent.keyboard("{Enter}");
  screen.getByRole("button", { name: "Close modal" }).focus();
  await userEvent.tab({ shift: true });
  expect(document.activeElement).not.toBe(
    screen.getByRole("button", { name: "Background" }),
  );
  screen.getByRole("button", { name: "Background" }).focus();
  expect(document.activeElement).not.toBe(
    screen.getByRole("button", { name: "Background" }),
  );
  await userEvent.click(screen.getByRole("combobox", { name: "Date format" }));
  expect(dialog.contains(screen.getByRole("listbox"))).toBe(true);
  expect(screen.getByRole("combobox", { name: "Date format" })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect((dialog as HTMLDialogElement).open).toBe(true);
  expect(screen.queryByRole("listbox")).toBeNull();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => (dialog as HTMLDialogElement).open).toBe(false);
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Edit setup" }),
  );
});
it("menus support last-item entry, wrapping, typeahead, Escape and Tab exit", async () => {
  render(
    <>
      <Dropdown
        items={[
          { label: "Archive", onClick: () => {} },
          { label: "Delete", onClick: () => {} },
        ]}
        triggerLabel="Actions"
      />
      {/* A text field is in the native Tab order even when macOS disables
          keyboard navigation to buttons. Do not override that preference. */}
      <input aria-label="After" />
    </>,
  );
  screen.getByRole("button", { name: /Actions/ }).focus();
  await userEvent.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Delete" }),
  );
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Archive" }),
  );
  await userEvent.keyboard("d");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Delete" }),
  );
  await userEvent.keyboard("{Escape}");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: /Actions/ }),
  );
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.tab();
  expect(document.activeElement).toBe(
    screen.getByRole("textbox", { name: "After" }),
  );
});

function NestedPopovers() {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  return (
    <Popover
      content={
        <div aria-label="Outer content">
          <Popover
            content={<input aria-label="Nested input" />}
            isOpen={inner}
            trigger={<button onClick={() => setInner(true)}>Inner</button>}
            onClose={() => setInner(false)}
          />
        </div>
      }
      isOpen={outer}
      trigger={<button onClick={() => setOuter(true)}>Outer</button>}
      onClose={() => setOuter(false)}
    />
  );
}
it("dismisses only the innermost generic popover", async () => {
  render(<NestedPopovers />);
  await userEvent.click(screen.getByRole("button", { name: "Outer" }));
  await userEvent.click(screen.getByRole("button", { name: "Inner" }));
  await userEvent.click(screen.getByRole("textbox", { name: "Nested input" }));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("textbox", { name: "Nested input" })).toBeNull();
  expect(screen.getByRole("button", { name: "Inner" })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: "Inner" })).toBeNull();
});
it("keeps selected radio indicators visible with reduced motion", async () => {
  await commands.setReducedMotion("reduce");
  try {
    const { container } = render(
      <RadioGroup value="a">
        <RadioGroupItem value="a">Selected</RadioGroupItem>
      </RadioGroup>,
    );
    const dot = container.querySelector('[data-doom-part="innerDot"]')!;
    expect(getComputedStyle(dot).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(getComputedStyle(dot).animationName).toBe("none");
  } finally {
    await commands.setReducedMotion("no-preference");
  }
});

function TallDialog() {
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  return (
    <>
      <button onClick={() => setOpen(true)}>Edit lower field</button>
      <Modal
        initialFocusRef={field}
        isOpen={open}
        title="Long setup"
        onClose={() => setOpen(false)}
      >
        <div style={{ height: 1200 }} />
        <input ref={field} aria-label="Requested field" />
      </Modal>
    </>
  );
}
it("scrolls the requested initial field into the visible dialog", async () => {
  render(<TallDialog />);
  await userEvent.click(
    screen.getByRole("button", { name: "Edit lower field" }),
  );
  const field = screen.getByRole("textbox", { name: "Requested field" });
  expect(document.activeElement).toBe(field);
  const bounds = field.getBoundingClientRect();
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight);
});

it("pointer-opened menus retain an invoker for Escape and keyboard navigation", async () => {
  render(
    <Dropdown
      items={[{ label: "Archive", onClick: () => {} }]}
      triggerLabel="Pointer actions"
    />,
  );
  const trigger = screen.getByRole("button", { name: /Pointer actions/ });
  await userEvent.click(trigger);
  expect(trigger).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
  await userEvent.click(trigger);
  await userEvent.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus();
});

it("restores the previously focused field after a pointer-opened modal closes", async () => {
  render(
    <>
      <input aria-label="Previous field" />
      <Fixture />
    </>,
  );
  const previous = screen.getByRole("textbox", { name: "Previous field" });
  const invoker = screen.getByRole("button", { name: "Edit setup" });
  previous.focus();
  // Exercise pointer invocation independently of each browser's click-focus policy.
  invoker.addEventListener("mousedown", (event) => event.preventDefault(), {
    once: true,
  });
  await userEvent.click(invoker);
  expect(screen.getByRole("dialog", { name: "Setup" })).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.activeElement).toBe(previous);
});

it("Shift+Tab exits a menu to the previous keyboard-reachable control", async () => {
  render(
    <>
      <input aria-label="Before" />
      <Dropdown
        items={[{ label: "Archive", onClick: () => {} }]}
        triggerLabel="Reverse actions"
      />
      <input aria-label="After" />
    </>,
  );
  const trigger = screen.getByRole("button", { name: /Reverse actions/ });
  trigger.focus();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.tab({ shift: true });
  expect(document.activeElement).toBe(
    screen.getByRole("textbox", { name: "Before" }),
  );
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

it("composes Select consumer handlers without losing focus and dismissal", async () => {
  const click = vi.fn();
  const key = vi.fn();
  render(
    <Select
      label="Composed"
      options={[{ value: "a", label: "Alpha" }]}
      onClick={click}
      onKeyDown={key}
    />,
  );
  const trigger = screen.getByRole("combobox", { name: "Composed" });
  await userEvent.click(trigger);
  expect(click).toHaveBeenCalledTimes(1);
  expect(trigger).toHaveFocus();
  expect(screen.getByRole("listbox")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  expect(key).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("listbox")).toBeNull();
});
it("allows Select consumers to cancel opening and keyboard handling", async () => {
  render(
    <Select
      label="Cancelled"
      options={[{ value: "a", label: "Alpha" }]}
      onClick={(event) => event.preventDefault()}
      onKeyDown={(event) => event.preventDefault()}
    />,
  );
  const trigger = screen.getByRole("combobox", { name: "Cancelled" });
  await userEvent.click(trigger);
  expect(screen.queryByRole("listbox")).toBeNull();
  trigger.focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(screen.queryByRole("listbox")).toBeNull();
});
