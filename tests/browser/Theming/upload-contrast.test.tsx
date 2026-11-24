import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { FileUpload } from "../../../components/FileUpload/FileUpload";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { captainTheme } from "../../../styles/themes/presets";

afterEach(cleanup);
for (const legacy of [true, false]) {
  it(`pairs the error header title with its error foreground (${legacy ? "legacy" : "object"})`, () => {
    const props = legacy
      ? { initialTheme: "captain" as const }
      : { theme: captainTheme };
    render(
      <DesignSystemProvider {...props}>
        <FileUpload error errorMessage="Invalid file" label="Upload resume" />
      </DesignSystemProvider>,
    );
    const title = screen.getByText("Upload resume");
    const header = title.closest('[data-doom-part="header"]')!;
    expect(getComputedStyle(header).backgroundColor).toBe("rgb(185, 28, 28)");
    expect(getComputedStyle(title).color).toBe("rgb(255, 255, 255)");
    expect(getComputedStyle(title).color).toBe(getComputedStyle(header).color);
  });
}
