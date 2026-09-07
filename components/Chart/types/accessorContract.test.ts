import { resolve } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

it("enforces accessor values and datum types at the public extension boundary", () => {
  const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd(),
  );
  const program = ts.createProgram(
    [
      "tests/package/fixtures/chart-consumer.tsx",
      "tests/browser/Chart/extensions.test.tsx",
      "types/css.d.ts",
      "types/declarations.d.ts",
    ],
    {
      ...parsed.options,
      incremental: false,
      noEmit: true,
      paths: { "doom-design-system": [resolve("components/Chart/Chart.tsx")] },
    },
  );
  expect(
    ts
      .getPreEmitDiagnostics(program)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n")),
  ).toEqual([]);
}, 20000);

it("omits missing bar categories while preserving zero and numeric strings", async () => {
  const { createChartStore, updateChartData, registerSeries } =
    await import("../state/store/chart.store");
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "category",
    "value",
  );
  updateChartData(store, [
    { category: null, value: 1 },
    { category: undefined, value: 2 },
    { category: 0, value: 3 },
    { category: "0", value: 4 },
  ]);
  registerSeries(store, "bars", [
    { id: "bars", type: "bar", x: "category", y: "value" },
  ]);
  expect(store.getState().scales.x?.domain()).toEqual([0, "0"]);
});
