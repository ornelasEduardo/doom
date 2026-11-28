import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { defineTheme, resolveTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

const normal = "rgb(11, 22, 33)";
const selected = "rgb(44, 55, 66)";
const disabled = "rgb(77, 88, 99)";
const theme = defineTheme({
  name: "Selector alternatives",
  components: {
    Button: {
      parts: {
        root: {
          color: normal,
          states: {
            selected: { color: selected },
            disabled: { color: disabled },
          },
        },
      },
      sizes: { sm: { root: { padding: "7px" } } },
      variants: { secondary: { root: { borderRadius: "11px" } } },
      compoundVariants: [
        {
          when: { size: "sm", variant: "secondary" },
          parts: { root: { borderWidth: "3px", borderStyle: "solid" } },
        },
      ],
    },
  },
});
const id = resolveTheme(theme).id;
afterEach(cleanup);
for (const classes of [true, false]) {
  it(`preserves states, variants, sizes and compounds with ${classes ? "only classes" : "only attributes"}`, () => {
    const prefix = `doom-${id}-Button-root`;
    render(
      <ThemeScope theme={theme}>
        <button
          {...(classes
            ? {
                className: `${prefix} ${prefix}--size-sm ${prefix}--variant-secondary`,
              }
            : {
                "data-doom-theme": id,
                "data-doom-component": "Button",
                "data-doom-part": "root",
                "data-doom-size": "sm",
                "data-doom-variant": "secondary",
              })}
        >
          Control
        </button>
      </ThemeScope>,
    );
    const button = screen.getByRole<HTMLButtonElement>("button");
    const style = () => getComputedStyle(button);
    expect(style().color).toBe(normal);
    expect(style().paddingTop).toBe("7px");
    expect(style().borderRadius).toBe("11px");
    expect(style().borderTopWidth).toBe("3px");
    button.setAttribute("aria-current", "page");
    expect(style().color).toBe(selected);
    button.disabled = true;
    expect(style().color).toBe(disabled);
    button.disabled = false;
    button.removeAttribute("aria-current");
    expect(style().color).toBe(normal);
  });
}

it("keeps generated state selectors below consumer rules in the same layer", () => {
  render(
    <ThemeScope theme={theme}>
      <style>
        {"@layer doom.theme { button { color: rgb(101, 102, 103); } }"}
      </style>
      <button
        disabled
        className={`doom-${id}-Button-root`}
        data-doom-component="Button"
        data-doom-part="root"
        data-doom-theme={id}
      >
        Overridden
      </button>
    </ThemeScope>,
  );
  expect(getComputedStyle(screen.getByRole("button")).color).toBe(
    "rgb(101, 102, 103)",
  );
});
