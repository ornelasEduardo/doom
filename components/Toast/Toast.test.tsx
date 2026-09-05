import "@testing-library/jest-dom";

import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./Toast";

// Test component to use the hook
const TestComponent = () => {
  const { toast, toastSuccess, toastError, toastWarning, toastInfo } =
    useToast();
  return (
    <div>
      <button onClick={() => toastSuccess("Success Message")}>
        Show Success
      </button>
      <button onClick={() => toastError("Error Message")}>Show Error</button>
      <button onClick={() => toastWarning("Warning Message")}>
        Show Warning
      </button>
      <button onClick={() => toastInfo("Info Message")}>Show Info</button>
      <button onClick={() => toast("Default Message")}>Show Default</button>
    </div>
  );
};

describe("Toast Component", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it.each([
    ["Success", "status"],
    ["Error", "alert"],
    ["Warning", "status"],
    ["Info", "status"],
    ["Default", "status"],
  ])("exposes %s notifications with the %s role", (type, role) => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: `Show ${type}` }));
    const notification = screen.getByRole(role);
    expect(notification).toHaveTextContent(`${type} Message`);
    expect(
      notification.parentElement?.closest(
        '[aria-live], [role="alert"], [role="status"], [role="log"]',
      ),
    ).toBeNull();
    expect(
      notification.querySelector(
        '[aria-live], [role="alert"], [role="status"], [role="log"]',
      ),
    ).toBeNull();
  });
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

  it("should remove toast using the accessible close button after its exit animation", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByRole("button", { name: "Close notification" }));
    expect(screen.getByText("Success Message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Success Message")).not.toBeInTheDocument();
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
