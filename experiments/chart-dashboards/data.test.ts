import { describe, expect, it } from "vitest";

import {
  createRequests,
  createTimeline,
  latencyBuckets,
  summarizeRegions,
} from "./data";

describe("dashboard data integrity", () => {
  it("keeps the rolling window stable and ordered across updates", () => {
    const before = createTimeline(0);
    const after = createTimeline(1);
    expect(before).toHaveLength(60);
    expect(after.slice(0, -1)).toEqual(before.slice(1));
    expect(after.every((row) => row.p99 >= row.p50 && row.requests > 0)).toBe(
      true,
    );
  });
  it("uses reproducible requests and reconciles every summary to its source", () => {
    const rows = createRequests(10000);
    expect(rows).toEqual(createRequests(10000));
    expect(new Set(rows.map((row) => row.id)).size).toBe(10000);
    expect(
      summarizeRegions(rows).reduce((sum, row) => sum + row.count, 0),
    ).toBe(rows.length);
    expect(latencyBuckets(rows).reduce((sum, row) => sum + row.count, 0)).toBe(
      rows.length,
    );
    const filtered = rows.filter((row) => row.region === "Europe");
    expect(
      latencyBuckets(filtered).reduce((sum, row) => sum + row.count, 0),
    ).toBe(filtered.length);
    expect(summarizeRegions([])).toEqual([]);
    expect(latencyBuckets([]).every((row) => row.count === 0)).toBe(true);
  });
});
