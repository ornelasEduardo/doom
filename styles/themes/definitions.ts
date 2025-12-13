const baseVariables = {
  // Typography Scale
  '--text-xs': '0.75rem',
  '--text-sm': '0.875rem',
  '--text-base': '1rem',
  '--text-lg': '1.125rem',
  '--text-xl': '1.25rem',
  '--text-2xl': '1.5rem',
  '--text-3xl': '1.875rem',
  '--text-4xl': '2.25rem',
  '--text-5xl': '3rem',
  '--text-6xl': '3.75rem',

  // Font Weights
  '--font-thin': '100',
  '--font-extralight': '200',
  '--font-light': '300',
  '--font-regular': '400',
  '--font-medium': '500',
  '--font-semibold': '600',
  '--font-bold': '700',
  '--font-extrabold': '800',
  '--font-black': '900',

  // Z-Indices
  '--z-base': '0',
  '--z-elevated': '10',
  '--z-header': '40',
  '--z-dropdown': '50',
  '--z-modal': '100',
  '--z-tooltip': '200',

  // Motion
  '--duration-fast': '150ms',
  '--duration-normal': '250ms',
  '--duration-slow': '350ms',
  '--ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  '--ease-out': 'cubic-bezier(0.0, 0, 0.2, 1)',
  '--ease-in': 'cubic-bezier(0.4, 0, 1, 1)',

  // Shadows (consistent relative to theme colors)
  '--shadow-sm': '2px 2px 0px 0px var(--card-border)',
  '--shadow-sm-hover': '3px 3px 0px 0px var(--card-border)',
  '--shadow-sm-checked': '3px 3px 0px 0px var(--card-border)',
  '--shadow-sm-checked-hover': '4px 4px 0px 0px var(--card-border)',

  // Structural (Standardized across themes)
  '--border-width': '3px',
  '--radius': '8px',
  '--shadow-hard': '5px 5px 0px 0px #000000',
  '--shadow-hover': '7px 7px 0px 0px #000000',
  '--font-heading': 'var(--font-montserrat)',
  '--heading-transform': 'uppercase',
  '--heading-weight': '800', // Standardized to ExtraBold
};

export const themes = {
  default: {
    name: 'Default',
    variables: {
      ...baseVariables,
      '--background': '#e0e7ff',
      '--foreground': '#000000',
      '--card-bg': '#ffffff',
      '--card-border': '#000000',
      '--primary': '#a855f7',
      '--primary-hover': '#9333ea',
      '--primary-foreground': '#000000',
      '--secondary': '#fbbf24',
      '--secondary-foreground': '#000000',
      '--accent': '#ec4899',
      '--muted': '#94a3b8',
      '--muted-foreground': '#334155',
      '--success': '#22c55e',
      '--warning': '#f59e0b',
      '--error': '#ef4444',
    }
  },
  doom: {
    name: 'DOOMSDAY',
    variables: {
      ...baseVariables,
      '--background': '#020617', // Slate-950 (Dark Void)
      '--foreground': '#e2e8f0', // Slate-200 (Silver Armor)
      '--card-bg': '#0f172a', // Slate-900 (Dark Metal Plating)
      '--card-border': '#1e293b', // Slate-800 (Panel Lines)
      '--primary': '#10b981', // Emerald-500 (Latverian Cloak Green)
      '--primary-hover': '#059669', // Emerald-600
      '--primary-foreground': '#020617',
      '--secondary': '#334155', // Slate-700 (Gunmetal)
      '--secondary-foreground': '#f8fafc',
      '--accent': '#fbbf24', // Amber-400 (Gold Accents/Magic)
      '--muted': '#64748b', // Slate-500
      '--muted-foreground': '#94a3b8', // Slate-400
      '--success': '#10b981',
      '--warning': '#fbbf24',
      '--error': '#ef4444',
    }
  },
  neighbor: {
    name: 'THE CAPTAIN',
    variables: {
      ...baseVariables,
      '--background': '#F8FAFC', // Clean white/silver background
      '--foreground': '#0F172A', // Dark slate text
      '--card-bg': '#FFFFFF',
      '--card-border': '#002D72', // Patriotic Blue border
      '--primary': '#002D72', // Patriotic Blue
      '--primary-hover': '#1E3A8A',
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#B91C1C', // Vibrant Red
      '--secondary-foreground': '#FFFFFF',
      '--accent': '#C0C0C0', // Silver (Shield)
      '--muted': '#64748B',
      '--muted-foreground': '#475569',
      '--success': '#15803D',
      '--warning': '#B45309',
      '--error': '#B91C1C',
    }
  },
  vigilante: {
    name: 'DARK KNIGHT',
    variables: {
      ...baseVariables,
      '--background': '#0F1419', // Deep blue-black (like Gotham night sky)
      '--foreground': '#E8E9ED', // Soft white for excellent readability
      '--card-bg': '#1A1F29', // Slightly lighter than background for depth
      '--card-border': '#2D3748', // Subtle gray border (not yellow - too harsh)
      '--primary': '#F7B731', // Warm gold (Batman's utility belt yellow, but softer)
      '--primary-hover': '#F5A623',
      '--primary-foreground': '#0F1419', // Dark text on yellow buttons
      '--secondary': '#4A5568', // Medium gray for secondary elements
      '--secondary-foreground': '#E8E9ED',
      '--accent': '#3B82F6', // Cool blue accent (Batman's cape)
      '--muted': '#718096', // Muted gray for less important text
      '--muted-foreground': '#A0AEC0', // Lighter muted text
      '--success': '#48BB78', // Softer green (not neon)
      '--warning': '#ED8936', // Warm orange warning
      '--error': '#F56565', // Softer red (not harsh)
    }
  }
} as const;

export type ThemeKey = keyof typeof themes;
