import "../../../styles/globals.scss";
import "../../../styles/theming/scope.scss";

import { cleanup, render as rtlRender, screen } from "@testing-library/react";
import React, { useRef, useState } from "react";
import { afterEach, expect, it } from "vitest";
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
  await userEvent.click(screen.getByRole("button", { name: "Edit setup" }));
  const dialog = screen.getByRole("dialog", { name: "Setup" });
  expect((dialog as HTMLDialogElement).matches(":modal")).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Edit setup" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Edit setup" }));
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
      <button>After</button>
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
    screen.getByRole("button", { name: "After" }),
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
      triggerLabel="Pointer actions"
      items={[{ label: "Archive", onClick: () => {} }]}
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
