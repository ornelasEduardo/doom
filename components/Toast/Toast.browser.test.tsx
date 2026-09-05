import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import { ToastProvider, useToast } from "./Toast";

function ToastTriggers() {
  const { toast, toastSuccess, toastError, toastWarning, toastInfo } =
    useToast();
  return (
    <>
      <button onClick={() => toastSuccess("Saved")}>Success</button>
      <button onClick={() => toastError("Failed")}>Error</button>
      <button onClick={() => toastWarning("Check input")}>Warning</button>
      <button onClick={() => toastInfo("Updated")}>Info</button>
      <button onClick={() => toast("Ready")}>Default</button>
    </>
  );
}

afterEach(cleanup);

describe("Toast in Chromium", () => {
  it.each([
    ["Success", "status", "Saved"],
    ["Error", "alert", "Failed"],
    ["Warning", "status", "Check input"],
    ["Info", "status", "Updated"],
    ["Default", "status", "Ready"],
  ] as const)(
    "exposes %s semantics after a real click",
    async (type, role, message) => {
      render(
        <ToastProvider>
          <ToastTriggers />
        </ToastProvider>,
      );

      await page.getByRole("button", { name: type, exact: true }).click();
      const notification = page.getByRole(role);
      await expect
        .element(notification, { timeout: 1000 })
        .toHaveTextContent(message);
      const element = notification.element();
      expect(
        element.parentElement?.closest(
          '[aria-live], [role="alert"], [role="status"], [role="log"]',
        ),
      ).toBeNull();
      expect(
        element.querySelector(
          '[aria-live], [role="alert"], [role="status"], [role="log"]',
        ),
      ).toBeNull();
    },
  );

  it("dismisses only the selected notification through its named close button", async () => {
    render(
      <ToastProvider>
        <ToastTriggers />
      </ToastProvider>,
    );

    await page.getByRole("button", { name: "Success", exact: true }).click();
    await page.getByRole("button", { name: "Error", exact: true }).click();
    await page
      .getByRole("status")
      .getByRole("button", { name: "Close notification" })
      .click({ timeout: 1000 });

    await expect
      .element(page.getByRole("status"), { timeout: 1000 })
      .not.toBeInTheDocument();
    await expect.element(page.getByRole("alert")).toHaveTextContent("Failed");
  });
});
