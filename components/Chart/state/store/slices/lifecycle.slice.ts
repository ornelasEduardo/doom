export type Status = "idle" | "ready" | "loading" | "error";

export interface LifecycleSlice {
  status: Status;
  elements: {
    frame: SVGSVGElement | null;
    plot: SVGGElement | null;
  };
}

export const getLifecycleInitialState = (): LifecycleSlice => ({
  status: "idle",
  elements: {
    frame: null,
    plot: null,
  },
});
