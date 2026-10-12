import { expect, it } from "vitest";

import {
  type CoordinateEncoding,
  validateCompactRequest,
} from "./compact-protocol";

it.each(["raw", "projected"] as const)(
  "accepts supported %s requests including empty data",
  (encoding) => {
    expect(() => validateCompactRequest(0, 0, encoding)).not.toThrow();
    expect(() => validateCompactRequest(100000, 2, encoding)).not.toThrow();
  },
);
it.each([
  [NaN, 0, "raw"],
  [Infinity, 0, "raw"],
  [-1, 0, "raw"],
  [1.5, 0, "raw"],
  [Number.MAX_SAFE_INTEGER + 1, 0, "raw"],
  [1, NaN, "raw"],
  [1, -1, "raw"],
  [1, 0.5, "raw"],
  [1, Number.MAX_SAFE_INTEGER + 1, "raw"],
  [1, 0, "unsupported"],
] as const)(
  "rejects invalid request (%s, %s, %s)",
  (count, revision, encoding) => {
    expect(() =>
      validateCompactRequest(count, revision, encoding as CoordinateEncoding),
    ).toThrow(RangeError);
  },
);
