import React from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import { captainTheme, neubrutalistTheme } from "../themes/presets";
import { useTheme } from "../themes/ThemeProvider";
import { defineTheme, resolveTheme } from "./defineTheme";
import { ThemeScope, useResolvedTheme } from "./ThemeScope";

function Identity() {
  return <output>{useResolvedTheme().id}</output>;
}

it("provides the neubrutalist resolved identity at the default provider", () => {
  expect(
    renderToString(
      <DesignSystemProvider>
        <Identity />
      </DesignSystemProvider>,
    ),
  ).toContain(resolveTheme(neubrutalistTheme).id);
});

it("derives override scopes from a string-selected root preset", () => {
  const patch = { roles: { focus: "tomato" } };
  const expected = defineTheme({
    ...patch,
    extends: captainTheme,
    name: captainTheme.name,
  });
  expect(
    renderToString(
      <DesignSystemProvider initialTheme="captain">
        <ThemeScope overrides={patch}>
          <Identity />
        </ThemeScope>
      </DesignSystemProvider>,
    ),
  ).toContain(resolveTheme(expected).id);
});

it("diagnoses legacy hook calls beneath an explicit object scope", () => {
  function LegacyProbe() {
    return <output>{useTheme().theme}</output>;
  }
  expect(() =>
    renderToString(
      <DesignSystemProvider initialTheme="captain">
        <ThemeScope theme={neubrutalistTheme}>
          <LegacyProbe />
        </ThemeScope>
      </DesignSystemProvider>,
    ),
  ).toThrow(/object|useResolvedTheme|migration/i);
});

it("accepts a typed CSS property for multiline truncation", () => {
  expect(() =>
    defineTheme({
      name: "clamp",
      components: { Button: { parts: { label: { WebkitLineClamp: "2" } } } },
    }),
  ).not.toThrow();
});

it("writes the supplied CSP nonce on all legacy adapter styles", () => {
  const html = renderToString(
    <DesignSystemProvider initialTheme="captain" nonce="legacy-nonce">
      <Identity />
    </DesignSystemProvider>,
  );
  const tags = html.match(/<style\b[^>]*>/g) ?? [];
  expect(tags.length).toBeGreaterThan(1);
  expect(tags.every((tag) => tag.includes('nonce="legacy-nonce"'))).toBe(true);
});
