// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { createVitest, parseCLI } from "vitest/node";

const root = process.cwd();

async function discover(command: string) {
  const scripts = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  ).scripts;
  expect(scripts[command]).toBeDefined();
  const { options } = parseCLI(scripts[command]);
  const runner = await createVitest(
    "test",
    { ...options, watch: false },
    {
      cacheDir: resolve(root, ".cache/issue95-config"),
      server: { port: 6395, strictPort: true },
    },
  );
  try {
    return (await runner.globTestSpecifications()).map((spec) => ({
      browser: spec.project.config.browser.name,
      file: spec.moduleId.slice(root.length + 1),
    }));
  } finally {
    await runner.close();
  }
}

describe("verification lanes", () => {
  it("rejects invalid test fixtures through the npm compiler command", () => {
    const dir = mkdtempSync(resolve(tmpdir(), "chart95-typecheck-"));
    try {
      writeFileSync(
        resolve(dir, "invalid.test.ts"),
        'const value: number = "invalid";\nexport { value };\n',
      );
      writeFileSync(
        resolve(dir, "tsconfig.json"),
        JSON.stringify({
          extends: resolve(root, "tsconfig.json"),
          compilerOptions: { rootDir: dir, incremental: false },
          include: ["invalid.test.ts"],
        }),
      );
      const result = spawnSync(
        "npm",
        ["run", "typecheck", "--", "--project", resolve(dir, "tsconfig.json")],
        { encoding: "utf8" },
      );
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain("invalid.test.ts(1,7): error TS2322");
      writeFileSync(
        resolve(dir, "invalid.test.ts"),
        "const value: number = 1;\nexport { value };\n",
      );
      const valid = spawnSync(
        "npm",
        ["run", "typecheck", "--", "--project", resolve(dir, "tsconfig.json")],
        { encoding: "utf8" },
      );
      expect(valid.status, valid.stdout + valid.stderr).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("includes source, browser and package test files with strict checking", () => {
    const result = spawnSync(
      "npm",
      ["run", "typecheck", "--", "--showConfig"],
      {
        encoding: "utf8",
      },
    );
    expect(result.status, result.stdout + result.stderr).toBe(0);
    const config: { compilerOptions: { strict: boolean }; files: string[] } =
      JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
    expect(config.compilerOptions.strict).toBe(true);
    expect(config.files.map((file) => resolve(root, file))).toEqual(
      expect.arrayContaining([
        resolve(root, "components/Chart/engine/Engine.test.ts"),
        resolve(root, "tests/browser/Chart/interaction.test.tsx"),
        resolve(root, "tests/package/imports.test.ts"),
      ]),
    );
  });

  it("keeps all components in Chromium and runs core Chart tests in every engine", async () => {
    const chromium = await discover("test:browser");
    expect(new Set(chromium.map(({ browser }) => browser))).toEqual(
      new Set(["chromium"]),
    );
    expect(
      chromium.some(
        ({ file }) => file === "tests/browser/Chip/keyboard.test.tsx",
      ),
    ).toBe(true);
    const matrix = await discover("test:browser:chart");
    expect(new Set(matrix.map(({ browser }) => browser))).toEqual(
      new Set(["chromium", "firefox", "webkit"]),
    );
    for (const browser of ["chromium", "firefox", "webkit"]) {
      const files = matrix
        .filter((entry) => entry.browser === browser)
        .map(({ file }) => file);
      const core = chromium
        .map(({ file }) => file)
        .filter(
          (file) =>
            file.startsWith("tests/browser/Chart/") &&
            !file.endsWith("/touch.test.tsx"),
        );
      expect(core).toEqual(
        expect.arrayContaining([
          "tests/browser/Chart/interaction.test.tsx",
          "tests/browser/Chart/domains.test.tsx",
          "tests/browser/Chart/stacking.test.tsx",
        ]),
      );
      expect(files).toEqual(expect.arrayContaining(core));
      expect(
        files.every((file) => file.startsWith("tests/browser/Chart/")),
      ).toBe(true);
      if (browser !== "chromium") {
        expect(files).not.toContain("tests/browser/Chart/touch.test.tsx");
      }
    }
  }, 30000);
});
