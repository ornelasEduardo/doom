import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { SplitButton } from "../../../components/SplitButton/SplitButton";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { orbitalTheme } from "../../../styles/themes/presets";

const originalRootSize = document.documentElement.style.fontSize;
afterEach(async () => {
  cleanup();
  document.documentElement.style.fontSize = originalRootSize;
  await page.viewport(1280, 800);
});

for (const themed of [false, true]) {
  it(`${themed ? "orbital" : "default"}: wraps enlarged labels without crowding the dropdown`, async () => {
    await page.viewport(320, 800);
    document.documentElement.style.fontSize = "32px";
    const primary = vi.fn();
    const secondary = vi.fn();
    render(
      <DesignSystemProvider {...(themed ? { theme: orbitalTheme } : {})}>
        <div data-testid="container" style={{ width: 240 }}>
          <SplitButton
            items={[{ label: "Account", onClick: secondary }]}
            primaryLabel="New conversation"
            onPrimaryClick={primary}
          />
        </div>
      </DesignSystemProvider>,
    );
    const container = screen.getByTestId("container");
    const main = screen.getByRole("button", {
      name: "New conversation",
      exact: true,
    });
    const dropdown = screen.getByRole("button", {
      name: "More New conversation options",
    });
    const root = main.parentElement!;
    expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right + 1,
    );
    expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth + 1);
    expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight + 1);
    expect(dropdown.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    const range = document.createRange();
    range.selectNodeContents(main);
    for (const rect of Array.from(range.getClientRects())) {
      expect(rect.right).toBeLessThanOrEqual(
        main.getBoundingClientRect().right + 1,
      );
    }
    await userEvent.click(main);
    expect(primary).toHaveBeenCalledOnce();
    await userEvent.click(dropdown);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(secondary).toHaveBeenCalledOnce();
  });
}
