import { cleanup, render, within } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Modal } from "../../../components/Modal/Modal";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

const theme = defineTheme({ name: "host", roles: { brand: "tomato" } });
const overlay = (host: Element) => (
  <ThemeScope portalContainer={host} theme={theme}>
    <Modal isOpen title="Preferences" onClose={() => {}}>
      Visible
    </Modal>
  </ThemeScope>
);

afterEach(cleanup);

it("mounts a themed dialog in a connected light DOM container", () => {
  const host = document.body.appendChild(document.createElement("section"));
  try {
    const view = render(overlay(host));
    const dialog = within(host).getByRole("dialog");
    expect(
      getComputedStyle(dialog).getPropertyValue("--doom-roles-brand").trim(),
    ).toBe("tomato");
    view.unmount();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  } finally {
    host.remove();
  }
});

it("diagnoses unsupported portal style roots and detached containers", () => {
  const shadowHost = document.body.appendChild(document.createElement("div"));
  const frame = document.body.appendChild(document.createElement("iframe"));
  try {
    const shadow = shadowHost.attachShadow({ mode: "open" });
    const invalid = [
      shadow,
      shadow.appendChild(document.createElement("aside")),
      frame.contentDocument!.body,
      document.createElement("div"),
      document.createDocumentFragment(),
    ];
    for (const target of invalid) {
      expect(() => render(overlay(target as Element))).toThrow(
        /portalContainer must be a connected element/,
      );
    }
  } finally {
    frame.remove();
    shadowHost.remove();
  }
});
