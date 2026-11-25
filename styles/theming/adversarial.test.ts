import { expect, it } from "vitest";

import { compileTheme } from "./compileTheme";
import { defineTheme, resolveTheme } from "./defineTheme";

it("keeps CSS behavior identical whenever two definitions share a content identity", () => {
  const one = defineTheme({
    name: "paper",
    components: {
      Button: {
        parts: {
          root: { margin: "0", marginLeft: "5px" },
        },
      },
    },
  });
  const two = defineTheme({
    name: "paper",
    components: {
      Button: {
        parts: {
          root: { marginLeft: "5px", margin: "0" },
        },
      },
    },
  });
  if (resolveTheme(one).id === resolveTheme(two).id) {
    expect(compileTheme(one).css === compileTheme(two).css).toBe(true);
  }
});

it("discards inherited same-mode recipes and classes when the child mode replaces them", () => {
  const parent = defineTheme({
    name: "paper",
    modes: {
      dark: {
        components: {
          Button: {
            classNames: { label: "parent" },
            parts: { root: { color: "red" } },
          },
        },
      },
    },
  });
  const child = defineTheme({
    name: "ink",
    extends: parent,
    modes: {
      dark: {
        components: {
          Button: { replace: true, classNames: { root: "child" } },
        },
      },
    },
  });
  expect(resolveTheme(child, "dark").components.Button).toEqual({
    classNames: { root: "child" },
  });
});

it("concatenates class names across inherited mode patches", () => {
  const parent = defineTheme({
    name: "paper",
    modes: {
      dark: {
        components: {
          Button: { classNames: { root: "parent" } },
        },
      },
    },
  });
  const child = defineTheme({
    name: "ink",
    extends: parent,
    modes: {
      dark: {
        components: { Button: { classNames: { root: "child" } } },
      },
    },
  });
  expect(resolveTheme(child, "dark").components.Button?.classNames?.root).toBe(
    "parent child",
  );
});

it("treats an explicitly undefined child class name as inheritance", () => {
  const parent = defineTheme({
    name: "paper",
    components: { Button: { classNames: { root: "parent" } } },
  });
  const child = defineTheme({
    name: "ink",
    extends: parent,
    components: { Button: { classNames: { root: undefined } } },
  });
  expect(resolveTheme(child).components.Button?.classNames?.root).toBe(
    "parent",
  );
});

it("rejects extension paths that flatten to the same CSS variable", () => {
  expect(() =>
    defineTheme({
      name: "paper",
      extensions: { "soft-blue": "red", soft: { blue: "blue" } },
    }),
  ).toThrow();
});
