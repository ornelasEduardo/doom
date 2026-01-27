import { XScale, YScale } from "../../../types/scales";

export interface ScalesSlice {
  scales: {
    x: XScale | null;
    y: YScale | null;
  };
}

export const getScalesInitialState = (): ScalesSlice => ({
  scales: { x: null, y: null },
});
