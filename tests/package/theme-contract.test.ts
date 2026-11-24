import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import ts from "typescript";
import { expect, it } from "vitest";

it("loads published theme subpaths in Node without React, charts or DOM access", () => {
  const loader = `
    export function resolve(specifier, context, next) {
      if (/^(react(?:-dom)?(?:\\/|$)|d3-|lucide-react)|components\\//.test(specifier)) throw Error(specifier);
      return next(specifier, context);
    }
  `;
  const assertions = `
    import assert from 'node:assert/strict';
    assert.equal(typeof document, 'undefined');
    const { compileTheme, defineTheme } = await import('doom-design-system/theme');
    const presets = await import('doom-design-system/themes');
    assert.equal(Object.keys(presets).length, 5);
    for (const [entry, label] of [['neubrutalist', 'neubrutalistTheme'], ['doomsday', 'doomsdayTheme'], ['captain', 'captainTheme'], ['vigilante', 'vigilanteTheme'], ['orbital', 'orbitalTheme']]) {
      assert.equal((await import('doom-design-system/themes/' + entry))[label], presets[label]);
    }
    for (const theme of [defineTheme({name: 'plain'}), ...Object.values(presets)]) {
      const asset = compileTheme(theme);
      assert.equal(asset.manifest.length, 3);
      assert.ok(asset.css.includes(asset.manifest[0]));
    }
    assert.ok(import.meta.resolve('doom-design-system/theme/scope.css').endsWith('scope.css'));
  `;
  expect(() =>
    execFileSync(process.execPath, [
      "--no-warnings",
      "--experimental-loader",
      "data:text/javascript," + encodeURIComponent(loader),
      "--input-type=module",
      "-e",
      assertions,
    ]),
  ).not.toThrow();
});

it("typechecks consumers against the published theme declarations", () => {
  const fixture = resolve("tests/package/fixtures/theme-consumer.tsx");
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    types: ["react"],
  };
  expect(
    ts.resolveModuleName("doom-design-system/theme", fixture, options, ts.sys)
      .resolvedModule?.resolvedFileName,
  ).toBe(resolve("dist/styles/theming/index.d.ts"));
  const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram([fixture], options),
  );
  expect(
    diagnostics.map((d) =>
      ts.flattenDiagnosticMessageText(d.messageText, "\n"),
    ),
  ).toEqual([]);
}, 20000);
