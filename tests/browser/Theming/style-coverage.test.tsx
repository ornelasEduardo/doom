import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cdp, commands, userEvent } from "vitest/browser";

import { Badge } from "../../../components/Badge/Badge";
import { Button } from "../../../components/Button/Button";
import { Card } from "../../../components/Card/Card";
import { Chip } from "../../../components/Chip/Chip";
import { Pagination } from "../../../components/Pagination/Pagination";
import { Text } from "../../../components/Text/Text";
import {
  captainTheme,
  doomsdayTheme,
  neubrutalistTheme,
  orbitalTheme,
  vigilanteTheme,
} from "../../../styles/themes/presets";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

afterEach(cleanup);
it("separates control and surface border/shadow defaults", () => {
  const theme = defineTheme({
    name: "Soft",
    defaults: {
      controls: {
        height: "48px",
        borderWidth: "3px",
        shadow: "0 0 8px rgb(10, 20, 30)",
      },
      surfaces: { borderWidth: "5px", shadow: "0 0 12px rgb(50, 60, 70)" },
    },
  });
  render(
    <ThemeScope theme={theme}>
      <Button>Control</Button>
      <Card data-testid="surface">Surface</Card>
    </ThemeScope>,
  );
  const button = getComputedStyle(screen.getByRole("button"));
  const card = getComputedStyle(screen.getByTestId("surface"));
  expect(button.borderTopWidth).toBe("3px");
  expect(button.height).toBe("48px");
  expect(button.boxShadow).toContain("8px");
  expect(card.borderTopWidth).toBe("5px");
  expect(card.boxShadow).toContain("12px");
});
it("renders neutral display components without uppercase or offset shadows", () => {
  render(
    <ThemeScope theme={defineTheme({ name: "Neutral" })}>
      <Badge>Badge</Badge>
      <Chip data-testid="chip">Chip</Chip>
    </ThemeScope>,
  );
  const badge = getComputedStyle(screen.getByText("Badge"));
  expect(badge.textTransform).toBe("none");
  expect(badge.boxShadow).toBe("none");
  expect(getComputedStyle(screen.getByTestId("chip")).textTransform).toBe(
    "none",
  );
});

it("uses a project heading family and allows disabled-control paint overrides", () => {
  const theme = defineTheme({
    name: "Publication",
    foundations: { fonts: { body: "monospace", heading: "Georgia, serif" } },
    components: {
      Button: {
        parts: {
          root: {
            states: {
              disabled: { backgroundImage: "linear-gradient(red, blue)" },
            },
          },
        },
      },
    },
  });
  render(
    <ThemeScope theme={theme}>
      <Text variant="h2">Heading</Text>
      <Button disabled>Disabled</Button>
    </ThemeScope>,
  );
  expect(getComputedStyle(screen.getByRole("heading")).fontFamily).toContain(
    "Georgia",
  );
  expect(
    getComputedStyle(screen.getByRole("button")).backgroundImage,
  ).toContain("linear-gradient");
});

it("honors reduced motion for themed controls", async () => {
  await commands.setReducedMotion("reduce");
  try {
    render(
      <ThemeScope theme={defineTheme({ name: "Accessible" })}>
        <Button>Press</Button>
      </ThemeScope>,
    );
    expect(
      parseFloat(
        getComputedStyle(screen.getByRole("button")).transitionDuration,
      ),
    ).toBeLessThan(0.001);
  } finally {
    await commands.setReducedMotion("no-preference");
  }
});

it("reads canonical color and dimension overrides at the part while preserving explicit small size", () => {
  const theme = defineTheme({ name: "Overrides" });
  const local = {
    "--doom-roles-brand": "rgb(77, 88, 99)",
    "--doom-defaults-controls-height": "51px",
  } as React.CSSProperties;
  render(
    <ThemeScope theme={theme}>
      <div style={local}>
        <Button>Normal</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </div>
    </ThemeScope>,
  );
  expect(
    getComputedStyle(screen.getByRole("button", { name: "Normal" }))
      .backgroundColor,
  ).toBe("rgb(77, 88, 99)");
  expect(
    getComputedStyle(screen.getByRole("button", { name: "Normal" })).height,
  ).toBe("51px");
  expect(
    getComputedStyle(screen.getByRole("button", { name: "Small" })).height,
  ).toBe("32px");
  expect(
    getComputedStyle(screen.getByRole("button", { name: "Large" })).height,
  ).toBe("48px");
});

it("keeps visible keyboard focus in forced colors across shipped presets", async () => {
  const session = cdp();
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  try {
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const themes = [
      neubrutalistTheme,
      doomsdayTheme,
      captainTheme,
      vigilanteTheme,
      orbitalTheme,
    ];
    render(
      <>
        {themes.map((theme) => (
          <ThemeScope key={theme.name} theme={theme}>
            <Button>{theme.name}</Button>
          </ThemeScope>
        ))}
      </>,
    );
    for (const theme of themes) {
      await userEvent.tab();
      const button = screen.getByRole("button", { name: theme.name });
      expect(document.activeElement).toBe(button);
      const style = getComputedStyle(button);
      expect(style.outlineStyle).toBe("solid");
      expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    }
  } finally {
    await session.send("Emulation.setEmulatedMedia", { features: [] });
  }
});

it("maps selected navigation styling to the current page", () => {
  const theme = defineTheme({
    name: "Navigator",
    components: {
      Pagination: {
        parts: {
          button: {
            states: { selected: { outline: "4px dotted rgb(1, 2, 3)" } },
          },
        },
      },
    },
  });
  render(
    <ThemeScope theme={theme}>
      <Pagination currentPage={2} totalPages={3} onPageChange={() => {}} />
    </ThemeScope>,
  );
  expect(
    getComputedStyle(screen.getByRole("button", { name: "2" })).outlineStyle,
  ).toBe("dotted");
  expect(
    getComputedStyle(screen.getByRole("button", { name: "1" })).outlineStyle,
  ).not.toBe("dotted");
});
