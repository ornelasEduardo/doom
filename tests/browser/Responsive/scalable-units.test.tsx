import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";

import { Button } from "../../../components/Button/Button";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
} from "../../../components/Drawer/Drawer";
import { Input } from "../../../components/Input/Input";
import { Stack } from "../../../components/Layout/Layout";
import { Select } from "../../../components/Select/Select";
import { Sheet, SheetBody, SheetHeader } from "../../../components/Sheet/Sheet";
import { Text } from "../../../components/Text/Text";
import { Textarea } from "../../../components/Textarea/Textarea";
import { ToastProvider, useToast } from "../../../components/Toast/Toast";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import {
  captainTheme,
  doomsdayTheme,
  neubrutalistTheme,
  orbitalTheme,
  vigilanteTheme,
} from "../../../styles/themes/presets";

const themes = [
  ["default", neubrutalistTheme],
  ["doom", doomsdayTheme],
  ["captain", captainTheme],
  ["orbital", orbitalTheme],
  ["vigilante", vigilanteTheme],
] as const;
const originalRootSize = document.documentElement.style.fontSize;
afterEach(async () => {
  cleanup();
  document.documentElement.style.fontSize = originalRootSize;
  await page.viewport(1280, 800);
});

function ToastTrigger() {
  const { toastSuccess } = useToast();
  return <Button onClick={() => toastSuccess("Saved")}>Notify</Button>;
}

function assertFits(element: HTMLElement, container: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  const parent = container.getBoundingClientRect();
  expect(
    bounds.left,
    `${element.tagName} starts inside container`,
  ).toBeGreaterThanOrEqual(parent.left - 1);
  expect(
    bounds.right,
    `${element.tagName} ends inside container`,
  ).toBeLessThanOrEqual(parent.right + 1);
  expect(
    element.scrollWidth,
    `${element.tagName} does not clip horizontally`,
  ).toBeLessThanOrEqual(element.clientWidth + 1);
  expect(
    element.scrollHeight,
    `${element.tagName} does not clip vertically`,
  ).toBeLessThanOrEqual(element.clientHeight + 1);
}

