import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemedPortal } from "../../../styles/theming/ThemedPortal";

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
