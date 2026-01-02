"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { ThemeKey, themes } from "./definitions";

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialTheme,
  onThemeChange,
}: {
  children: React.ReactNode;
  initialTheme: ThemeKey;
  onThemeChange?: (theme: ThemeKey) => void;
}) {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(initialTheme);

  useEffect(() => {
    setCurrentTheme(initialTheme);
  }, [initialTheme]);

  const handleSetTheme = (newTheme: ThemeKey) => {
    setCurrentTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  // Get the variables for the current theme
  const themeConfig = themes[currentTheme] || themes.default;
  const themeVars = themeConfig.variables;
  const solidVars = themeConfig.solid || {};

  // Generate CSS variables string (includes both theme and solid tokens)
  const allVars = { ...themeVars, ...solidVars };
  const cssVariables = Object.entries(allVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n");

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme: handleSetTheme,
        availableThemes: themes,
      }}
    >
      <style
        dangerouslySetInnerHTML={{ __html: `:root { ${cssVariables} }` }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
