import { expect, it } from "vitest";

import {
  captainTheme,
  doomsdayTheme,
  neubrutalistTheme,
  orbitalTheme,
  vigilanteTheme,
} from "../themes/presets";
import { compileTheme, defineTheme, resolveTheme } from "./index";

it("inherits references, merges class names and compiles each context", () => {
  const parent = defineTheme({
    name: "base",
    roles: { brand: "red" },
    components: {
      Button: {
        classNames: { root: "base" },
        parts: { label: { color: "{roles.brand}" } },
      },
    },
  });
  const theme = defineTheme({
    name: "base",
    extends: parent,
    components: { Button: { classNames: { root: "custom" } } },
    modes: { light: {}, dark: { roles: { brand: "blue" } } },
    defaultMode: "light",
  });
  expect(resolveTheme(theme, "dark").components.Button?.classNames?.root).toBe(
    "base custom",
  );
  expect(compileTheme(theme).manifest).toHaveLength(6);
  expect(compileTheme(theme).css).toContain("var(--doom-roles-brand)");
  expect(resolveTheme(theme).id).not.toBe(resolveTheme(parent).id);
});
it("rejects unsafe values, cycles, unknown keys and unknown modes", () => {
  for (const brand of [
    "a;</style>",
    "unclosed[",
    "{roles.missing}",
    "{roles.brand}",
  ]) {
    expect(() => defineTheme({ name: "a", roles: { brand } })).toThrow();
  }
  expect(() => resolveTheme(defineTheme({ name: "x" }), "missing")).toThrow();
});

it("resolves every preset and Orbital material tokens", () => {
  for (const theme of [
    captainTheme,
    doomsdayTheme,
    neubrutalistTheme,
    orbitalTheme,
    vigilanteTheme,
  ]) {
    expect(compileTheme(theme).manifest).toHaveLength(3);
    expect(resolveTheme(theme).variables["--background"]).toBe(
      "var(--doom-roles-canvas)",
    );
  }
  expect(
    resolveTheme(orbitalTheme).variables["--doom-extensions-material-metal"],
  ).toBe("#c7cbc5");
});

it("starts neutral and discards inherited recipes/classes on replacement", () => {
  const theme = defineTheme({
    name: "a",
    components: {
      Button: {
        parts: { label: { color: "red" } },
        classNames: { root: "old" },
      },
    },
  });
  const child = defineTheme({
    name: "b",
    extends: theme,
    components: { Button: { replace: true, classNames: { root: "new" } } },
  });
  expect(resolveTheme(child).components.Button).toEqual({
    classNames: { root: "new" },
  });
  expect(
    resolveTheme(theme).variables["--doom-defaults-controls-press-transform"],
  ).toEqual("none");
  expect(
    resolveTheme(theme).variables["--doom-defaults-controls-focus-outline"],
  ).toContain("2px solid");
});

it("emits base, size, variant, compounds, then states with focus last", () => {
  const theme = defineTheme({
    name: "paint",
    components: {
      Button: {
        parts: {
          root: {
            color: "red",
            states: {
              focusVisible: { color: "gold" },
              disabled: { color: "gray" },
            },
          },
        },
        sizes: { sm: { root: { color: "blue" } } },
        variants: { primary: { root: { color: "green" } } },
        compoundVariants: [
          {
            when: { size: "sm", variant: "primary" },
            parts: { root: { color: "black" } },
          },
        ],
      },
    },
  });
  const css = compileTheme(theme).css;
  const indices = ["red", "blue", "green", "black", "gray", "gold"].map(
    (color) => css.indexOf("{color:" + color + "}"),
  );
  expect(indices).not.toContain(-1);
  expect(indices).toEqual([...indices].sort((a, b) => a - b));
  expect(css).toContain('[data-doom-size="sm"][data-doom-variant="primary"]');
  expect(css).toContain(":focus-visible");
});

