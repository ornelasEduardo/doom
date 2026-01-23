import { Accessor } from "./accessors";

// =============================================================================
// LEGEND TYPES
// =============================================================================

export interface LegendItem {
  label: string;
  color?: string;
  yAccessor?: Accessor<any, number>;
  hideCursor?: boolean;
  /** Defines how hover interactions should behave for this series */
  interactionMode?: "x" | "xy";
}

export interface LegendConfig {
  data: LegendItem[];
}
