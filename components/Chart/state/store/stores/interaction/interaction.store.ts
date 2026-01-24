import { useChartContext } from "../../../../context";
import { InteractionType } from "../../../../types/interaction";
import { createStore, StoreApi } from "../../createStore";

export interface InteractionState {
  interactions: Map<InteractionType | string, unknown>;
}

export type InteractionStore = StoreApi<InteractionState>;

export const createInteractionStore = () =>
  createStore<InteractionState>({
    interactions: new Map(),
  });

export const upsertInteraction = <T>(
  store: InteractionStore,
  type: InteractionType | string,
  payload: T,
) => {
  store.setState((state) => {
    const nextInteractions = new Map(state.interactions);
    nextInteractions.set(type, payload);
    return { interactions: nextInteractions };
  });
};

export const removeInteraction = (
  store: InteractionStore,
  type: InteractionType | string,
) => {
  store.setState((state) => {
    // Optimization: Don't create new map if key doesn't exist
    if (!state.interactions.has(type)) {
      return state;
    }
    const nextInteractions = new Map(state.interactions);
    nextInteractions.delete(type);
    return { interactions: nextInteractions };
  });
};

export const getInteraction = <T>(
  store: InteractionStore,
  type: InteractionType | string,
): T | null => {
  return (store.getState().interactions.get(type) as T) || null;
};

/**
 * Hook to consume interaction state.
 * @param type The interaction type to subscribe to (e.g. InteractionType.HOVER)
 * @param selector Optional selector to pick a specifc part of the interaction state.
 *                 This helps prevent re-renders when other parts of the interaction change.
 */
export const useInteraction = <T, R = T>(
  type: InteractionType | string,
  selector?: (state: T | null) => R,
): R => {
  const { interactionStore } = useChartContext();

  const selection = interactionStore.useStore((state: InteractionState) => {
    const interaction = (state.interactions.get(type) as T) || null;
    return selector ? selector(interaction) : (interaction as unknown as R);
  });

  return selection;
};
