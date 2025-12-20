export const palette = {
  common: {
    black: "#000000",
    white: "#ffffff",
  },
  slate: {
    50: "#F8FAFC",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },
  navy: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#002D72",
    600: "#002D72",
    700: "#1E3A8A",
    800: "#001533",
    900: "#0F172A",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3B82F6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fde047",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#F7B731",
    700: "#F5A623",
    800: "#b45309",
    900: "#78350f",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#10b981",
    700: "#059669",
    800: "#15803D",
    900: "#14532d",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#b91c1c",
    700: "#F56565",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#0F1419",
    975: "#1A1F29",
    990: "#2D3748",
  },
} as const;

export const baseVariables = {
  // Typography Scale
  "--text-xs": "0.75rem",
  "--text-sm": "0.875rem",
  "--text-base": "1rem",
  "--text-lg": "1.125rem",
  "--text-xl": "1.25rem",
  "--text-2xl": "1.5rem",
  "--text-3xl": "1.875rem",
  "--text-4xl": "2.25rem",
  "--text-5xl": "3rem",
  "--text-6xl": "3.75rem",

  // Font Weights
  "--font-thin": "100",
  "--font-extralight": "200",
  "--font-light": "300",
  "--font-regular": "400",
  "--font-medium": "500",
  "--font-semibold": "600",
  "--font-bold": "700",
  "--font-extrabold": "800",
  "--font-black": "900",

  // Spacing Scale
  "--spacing-xs": "0.25rem",
  "--spacing-sm": "0.5rem",
  "--spacing-md": "1rem",
  "--spacing-lg": "1.5rem",
  "--spacing-xl": "2rem",
  "--spacing-2xl": "3rem",

  // Z-Indices
  "--z-base": "0",
  "--z-elevated": "10",
  "--z-header": "40",
  "--z-dropdown": "50",
  "--z-modal": "100",
  "--z-tooltip": "200",

  // Motion
  "--duration-fast": "150ms",
  "--duration-normal": "250ms",
  "--duration-slow": "350ms",
  "--ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  "--ease-out": "cubic-bezier(0.0, 0, 0.2, 1)",
  "--ease-in": "cubic-bezier(0.4, 0, 1, 1)",

  // Border Radius
  "--radius-pill": "9999px",
  "--radius-full": "50%",

  // Outline
  "--outline-width": "2px",
  "--outline-offset": "2px",

  // Overlay
  "--overlay-opacity": "0.5",

  // Common Sizes
  "--size-icon-sm": "20px",
  "--size-icon-md": "24px",
  "--size-icon-lg": "32px",
  "--size-touch-target": "44px",

  // Common Colors
  "--common-black": palette.common.black,
  "--common-white": palette.common.white,

  // Functional Tokens (Structure)
  "--border-strong": palette.common.black,

  // Structural Standards (Global)
  "--border-width": "2px",
  "--radius": "4px",
  "--shadow-hard": "4px 4px 0px 0px var(--border-strong)",
  "--shadow-hover": "8px 8px 0px 0px var(--border-strong)",

  // Typography Standards (Global)
  "--font-heading": "var(--font-montserrat)",
  "--heading-transform": "uppercase",
  "--heading-weight": "800",

  // Shadows (consistent relative to theme colors)
  "--shadow-sm": "2px 2px 0px 0px var(--card-border)",
  "--shadow-sm-hover": "4px 4px 0px 0px var(--card-border)",
  "--shadow-sm-checked": "4px 4px 0px 0px var(--card-border)",
  "--shadow-sm-checked-hover": "6px 6px 0px 0px var(--card-border)",
  "--shadow-lg": "8px 8px 0px 0px var(--card-border)",
};
