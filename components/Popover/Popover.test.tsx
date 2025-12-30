import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Popover } from "./Popover";
import styles from "./Popover.module.scss";

describe("Popover Component", () => {
  it("should render trigger", () => {
    render(
      <Popover
        content={<div>Content</div>}
        isOpen={false}
        trigger={<button>Trigger</button>}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("should render content when open in a portal", () => {
    const { getByText } = render(
      <Popover
        content={<div>Content</div>}
        isOpen={true}
        trigger={<button>Trigger</button>}
        onClose={() => {}}
      />,
    );
    const content = getByText("Content");
    expect(content).toBeInTheDocument();
    // Verify it's in a portal (child of body)
    expect(content.closest("body")).toBe(document.body);
  });

  it("should call onClose when clicking outside", () => {
    const onClose = vi.fn();
    render(
      <Popover
        content={<div>Content</div>}
        isOpen={true}
        trigger={<button>Trigger</button>}
        onClose={onClose}
      />,
    );

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("should not call onClose when clicking inside the content", () => {
    const onClose = vi.fn();
    render(
      <Popover
        content={<div>Content</div>}
        isOpen={true}
        trigger={<button>Trigger</button>}
        onClose={onClose}
      />,
    );

    // Click inside
    fireEvent.mouseDown(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should clean up event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <Popover
        content={<div>Content</div>}
        isOpen={true}
        trigger={<button>Trigger</button>}
        onClose={() => {}}
      />,
    );

    unmount();
    // Should remove resize and scroll listeners (plus mousedown on document)
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      true,
    );

    removeSpy.mockRestore();
  });

  describe("Positioning & Edge Detection", () => {
    let getBoundingClientRectSpy: any;

    beforeEach(() => {
      // Mock window dimensions for happy-dom
      vi.stubGlobal("innerWidth", 1000);
      vi.stubGlobal("innerHeight", 800);

      // Spy on prototype
      getBoundingClientRectSpy = vi.spyOn(
        HTMLElement.prototype,
        "getBoundingClientRect",
      );
    });

    afterEach(() => {
      getBoundingClientRectSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it("should clamp horizontal position when overflowing right edge", () => {
      // Trigger near right edge (left=950, width=50)
      // Viewport width = 1000
      // Popover width = 200
      // Padding = 16
      // Calculation: align='start' -> left = 950.
      // Overflow: 950 + 200 = 1150 > 1000 - 16 (984).
      // Clamped left = 1000 - 200 - 16 = 784.

      getBoundingClientRectSpy.mockImplementation(function (this: HTMLElement) {
        if (this.classList.contains(styles.triggerWrapper)) {
          return {
            top: 100,
            left: 950,
            width: 50,
            height: 40,
            bottom: 140,
            right: 1000,
          } as DOMRect;
        }
        if (this.classList.contains(styles.popover)) {
          return {
            top: 0,
            left: 0,
            width: 200,
            height: 100,
            bottom: 0,
            right: 0,
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          bottom: 0,
          right: 0,
        } as DOMRect;
      });

      render(
        <Popover
          content={<div>Content</div>}
          isOpen={true}
          placement="bottom-start"
          trigger={<button>Trigger</button>}
          onClose={() => {}}
        />,
      );

      const popover = document.body.querySelector(
        `.${styles.popover}`,
      ) as HTMLElement;
      expect(popover).toBeInTheDocument();
      expect(popover.style.left).toBe("784px");
    });

    it("should clamp horizontal position when overflowing left edge", () => {
      // Trigger near left edge (left=5, width=50)
      // Padding = 16
      // Clamped left = 16.

      getBoundingClientRectSpy.mockImplementation(function (this: HTMLElement) {
        if (this.classList.contains(styles.triggerWrapper)) {
          return {
            top: 100,
            left: 5,
            width: 50,
            height: 40,
            bottom: 140,
            right: 55,
          } as DOMRect;
        }
        if (this.classList.contains(styles.popover)) {
          return {
            top: 0,
            left: 0,
            width: 200,
            height: 100,
            bottom: 0,
            right: 0,
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          bottom: 0,
          right: 0,
        } as DOMRect;
      });

      render(
        <Popover
          content={<div>Content</div>}
          isOpen={true}
          placement="bottom-start"
          trigger={<button>Trigger</button>}
          onClose={() => {}}
        />,
      );

      const popover = document.body.querySelector(
        `.${styles.popover}`,
      ) as HTMLElement;
      expect(popover.style.left).toBe("16px");
    });

    it("should flip to top when overflowing bottom edge", () => {
      // Trigger near bottom edge
      // Trigger: top=750, height=40 (bottom=790)
      // Viewport: 800, offset=8
      // Content: height=100
      // Normal bottom: 790 + 8 = 798.
      // 798 + 100 = 898 > 800.
      // Flip to top: 750 - 100 - 8 = 642.

      getBoundingClientRectSpy.mockImplementation(function (this: HTMLElement) {
        if (this.classList.contains(styles.triggerWrapper)) {
          return {
            top: 750,
            left: 100,
            width: 50,
            height: 40,
            bottom: 790,
            right: 150,
          } as DOMRect;
        }
        if (this.classList.contains(styles.popover)) {
          return {
            top: 0,
            left: 0,
            width: 200,
            height: 100,
            bottom: 0,
            right: 0,
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          bottom: 0,
          right: 0,
        } as DOMRect;
      });

      render(
        <Popover
          content={<div>Content</div>}
          isOpen={true}
          placement="bottom-start"
          trigger={<button>Trigger</button>}
          onClose={() => {}}
        />,
      );

      const popover = document.body.querySelector(
        `.${styles.popover}`,
      ) as HTMLElement;
      expect(popover.style.top).toBe("642px");
    });
  });
});
