import type { Selection } from "d3-selection";

import { Behavior, GenericBehavior } from "../types/events";
import {
  ChannelReference,
  HoverInteraction,
  InteractionChannel,
  SelectionInteraction,
} from "../types/interaction";
import { getInteractionKey } from "../utils/interactionChannels";

export interface SelectionUpdateOptions<T = unknown> {
  /** Defaults to selection; hover channels supply all target data. */
  on?:
    | ChannelReference<SelectionInteraction<T>>
    | ChannelReference<HoverInteraction<T>>;
  /** Elements whose bound datum is T. */
  selector?: string;
  /** Always receives an array, including [] when the channel is cleared. */
  fn?: (
    selection: Selection<SVGElement, T, SVGGElement, unknown>,
    data: T[],
  ) => void;
}

type SelectionClass = "selected" | "dimmed";
interface ClassClaims {
  baseline: boolean;
  owners: Map<symbol, boolean>;
}
const classClaims = new WeakMap<Element, Map<SelectionClass, ClassClaims>>();

function claimClass(
  element: Element,
  name: SelectionClass,
  owner: symbol,
  enabled: boolean | null,
) {
  let classes = classClaims.get(element);
  if (!classes) {
    if (enabled === null) {
      return;
    }
    classes = new Map();
    classClaims.set(element, classes);
  }
  let claims = classes.get(name);
  if (!claims) {
    if (enabled === null) {
      return;
    }
    claims = { baseline: element.classList.contains(name), owners: new Map() };
    classes.set(name, claims);
  }
  if (enabled === null) {
    claims.owners.delete(owner);
  } else {
    claims.owners.set(owner, enabled);
  }
  element.classList.toggle(
    name,
    claims.baseline || [...claims.owners.values()].some(Boolean),
  );
  if (claims.owners.size === 0) {
    classes.delete(name);
  }
  if (classes.size === 0) {
    classClaims.delete(element);
  }
}

/** Hydrates and follows selection or hover state without changing callback shape. */
export function SelectionUpdate(options?: {
  on?: string;
  selector?: string;
  fn?: never;
}): GenericBehavior;
export function SelectionUpdate<T>(
  options: SelectionUpdateOptions<T>,
): Behavior<T>;
export function SelectionUpdate<T = unknown>(
  options: SelectionUpdateOptions<T> = {},
): Behavior<T> {
  const {
    on = InteractionChannel.SELECTION,
    selector = ".chart-bar, .chart-point, path",
    fn,
  } = options;
  return ({ getChartContext }) => {
    const { g, chartStore } = getChartContext();
    if (!g) {
      return;
    }
    const owner = Symbol("selection classes");
    let owned = new Set<Element>();
    const release = (element: Element) => {
      claimClass(element, "selected", owner, null);
      claimClass(element, "dimmed", owner, null);
    };
    const update = () => {
      const interaction = chartStore
        .getState()
        .interactions.get(getInteractionKey(on)) as
        | SelectionInteraction<T>
        | HoverInteraction<T>
        | undefined;
      const data = interaction
        ? "selection" in interaction
          ? interaction.selection
          : interaction.targets.map((target) => target.data)
        : [];
      const selection = g.selectAll<SVGElement, T>(selector);
      if (fn) {
        fn(selection, data);
        return;
      }
      const active = new Set(data);
      const current = new Set<Element>(selection.nodes());
      for (const element of owned) {
        if (!current.has(element)) {
          release(element);
        }
      }
      selection.each(function (datum) {
        claimClass(this, "selected", owner, active.has(datum));
        claimClass(
          this,
          "dimmed",
          owner,
          active.size > 0 && !active.has(datum),
        );
      });
      owned = current;
    };
    const unsubscribe = chartStore.subscribe(update);
    const cleanup = () => {
      unsubscribe();
      owned.forEach(release);
      owned.clear();
    };
    try {
      update();
    } catch (error) {
      cleanup();
      throw error;
    }
    return cleanup;
  };
}
