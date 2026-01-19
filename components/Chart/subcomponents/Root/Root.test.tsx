import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Root } from "./Root";
import styles from "./Root.module.scss";

// Mock ResizeObserver as a class
// Mock ResizeObserver as a class
const resizeObservers: {
  callback: ResizeObserverCallback;
  element: Element;
}[] = [];

class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    resizeObservers.push({ callback: this.callback, element });
    // Trigger immediately with mock dimensions
    this.callback(
      [
        {
          target: element,
          contentRect: { width: 500, height: 300 } as DOMRectReadOnly,
          contentBoxSize: [
            { inlineSize: 500, blockSize: 300 } as ResizeObserverSize,
          ],
        } as ResizeObserverEntry,
      ],
      this,
    );
  }

  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

describe("Root", () => {
  const data = [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
  ];

  it("renders children", () => {
    render(
      <Root data={data}>
        <div data-testid="child">Child content</div>
      </Root>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies container class", () => {
    const { container } = render(
      <Root data={data}>
        <div>Content</div>
      </Root>,
    );
    expect(container.firstChild).toHaveClass(styles.chartContainer);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Root className="custom-class" data={data}>
        <div>Content</div>
      </Root>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("applies solid variant class", () => {
    const { container } = render(
      <Root data={data} variant="solid">
        <div>Content</div>
      </Root>,
    );
    expect(container.firstChild).toHaveClass(styles.solid);
  });

  it("applies flat class when flat prop is true", () => {
    const { container } = render(
      <Root flat data={data}>
        <div>Content</div>
      </Root>,
    );
    expect(container.firstChild).toHaveClass(styles.flat);
  });

  it("applies frameless class when withFrame is false", () => {
    const { container } = render(
      <Root data={data} withFrame={false}>
        <div>Content</div>
      </Root>,
    );
    expect(container.firstChild).toHaveClass(styles.frameless);
  });

  it("applies custom style", () => {
    const { container } = render(
      <Root data={data} style={{ backgroundColor: "red" }}>
        <div>Content</div>
      </Root>,
    );
    expect(container.firstChild).toHaveStyle({ backgroundColor: "red" });
  });
});
