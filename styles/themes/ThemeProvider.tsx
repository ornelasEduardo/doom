'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Global, css } from '@emotion/react';
import { themes, ThemeKey } from './definitions';
import { setThemePreference } from './actions';

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children, 
  initialTheme 
}: { 
  children: React.ReactNode; 
  initialTheme: ThemeKey;
}) {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(initialTheme);

  const handleSetTheme = async (newTheme: ThemeKey) => {
    setCurrentTheme(newTheme);
    await setThemePreference(newTheme);
  };

  // Get the variables for the current theme
  const themeVars = themes[currentTheme]?.variables || themes.default.variables;

  // Generate CSS variables block
  const themeStyles = css`
    :root {
      ${Object.entries(themeVars)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n      ')}
    }
  `;

  return (
    <ThemeContext.Provider 
      value={{ 
        theme: currentTheme, 
        setTheme: handleSetTheme,
        availableThemes: themes
      }}
    >
      <Global styles={themeStyles} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
