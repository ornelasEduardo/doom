import { expect, it } from "vitest";

import { generateServices, serviceRows } from "./data";
import { packServiceGeometry } from "./direct-data";

it.each([0, 1, 7, 8, 9, 10000])(
  "preserves every value and coordinate for %i rows across revisions",
  (count) => {
    for (const revision of [0, 1, 2, 3]) {
      const rows = generateServices(count, revision);
      const result = packServiceGeometry(count, revision);
      expect(result.values).toEqual(
        Float64Array.from(rows.flatMap((row) => [row.requests, row.latency])),
      );
      const coordinates = Float64Array.from(
        rows.flatMap((row) => [
          Math.log10(row.requests) / 3,
          1 - Math.log10(row.latency) / 3,
        ]),
      );
      expect(result.coordinates).toEqual(coordinates);
      expect(result.positions).toEqual(Float32Array.from(coordinates));
    }
  },
);

it.each([0, 1, 2, 3, -1])(
  "preserves the complete million-point sequence at revision %i",
  (revision) => {
    const packed = packServiceGeometry(1000000, revision);
    let index = 0;
    for (const row of serviceRows(1000000, revision)) {
      const offset = index * 2;
      const x = Math.log10(row.requests) / 3;
      const y = 1 - Math.log10(row.latency) / 3;
      if (
        packed.values[offset] !== row.requests ||
        packed.values[offset + 1] !== row.latency ||
        packed.coordinates[offset] !== x ||
        packed.coordinates[offset + 1] !== y ||
        packed.positions[offset] !== Math.fround(x) ||
        packed.positions[offset + 1] !== Math.fround(y)
      ) {
        throw new Error(`Numeric mismatch at row ${index}`);
      }
      index++;
    }
    expect(index).toBe(1000000);
  },
);
