import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsBody } from "./Tabs";
import { describe, it, expect, vi } from "vitest";
import React from "react";

describe("Tabs Component", () => {
  it("should render default tab with correct roles", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsBody>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </TabsBody>
      </Tabs>
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    const tab2 = screen.getByRole("tab", { name: "Tab 2" });

    expect(tab1).toHaveAttribute("aria-selected", "true");
    expect(tab2).toHaveAttribute("aria-selected", "false");

    const panel1 = screen.getByRole("tabpanel");
    expect(panel1).toHaveTextContent("Content 1");
    expect(panel1).toHaveAttribute("aria-labelledby", tab1.id);
  });

  it("should switch tabs on click", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsBody>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </TabsBody>
      </Tabs>
    );

    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("should work in controlled mode", () => {
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsBody>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </TabsBody>
      </Tabs>
    );

    expect(screen.getByText("Content 1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tab 2"));
    expect(handleValueChange).toHaveBeenCalledWith("tab2");

    // Should not change content until prop updates
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    // Re-render with new value
    rerender(
      <Tabs value="tab2" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsBody>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </TabsBody>
      </Tabs>
    );

    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });
});
