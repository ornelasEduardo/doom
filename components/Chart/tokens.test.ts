/**
 * Token discipline.
 *
 * An undefined CSS custom property fails silently: `stroke: var(--nope)` is
 * invalid, so SVG falls back to its initial value and the mark simply does not
 * draw. That is how the drag ghost's connector went invisible — it referenced
 * a --text-tertiary that no theme defines.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
};

const readAll = (dir: string, extensions: string[]) =>
  walk(dir)
    .filter((f) => extensions.some((e) => f.endsWith(e)))
    .filter((f) => !f.includes(".test."))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");

describe("CSS custom properties", () => {
  it("only references tokens that are defined somewhere", () => {
    const chartSource = readAll("components/Chart", [".ts", ".tsx", ".scss"]);
    const definitions =
      readAll("styles", [".scss", ".ts"]) + "\n" + chartSource;

    const referenced = new Set(
      [...chartSource.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((m) => m[1]),
    );

    const undefinedTokens = [...referenced].filter((token) => {
      // Declared in SCSS as `--token:` or in a theme object as `"--token":`.
      const declared = new RegExp(`(^|[\\s{;"'])${token}["']?\\s*:`, "m");
      return !declared.test(definitions);
    });

    expect(undefinedTokens).toEqual([]);
  });
});
