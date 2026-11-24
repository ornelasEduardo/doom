import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { FileUpload } from "../../../components/FileUpload/FileUpload";
import { Input } from "../../../components/Input/Input";
import {
  Tabs,
  TabsBody,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/Tabs/Tabs";
import { Textarea } from "../../../components/Textarea/Textarea";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

afterEach(cleanup);
const accent = "rgb(13, 54, 82)";
const invalid = { states: { invalid: { backgroundColor: accent } } };
it("styles invalid helper text and dropzone as their error state changes", async () => {
  const theme = defineTheme({
    name: "Forms",
    components: {
      Input: { parts: { helperText: invalid } },
      Textarea: { parts: { helperText: invalid } },
      FileUpload: { parts: { body: invalid } },
    },
  });
  function fixture(error: boolean) {
    return (
      <ThemeScope theme={theme}>
        <Input
          error={error ? "Address invalid" : undefined}
          helperText="Address help"
        />
        <Textarea
          error={error ? "Note invalid" : undefined}
          helperText="Note help"
        />
        <FileUpload
          classNames={{ body: "dropzone" }}
          error={error}
          errorMessage="Upload invalid"
        />
      </ThemeScope>
    );
  }
  const { container, rerender } = render(fixture(true));
  const body = container.querySelector(".dropzone")!;
  for (const node of [
    body,
    screen.getByText("Address invalid"),
    screen.getByText("Note invalid"),
  ]) {
    expect(getComputedStyle(node).backgroundColor).toBe(accent);
  }
  fireEvent.dragEnter(body);
  expect(body.hasAttribute("data-dragging")).toBe(true);
  fireEvent.dragLeave(body);
  expect(body.hasAttribute("data-dragging")).toBe(false);
  rerender(fixture(false));
  for (const node of [
    body,
    screen.getByText("Address help"),
    screen.getByText("Note help"),
  ]) {
    await expect
      .poll(() => getComputedStyle(node).backgroundColor)
      .not.toBe(accent);
  }
});
it("routes upload instance classes to the preview image and wrapper", async () => {
  const theme = defineTheme({ name: "Preview" });
  const { container } = render(
    <ThemeScope theme={theme}>
      <style>
        {
          ".preview-frame { padding: 7px } .preview-image { border-radius: 13px }"
        }
      </style>
      <FileUpload
        showPreview
        classNames={{
          previewWrapper: "preview-frame",
          previewImg: "preview-image",
        }}
      />
    </ThemeScope>,
  );
  const file = new File(
    ['<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"/>'],
    "example.svg",
    { type: "image/svg+xml" },
  );
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: transfer.files },
  });
  const preview = await screen.findByRole("img", { name: "example" });
  expect(getComputedStyle(preview).borderTopLeftRadius).toBe("13px");
  expect(getComputedStyle(preview.closest(".preview-frame")!).paddingTop).toBe(
    "7px",
  );
});
it("routes distinct Tabs root, body and trigger classes while preserving selection", async () => {
  const theme = defineTheme({
    name: "Panels",
    components: {
      Tabs: {
        parts: {
          root: { padding: "3px" },
          body: { padding: "7px" },
        },
      },
    },
  });
  const { container } = render(
    <ThemeScope theme={theme}>
      <Tabs
        classNames={{
          root: "outer-tabs",
          body: "tabs-body",
          tabsTrigger: "tab-control",
        }}
        defaultValue="a"
      >
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsBody>
          <TabsContent value="a">First</TabsContent>
          <TabsContent value="b">Second</TabsContent>
        </TabsBody>
      </Tabs>
    </ThemeScope>,
  );
  expect(
    getComputedStyle(container.querySelector(".outer-tabs")!).paddingTop,
  ).toBe("3px");
  expect(
    getComputedStyle(container.querySelector(".tabs-body")!).paddingTop,
  ).toBe("7px");
  const tab = screen.getByRole("tab", { name: "B" });
  expect(tab.classList.contains("tab-control")).toBe(true);
  await userEvent.click(tab);
  expect(screen.getByRole("tabpanel").textContent).toBe("Second");
});
