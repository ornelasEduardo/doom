import { useRef, useSyncExternalStore } from "react";

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

const isPlainObjectOrArray = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return true;
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Shallow comparison used to decide whether a derived snapshot is materially
 * unchanged and its previous identity can be reused.
 */
const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) {
    return true;
  }
  // Only plain objects and arrays are safe to compare key-by-key. A Map or Set
  // has no own enumerable keys, so a key comparison would call every pair equal
  // and silently swallow real updates — the interactions Map is exactly that.
  if (!isPlainObjectOrArray(a) || !isPlainObjectOrArray(b)) {
    return false;
  }

  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) =>
    Object.is(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
};

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
    // useSyncExternalStore compares snapshots with Object.is, so a selector
    // deriving a fresh object each call looks like a new snapshot every read
    // and React bails out with "Maximum update depth exceeded".
    const selectorRef = useRef(selector);
    selectorRef.current = selector;
    const cache = useRef<{ state: T; value: U } | null>(null);

    const getSnapshot = () => {
      const state = getState();
      const cached = cache.current;

      if (cached && cached.state === state) {
        return cached.value;
      }

      const next = selectorRef.current(state);

      if (cached && shallowEqual(cached.value, next)) {
        cache.current = { state, value: cached.value };
        return cached.value;
      }

      cache.current = { state, value: next };
      return next;
    };
    // The server snapshot reads the same store: state lives in a per-instance
    // closure created during render, so there is nothing to hydrate from a
    // different source. Omitting it makes React throw "Missing
    // getServerSnapshot" and takes down any server-rendered page.
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };

  return { getState, setState, subscribe, useStore };
}
