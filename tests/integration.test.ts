/**
 * Integration test to verify the built package can be imported in ESM
 * This catches issues that static analysis might miss
 */

import { describe, expect, it } from "vitest";

describe("Package ESM Integration", () => {
  it("should be able to import the main entry point", async () => {
    // This will fail if there are any import resolution issues
    const pkg = await import("../dist/index.js");

    // Verify some key exports exist
    expect(pkg.Button).toBeDefined();
    expect(pkg.Input).toBeDefined();
    expect(pkg.Card).toBeDefined();
  });

  it("should be able to import individual components", async () => {
    const { Button } = await import("../dist/components/Button/index.js");
    const { Input } = await import("../dist/components/Input/index.js");
    const { Badge } = await import("../dist/components/Badge/index.js");

    expect(Button).toBeDefined();
    expect(Input).toBeDefined();
    expect(Badge).toBeDefined();
  });

  it("should be able to import theme utilities", async () => {
    const themes = await import("../dist/styles/themes/index.js");
    expect(themes.ThemeProvider).toBeDefined();
  });
});
