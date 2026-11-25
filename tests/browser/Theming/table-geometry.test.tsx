import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Table } from "../../../components/Table/Table";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

afterEach(cleanup);
const rows = Array.from({ length: 500 }, (_, i) => ({ name: "Row " + i }));
const columns = ["name"];
const theme = defineTheme({
  name: "Measured",
  components: { Table: { parts: { td: { padding: "5px" } } } },
});
const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

it("keeps expanded virtual details mounted throughout their measured scroll range", async () => {
  const { container } = render(
    <ThemeScope theme={theme}>
      <Table
        enableVirtualization
        columns={columns}
        data={rows}
        enableColumnFilters={false}
        enableFiltering={false}
        enablePagination={false}
        height={220}
        renderExpandedRow={(row) =>
          row.index === 0 ? (
            <div style={{ height: 1600 }}>First row details</div>
          ) : null
        }
      />
    </ThemeScope>,
  );
  const viewport = container.querySelector<HTMLElement>(
    '[data-doom-part="tableWrapper"]',
  )!;
  await userEvent.click(
    await screen.findByRole("button", { name: "Expand row" }),
  );
  const detail = screen.getByText("First row details");
  await nextFrame();
  viewport.scrollTop = 1000;
  await nextFrame();
  expect(viewport.scrollTop).toBeGreaterThan(800);
  expect(detail.isConnected).toBe(true);
  const bounds = viewport.getBoundingClientRect();
  expect(
    detail.contains(
      document.elementFromPoint(bounds.left + 20, bounds.bottom - 20),
    ),
  ).toBe(true);
  viewport.scrollTop = viewport.scrollHeight;
  await expect.poll(() => screen.queryByText("Row 499") !== null).toBe(true);
  viewport.scrollTop = 0;
  await userEvent.click(
    await within(viewport).findByRole("button", { name: "Collapse row" }),
  );
  expect(screen.queryByText("First row details")).toBeNull();
});
