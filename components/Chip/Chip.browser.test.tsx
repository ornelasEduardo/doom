import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { Chip } from "./Chip";

afterEach(cleanup);

describe("Chip keyboard interaction in Chromium", () => {
  it.each(["{Enter}", " "])(
    "activates the focused root once with %j",
    async (key) => {
      const calls: string[] = [];
      render(
        <Chip
          onClick={(event) => calls.push(event.type)}
          onKeyDown={() => calls.push("keydown")}
        >
          Activate
        </Chip>,
      );
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole("button"));
      await userEvent.keyboard(key);
      expect(calls).toEqual(["keydown", "click"]);
    },
  );

  it.each(["{Enter}", " "])(
    "honors callback cancellation with %j",
    async (key) => {
      const onClick = vi.fn();
      const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLDivElement>) =>
        event.preventDefault(),
      );
      render(
        <Chip onClick={onClick} onKeyDown={onKeyDown}>
          Cancelled
        </Chip>,
      );
      await userEvent.tab();
      await userEvent.keyboard(key);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    },
  );

  it.each(["{Enter}", " "])(
    "activates only the nested dismiss button with %j",
    async (key) => {
      const onClick = vi.fn();
      const onDismiss = vi.fn();
      render(
        <Chip onClick={onClick} onDismiss={onDismiss}>
          Dismissible
        </Chip>,
      );
      await userEvent.tab();
      await userEvent.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Dismiss" }),
      );
      await userEvent.keyboard(key);
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    },
  );

  it.each(["{Enter}", " "])(
    "does not activate a disabled chip even with consumer-provided tabIndex using %j",
    async (key) => {
      const onClick = vi.fn();
      const onKeyDown = vi.fn();
      render(
        <Chip disabled tabIndex={0} onClick={onClick} onKeyDown={onKeyDown}>
          Disabled
        </Chip>,
      );
      await userEvent.tab();
      expect(document.activeElement).toBe(screen.getByRole("button"));
      await userEvent.keyboard(key);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    },
  );

  it("prevents Space from scrolling a scrollable page", async () => {
    const onClick = vi.fn();
    const { container } = render(<Chip onClick={onClick}>Stay here</Chip>);
    container.style.height = "3000px";
    window.scrollTo(0, 0);
    await userEvent.tab();
    await userEvent.keyboard(" ");
    // Chromium scrolls asynchronously after a Space key's default action.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(window.scrollY).toBe(0);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
