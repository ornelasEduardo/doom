import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Button } from "../../../components/Button/Button";
import { Select } from "../../../components/Select/Select";
import { compileTheme } from "../../../styles/theming/compileTheme";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

const first = defineTheme({
  name: "Editorial",
  components: {
    Button: {
      classNames: { label: "editorial-label" },
      parts: {
        root: {
          backgroundColor: "rgb(31, 32, 33)",
          states: {
            hover: { backgroundColor: "rgb(41, 42, 43)" },
            disabled: { backgroundColor: "rgb(51, 52, 53)" },
            focusVisible: { outline: "5px solid rgb(61, 62, 63)" },
          },
        },
      },
    },
    Select: { parts: { optionsList: { backgroundColor: "rgb(71, 72, 73)" } } },
  },
});
const second = defineTheme({
  name: "Editorial",
  components: {
    Button: { parts: { root: { backgroundColor: "rgb(81, 82, 83)" } } },
  },
});
const options = [
  { label: "Spring", value: "spring" },
  { label: "Autumn", value: "autumn" },
];
const button = (name: string) => screen.getByRole("button", { name });
const background = (node: Element) => getComputedStyle(node).backgroundColor;

afterEach(cleanup);

it("isolates same-name recipes across nested and sibling scopes", () => {
  render(
    <>
      <ThemeScope theme={first}>
        <Button>Outer</Button>
        <ThemeScope theme={second}>
          <Button>Inner</Button>
        </ThemeScope>
      </ThemeScope>
      <ThemeScope theme={second}>
        <Button>Sibling</Button>
      </ThemeScope>
    </>,
  );
  expect(background(button("Outer"))).toBe("rgb(31, 32, 33)");
  expect(background(button("Inner"))).toBe("rgb(81, 82, 83)");
  expect(background(button("Sibling"))).toBe("rgb(81, 82, 83)");
});

it("applies hover and disabled recipes on the actual control", async () => {
  render(
    <ThemeScope theme={first}>
      <Button>Ready</Button>
      <Button disabled>Unavailable</Button>
    </ThemeScope>,
  );
  await userEvent.hover(button("Ready"));
  await expect.poll(() => background(button("Ready"))).toBe("rgb(41, 42, 43)");
  expect(background(button("Unavailable"))).toBe("rgb(51, 52, 53)");
});

it("shows the recipe focus outline on keyboard focus", async () => {
  render(
    <ThemeScope theme={first}>
      <Button>Continue</Button>
    </ThemeScope>,
  );
  await userEvent.tab();
  const target = button("Continue");
  expect(document.activeElement).toBe(target);
  await expect
    .poll(() => getComputedStyle(target).outlineColor)
    .toBe("rgb(61, 62, 63)");
  expect(getComputedStyle(target).outlineWidth).toBe("5px");
});

it("merges reusable and instance classes on the inner label", () => {
  render(
    <ThemeScope theme={first}>
      <style>
        {
          ".editorial-label { letter-spacing: 3px } .consumer-label { word-spacing: 7px }"
        }
      </style>
      <Button classNames={{ label: "consumer-label" }}>Label</Button>
    </ThemeScope>,
  );
  const label = screen.getByText("Label");
  expect(label).not.toBe(button("Label"));
  expect(getComputedStyle(label).letterSpacing).toBe("3px");
  expect(getComputedStyle(label).wordSpacing).toBe("7px");
});

it("carries the logical theme and direction through Select's Popover", async () => {
  const { container } = render(
    <ThemeScope theme={second}>
      <ThemeScope dir="rtl" theme={first}>
        <Select label="Season" options={options} />
      </ThemeScope>
    </ThemeScope>,
  );
  await userEvent.click(screen.getByRole("combobox"));
  const menu = screen.getByRole("listbox");
  expect(container.contains(menu)).toBe(false);
  expect(getComputedStyle(menu).direction).toBe("rtl");
  expect(background(menu)).toBe("rgb(71, 72, 73)");
});

it("leaves an adjacent unscoped control's computed presentation intact", () => {
  const { rerender } = render(<button>Outside</button>);
  const before = background(button("Outside"));
  rerender(
    <>
      <button>Outside</button>
      <ThemeScope theme={first}>
        <Button>Inside</Button>
      </ThemeScope>
    </>,
  );
  expect(background(button("Inside"))).toBe("rgb(31, 32, 33)");
  expect(background(button("Outside"))).toBe(before);
});

it("keeps compiled CSS independent of repeated control instances and active after a sibling unmount", () => {
  function fixture(count: number, sibling: boolean) {
    return (
      <>
        {sibling && (
          <ThemeScope theme={first}>
            <Button>Peer</Button>
          </ThemeScope>
        )}
        <ThemeScope theme={first}>
          {Array.from({ length: count }, (_, i) => (
            <Button key={i}>{"Item " + i}</Button>
          ))}
        </ThemeScope>
      </>
    );
  }
  const styles = () =>
    Array.from(
      document.querySelectorAll(
        'style[data-doom-styles], style[data-href^="doom-theme-"]',
      ),
      (node) => node.textContent,
    ).join("");
  const { rerender } = render(fixture(1, true));
  const original = styles();
  expect(original).toContain(compileTheme(first).css);
  rerender(fixture(100, true));
  expect(styles()).toBe(original);
  rerender(fixture(100, false));
  expect(background(button("Item 99"))).toBe("rgb(31, 32, 33)");
});

it("switches recipes while preserving an uncontrolled selection and its focus", async () => {
  function fixture(theme: typeof first) {
    return (
      <ThemeScope theme={theme}>
        <Button>Paint</Button>
        <Select label="Season" options={options} />
      </ThemeScope>
    );
  }
  const { rerender } = render(fixture(first));
  const trigger = screen.getByRole("combobox");
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("option", { name: "Autumn" }));
  trigger.focus();
  rerender(fixture(second));
  expect(screen.getByRole("combobox")).toBe(trigger);
  expect(trigger.textContent).toContain("Autumn");
  expect(document.activeElement).toBe(trigger);
  await expect.poll(() => background(button("Paint"))).toBe("rgb(81, 82, 83)");
});