for (const [name, theme] of themes) {
  for (const legacy of [false, true]) {
    const mode = `${name}/${legacy ? "legacy" : "object"}`;
    const provider = legacy ? { initialTheme: name } : { theme };

    for (const kind of ["drawer", "sheet"] as const) {
      it(`${mode}: contains enlarged ${kind} content in a narrow viewport`, async () => {
        await page.viewport(320, 800);
        document.documentElement.style.fontSize = "32px";
        const Overlay = kind === "drawer" ? Drawer : Sheet;
        const Header = kind === "drawer" ? DrawerHeader : SheetHeader;
        const Body = kind === "drawer" ? DrawerBody : SheetBody;
        render(
          <DesignSystemProvider {...provider}>
            <Overlay isOpen onClose={() => {}}>
              <Header>
                <Text variant="h2">Account settings</Text>
              </Header>
              <Body>
                <Text>
                  Review your notification preferences before saving these
                  changes.
                </Text>
                <Button>Save preferences</Button>
              </Body>
            </Overlay>
          </DesignSystemProvider>,
        );
        const panel = await screen.findByRole("dialog");
        await expect
          .poll(() => panel.getBoundingClientRect().left)
          .toBeGreaterThanOrEqual(-1);
        await expect
          .poll(() => panel.getBoundingClientRect().right)
          .toBeLessThanOrEqual(321);
        expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth + 1);
        const close = screen.getByRole("button", { name: `Close ${kind}` });
        expect(close.getBoundingClientRect().right).toBeLessThanOrEqual(320);
      });
    }

    it(`${mode}: preserves default control geometry`, () => {
      document.documentElement.style.fontSize = "16px";
      render(
        <DesignSystemProvider {...provider}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <div key={size} data-testid={size}>
              <Button size={size}>Save</Button>
              <Select options={[{ value: "one", label: "One" }]} size={size} />
            </div>
          ))}
          <Input aria-label="Address" />
        </DesignSystemProvider>,
      );
      // Captured from the original committed implementation in Chromium.
      for (const [size, height] of [
        ["sm", 32],
        ["md", name === "orbital" ? 38 : 40],
        ["lg", 48],
      ] as const) {
        for (const node of screen
          .getByTestId(size)
          .querySelectorAll("button")) {
          expect(node.getBoundingClientRect().height).toBe(height);
        }
      }
      expect(screen.getByRole("textbox").getBoundingClientRect().height).toBe(
        name === "orbital" ? 38 : 40,
      );
    });

    for (const width of [320, 1280]) {
      it(`${mode}: keeps short notifications sized and contained at ${width}px`, async () => {
        await page.viewport(width, 800);
        document.documentElement.style.fontSize = "16px";
        render(
          <DesignSystemProvider {...provider}>
            <ToastProvider>
              <ToastTrigger />
            </ToastProvider>
          </DesignSystemProvider>,
        );
        await userEvent.click(screen.getByRole("button", { name: "Notify" }));
        const notification = screen.getByRole("group", { name: "Saved" });
        await expect
          .poll(() => notification.getBoundingClientRect().right)
          .toBeLessThanOrEqual(width);
        expect(
          notification.getBoundingClientRect().left,
        ).toBeGreaterThanOrEqual(0);
        expect(
          notification.getBoundingClientRect().width,
        ).toBeGreaterThanOrEqual(287);
        document.documentElement.style.fontSize = "32px";
        await expect
          .poll(() => notification.getBoundingClientRect().right)
          .toBeLessThanOrEqual(width);
        expect(
          notification.getBoundingClientRect().left,
        ).toBeGreaterThanOrEqual(0);
        expect(notification.scrollWidth).toBeLessThanOrEqual(
          notification.clientWidth + 1,
        );
      });
    }

    it(`${mode}: scales controls, spacing and icons with the root font`, async () => {
      document.documentElement.style.fontSize = "16px";
      render(
        <DesignSystemProvider {...provider}>
          <Stack data-testid="stack" gap={4}>
            <Button>Save</Button>
            <Input aria-label="Address" />
            <Textarea aria-label="Notes" />
            <Select
              label="Season"
              options={[{ value: "spring", label: "Spring" }]}
            />
          </Stack>
        </DesignSystemProvider>,
      );
      const button = screen.getByRole("button", { name: "Save" });
      const input = screen.getByRole("textbox", { name: "Address" });
      const textarea = screen.getByRole("textbox", { name: "Notes" });
      const select = screen.getByRole("combobox");
      const icon = select.querySelector("svg")!;
      const baseline = [button, input, textarea, select, icon].map(
        (node) => node.getBoundingClientRect().height,
      );
      expect(baseline.every((height) => height > 0)).toBe(true);
      const baselineGap = parseFloat(
        getComputedStyle(screen.getByTestId("stack")).rowGap,
      );
      for (const rootSize of [20, 32]) {
        document.documentElement.style.fontSize = `${rootSize}px`;
        const ratio = rootSize / 16;
        for (const [index, node] of [
          button,
          input,
          textarea,
          select,
          icon,
        ].entries()) {
          // Short controls remain at their scaled minimum; icons scale exactly.
          await expect
            .poll(() =>
              Math.abs(
                node.getBoundingClientRect().height - baseline[index] * ratio,
              ),
            )
            .toBeLessThanOrEqual(1);
        }
        expect(
          parseFloat(getComputedStyle(screen.getByTestId("stack")).rowGap),
        ).toBeCloseTo(baselineGap * ratio, 1);
      }
    });

    for (const rootSize of [16, 20, 32]) {
      for (const width of [288, 960]) {
        it(`${mode}: fits ${width}px with ${rootSize}px text and increased text spacing`, () => {
          document.documentElement.style.fontSize = `${rootSize}px`;
          render(
            <DesignSystemProvider {...provider}>
              <style>{`.spacing-audit, .spacing-audit * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }`}</style>
              <div
                className="spacing-audit"
                data-testid="frame"
                style={{ width, maxWidth: "100%" }}
              >
                <Stack gap={4}>
                  <Button>Save all changes and continue editing</Button>
                  <Input
                    helperText="Use your preferred contact address for notifications"
                    label="Email address"
                  />
                  <Textarea label="Additional information" />
                  <Select
                    defaultValue="long"
                    label="Delivery preference"
                    options={[
                      {
                        value: "long",
                        label: "Deliver to the address provided on my account",
                      },
                    ]}
                  />
                  <Checkbox label="Keep me informed about changes to my account" />
                </Stack>
              </div>
            </DesignSystemProvider>,
          );
          const frame = screen.getByTestId("frame");
          for (const node of [
            screen.getByRole("button"),
            screen.getByRole("textbox", { name: "Email address" }),
            screen.getByRole("textbox", { name: "Additional information" }),
            screen.getByRole("combobox"),
          ]) {
            assertFits(node, frame);
          }
          const label = screen
            .getByRole("button")
            .querySelector<HTMLElement>('[data-doom-part="label"]')!;
          const labelBounds = label.getBoundingClientRect();
          const buttonBounds = screen
            .getByRole("button")
            .getBoundingClientRect();
          expect(labelBounds.top).toBeGreaterThanOrEqual(buttonBounds.top);
          expect(labelBounds.bottom).toBeLessThanOrEqual(buttonBounds.bottom);
          expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth + 1);
          const chevron = screen
            .getByRole("combobox")
            .querySelector("svg")!
            .getBoundingClientRect();
          expect(
            chevron.width,
            "Select chevron remains visible beside a long label",
          ).toBeGreaterThanOrEqual(chevron.height - 1);
          const checkboxDisplay =
            screen.getByRole("checkbox").nextElementSibling!;
          const checkboxBounds = checkboxDisplay.getBoundingClientRect();
          expect(
            Math.abs(checkboxBounds.width - checkboxBounds.height),
            "checkbox keeps its square target beside a wrapping label",
          ).toBeLessThanOrEqual(1);
        });
      }
    }

    it(`${mode}: keeps selection and keyboard interaction working with enlarged text`, async () => {
      await page.viewport(320, 800);
      document.documentElement.style.fontSize = "32px";
      render(
        <DesignSystemProvider {...provider}>
          <div style={{ width: 288 }}>
            <Select
              label="Season"
              options={[
                { value: "spring", label: "Spring" },
                { value: "autumn", label: "Autumn" },
              ]}
            />
            <Checkbox label="Send updates" />
          </div>
        </DesignSystemProvider>,
      );
      const select = screen.getByRole("combobox");
      await userEvent.click(select);
      const listbox = screen.getByRole("listbox");
      await expect
        .poll(() => listbox.getBoundingClientRect().right)
        .toBeLessThanOrEqual(320);
      expect(listbox.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
      await userEvent.click(screen.getByRole("option", { name: "Autumn" }));
      expect(select.textContent).toContain("Autumn");
      const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
      checkbox.focus();
      await userEvent.keyboard(" ");
      expect(checkbox.checked).toBe(true);
    });
  }
}
