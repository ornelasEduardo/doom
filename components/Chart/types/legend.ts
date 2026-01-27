// =============================================================================
// LEGEND TYPES
// =============================================================================

export interface LegendItem {
  label: string;
  color?: string;
}

export interface LegendConfig {
  data: LegendItem[];
}
