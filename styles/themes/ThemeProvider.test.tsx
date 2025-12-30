import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./ThemeProvider";

// Helper component to consume theme context
const ThemeConsumer = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme("doom")}>Set Doom Theme</button>
      <button onClick={() => setTheme("default")}>Set Default Theme</button>
    </div>
  );
};

describe("ThemeProvider", () => {
  it("renders with default theme", () => {
    render(
      <ThemeProvider initialTheme="default">
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("current-theme").textContent).toBe("default");
  });

  it("renders with provided initial theme", () => {
    render(
      <ThemeProvider initialTheme="doom">
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("current-theme").textContent).toBe("doom");
  });

  it("updates theme when setTheme is called", () => {
    render(
      <ThemeProvider initialTheme="default">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    const button = screen.getByText("Set Doom Theme");
    fireEvent.click(button);

    expect(screen.getByTestId("current-theme").textContent).toBe("doom");
  });

  it("calls onThemeChange when theme is updated", () => {
    const handleThemeChange = vi.fn();
    render(
      <ThemeProvider initialTheme="default" onThemeChange={handleThemeChange}>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    const button = screen.getByText("Set Doom Theme");
    fireEvent.click(button);

    expect(handleThemeChange).toHaveBeenCalledWith("doom");
  });
});
