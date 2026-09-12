export interface InteractionsSlice {
  managedHoverChannels: Set<string | symbol>;
  interactions: Map<string | symbol, any>;
}

export const getInteractionsInitialState = (): InteractionsSlice => ({
  interactions: new Map(),
  managedHoverChannels: new Set(),
});
