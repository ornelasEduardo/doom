import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Chip } from "./Chip";

describe("Chip", () => {
  it.each(["Enter", " "])(
    "activates once on %j with a mouse click event",
    (key) => {
      const onClick = vi.fn();
      render(<Chip onClick={onClick}>Activate</Chip>);
      const chip = screen.getByRole("button");
      chip.focus();
      fireEvent.keyDown(chip, { key });
      fireEvent.keyUp(chip, { key });
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0].type).toBe("click");
      expect(onClick.mock.calls[0][0].target).toBe(chip);
    },
  );

  it("prevents Space scrolling when activating", () => {
    render(<Chip onClick={() => {}}>Activate</Chip>);
    const chip = screen.getByRole("button");
    const event = createEvent.keyDown(chip, { key: " " });
    fireEvent(chip, event);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each(["Enter", " "])(
    "calls onKeyDown before activating with %j",
    (key) => {
      const calls: string[] = [];
      render(
        <Chip
          onClick={() => calls.push("click")}
          onKeyDown={() => calls.push("keydown")}
        >
          Activate
        </Chip>,
      );
      fireEvent.keyDown(screen.getByRole("button"), { key });
      expect(calls).toEqual(["keydown", "click"]);
    },
  );

  it.each(["Enter", " "])("honors onKeyDown cancellation for %j", (key) => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLDivElement>) =>
      event.preventDefault(),
    );
    render(
      <Chip onClick={onClick} onKeyDown={onKeyDown}>
        Cancelled
      </Chip>,
    );
    fireEvent.keyDown(screen.getByRole("button"), { key });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(["Enter", " "])("does not activate disabled chips with %j", (key) => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <Chip disabled onClick={onClick} onKeyDown={onKeyDown}>
        Disabled
      </Chip>,
    );
    const chip = screen.getByRole("button");
    fireEvent.keyDown(chip, { key });
    expect(chip).not.toHaveAttribute("tabindex");
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it.each(["Escape", "ArrowDown", "a"])(
    "passes through unrelated key %j",
    (key) => {
      const onClick = vi.fn();
      const onKeyDown = vi.fn();
      render(
        <Chip onClick={onClick} onKeyDown={onKeyDown}>
          Other key
        </Chip>,
      );
      const event = createEvent.keyDown(screen.getByRole("button"), { key });
      fireEvent(screen.getByRole("button"), event);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    },
  );

  it.each(["Enter", " "])(
    "leaves dismiss button keyboard events alone for %j",
    (key) => {
      const onClick = vi.fn();
      const onDismiss = vi.fn();
      const onKeyDown = vi.fn();
      render(
        <Chip onClick={onClick} onDismiss={onDismiss} onKeyDown={onKeyDown}>
          Dismissible
        </Chip>,
      );
      const dismiss = screen.getByRole("button", { name: "Dismiss" });
      const event = createEvent.keyDown(dismiss, { key });
      fireEvent(dismiss, event);
      expect(event.defaultPrevented).toBe(false);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
      // The DOM test environment does not synthesize native button clicks from keys.
      fireEvent.click(dismiss);
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    },
  );

  it.each(["Enter", " "])(
    "does not intercept %j on a non-clickable chip",
    (key) => {
      const onKeyDown = vi.fn();
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Chip ref={ref} onKeyDown={onKeyDown}>
          Static
        </Chip>,
      );
      const event = createEvent.keyDown(ref.current!, { key });
      fireEvent(ref.current!, event);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(false);
      expect(ref.current).not.toHaveAttribute("role");
      expect(ref.current).not.toHaveAttribute("tabindex");
    },
  );

  // ==========================================================================
  // Rendering
  // ==========================================================================

  it("should render children correctly", () => {
    render(<Chip>Test Label</Chip>);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("should apply default variant and size classes", () => {
    const { container } = render(<Chip>Default</Chip>);
    // use :first-child to get the root div, not the inner span
    const chip = container.firstChild as HTMLElement;
    expect(chip?.className).toMatch(/chip/);
    expect(chip?.className).toMatch(/default/);
    expect(chip?.className).toMatch(/md/);
  });

  it.each(["primary", "success", "warning", "error"] as const)(
    "should apply %s variant class",
    (variant) => {
      const { container } = render(<Chip variant={variant}>Variant</Chip>);
      const chip = container.firstChild as HTMLElement;
      expect(chip?.className).toMatch(new RegExp(variant));
    },
  );

  it.each(["xs", "sm", "md", "lg", "xl"] as const)(
    "should apply %s size class",
    (size) => {
      const { container } = render(<Chip size={size}>Size</Chip>);
      const chip = container.firstChild as HTMLElement;
      expect(chip?.className).toMatch(new RegExp(`_${size}_`));
    },
  );

  // ==========================================================================
  // Interactivity
  // ==========================================================================

  it("should apply interactive class when onClick is provided", () => {
    const { container } = render(<Chip onClick={() => {}}>Clickable</Chip>);
    const chip = container.firstChild as HTMLElement;
    expect(chip?.className).toMatch(/interactive/);
  });

  it("should apply interactive class when onDismiss is provided", () => {
    const { container } = render(<Chip onDismiss={() => {}}>Dismissible</Chip>);
    const chip = container.firstChild as HTMLElement;
    expect(chip?.className).toMatch(/interactive/);
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Clickable</Chip>);

    fireEvent.click(screen.getByText("Clickable"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Chip disabled onClick={handleClick}>
        Disabled
      </Chip>,
    );

    fireEvent.click(screen.getByText("Disabled"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should have role=button when onClick is provided", () => {
    render(<Chip onClick={() => {}}>Button</Chip>);
    const chip = screen.getByRole("button");
    expect(chip).toBeInTheDocument();
  });

  it("should have tabIndex=0 when interactive and not disabled", () => {
    const { container } = render(<Chip onClick={() => {}}>Focusable</Chip>);
    const chip = container.firstChild as HTMLElement;
    expect(chip).toHaveAttribute("tabIndex", "0");
  });

  // ==========================================================================
  // Dismiss
  // ==========================================================================

  it("should render dismiss button when onDismiss is provided", () => {
    render(<Chip onDismiss={() => {}}>Dismissible</Chip>);
    expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
  });

  it("should not render dismiss button when disabled", () => {
    render(
      <Chip disabled onDismiss={() => {}}>
        Disabled Dismiss
      </Chip>,
    );
    expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
  });

  it("should call onDismiss when dismiss button clicked", () => {
    const handleDismiss = vi.fn();
    render(<Chip onDismiss={handleDismiss}>Dismissible</Chip>);

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("should call onDismiss when dismiss button is clicked", () => {
    const handleDismiss = vi.fn();
    render(<Chip onDismiss={handleDismiss}>Dismissible</Chip>);

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  // ==========================================================================
  // Ref Forwarding
  // ==========================================================================

  it("should forward ref to the div element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Chip ref={ref}>Ref Test</Chip>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toContain("Ref Test");
  });

  // ==========================================================================
  // Disabled State
  // ==========================================================================

  it("should apply disabled class when disabled", () => {
    const { container } = render(<Chip disabled>Disabled</Chip>);
    const chip = container.firstChild as HTMLElement;
    expect(chip?.className).toMatch(/disabled/);
  });
});
