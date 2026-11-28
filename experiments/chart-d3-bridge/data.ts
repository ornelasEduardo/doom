import type { Service } from "./scatter";

export const serviceSeeds: readonly Service[] = [
  { label: "Auth", requests: 40, latency: 80 },
  { label: "Search", requests: 100, latency: 40 },
  { label: "Orders", requests: 20, latency: 60 },
  { label: "Catalog", requests: 250, latency: 25 },
  { label: "Billing", requests: 8, latency: 180 },
  { label: "Media", requests: 400, latency: 120 },
  { label: "Reports", requests: 3, latency: 500 },
  { label: "Events", requests: 700, latency: 6 },
];

export function* serviceRows(count: number, revision = 0): Generator<Service> {
  let seed = 123456789;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < count; index++) {
    const service = serviceSeeds[index] ?? {
      label: `Service ${index + 1}`,
      requests: Math.round(10 ** (next() * 3) * 100) / 100,
      latency: Math.round(10 ** (next() * 3) * 100) / 100,
    };
    yield {
      ...service,
      latency: Math.min(
        1000,
        Math.round(
          service.latency * (index % 2 ? 1 : 1 + (revision % 3) * 0.15) * 100,
        ) / 100,
      ),
    };
  }
}

export function generateServices(count: number, revision = 0): Service[] {
  return Array.from(serviceRows(count, revision));
}
export function serviceLabel(index: number) {
  return serviceSeeds[index]?.label ?? `Service ${index + 1}`;
}
