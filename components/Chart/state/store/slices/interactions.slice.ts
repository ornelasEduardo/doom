export interface InteractionsSlice {
  interactions: Map<string, any>;
}

export const getInteractionsInitialState = (): InteractionsSlice => ({
  interactions: new Map(),
});
