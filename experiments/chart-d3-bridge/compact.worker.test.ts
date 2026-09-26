import { afterEach, expect, it, vi } from "vitest";

import type { CompactMessage } from "./compact-protocol";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
it("rejects invalid preparation before publishing any buffers", async () => {
  const scope = {
    onmessage: undefined as unknown as (event: MessageEvent) => void,
    postMessage: vi.fn(),
  };
  vi.stubGlobal("self", scope);
  await import("./compact.worker");
  expect(() =>
    scope.onmessage({
      data: { count: NaN, revision: 0, encoding: "raw" },
    } as MessageEvent),
  ).toThrow(RangeError);
  expect(scope.postMessage).not.toHaveBeenCalled();
});
it.each(["raw", "projected"] as const)(
  "transfers %s buffers in order without detaching indexing data",
  async (encoding) => {
    const messages: CompactMessage[] = [];
    const scope = {
      onmessage: undefined as unknown as (event: MessageEvent) => void,
      postMessage(
        message: CompactMessage,
        options: StructuredSerializeOptions,
      ) {
        messages.push(structuredClone(message, options));
      },
    };
    vi.stubGlobal("self", scope);
    await import("./compact.worker");
    scope.onmessage({
      data: { count: 2, revision: 0, encoding },
    } as MessageEvent);
    expect(messages.map((message) => message.stage)).toEqual(["draw", "ready"]);
    const [draw, ready] = messages;
    if (draw.stage !== "draw" || ready.stage !== "ready") {
      throw new Error("Missing stages");
    }
    expect(draw.positions).toHaveLength(4);
    expect(ready.grid.coordinates).toHaveLength(4);
    expect(ready.grid.coordinates[0]).toBe(Math.log10(40) / 3);
    expect(ready.grid.coordinates[1]).toBe(1 - Math.log10(80) / 3);
    expect(
      encoding === "raw"
        ? ready.values?.[0]
        : draw.encoding === "projected" && draw.values[0],
    ).toBe(40);
  },
);
