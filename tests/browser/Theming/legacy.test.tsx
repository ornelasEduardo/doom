import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Button } from "../../../components/Button/Button";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { defineTheme } from "../../../styles/theming/defineTheme";

afterEach(cleanup);
it("preserves descendant legacy variables while isolating adjacent object themes", () => {
  const modern = defineTheme({
    name: "Isolated",
    roles: { brand: "rgb(11, 22, 33)" },
  });
  render(
    <>
      <DesignSystemProvider initialTheme="captain">
        <div style={{ "--primary": "rgb(44, 55, 66)" } as React.CSSProperties}>
          <Button>Legacy local</Button>
        </div>
        <DesignSystemProvider theme={modern}>
          <Button>Modern nested</Button>
        </DesignSystemProvider>
      </DesignSystemProvider>
      <DesignSystemProvider theme={modern}>
        <Button>Modern sibling</Button>
      </DesignSystemProvider>
    </>,
  );
  expect(
    getComputedStyle(screen.getByRole("button", { name: "Legacy local" }))
      .backgroundColor,
  ).toBe("rgb(44, 55, 66)");
  for (const name of ["Modern nested", "Modern sibling"]) {
    expect(
      getComputedStyle(screen.getByRole("button", { name })).backgroundColor,
    ).toBe("rgb(11, 22, 33)");
  }
});
