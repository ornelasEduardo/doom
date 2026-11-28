import { buildGrid } from "../../components/Chart/engine/PreparedGrid";
import {
  type CompactMessage,
  type CompactRequest,
  validateCompactRequest,
} from "./compact-protocol";
import {
  packServiceGeometry,
  packServiceValues,
  projectServiceValues,
} from "./direct-data";

self.onmessage = (event: MessageEvent<CompactRequest>) => {
  const { count, revision, encoding } = event.data;
  validateCompactRequest(count, revision, encoding);
  const start = performance.now();
  let coordinates: Float64Array;
  let exactValues: Float64Array | undefined;
  let indexStart: number;
  if (encoding === "raw") {
    const { values, positions } = packServiceValues(count, revision);
    self.postMessage(
      {
        stage: "draw",
        encoding,
        positions,
        preparationMs: performance.now() - start,
      } satisfies CompactMessage,
      { transfer: [positions.buffer] },
    );
    indexStart = performance.now();
    coordinates = projectServiceValues(values);
    exactValues = values;
  } else {
    const packed = packServiceGeometry(count, revision);
    coordinates = packed.coordinates;
    self.postMessage(
      {
        stage: "draw",
        encoding: "projected",
        values: packed.values,
        positions: packed.positions,
        preparationMs: performance.now() - start,
      } satisfies CompactMessage,
      { transfer: [packed.values.buffer, packed.positions.buffer] },
    );
    indexStart = performance.now();
  }
  const grid = buildGrid(coordinates, 128, {
    minX: 0,
    minY: 0,
    width: 1,
    height: 1,
  });
  const transfer: Transferable[] = [
    grid.coordinates.buffer,
    grid.heads.buffer,
    grid.next.buffer,
    grid.previous.buffer,
  ];
  if (exactValues) {
    transfer.push(exactValues.buffer);
  }
  self.postMessage(
    {
      stage: "ready",
      grid,
      values: exactValues,
      indexMs: performance.now() - indexStart,
    } satisfies CompactMessage,
    { transfer },
  );
};
