import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { compileTheme } from "./compileTheme";
import { defineTheme } from "./defineTheme";
import { ThemedPortal } from "./ThemedPortal";
import { ThemeScope, useResolvedTheme } from "./ThemeScope";

function Probe({ label }: { label: string }) {
  const theme = useResolvedTheme();
  const [count, setCount] = useState(0);
  return (
    <button
      data-testid={label}
      data-theme={theme.id}
      onClick={() => setCount(count + 1)}
    >
      {count}
    </button>
  );
}
const red = () => defineTheme({ name: "same", roles: { brand: "red" } });
const blue = () => defineTheme({ name: "same", roles: { brand: "blue" } });

describe("scoped themes", () => {
  it("isolates nested same-name themes and preserves interaction state on switching", () => {
    const a = red();
    const b = blue();
    const ui = (theme: typeof a) => (
      <ThemeScope theme={theme}>
        <Probe label="outer" />
        <ThemeScope theme={b}>
          <Probe label="inner" />
        </ThemeScope>
      </ThemeScope>
    );
    const { rerender } = render(ui(a));
    expect(screen.getByTestId("outer").dataset.theme).not.toBe(
      screen.getByTestId("inner").dataset.theme,
    );
    fireEvent.click(screen.getByTestId("outer"));
    rerender(ui(b));
    expect(screen.getByTestId("outer").textContent).toBe("1");
    expect(screen.getByTestId("outer").dataset.theme).toBe(
      screen.getByTestId("inner").dataset.theme,
    );
  });
  it("provides initial CSS in SSR without document globals", () => {
    const html = renderToString(
      <ThemeScope nonce="abc" theme={red()}>
        <Probe label="ssr" />
      </ThemeScope>,
    );
    expect(html).toContain("<style");
    expect(html).toContain('nonce="abc"');
    expect(html).toContain("data-doom-scope");
    expect(html).not.toContain(":root:root");
  });
  it("bridges theme tokens and identity into portals", () => {
    const theme = blue();
    render(
      <ThemeScope theme={theme}>
        <Probe label="owner" />
        <ThemedPortal>
          <Probe label="portal" />
        </ThemedPortal>
      </ThemeScope>,
    );
    expect(screen.getByTestId("portal").dataset.theme).toBe(
      screen.getByTestId("owner").dataset.theme,
    );
    expect(screen.getByTestId("portal").closest("[data-doom-scope]")).not.toBe(
      screen.getByTestId("owner").closest("[data-doom-scope]"),
    );
  });
  it("requires external manifests and prohibits implicit runtime derived styles", () => {
    const theme = red();
    expect(() =>
      renderToString(
        <ThemeScope styleStrategy="external" theme={theme}>
          <Probe label="x" />
        </ThemeScope>,
      ),
    ).toThrow(/manifest/i);
    const html = renderToString(
      <ThemeScope
        styleManifest={compileTheme(theme).manifest}
        styleStrategy="external"
        theme={theme}
      >
        <Probe label="external" />
      </ThemeScope>,
    );
    expect(html).not.toContain("<style");
    expect(() =>
      renderToString(
        <ThemeScope
          styleManifest={compileTheme(theme).manifest}
          styleStrategy="external"
          theme={theme}
        >
          <ThemeScope overrides={{ roles: { brand: "green" } }}>
            <Probe label="derived" />
          </ThemeScope>
        </ThemeScope>,
      ),
    ).toThrow(/precompil|overrides/i);
  });
});

it("deduplicates repeated sibling theme assets during server rendering", () => {
  const theme = red();
  const html = renderToString(
    <>
      {Array.from({ length: 20 }, (_, i) => (
        <ThemeScope key={i} theme={theme}>
          <Probe label={String(i)} />
        </ThemeScope>
      ))}
    </>,
  );
  expect((html.match(/<style/g) ?? []).length).toBe(1);
});
