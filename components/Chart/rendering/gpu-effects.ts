import type { InteractionTarget } from "../types/interaction";

interface Dimming {
  root: Element;
  selector: string;
  targets: readonly InteractionTarget[];
  opacity: number;
}
interface Registry {
  owners: Map<number, Dimming>;
  listeners: Set<() => void>;
}
const registries = new WeakMap<SVGSVGElement, Registry>();
function registry(root: Element) {
  const svg =
    root instanceof SVGSVGElement
      ? root
      : (root as SVGGraphicsElement).ownerSVGElement;
  if (!svg) {
    return;
  }
  let value = registries.get(svg);
  if (!value) {
    value = { owners: new Map(), listeners: new Set() };
    registries.set(svg, value);
  }
  return value;
}
export function updateGpuDimming(
  root: Element,
  owner: number,
  state?: Omit<Dimming, "root">,
) {
  const value = registry(root);
  if (!value) {
    return;
  }
  const previous = value.owners.get(owner);
  if (!state) {
    if (!value.owners.delete(owner)) {
      return;
    }
  } else {
    if (
      previous &&
      previous.opacity === state.opacity &&
      previous.selector === state.selector &&
      previous.targets.length === state.targets.length &&
      previous.targets.every(
        (target, i) =>
          target.seriesId === state.targets[i].seriesId &&
          target.dataIndex === state.targets[i].dataIndex &&
          target.data === state.targets[i].data,
      )
    ) {
      return;
    }
    value.owners.set(owner, { ...state, root });
  }
  value.listeners.forEach((listener) => listener());
}
export function subscribeGpuEffects(svg: SVGSVGElement, listener: () => void) {
  const value = registry(svg)!;
  value.listeners.add(listener);
  return () => {
    value.listeners.delete(listener);
  };
}
export function readGpuEmphasis(
  node: SVGGraphicsElement,
  seriesId: string,
  dataIndices: Int32Array,
  dataAt?: (slot: number) => unknown,
) {
  const probe = node.querySelector("[data-chart-gpu-selector-proxy]") ?? node;
  const effects = [...(registry(node)?.owners.entries() ?? [])]
    .sort(([a], [b]) => a - b)
    .map(([, effect]) => effect)
    .filter(
      (effect) =>
        effect.root.contains(node) &&
        (node.matches(effect.selector) || probe.matches(effect.selector)),
    );
  if (!effects.length) {
    return undefined;
  }
  const active = effects.map((effect) => {
    const slots = new Set<number>();
    for (const target of effect.targets) {
      if (target.seriesId !== undefined && target.seriesId !== seriesId) {
        continue;
      }
      if (target.dataIndex === undefined) {
        continue;
      }
      let low = 0,
        high = dataIndices.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (dataIndices[mid] < target.dataIndex) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      if (
        dataIndices[low] === target.dataIndex &&
        (target.seriesId !== undefined || dataAt?.(low) === target.data)
      ) {
        slots.add(low);
      }
    }
    return slots;
  });
  const indices = new Set(active.flatMap((slots) => [...slots]));
  const overrides = [...indices].map((index) => {
    let opacity = 1;
    effects.forEach((effect, i) => {
      if (!active[i].has(index)) {
        opacity = effect.opacity;
      }
    });
    return { index, opacity };
  });
  return {
    opacity: effects[effects.length - 1].opacity,
    indices: [],
    overrides,
  };
}
