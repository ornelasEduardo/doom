import { expect, it } from "vitest";

import { generateServices } from "./data";

it("generates reproducible log-distributed scenes with stable unique identities", () => {
  const rows = generateServices(50000);
  expect(rows).toHaveLength(50000);
  expect(new Set(rows.map((row) => row.label)).size).toBe(50000);
  expect(
    rows.every(
      (row) =>
        row.requests >= 1 &&
        row.requests <= 1000 &&
        row.latency >= 1 &&
        row.latency <= 1000,
    ),
  ).toBe(true);
  expect(generateServices(1000)).toEqual(rows.slice(0, 1000));
  expect(rows.filter((row) => row.requests < 10).length).toBeGreaterThan(10000);
  expect(rows.filter((row) => row.requests > 100).length).toBeGreaterThan(
    10000,
  );
});
it("data updates retain identities and move values within the log domain", () => {
  const before = generateServices(1000);
  const after = generateServices(1000, 1);
  expect(after.map((row) => row.label)).toEqual(before.map((row) => row.label));
  expect(
    after.some((row, index) => row.latency !== before[index].latency),
  ).toBe(true);
  expect(after.every((row) => row.latency >= 1 && row.latency <= 1000)).toBe(
    true,
  );
});
