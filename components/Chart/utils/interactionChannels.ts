import type { Store } from "../state/store/chart.store";
import type {
  HoverInteraction,
  InteractionAccess,
  InteractionChannelHandle,
  InteractionPayload,
  InteractionWriter,
} from "../types/interaction";

type Channel = string | { readonly key: symbol };
export const getInteractionKey = (channel: Channel) =>
  typeof channel === "string" ? channel : channel.key;

export function createInteractionChannel<Payload>(
  name: string,
): InteractionChannelHandle<Payload> {
  return Object.freeze({
    name,
    key: Symbol(name),
  }) as InteractionChannelHandle<Payload>;
}

/** The heterogeneous map is private to this adapter; handles carry its payload contract. */
export function createInteractionAccess<T>(
  store: Store<T>,
): InteractionAccess<T> {
  const writer = (
    read: () => ReadonlyMap<string | symbol, unknown>,
    write: (
      key: string | symbol,
      value: unknown,
      remove: boolean,
      managed?: boolean,
    ) => void,
  ): InteractionWriter<T> => {
    function getInteraction<Payload>(
      channel: InteractionChannelHandle<Payload>,
    ): Payload | null;
    function getInteraction<Name extends string>(
      channel: Name,
    ): InteractionPayload<T, Name> | null;
    function getInteraction(channel: Channel): unknown {
      return read().get(getInteractionKey(channel)) ?? null;
    }
    function upsertInteraction<Payload>(
      channel: InteractionChannelHandle<Payload>,
      payload: NoInfer<Payload>,
    ): void;
    function upsertInteraction<Name extends string>(
      channel: Name,
      payload: InteractionPayload<T, NoInfer<Name>>,
    ): void;
    function upsertInteraction(channel: Channel, payload: unknown) {
      write(getInteractionKey(channel), payload, false);
    }
    return {
      getInteraction,
      upsertInteraction,
      upsertHoverInteraction: (
        channel: Channel,
        payload: HoverInteraction<T>,
      ) => {
        const key = getInteractionKey(channel);
        if (
          typeof key === "string" &&
          (key === "selection" ||
            key === "drag" ||
            key === "cursor-config" ||
            key === "tooltip-config" ||
            key.startsWith("cursor-config:") ||
            key.startsWith("tooltip-config:"))
        ) {
          throw new Error(
            `Interaction channel "${key}" cannot store managed hover`,
          );
        }
        write(key, payload, false, true);
      },
      removeInteraction: (channel: Channel) =>
        write(getInteractionKey(channel), undefined, true),
    };
  };

  const access = writer(
    () => store.getState().interactions,
    (key, value, remove, managed = false) => {
      store.setState((state) => {
        const previous = state.interactions;
        if (
          state.managedHoverChannels.has(key) === managed &&
          (remove
            ? !previous.has(key)
            : previous.has(key) && Object.is(previous.get(key), value))
        ) {
          return state;
        }
        const interactions = new Map(previous);
        if (remove) {
          interactions.delete(key);
        } else {
          interactions.set(key, value);
        }
        const managedHoverChannels = new Set(state.managedHoverChannels);
        if (managed) {
          managedHoverChannels.add(key);
        } else {
          managedHoverChannels.delete(key);
        }
        return { interactions, managedHoverChannels };
      });
    },
  );

  function subscribeInteraction<Payload>(
    channel: InteractionChannelHandle<Payload>,
    listener: (
      next: NoInfer<Payload> | null,
      previous: NoInfer<Payload> | null,
    ) => void,
    equality?: (
      a: NoInfer<Payload> | null,
      b: NoInfer<Payload> | null,
    ) => boolean,
  ): () => void;
  function subscribeInteraction<Name extends string>(
    channel: Name,
    listener: (
      next: InteractionPayload<T, NoInfer<Name>> | null,
      previous: InteractionPayload<T, NoInfer<Name>> | null,
    ) => void,
    equality?: (
      a: InteractionPayload<T, NoInfer<Name>> | null,
      b: InteractionPayload<T, NoInfer<Name>> | null,
    ) => boolean,
  ): () => void;
  function subscribeInteraction<Payload>(
    channel: Channel,
    listener: (next: Payload | null, previous: Payload | null) => void,
    equality = Object.is,
  ) {
    const read = () =>
      (store.getState().interactions.get(getInteractionKey(channel)) ??
        null) as Payload | null;
    let previous = read();
    return store.subscribe(() => {
      try {
        const next = read();
        if (equality(previous, next)) {
          return;
        }
        const before = previous;
        previous = next;
        listener(next, before);
      } catch (error) {
        console.error("Interaction subscription error:", error);
      }
    });
  }

  return {
    ...access,
    subscribeInteraction,
    batchInteractions: (update) => {
      const initial = store.getState().interactions;
      const staged = new Map<string | symbol, unknown>(initial);
      const managed = new Set(store.getState().managedHoverChannels);
      const touched = new Set<string | symbol>();
      let active = true;
      const batch = writer(
        () => staged,
        (key, value, remove, isManaged = false) => {
          if (!active) {
            throw new Error("Interaction batch has already finished");
          }
          touched.add(key);
          if (isManaged) {
            managed.add(key);
          } else {
            managed.delete(key);
          }
          if (remove) {
            staged.delete(key);
          } else {
            staged.set(key, value);
          }
        },
      );
      try {
        const result: unknown = update(batch);
        if (result !== null && typeof result === "object" && "then" in result) {
          throw new Error("Interaction batches must be synchronous");
        }
      } finally {
        active = false;
      }
      store.setState((state) => {
        const interactions = new Map(state.interactions);
        const managedHoverChannels = new Set(state.managedHoverChannels);
        let changed = false;
        touched.forEach((key) => {
          if (
            managedHoverChannels.has(key) === managed.has(key) &&
            interactions.has(key) === staged.has(key) &&
            Object.is(interactions.get(key), staged.get(key))
          ) {
            return;
          }
          changed = true;
          if (managed.has(key)) {
            managedHoverChannels.add(key);
          } else {
            managedHoverChannels.delete(key);
          }
          if (staged.has(key)) {
            interactions.set(key, staged.get(key));
          } else {
            interactions.delete(key);
          }
        });
        return changed ? { interactions, managedHoverChannels } : state;
      });
    },
  };
}
