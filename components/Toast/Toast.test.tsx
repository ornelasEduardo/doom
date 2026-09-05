import "@testing-library/jest-dom";

import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
      <button
        onClick={() => {
          for (let index = 0; index < 20; index++) {
            toastSuccess(`Saved ${index}`);
          }
          toastError("Urgent error");
        }}
      >
        Burst
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
  beforeEach(() => vi.useFakeTimers());

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

    const notification = screen.getByRole(role);
    expect(notification).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: `Show ${type}` }));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole(role)).toBe(notification);
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
  it("announces errors promptly despite a burst of polite messages", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
    const alert = screen.getByRole("alert");
    fireEvent.click(screen.getByText("Burst"));
    act(() => vi.advanceTimersByTime(100));
    expect(alert).toHaveTextContent(/^Urgent error$/);
    expect(screen.getByRole("alert")).toBe(alert);
    expect(screen.getByRole("status")).toHaveTextContent("Saved 19");
  });

  it.each([
    ["Success", "status"],
    ["Error", "alert"],
  ])(
    "retains %s text until replacement and clears repeated messages",
    (type, role) => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );
      const region = screen.getByRole(role);
      fireEvent.click(screen.getByText(`Show ${type}`));
      act(() => vi.advanceTimersByTime(100));
      expect(region).toHaveTextContent(`${type} Message`);
      act(() => vi.advanceTimersByTime(10000));
      expect(region).toHaveTextContent(`${type} Message`);
      expect(screen.getByRole(role)).toBe(region);
      fireEvent.click(screen.getByText(`Show ${type}`));
      expect(region).toBeEmptyDOMElement();
      act(() => vi.advanceTimersByTime(100));
      expect(region).toHaveTextContent(`${type} Message`);
    },
  );

  it("replaces polite announcements without reannouncing old content", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );
    const region = screen.getByRole("status");
    fireEvent.click(screen.getByText("Show Success"));
    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByText("Show Info"));
    expect(region).toBeEmptyDOMElement();
    act(() => vi.advanceTimersByTime(100));
    expect(region).toHaveTextContent(/^Info Message$/);
  });

  it("should render toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(
      screen.getByRole("group", { name: "Success Message" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show Error"));
    expect(
      screen.getByRole("group", { name: "Error Message" }),
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole("group", { name: "Success Message" }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(
      screen.queryByRole("group", { name: "Success Message" }),
    ).not.toBeInTheDocument();
  });

  it("should auto remove toast", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(
      screen.getByRole("group", { name: "Success Message" }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5500);
    });

    // Should be gone
    // Note: removeToast has a 300ms timeout inside too.
    // 5000 + 300 = 5300. 5500 is safe.
    expect(
      screen.queryByRole("group", { name: "Success Message" }),
    ).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
