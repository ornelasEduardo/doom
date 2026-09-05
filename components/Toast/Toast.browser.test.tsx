import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React, { StrictMode, useEffect, useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import { ToastProvider, useToast } from "./Toast";

function MountedOnce() {
  const sent = useRef(false);
  const { toastInfo } = useToast();
  useEffect(() => {
    if (!sent.current) {
      sent.current = true;
      toastInfo("Mounted once");
    }
  }, [toastInfo]);
  return null;
}

function ToastTriggers() {
  const { toast, toastSuccess, toastError, toastWarning, toastInfo } =
    useToast();
  return (
    <>
      <button onClick={() => toastSuccess("Saved")}>Success</button>
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
      <button onClick={() => toastError("Failed")}>Error</button>
      <button onClick={() => toastWarning("Check input")}>Warning</button>
      <button onClick={() => toastInfo("Updated")}>Info</button>
      <button onClick={() => toast("Ready")}>Default</button>
    </>
  );
}

afterEach(cleanup);

describe("Toast in Chromium", () => {
  it.each([false, true])(
    "announces a guarded child mount effect with StrictMode=%s",
    async (strict) => {
      const content = (
        <ToastProvider>
          <MountedOnce />
        </ToastProvider>
      );
      render(strict ? <StrictMode>{content}</StrictMode> : content);
      const region = page.getByRole("status").element();
      expect(region.textContent).toBe("");
      await expect
        .element(page.getByRole("group", { name: "Mounted once" }))
        .toBeInTheDocument();
      await expect
        .element(region, { timeout: 500 })
        .toHaveTextContent("Mounted once");
      expect(page.getByRole("status").element()).toBe(region);
    },
  );

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

      const notification = page.getByRole(role);
      const original = notification.element();
      expect(original.textContent).toBe("");
      await page.getByRole("button", { name: type, exact: true }).click();
      await expect
        .element(notification, { timeout: 1000 })
        .toHaveTextContent(message);
      const element = notification.element();
      expect(element).toBe(original);
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

  it("makes repeated messages genuine changes in the same established region", async () => {
    render(
      <ToastProvider>
        <ToastTriggers />
      </ToastProvider>,
    );
    const region = page.getByRole("status").element();
    expect(region.textContent).toBe("");
    await page.getByRole("button", { name: "Success", exact: true }).click();
    await expect.element(region, { timeout: 1000 }).toHaveTextContent("Saved");
    const changes: string[] = [];
    const observer = new MutationObserver(() =>
      changes.push(region.textContent ?? ""),
    );
    observer.observe(region, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    try {
      await page.getByRole("button", { name: "Success", exact: true }).click();
      await expect.poll(() => changes, { timeout: 2000 }).toContain("");
      await expect.poll(() => changes, { timeout: 2000 }).toContain("Saved");
      expect(changes.indexOf("")).toBeLessThan(changes.indexOf("Saved"));
      expect(page.getByRole("status").element()).toBe(region);
    } finally {
      observer.disconnect();
    }
  });

  it.each([
    ["Success", "status", "Saved"],
    ["Error", "alert", "Failed"],
  ] as const)(
    "retains %s text in the established region without a replacement",
    async (type, role, message) => {
      render(
        <ToastProvider>
          <ToastTriggers />
        </ToastProvider>,
      );
      const region = page.getByRole(role).element();
      await page.getByRole("button", { name: type, exact: true }).click();
      await expect.element(region, { timeout: 500 }).toHaveTextContent(message);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      expect(region.textContent).toBe(message);
      expect(page.getByRole(role).element()).toBe(region);
    },
  );

  it("announces an error promptly through a polite burst and retains both regions", async () => {
    render(
      <ToastProvider>
        <ToastTriggers />
      </ToastProvider>,
    );
    const alert = page.getByRole("alert").element();
    const status = page.getByRole("status").element();
    await page.getByRole("button", { name: "Burst", exact: true }).click();
    await expect
      .element(alert, { timeout: 500 })
      .toHaveTextContent("Urgent error");
    await expect
      .element(status, { timeout: 500 })
      .toHaveTextContent("Saved 19");
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(alert.textContent).toBe("Urgent error");
    expect(status.textContent).toContain("Saved 19");
    expect(page.getByRole("alert").element()).toBe(alert);
    expect(page.getByRole("status").element()).toBe(status);
  });

  it("dismisses only the selected notification through its named close button", async () => {
    render(
      <ToastProvider>
        <ToastTriggers />
      </ToastProvider>,
    );

    await page.getByRole("button", { name: "Success", exact: true }).click();
    await page.getByRole("button", { name: "Error", exact: true }).click();
    await page
      .getByRole("group", { name: "Saved" })
      .getByRole("button", { name: "Close notification" })
      .click({ timeout: 1000 });

    await expect
      .element(page.getByRole("group", { name: "Saved" }), { timeout: 1000 })
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("group", { name: "Failed" }))
      .toHaveTextContent("Failed");
  });
});
