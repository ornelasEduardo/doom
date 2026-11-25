import { legacyAliases } from "../../theming/defaults";
import { defineTheme } from "../../theming/defineTheme";
import type { ThemePatch } from "../../theming/types";
import type { ThemeKey, themes } from "../definitions";

const hardEdges: ThemePatch = {
  foundations: {
    icons: { stroke: "2.5" },
    motion: { easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    fonts: { heading: "var(--font-montserrat, system-ui), sans-serif" },
    radii: { surface: "4px" },
    shadows: {
      raised: "{shadowOffsets.md} {roles.shadow}",
      overlay: "{shadowOffsets.lg} {roles.shadow}",
    },
  },
  roles: {
    selection: "{roles.brand}",
    onSelection: "{roles.onBrand}",
    onReadout: "{roles.canvas}",
    overlay: "rgb(0 0 0 / {effects.overlayOpacity})",
  },
  defaults: {
    uploads: {
      busyBackground: "{defaults.metrics.commonBlack}",
      busyForeground: "{roles.canvas}",
      busyTransform: "scale(1.01)",
      decorationContent: '""',
      busyLabelOpacity: "0",
      busyLabelVisibility: "hidden",
      busyLabelTransform: "scale(0.9)",
    },
    controls: {
      hoverShadow: "{defaults.shadows.lg}",
      errorMotionDuration: "0.3s",
      borderWidth: "2px",
      shadow: "{defaults.shadows.md}",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      hoverTransform: "translate(-2px, -2px)",
      pressTransform: "translate(2px, 2px)",
      ghostPressTransform: "scale(0.95)",
      hoverFilter: "brightness(1.1)",
      focusTransform: "translate(-2px, -2px)",
      focusShadow: "{shadowOffsets.xl} {roles.shadowBrand}",
      errorShadow: "{shadowOffsets.lg} {roles.shadowDanger}",
      errorFocusShadow: "{shadowOffsets.xl} {roles.shadowDanger}",
      disabledBackground:
        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)",
    },
    badges: {
      shadow:
        "{defaults.surfaces.borderWidth} {defaults.surfaces.borderWidth} 0 0 {roles.border}",
    },
    ratings: { hoverTransform: "scale(1.15)", pressTransform: "scale(0.85)" },
    surfaces: {
      borderWidth: "2px",
      shadowTop: "{spacing.2} calc(-1 * {spacing.2}) 0 0 {roles.shadow}",
      shadowLeft: "calc(-1 * {spacing.2}) {spacing.2} 0 0 {roles.shadow}",
      shadowRight: "{spacing.2} {spacing.2} 0 0 {roles.shadow}",
    },
    headings: { transform: "uppercase", weight: "800" },
    labels: {
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    shadows: {
      sm: "{shadowOffsets.sm} {roles.shadow}",
      md: "{shadowOffsets.md} {roles.shadow}",
      lg: "{shadowOffsets.lg} {roles.shadow}",
      xl: "{shadowOffsets.xl} {roles.shadow}",
      smBorder: "{shadowOffsets.sm} {roles.border}",
      mdBorder: "{shadowOffsets.md} {roles.border}",
      lgBorder: "{shadowOffsets.lg} {roles.border}",
    },
  },
};
export function preset(key: ThemeKey, source: (typeof themes)[ThemeKey]) {
  const patch = structuredClone(key === "orbital" ? {} : hardEdges) as Record<
    string,
    unknown
  >;
  const variables: Record<string, string> = {
    ...source.variables,
    ...source.solid,
  };
  for (const [index, role] of [
    "primary",
    "accent",
    "success",
    "warning",
    "error",
    "secondary",
  ].entries()) {
    const series = "--chart-series-" + (index + 1);
    if (!variables[series]) {
      variables[series] = variables["--" + role];
    }
  }
  for (const [key, value] of Object.entries(variables)) {
    const path =
      legacyAliases[key] ?? "extensions." + key.slice(2).split("-").join(".");
    const parts = path.split(".");
    let target = patch;
    for (const segment of parts.slice(0, -1)) {
      target[segment] ??= {};
      target = target[segment] as Record<string, unknown>;
    }
    target[parts[parts.length - 1]] = value.replace(
      /var\((--[\w-]+)\)/g,
      (original, alias: string) =>
        legacyAliases[alias] ? "{" + legacyAliases[alias] + "}" : original,
    );
  }
  const components: ThemePatch["components"] =
    key === "orbital"
      ? {
          Chart: {
            parts: {
              tooltipCard: {
                backgroundColor: "{roles.readout}",
                color: "{roles.onReadout}",
              },
              tooltipLabel: { color: "{roles.onReadoutMuted}" },
              tooltipSeriesLabel: { color: "{roles.onReadoutMuted}" },
              tooltipValue: { color: "{roles.onReadout}" },
            },
          },
        }
      : undefined;
  return defineTheme({ name: source.name, ...patch, components });
}
