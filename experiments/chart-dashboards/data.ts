export interface TimelineRow {
  second: number;
  p50: number;
  p99: number;
  requests: number;
  errors: number;
}
export interface RequestRow {
  id: number;
  region: string;
  kb: number;
  latency: number;
}
export interface CountRow {
  label: string;
  count: number;
}
export const regions = ["Americas", "Europe", "Asia Pacific"] as const;

export function createTimeline(tick: number): TimelineRow[] {
  return Array.from({ length: 60 }, (_, i) => {
    const second = tick + i;
    const incident = Math.max(0, 1 - Math.abs((second % 90) - 42) / 8);
    const p50 = Math.round(42 + 9 * Math.sin(second / 5) + incident * 30);
    return {
      second,
      p50,
      p99: Math.round(p50 + 65 + incident * 160),
      requests: Math.round(1800 + 350 * Math.sin(second / 8) - incident * 200),
      errors: Math.round(3 + incident * 45),
    };
  });
}

export function createRequests(count: number): RequestRow[] {
  let seed = 7281;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, (_, id) => {
    const regionIndex = id % regions.length;
    const kb = Math.round(5 + random() ** 2 * 495);
    return {
      id,
      region: regions[regionIndex],
      kb,
      latency: Math.round(
        15 + kb * 0.42 + regionIndex * 18 + random() ** 4 * 220,
      ),
    };
  });
}

export function summarizeRegions(rows: RequestRow[]): CountRow[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.region, (counts.get(row.region) ?? 0) + 1);
  }
  return Array.from(counts, ([label, count]) => ({ label, count }));
}

export function latencyBuckets(rows: RequestRow[]): CountRow[] {
  const buckets = ["<100", "100–199", "200–299", "300–399", "400+"].map(
    (label) => ({ label, count: 0 }),
  );
  for (const row of rows) {
    buckets[Math.min(4, Math.floor(row.latency / 100))].count++;
  }
  return buckets;
}
