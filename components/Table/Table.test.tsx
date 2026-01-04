import "@testing-library/jest-dom";

import { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Table } from "./Table";

interface TestData {
  id: number;
  name: string;
  age: number;
}

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "age",
    header: "Age",
  },
];

const data: TestData[] = [
  { id: 1, name: "Alice", age: 25 },
  { id: 3, name: "Charlie", age: 35 },
  { id: 2, name: "Bob", age: 30 },
];

describe("Table Component", () => {
  it("should render data", () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("should filter data", () => {
    render(<Table columns={columns} data={data} />);

    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("should sort data", async () => {
    render(<Table columns={columns} data={data} />);

    const nameHeader = screen.getByText("Name").closest("th");

    fireEvent.click(nameHeader!);

    const rowsAsc = screen.getAllByRole("row").slice(1);
    expect(rowsAsc[0]).toHaveTextContent("Alice");
    expect(rowsAsc[1]).toHaveTextContent("Bob");
    expect(rowsAsc[2]).toHaveTextContent("Charlie");

    fireEvent.click(nameHeader!);

    const rowsDesc = screen.getAllByRole("row").slice(1);
    expect(rowsDesc[0]).toHaveTextContent("Charlie");
    expect(rowsDesc[1]).toHaveTextContent("Bob");
    expect(rowsDesc[2]).toHaveTextContent("Alice");
  });

  it("should paginate data", () => {
    render(<Table columns={columns} data={data} pageSize={1} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    const nextButton = screen.getByLabelText("Go to next page");
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);

    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("should render with striped prop", () => {
    render(<Table columns={columns} data={data} striped={true} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("should render with virtualization enabled and only show visible rows", () => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    Object.defineProperties(HTMLElement.prototype, {
      offsetHeight: { get: () => 400 },
      offsetWidth: { get: () => 600 },
    });

    const largeData = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Person ${i}`,
      age: 20 + i,
    }));

    render(
      <Table
        columns={columns}
        data={largeData}
        enableVirtualization={true}
        height={400}
      />,
    );

    const rows = screen.getAllByRole("row");
    const dataRows = rows.slice(1);

    expect(dataRows.length).toBeLessThan(50);
    expect(dataRows.length).toBeGreaterThan(0);
    expect(screen.getByText("Person 0")).toBeInTheDocument();
  });
});
