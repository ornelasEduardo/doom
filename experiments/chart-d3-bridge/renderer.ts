export interface Frame {
  container: { node(): unknown };
}
export interface Resource<T> {
  draw(frame: T): void;
  dispose(): void;
}

/** Experimental renderer lifecycle; intentionally outside the public Chart API. */
export function createRenderer<T extends Frame>(
  setup: (frame: T, invalidate: () => void) => Resource<T>,
) {
  type Slot = { frame: T; resource?: Resource<T>; raf?: number };
  let active: Slot | undefined;
  const dispose = () => {
    const previous = active;
    active = undefined;
    if (previous?.raf !== undefined) {
      cancelAnimationFrame(previous.raf);
    }
    previous?.resource?.dispose();
  };
  const render = (frame: T) => {
    if (active && active.frame.container.node() !== frame.container.node()) {
      dispose();
    }
    if (!active) {
      const slot: Slot = { frame };
      active = slot;
      const invalidate = () => {
        if (active !== slot || slot.raf !== undefined) {
          return;
        }
        slot.raf = requestAnimationFrame(() => {
          slot.raf = undefined;
          if (active === slot) {
            slot.resource?.draw(slot.frame);
          }
        });
      };
      try {
        slot.resource = setup(frame, invalidate);
      } catch (error) {
        dispose();
        throw error;
      }
    }
    active.frame = frame;
    const slot = active;
    if (slot.raf === undefined) {
      slot.raf = requestAnimationFrame(() => {
        slot.raf = undefined;
        if (active === slot) {
          slot.resource?.draw(slot.frame);
        }
      });
    }
  };
  return { render, dispose };
}
