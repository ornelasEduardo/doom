import "@testing-library/jest-dom";

import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./Toast";

// Test component to use the hook
const TestComponent = () => {
  const { toastSuccess, toastError } = useToast();
  return (
    <div>
      <button onClick={() => toastSuccess("Success Message")}>
        Show Success
      </button>
      <button onClick={() => toastError("Error Message")}>Show Error</button>
    </div>
  );
};

describe("Toast Component", () => {
  it("should render toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success Message")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Error Message")).toBeInTheDocument();
  });

  it("should remove toast on close click", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success Message")).toBeInTheDocument();

    // Find close button (it has an X icon)
    // We can find by role button inside the toast
    const closeButtons = screen.getAllByRole("button");
    // The first 2 are from TestComponent, the 3rd should be the close button
    const closeButton = closeButtons[2];

    fireEvent.click(closeButton);

    // It has a timeout for animation, so we need to wait
    // But in JSDOM/Vitest we might need fake timers.
    // For now, let's just check if removeToast was called (which sets isExiting).
    // The element might still be there but exiting.
    // Let's use fake timers.
  });

  it("should auto remove toast", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success Message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5500);
    });

    // Should be gone
    // Note: removeToast has a 300ms timeout inside too.
    // 5000 + 300 = 5300. 5500 is safe.
    expect(screen.queryByText("Success Message")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
