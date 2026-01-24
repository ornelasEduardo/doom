import { useSyncExternalStore } from "react";

export type Listener = () => void;

export interface StoreApi<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: Listener) => () => void;
  /**
   * React hook to subscribe to the store.
   * @param selector Optional selector function to optimize re-renders.
   */
  useStore: <U>(selector?: (state: T) => U) => U;
}

export function createStore<T>(initialState: T): StoreApi<T> {
  let state = initialState;
  const listeners = new Set<Listener>();

  const getState = () => state;

  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;

    // shallow comparison to avoid unnecessary updates
    if (nextState === state) {
      return;
    }

    state = { ...state, ...nextState };
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = <U>(selector: (state: T) => U = (s) => s as any): U => {
    return useSyncExternalStore(subscribe, () => selector(getState()));
  };

  return { getState, setState, subscribe, useStore };
}
