import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Table } from "./Table";
import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";

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
    render(<Table data={data} columns={columns} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("should filter data", () => {
    render(<Table data={data} columns={columns} />);

    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("should sort data", async () => {
    render(<Table data={data} columns={columns} />);

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
    render(<Table data={data} columns={columns} pageSize={1} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    const nextButton = screen.getByLabelText("Go to next page");
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);

    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("should render with striped prop", () => {
    render(<Table data={data} columns={columns} striped={true} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
