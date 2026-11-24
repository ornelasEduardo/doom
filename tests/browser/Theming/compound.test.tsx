import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { Card } from "../../../components/Card/Card";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { compileTheme } from "../../../styles/theming/compileTheme";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

afterEach(cleanup);

const paper = defineTheme({
  name: "Paper",
  foundations: { fonts: { body: "monospace" } },
  components: {
    Card: { parts: { root: { borderRadius: "19px" } } },
    Checkbox: {
      parts: {
        checkboxDisplay: {
          borderRadius: "3px",
          states: { checked: { borderRadius: "21px" } },
        },
      },
    },
  },
});

it("applies Card.root to both the convenience and explicit root components", () => {
  render(
    <ThemeScope theme={paper}>
      <Card>Convenience</Card>
      <Card.Root>Explicit</Card.Root>
    </ThemeScope>,
  );
  for (const text of ["Explicit", "Convenience"]) {
    expect(getComputedStyle(screen.getByText(text)).borderTopLeftRadius).toBe(
      "19px",
    );
  }
});

it("applies root instance classes to its compound parts and isolates nested Card instances", () => {
  render(
    <ThemeScope theme={paper}>
      <style>
        {
          ".outer-header { letter-spacing: 4px } .inner-header { letter-spacing: 8px }"
        }
      </style>
      <Card.Root classNames={{ header: "outer-header" }}>
        <Card.Header>Outer</Card.Header>
        <Card.Root classNames={{ header: "inner-header" }}>
          <Card.Header>Inner</Card.Header>
        </Card.Root>
      </Card.Root>
    </ThemeScope>,
  );
  expect(getComputedStyle(screen.getByText("Outer")).letterSpacing).toBe("4px");
  expect(getComputedStyle(screen.getByText("Inner")).letterSpacing).toBe("8px");
});

it("updates the visible checkbox indicator recipe when an uncontrolled input changes", async () => {
  render(
    <ThemeScope theme={paper}>
      <Checkbox classNames={{ checkboxDisplay: "indicator" }} label="Enable" />
    </ThemeScope>,
  );
  const indicator = document.querySelector(".indicator")!;
  expect(getComputedStyle(indicator).borderTopLeftRadius).toBe("3px");
  await userEvent.click(screen.getByText("Enable"));
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  await expect
    .poll(() => getComputedStyle(indicator).borderTopLeftRadius)
    .toBe("21px");
});

it("inherits a precompiled manifest and scoped typography through nested external boundaries", () => {
  const compiled = compileTheme(paper);
  const { container } = render(
    <>
      <style>{compiled.css}</style>
      <ThemeScope
        styleManifest={compiled.manifest}
        styleStrategy="external"
        theme={paper}
      >
        <ThemeScope surface="solid">
          <Card.Root>External</Card.Root>
        </ThemeScope>
      </ThemeScope>
    </>,
  );
  expect(container.querySelector("style[data-doom-styles]")).toBeNull();
  const part = screen.getByText("External");
  expect(getComputedStyle(part).fontFamily).toBe("monospace");
  expect(getComputedStyle(part).borderTopLeftRadius).toBe("19px");
});

it("preserves an asChild host's explicit direction when the scope omits dir", () => {
  render(
    <ThemeScope asChild theme={paper}>
      <section dir="rtl">Arabic</section>
    </ThemeScope>,
  );
  expect(getComputedStyle(screen.getByText("Arabic")).direction).toBe("rtl");
});

it("observes system preference changes through a nested inherited scope without remounting its control", async () => {
  let dark = false;
  const preference = new EventTarget();
  const original = window.matchMedia.bind(window);
  const spy = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    if (query !== "(prefers-color-scheme: dark)") {
      return original(query);
    }
    return Object.assign(preference, {
      matches: dark,
      media: query,
    }) as MediaQueryList;
  });
  try {
    const theme = defineTheme({
      name: "System",
      defaultMode: "light",
      modes: {
        light: { foundations: { fonts: { body: "serif" } } },
        dark: { foundations: { fonts: { body: "monospace" } } },
      },
    });
    render(
      <ThemeScope mode="system" theme={theme}>
        <ThemeScope>
          <input aria-label="Draft" defaultValue="Saved" />
        </ThemeScope>
      </ThemeScope>,
    );
    const input = screen.getByRole("textbox");
    const owner = input.parentElement!;
    expect(getComputedStyle(owner).fontFamily).toBe("serif");
    dark = true;
    Object.assign(preference, { matches: true });
    act(() => preference.dispatchEvent(new Event("change")));
    expect(getComputedStyle(owner).fontFamily).toBe("monospace");
    expect(screen.getByRole("textbox")).toBe(input);
  } finally {
    spy.mockRestore();
  }
});
