import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Button } from "../../../components/Button/Button";
import {
  Checkbox,
  type CheckboxIndicatorContext,
} from "../../../components/Checkbox/Checkbox";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

afterEach(cleanup);
const accent = "rgb(91, 37, 52)";
const theme = defineTheme({
  name: "Indicators",
  components: {
    Button: { parts: { spinner: { color: accent } } },
    Checkbox: { parts: { icon: { color: accent } } },
  },
});
function indicator({
  props,
  size,
  checked,
  indeterminate,
  disabled,
}: CheckboxIndicatorContext) {
  return (
    <span {...props} data-size={size}>
      {[checked, indeterminate, disabled].join(",")}
    </span>
  );
}
it("keeps custom indicators themed, decorative and synchronized with native form reset", async () => {
  render(
    <ThemeScope theme={theme}>
      <form>
        <Button
          loading
          renderLoadingIndicator={({ props }) => (
            <span {...props}>Working</span>
          )}
        >
          Save
        </Button>
        <Checkbox defaultChecked label="Copies" renderIndicator={indicator} />
        <button type="reset">Reset</button>
      </form>
    </ThemeScope>,
  );
  const input = screen.getByRole("checkbox", {
    name: "Copies",
  }) as HTMLInputElement;
  expect(getComputedStyle(screen.getByText("Working")).color).toBe(accent);
  expect(
    screen.getByRole("button", { name: "Save" }).matches(":disabled"),
  ).toBe(true);
  const mark = screen.getByText("true,false,false");
  expect(mark.getAttribute("aria-hidden")).toBe("true");
  expect(getComputedStyle(mark).color).toBe(accent);
  await userEvent.tab();
  expect(document.activeElement).toBe(input);
  await userEvent.keyboard(" ");
  expect(mark.textContent).toBe("false,false,false");
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));
  await expect.poll(() => mark.textContent).toBe("true,false,false");
  expect(input.checked).toBe(true);
});
it("reflects controlled mixed and disabled state", () => {
  const { rerender } = render(
    <Checkbox
      disabled
      indeterminate
      checked={false}
      label="All"
      renderIndicator={indicator}
    />,
  );
  expect((screen.getByRole("checkbox") as HTMLInputElement).indeterminate).toBe(
    true,
  );
  expect(screen.getByText("false,true,true").getAttribute("data-size")).toBe(
    "24",
  );
  rerender(
    <Checkbox checked readOnly label="All" renderIndicator={indicator} />,
  );
  expect(screen.getByText("true,false,false")).toBeTruthy();
});
