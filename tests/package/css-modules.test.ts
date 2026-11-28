import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import postcss, { type AtRule, type Plugin } from "postcss";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const localByDefault =
  require("postcss-modules-local-by-default") as (options: {
    mode: "pure";
  }) => Plugin;

const dist = resolve("dist");

async function validateModule(css: string, from: string) {
  return postcss([localByDefault({ mode: "pure" })]).process(css, { from });
}

describe("Published stylesheet compatibility", () => {
  it("rejects global-only selectors like Next.js CSS Modules", async () => {
    await expect(
      validateModule(
        ":global([data-chart-plot]) { opacity: 0; }",
        "regression.module.css",
      ),
    ).rejects.toThrow("is not pure");
  });

  it("ships CSS Modules accepted by pure-mode consumers", async () => {
    const files = (await readdir(dist, { recursive: true })).filter((file) =>
      file.endsWith(".module.css"),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const path = resolve(dist, file);
      await validateModule(await readFile(path, "utf8"), path);
    }
  });

  it("loads global chart paint rules as a separate stylesheet", async () => {
    const scene = resolve(dist, "components/Chart/rendering/scene.js");
    expect(await readFile(scene, "utf8")).toMatch(
      /import ["']\.\/scene\.css["']/,
    );
    const css = await readFile(
      resolve(dist, "components/Chart/rendering/scene.css"),
      "utf8",
    );
    const root = postcss.parse(css);
    const layers = new Map<string, string | undefined>();
    const rules = new Map<string, string>();
    root.walkRules((rule) => {
      const parent = rule.parent;
      layers.set(
        rule.selector,
        parent?.type === "atrule" && (parent as AtRule).name === "layer"
          ? (parent as AtRule).params
          : undefined,
      );
      rule.walkDecls((decl) => {
        rules.set(
          `${rule.selector}:${decl.prop}`,
          decl.value + (decl.important ? " !important" : ""),
        );
      });
    });
    // Suppression must beat layered theme paint; transition reset stays layered.
    expect(layers.get("[data-chart-plot]")).toBeUndefined();
    expect(layers.get("[data-chart-gpu-mark]")).toBeUndefined();
    expect(layers.get("[data-chart-plot] [data-chart-gpu-mark]")).toBe(
      "doom.components",
    );
    const manifest = JSON.parse(
      await readFile(resolve("package.json"), "utf8"),
    );
    expect(manifest.sideEffects).toContain("**/*.css");
    expect(rules.get("[data-chart-plot]:--chart-gpu-paint-filter")).toBe(
      "opacity(0)",
    );
    expect(rules.get("[data-chart-gpu-mark]:filter")).toBe(
      "var(--chart-gpu-paint-filter, opacity(0)) !important",
    );
    expect(
      rules.get("[data-chart-plot] [data-chart-gpu-mark]:transition"),
    ).toBe("none");
  });
});
