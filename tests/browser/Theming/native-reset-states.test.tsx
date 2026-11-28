import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

const checkedColor = "rgb(12, 34, 56)";
const invalidColor = "rgb(76, 54, 32)";
const disabledColor = "rgb(23, 45, 67)";
const focusColor = "rgb(87, 65, 43)";
const theme = defineTheme({
  name: "Native reset states",
  components: {
    Checkbox: {
      parts: {
        checkboxDisplay: {
          backgroundColor: "transparent",
          border: "2px solid transparent",
          states: {
            checked: { backgroundColor: checkedColor },
            invalid: { color: invalidColor },
            disabled: { borderColor: disabledColor },
            focusVisible: { outline: `3px solid ${focusColor}` },
          },
        },
      },
    },
  },
});
afterEach(cleanup);

for (const legacy of [false, true]) {
  it(`preserves native checked, invalid, disabled, focus and form reset (${legacy ? "legacy" : "object"} host)`, async () => {
    const content = (
      <ThemeScope theme={theme}>
        <form>
          <Checkbox defaultChecked required label="Remember" />
          <button type="reset">Reset</button>
        </form>
      </ThemeScope>
    );
    const { container } = render(
      legacy ? (
        <DesignSystemProvider initialTheme="captain">
          {content}
        </DesignSystemProvider>
      ) : (
        content
      ),
    );
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    const display = container.querySelector(
      '[data-doom-part="checkboxDisplay"]',
    )!;
    const style = () => getComputedStyle(display);
    await expect.poll(() => style().backgroundColor).toBe(checkedColor);
    // Focus the native control directly: WebKit on macOS can exclude controls
    // from Tab navigation depending on the OS keyboard-navigation preference.
    await userEvent.keyboard("{Tab}");
    input.focus();
    expect(input.matches(":focus-visible")).toBe(true);
    await expect.poll(() => style().outlineColor).toBe(focusColor);
    await userEvent.keyboard(" ");
    expect(input.checked).toBe(false);
    expect(input.matches(":invalid")).toBe(true);
    await expect.poll(() => style().backgroundColor).not.toBe(checkedColor);
    await expect.poll(() => style().color).toBe(invalidColor);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await expect.poll(() => input.checked).toBe(true);
    await expect.poll(() => style().backgroundColor).toBe(checkedColor);
    input.disabled = true;
    await expect.poll(() => style().borderTopColor).toBe(disabledColor);
  });
}
