import { resolve } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

it("compiles Chart accessors and extensions against the built package", () => {
  const fixture = resolve("tests/package/fixtures/chart-consumer.tsx");
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    types: ["react"],
  };
  const resolved = ts.resolveModuleName(
    "doom-design-system",
    fixture,
    options,
    ts.sys,
  );
  expect(resolved.resolvedModule?.resolvedFileName).toBe(
    resolve("dist/index.d.ts"),
  );
  const program = ts.createProgram([fixture], options);
  expect(
    ts.getPreEmitDiagnostics(program).map((d) =>
      ts.formatDiagnostic(d, {
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getCanonicalFileName: (path) => path,
        getNewLine: () => "\n",
      }),
    ),
  ).toEqual([]);
}, 20000);
