import type { GridBuffers } from "../../components/Chart/engine/PreparedGrid";

export type CoordinateEncoding = "raw" | "projected";

export interface CompactRequest {
  count: number;
  revision: number;
  encoding: CoordinateEncoding;
}

export type CompactMessage =
  | {
      stage: "draw";
      encoding: "raw";
      positions: Float32Array;
      preparationMs: number;
    }
  | {
      stage: "draw";
      encoding: "projected";
      values: Float64Array;
      positions: Float32Array;
      preparationMs: number;
    }
  | {
      stage: "ready";
      grid: GridBuffers;
      values?: Float64Array;
      indexMs: number;
    };

export function validateCompactRequest(
  count: number,
  revision: number,
  encoding: CoordinateEncoding,
) {
  if (
    !Number.isSafeInteger(count) ||
    count < 0 ||
    !Number.isSafeInteger(revision) ||
    revision < 0 ||
    (encoding !== "raw" && encoding !== "projected")
  ) {
    throw new RangeError("Invalid compact preparation request");
  }
}
