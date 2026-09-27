import { serviceSeeds } from "./data";

function packServices(
  count: number,
  revision: number,
  coordinates?: Float64Array,
) {
  const values = new Float64Array(count * 2),
    positions = new Float32Array(count * 2);
  let seed = 123456789;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const multiplier = 1 + (revision % 3) * 0.15;
  for (let index = 0; index < count; index++) {
    const preset = serviceSeeds[index];
    const requests =
      preset?.requests ?? Math.round(10 ** (next() * 3) * 100) / 100;
    const original =
      preset?.latency ?? Math.round(10 ** (next() * 3) * 100) / 100;
    const latency = Math.min(
      1000,
      Math.round(original * (index % 2 ? 1 : multiplier) * 100) / 100,
    );
    const offset = index * 2;
    values[offset] = requests;
    values[offset + 1] = latency;
    if (coordinates) {
      positions[offset] = coordinates[offset] = Math.log10(requests) / 3;
      positions[offset + 1] = coordinates[offset + 1] =
        1 - Math.log10(latency) / 3;
    } else {
      positions[offset] = requests;
      positions[offset + 1] = latency;
    }
  }
  return { values, positions };
}

export function packServiceGeometry(count: number, revision = 0) {
  const coordinates = new Float64Array(count * 2);
  return { ...packServices(count, revision, coordinates), coordinates };
}
export function packServiceValues(count: number, revision = 0) {
  return packServices(count, revision);
}
export function projectServiceValues(values: Float64Array) {
  const coordinates = new Float64Array(values.length);
  for (let i = 0; i < values.length; i += 2) {
    coordinates[i] = Math.log10(values[i]) / 3;
    coordinates[i + 1] = 1 - Math.log10(values[i + 1]) / 3;
  }
  return coordinates;
}