it("rejects malformed input and unsupported recipe selectors", () => {
  const invalid = [
    { roles: { braand: "red" } },
    { roles: { brand: null } },
    { roles: { brand: { nested: "red" } } },
    { defaults: { controls: { height: "{radii.unknown}" } } },
    { extensions: { a: "{extensions.b}", b: "{extensions.a}" } },
    { components: { Button: { parts: { wrong: { color: "red" } } } } },
    { components: { Button: { variants: { huge: {} } } } },
    { components: { Button: { parts: { root: { padding: 2 } } } } },
    { components: { Button: { parts: { root: { padding: "2" } } } } },
    {
      components: { Button: { parts: { root: { background: "rgb(1 2 3" } } } },
    },
    { components: { Button: { parts: { root: { foo: "bar" } } } } },
    { components: { Button: { parts: { root: { states: { whoops: {} } } } } } },
    { components: { Button: { replace: "yes" } } },
    { extensions: JSON.parse('{"__proto__":{"x":"red"}}') },
  ];
  for (const patch of invalid) {
    expect(() => defineTheme({ name: "bad", ...patch } as never)).toThrow();
  }
});

it("isolates frozen deterministic mode identities and snapshots chart roles", () => {
  const one = defineTheme({
    name: "x",
    roles: { brand: "#112233", chartSeries1: "{roles.brand}" },
  });
  const two = defineTheme({
    name: "x",
    roles: { chartSeries1: "{roles.brand}", brand: "#112233" },
  });
  expect(compileTheme(one)).toEqual(compileTheme(two));
  const solid = resolveTheme(one, "default", "solid");
  expect(solid.variables["--doom-roles-chart-series1"]).toBe(
    "var(--doom-base-roles-chart-series1)",
  );
  expect(solid.variables["--doom-base-roles-brand"]).toBe("#112233");
  expect(Object.isFrozen(solid.variables)).toBe(true);
});

it("merges named modes across inheritance and distinguishes meaningful shorthand order", () => {
  const ancestor = defineTheme({
    name: "ancestor",
    modes: {
      dark: { components: { Button: { classNames: { root: "parent" } } } },
    },
  });
  const child = defineTheme({
    name: "child",
    extends: ancestor,
    modes: {
      dark: { components: { Button: { classNames: { root: "child" } } } },
    },
  });
  expect(resolveTheme(child).components.Button?.classNames?.root).toBe(
    "parent child",
  );
  const ordered = (root: { padding?: string; paddingLeft?: string }) =>
    resolveTheme(
      defineTheme({
        name: "same",
        components: { Button: { parts: { root } } },
      }),
    ).id;
  expect(ordered({ padding: "2px", paddingLeft: "3px" })).not.toBe(
    ordered({ paddingLeft: "3px", padding: "2px" }),
  );
});

it("reuses immutable compiled assets across repeated scopes", () => {
  const theme = defineTheme({ name: "repeated" });
  const compiled = compileTheme(theme);
  expect(compileTheme(theme)).toBe(compiled);
  expect(Object.isFrozen(compiled.manifest)).toBe(true);
  expect(compiled.css.length).toBeLessThan(40_000);
});

it("restricts recipe and token keys in the public TypeScript contract", () => {
  const check = (_patch: import("./types").ThemePatch) => undefined;
  check({
    components: {
      Button: {
        parts: { root: { WebkitLineClamp: 2, padding: "{spacing.2}" } },
      },
    },
  });
  // @ts-expect-error Unknown semantic role.
  check({ roles: { brannd: "red" } });
  // @ts-expect-error Unknown Button part.
  check({ components: { Button: { parts: { notAPart: { color: "red" } } } } });
  // @ts-expect-error Unknown public variant.
  check({ components: { Button: { variants: { special: {} } } } });
  // @ts-expect-error CSS length requires units for nonzero values.
  check({ components: { Button: { parts: { root: { padding: 4 } } } } });
  // @ts-expect-error Theme recipes cannot add disabled behavior.
  check({ components: { Button: { parts: { root: { disabled: true } } } } });
});

it("keeps class and attribute recipe selectors independently indexable", () => {
  const css = compileTheme(
    defineTheme({
      name: "Indexed",
      components: {
        Button: {
          parts: {
            root: { color: "red", states: { checked: { color: "blue" } } },
          },
        },
      },
    }),
  ).css;
  expect(css).toMatch(/:where\(\.doom-[^,]+\),:where\(\[data-doom-theme=/);
  expect(css).not.toMatch(/:where\(:is\(\.doom-[^,]+,\[data-doom-theme=/);
});
