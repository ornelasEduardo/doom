import postcss from "postcss";
import { compile } from "sass";
import { expect, it } from "vitest";

it("ships reduced-motion rules scoped to chart plots", () => {
  const sheet = postcss.parse(
    compile("components/Chart/subcomponents/Root/Root.module.scss").css,
  );
  const selectors: string[] = [];
  sheet.walkAtRules("media", (media) => {
    if (media.params !== "(prefers-reduced-motion: reduce)") {
      return;
    }
    media.walkDecls("transition", (declaration) => {
      if (
        declaration.value === "none" &&
        declaration.parent &&
        "selector" in declaration.parent &&
        typeof declaration.parent.selector === "string"
      ) {
        selectors.push(declaration.parent.selector);
      }
    });
  });
  expect(selectors.length).toBeGreaterThan(0);
  expect(
    selectors.every(
      (selector) =>
        selector.includes(".chartContainer") &&
        selector.includes("data-chart-plot"),
    ),
  ).toBe(true);
});
