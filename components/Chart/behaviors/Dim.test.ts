import { select } from "d3-selection";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createChartStore } from "../state/store/chart.store";
import type { Behavior, BehaviorContext } from "../types/events";
import type { HoverInteraction } from "../types/interaction";
import {
  createInteractionAccess,
  createInteractionChannel,
} from "../utils/interactionChannels";
import { Dim } from "./Dim";

const disposals: (() => void)[] = [];
afterEach(() => {
  disposals.splice(0).forEach((dispose) => dispose());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function scene(count = 3, initial: unknown[] = [], sameKey = false) {
  const g = select(document.body).append("svg").append("g");
  const data = Array.from({ length: count }, (_, i) => ({ id: i }));
  const marks = g
    .selectAll<SVGCircleElement, (typeof data)[number]>("circle")
    .data(data)
    .join("circle")
    .nodes();
  const store = createChartStore({});
  let targets = initial;
  const dataIndex = (datum: unknown) =>
    data.indexOf(datum as (typeof data)[number]);
  const context = {
    getChartContext: () => ({ g, chartStore: store }),
    getInteraction: () => ({
      targets: targets.map((data) => ({
        data,
        seriesId: "s",
        dataIndex: sameKey ? 0 : dataIndex(data),
      })),
    }),
  } as unknown as BehaviorContext;
  return {
    g,
    context,
    data,
    marks,
    store,
    start: (selector = "circle") => {
      const dispose = Dim({ selector })(context)!;
      disposals.push(dispose);
      return dispose;
    },
    hover: (...data: unknown[]) => {
      targets = data;
      store.setState({});
    },
  };
}
const mutations = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Dim", () => {
  it("reconciles consumer edits when the first observer has no opacity claim on the mark", async () => {
    const s = scene();
    s.hover(s.data[0]);
    disposals.push(Dim({ selector: "circle", opacity: 0.3 })(s.context)!);
    disposals.push(
      Dim({ selector: "circle", opacity: 0.6 })({
        ...s.context,
        getInteraction: (() => ({
          targets: [{ data: s.data[1] }],
        })) as BehaviorContext["getInteraction"],
      })!,
    );
    await mutations();
    s.marks[0].style.setProperty("opacity", "0.7", "important");
    await mutations();
    expect(s.marks[0].style.opacity).toBe("0.6");
  });
  it("does not read per-mark opacity declarations on first activation after indexing", async () => {
    const s = scene(5000);
    s.start();
    await mutations();
    const values = vi.spyOn(CSSStyleDeclaration.prototype, "getPropertyValue");
    const priorities = vi.spyOn(
      CSSStyleDeclaration.prototype,
      "getPropertyPriority",
    );
    s.hover(s.data[0]);
    expect(
      values.mock.calls.filter(([name]) => name === "opacity").length,
    ).toBeLessThanOrEqual(2);
    expect(
      priorities.mock.calls.filter(([name]) => name === "opacity").length,
    ).toBeLessThanOrEqual(2);
    expect(s.marks[1].style.opacity).toBe("0.3");
    expect(s.marks[0].style.opacity).toBe("");
  });
  it("refreshes cached baselines for consumer edits before activation and before disposal", () => {
    const s = scene();
    const dispose = s.start();
    s.marks[1].style.setProperty("opacity", "0.8", "important");
    s.hover(s.data[0]);
    expect(s.marks[1].style.opacity).toBe("0.3");
    s.hover();
    expect(s.marks[1].style.opacity).toBe("0.8");
    s.hover(s.data[0]);
    s.marks[1].style.setProperty("opacity", "0.7", "important");
    dispose();
    expect(s.marks[1].style.opacity).toBe("0.7");
    expect(s.marks[1].style.getPropertyPriority("opacity")).toBe("important");
  });
  it.each([false, true])(
    "restores overlapping Dim ownership in either disposal order (reverse=%s)",
    (reverse) => {
      const s = scene();
      s.marks[1].style.setProperty("opacity", "0.8", "important");
      s.hover(s.data[0]);
      const first = Dim({ selector: "circle", opacity: 0.3 })(s.context)!;
      const second = Dim({ selector: "circle", opacity: 0.6 })(s.context)!;
      disposals.push(first, second);
      expect(s.marks[1].style.opacity).toBe("0.6");
      (reverse ? second : first)();
      expect(s.marks[1].style.opacity).toBe(reverse ? "0.3" : "0.6");
      (reverse ? first : second)();
      expect(s.marks[1].style.opacity).toBe("0.8");
      expect(s.marks[1].style.getPropertyPriority("opacity")).toBe("important");
    },
  );
  it("keeps overlapping owners on the changed-mark path", async () => {
    const s = scene(5000);
    s.hover(s.data[0]);
    disposals.push(Dim({ selector: "circle", opacity: 0.3 })(s.context)!);
    disposals.push(Dim({ selector: "circle", opacity: 0.6 })(s.context)!);
    await mutations();
    const query = vi.spyOn(s.g.node()!, "querySelectorAll");
    const writes = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");
    const removals = vi.spyOn(CSSStyleDeclaration.prototype, "removeProperty");
    for (let i = 1; i <= 20; i++) {
      s.hover(s.data[i]);
      await mutations();
    }
    expect(
      writes.mock.calls.length + removals.mock.calls.length,
    ).toBeLessThanOrEqual(80);
    expect(s.marks[0].style.opacity).toBe("0.6");
    expect(s.marks[20].style.opacity).toBe("");
    expect(query).not.toHaveBeenCalled();
  });
  it("reads typed hover handles by identity and ignores same-name channels", () => {
    const s = scene();
    type Row = (typeof s.data)[number];
    const store = createChartStore<Row>({});
    const access = createInteractionAccess(store);
    const channel = createInteractionChannel<HoverInteraction<Row>>("focus");
    const other = createInteractionChannel<HoverInteraction<Row>>("focus");
    const behavior: Behavior<Row> = Dim({ selector: "circle", on: channel });
    const context = {
      ...access,
      getChartContext: () => ({ g: s.g, chartStore: store }),
    } as unknown as BehaviorContext<Row>;
    const payload: HoverInteraction<Row> = {
      pointer: { x: 0, y: 0, containerX: 0, containerY: 0, isTouch: false },
      targets: [{ data: s.data[0], coordinate: { x: 0, y: 0 } }],
    };
    access.upsertInteraction(other, payload);
    disposals.push(behavior(context)!);
    expect(s.marks[1].style.opacity).toBe("");
    access.upsertInteraction(channel, payload);
    expect(s.marks[1].style.opacity).toBe("0.3");
    access.removeInteraction(other);
    expect(s.marks[1].style.opacity).toBe("0.3");
    access.removeInteraction(channel);
    expect(s.marks[1].style.opacity).toBe("");
  });
  it("restores detached subtrees whose selector depended on their former ancestors", async () => {
    const s = scene();
    s.g.attr("class", "series");
    const inner = s.g.append("g");
    s.marks.forEach((mark) => inner.node()!.appendChild(mark));
    s.start(".series circle");
    s.hover(s.data[0]);
    expect(s.marks[1].style.opacity).toBe("0.3");
    inner.remove();
    await mutations();
    expect(s.marks[1].style.opacity).toBe("");
  });
  it("diffs multi-target unions and does no writes for unchanged or unrelated interactions", async () => {
    const s = scene();
    s.start();
    s.hover(s.data[0], s.data[1]);
    await mutations();
    expect(s.marks[2].style.opacity).toBe("0.3");
    s.hover(s.data[1], s.data[2]);
    await mutations();
    expect(s.marks[0].style.opacity).toBe("0.3");
    expect(s.marks[1].style.opacity).toBe("");
    expect(s.marks[2].style.opacity).toBe("");
    const writes = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");
    const query = vi.spyOn(s.g.node()!, "querySelectorAll");
    s.hover(s.data[2], s.data[1]);
    s.store.setState({ interactions: new Map([["unrelated", {}]]) });
    await mutations();
    expect(writes).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });
  it("restores marks when an ancestor stops matching a custom selector", async () => {
    const s = scene();
    const wrapper = s.g.append("g").attr("data-enabled", "yes");
    s.marks.forEach((mark) => wrapper.node()!.appendChild(mark));
    const current = s.data[0];
    const context = {
      getChartContext: () => ({ g: s.g, chartStore: s.store }),
      getInteraction: () => ({ targets: [{ data: current }] }),
    } as unknown as BehaviorContext;
    disposals.push(Dim({ selector: '[data-enabled="yes"] circle' })(context)!);
    expect(s.marks[1].style.opacity).toBe("0.3");
    wrapper.attr("data-enabled", "no");
    await mutations();
    expect(s.marks[1].style.opacity).toBe("");
  });

  it("bounds steady target changes to the changed marks, without selector sweeps", async () => {
    const s = scene(5000);
    s.start();
    s.hover(s.data[0]);
    await mutations();
    const query = vi.spyOn(s.g.node()!, "querySelectorAll");
    const writes = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");
    const removals = vi.spyOn(CSSStyleDeclaration.prototype, "removeProperty");
    let datumReads = 0;
    s.marks.forEach((mark, index) =>
      Object.defineProperty(mark, "__data__", {
        configurable: true,
        get: () => {
          datumReads++;
          return s.data[index];
        },
      }),
    );
    for (let i = 1; i <= 20; i++) {
      s.hover(s.data[i]);
      await mutations();
    }
    expect(s.marks[20].style.opacity || "1").toBe("1");
    expect(s.marks[0].style.opacity).toBe("0.3");
    expect(
      writes.mock.calls.length + removals.mock.calls.length,
    ).toBeLessThanOrEqual(40);
    expect(datumReads).toBeLessThanOrEqual(40);
    expect(query).not.toHaveBeenCalled();
  });
  it("preserves inline opacity, priority and absent declarations on clear and disposal", () => {
    const s = scene();
    s.marks[0].style.setProperty("opacity", "0.65", "important");
    s.marks[1].setAttribute("opacity", "0.8");
    const dispose = s.start();
    s.hover(s.data[0]);
    expect(s.marks[0].style.opacity).toBe("0.65");
    s.hover(s.data[1]);
    s.hover();
    expect(s.marks[0].style.getPropertyPriority("opacity")).toBe("important");
    expect(s.marks[0].style.opacity).toBe("0.65");
    expect(s.marks[1].style.opacity).toBe("");
    s.hover(s.data[2]);
    dispose();
    expect(s.marks[0].style.opacity).toBe("0.65");
    expect(s.marks[1].getAttribute("opacity")).toBe("0.8");
    expect(s.marks[2].style.opacity).toBe("");
  });
  it("hydrates existing interaction and follows same-key datum changes", () => {
    const s = scene(3, [], true);
    s.hover(s.data[0]);
    s.start();
    expect(s.marks[1].style.opacity).toBe("0.3");
    s.hover(s.data[1]);
    expect(s.marks[0].style.opacity).toBe("0.3");
    expect(s.marks[1].style.opacity).toBe("");
  });
  it("reconciles joined and rebound marks after renderer mutations", async () => {
    const s = scene();
    s.start();
    s.hover(s.data[0]);
    const joined = s.g.append("circle").datum(s.data[2]).node()!;
    select(s.marks[1]).datum(s.data[0]).attr("cx", 42);
    await mutations();
    expect(joined.style.opacity).toBe("0.3");
    expect(s.marks[1].style.opacity).toBe("");
    s.marks[0].remove();
    await mutations();
    expect(s.marks[0].style.opacity).toBe("");
  });
  it("reindexes a data-only rebind after a scene store change", async () => {
    const s = scene();
    s.start();
    s.hover(s.data[0]);
    s.store.setState({ data: [...s.data] });
    select(s.marks[1]).datum(s.data[0]);
    await mutations();
    expect(s.marks[1].style.opacity).toBe("");
  });
  it("retains consumer opacity edits made while dimmed", async () => {
    const s = scene();
    s.start();
    s.hover(s.data[0]);
    s.marks[1].style.setProperty("opacity", "0.7", "important");
    await mutations();
    expect(s.marks[1].style.opacity).toBe("0.3");
    s.hover();
    expect(s.marks[1].style.opacity).toBe("0.7");
    expect(s.marks[1].style.getPropertyPriority("opacity")).toBe("important");
  });
});
