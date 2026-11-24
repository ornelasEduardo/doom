import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import {
  Accordion,
  AccordionItem,
} from "../../../components/Accordion/Accordion";
import { Combobox } from "../../../components/Combobox/Combobox";
import { Pagination } from "../../../components/Pagination/Pagination";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../components/RadioGroup/RadioGroup";
import { Sidebar } from "../../../components/Sidebar/Sidebar";
import { Switch } from "../../../components/Switch/Switch";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

const accent = "rgb(23, 41, 99)";
const selected = { states: { selected: { backgroundColor: accent } } };
const expanded = { states: { expanded: { backgroundColor: accent } } };
const checked = { states: { checked: { backgroundColor: accent } } };
const theme = defineTheme({
  name: "State tests",
  components: {
    Accordion: { parts: { contentBody: expanded } },
    Combobox: { parts: { option: { ...selected, height: "78px" } } },
    Pagination: { parts: { button: selected } },
    RadioGroup: { parts: { radioCircle: checked } },
    Switch: { parts: { toggle: checked } },
    Sidebar: {
      parts: {
        item: selected,
        sectionTrigger: selected,
        sectionContent: expanded,
      },
    },
  },
});
afterEach(cleanup);
const options = Array.from({ length: 100 }, (_, i) => ({
  value: String(i),
  label: "Option " + i,
}));
function Options() {
  const [value, change] = React.useState<string | string[] | undefined>([]);
  return (
    <Combobox
      inline
      multiple
      options={options}
      searchable={false}
      value={value}
      onChange={change}
    />
  );
}
it("measures adjacent virtual options and reflects individual and select-all state", async () => {
  render(
    <ThemeScope theme={theme}>
      <Options />
    </ThemeScope>,
  );
  const first = await screen.findByRole("button", { name: "Option 0" });
  const second = screen.getByRole("button", { name: "Option 1" });
  await expect
    .poll(
      () =>
        second.getBoundingClientRect().top -
        first.getBoundingClientRect().bottom,
    )
    .toBeCloseTo(0);
  await userEvent.click(first);
  await expect.poll(() => getComputedStyle(first).backgroundColor).toBe(accent);
  const all = screen.getByRole("button", { name: "All" });
  await userEvent.click(all);
  await expect.poll(() => getComputedStyle(all).backgroundColor).toBe(accent);
  expect(getComputedStyle(second).backgroundColor).toBe(accent);
});
it("reflects the native radio, switch, active page and expanded accordion state", async () => {
  const { container } = render(
    <ThemeScope theme={theme}>
      <Switch checked readOnly label="Enabled" />
      <RadioGroup defaultValue="yes">
        <RadioGroupItem value="yes">Yes</RadioGroupItem>
      </RadioGroup>
      <Pagination currentPage={2} totalPages={3} onPageChange={() => {}} />
      <Accordion>
        <AccordionItem trigger="Details" value="details">
          Body
        </AccordionItem>
      </Accordion>
    </ThemeScope>,
  );
  for (const name of ["radioCircle", "toggle"]) {
    expect(
      getComputedStyle(
        container.querySelector('[data-doom-part="' + name + '"]')!,
      ).backgroundColor,
    ).toBe(accent);
  }
  expect(
    getComputedStyle(screen.getByRole("button", { name: "2" })).backgroundColor,
  ).toBe(accent);
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(getComputedStyle(screen.getByText("Body")).backgroundColor).toBe(
    accent,
  );
});
it("reflects active section and expanded group states on the sidebar surface", () => {
  const { container } = render(
    <ThemeScope theme={theme}>
      <Sidebar activeItem="/east" activeSection="sales">
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={null} id="sales" label="Sales">
            <Sidebar.Group expanded id="region" label="Regions">
              <Sidebar.Item href="/east">East</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>
    </ThemeScope>,
  );
  expect(
    getComputedStyle(screen.getByRole("button", { name: "Sales" }))
      .backgroundColor,
  ).toBe(accent);
  expect(
    getComputedStyle(screen.getByRole("link", { name: "East" }))
      .backgroundColor,
  ).toBe(accent);
  const panels = container.querySelectorAll(
    '[data-doom-part="sectionContent"]',
  );
  expect(panels.length).toBe(2);
  panels.forEach((panel) =>
    expect(getComputedStyle(panel).backgroundColor).toBe(accent),
  );
});
