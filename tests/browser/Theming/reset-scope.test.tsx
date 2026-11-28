import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemedPortal } from "../../../styles/theming/ThemedPortal";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

const modern = defineTheme({ name: "Reset isolation" });
afterEach(cleanup);

it("resets legacy content and portals without resetting an adjacent object theme", () => {
  render(
    <>
      <DesignSystemProvider initialTheme="captain">
        <p data-testid="legacy">Legacy paragraph</p>
        <ThemedPortal>
          <p data-testid="portal">Portal paragraph</p>
        </ThemedPortal>
      </DesignSystemProvider>
      <DesignSystemProvider theme={modern}>
        <p data-testid="modern">Modern paragraph</p>
      </DesignSystemProvider>
    </>,
  );
  expect(getComputedStyle(screen.getByTestId("legacy")).marginTop).toBe("0px");
  expect(getComputedStyle(screen.getByTestId("portal")).marginTop).toBe("0px");
  expect(
    parseFloat(getComputedStyle(screen.getByTestId("modern")).marginTop),
  ).toBeGreaterThan(0);
});

it("does not emit a document-wide descendant search for legacy providers", () => {
  render(
    <DesignSystemProvider theme={modern}>
      <p>Modern</p>
    </DesignSystemProvider>,
  );
  const selectors: string[] = [];
  function collect(rules: CSSRuleList) {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        selectors.push(rule.selectorText);
      }
      if ("cssRules" in rule) {
        collect((rule as CSSGroupingRule).cssRules);
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    collect(sheet.cssRules);
  }
  expect(selectors.join("\n")).not.toMatch(
    /(?:html|body):has\(\[data-doom-legacy\]/,
  );
});

it("retains the full-height document contract for a withBody provider", () => {
  const previous = document.body.getAttribute("data-doom-legacy");
  try {
    document.body.setAttribute("data-doom-legacy", "");
    expect(document.documentElement.getBoundingClientRect().height).toBe(
      window.innerHeight,
    );
    expect(document.body.getBoundingClientRect().height).toBe(
      window.innerHeight,
    );
    expect(getComputedStyle(document.body).marginTop).toBe("0px");
  } finally {
    if (previous === null) {
      document.body.removeAttribute("data-doom-legacy");
    } else {
      document.body.setAttribute("data-doom-legacy", previous);
    }
  }
});

it("preserves typography supplied by the legacy provider class", () => {
  render(
    <>
      <style>{`.legacy-application-font { font-family: monospace; font-size: 21px; line-height: 2; color: rgb(12, 34, 56); }`}</style>
      <DesignSystemProvider
        fontClassName="legacy-application-font"
        initialTheme="captain"
      >
        <ThemeScope>
          <div data-testid="custom-font">Application typography</div>
        </ThemeScope>
      </DesignSystemProvider>
    </>,
  );
  const style = getComputedStyle(screen.getByTestId("custom-font"));
  expect(style.fontFamily).toBe("monospace");
  expect(style.fontSize).toBe("21px");
  expect(style.lineHeight).toBe("42px");
  expect(style.color).toBe("rgb(12, 34, 56)");
});

it("inherits body typography in legacy portals under withBody", () => {
  const previous = document.body.getAttribute("data-doom-legacy");
  const previousStyle = document.body.getAttribute("style");
  try {
    document.body.setAttribute("data-doom-legacy", "");
    document.body.style.fontFamily = "monospace";
    document.body.style.fontSize = "21px";
    render(
      <DesignSystemProvider initialTheme="captain">
        <ThemedPortal>
          <div data-testid="body-portal">Portal typography</div>
        </ThemedPortal>
      </DesignSystemProvider>,
    );
    const style = getComputedStyle(screen.getByTestId("body-portal"));
    expect(style.fontFamily).toBe("monospace");
    expect(style.fontSize).toBe("21px");
  } finally {
    for (const [name, value] of [
      ["data-doom-legacy", previous],
      ["style", previousStyle],
    ] as const) {
      if (value === null) {
        document.body.removeAttribute(name);
      } else {
        document.body.setAttribute(name, value);
      }
    }
  }
});
