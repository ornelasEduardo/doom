import "@testing-library/jest-dom";

import { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Table } from "./Table";

// Mock FilterSheetNested
vi.mock("./FilterBuilder/FilterSheetNested", () => ({
  FilterSheetNested: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="filter-sheet">Filter Sheet</div> : null,
}));

// Mock Select
vi.mock("../Select/Select", () => ({
  Select: ({
    value,
    onChange,
    options,
    "data-testid": testId,
    className,
  }: {
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string | number; label: string }[];
    "data-testid"?: string;
    className?: string;
  }) => (
    <select
      className={className}
      data-testid={testId || "mock-select"}
      value={value}
      onChange={onChange}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

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

const mockVirtualizer = () => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { get: () => 400 },
    offsetWidth: { get: () => 600 },
  });
};

describe("Table Component", () => {
  it("should render data", () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  describe("string columns", () => {
    const simpleData = [
      { name: "Alice", age: 25, status: "Active" },
      { name: "Bob", age: 30, status: "Inactive" },
    ];

    it("should render with string[] columns", () => {
      render(<Table columns={["name", "age", "status"]} data={simpleData} />);

      // Check headers
      expect(screen.getByText("name")).toBeInTheDocument();
      expect(screen.getByText("age")).toBeInTheDocument();
      expect(screen.getByText("status")).toBeInTheDocument();

      // Check data
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should sort with string columns", () => {
      render(<Table columns={["name", "age"]} data={simpleData} />);

      const nameHeader = screen.getByText("name").closest("th");
      fireEvent.click(nameHeader!);

      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).toHaveTextContent("Alice");
      expect(rows[1]).toHaveTextContent("Bob");
    });

    it("should filter with string columns", () => {
      render(<Table columns={["name", "age"]} data={simpleData} />);

      const searchInput = screen.getByPlaceholderText("Search...");
      fireEvent.change(searchInput, { target: { value: "Bob" } });

      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("should support mixed string and ColumnDef columns", () => {
      const mixedColumns = [
        "name",
        { accessorKey: "age", header: "Age (years)" },
      ];

      render(<Table columns={mixedColumns} data={simpleData} />);

      // String column uses key as header
      expect(screen.getByText("name")).toBeInTheDocument();
      // ColumnDef uses custom header
      expect(screen.getByText("Age (years)")).toBeInTheDocument();

      // Data renders correctly
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
    });
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
    mockVirtualizer();

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

  it("should filter numeric column with multiple string values when VIRTUALIZED", async () => {
    mockVirtualizer();

    const columnsWithFilter: ColumnDef<TestData>[] = columns.map((col) => ({
      ...col,
      enableColumnFilter: true,
    }));

    render(
      <Table
        columns={columnsWithFilter}
        data={data}
        enableColumnFilters={true}
        enableVirtualization={true}
      />,
    );

    // Find filter button for Age
    const ageHeader = screen.getByText("Age").closest("th");
    const filterBtn = ageHeader?.querySelector("button");
    expect(filterBtn).toBeInTheDocument();

    // Click to open filter
    fireEvent.click(filterBtn!);

    // Click "25" - Scope to button to avoid finding table cell
    const option25 = await screen.findByRole("button", { name: /25/i });
    fireEvent.click(option25);

    // Check that filtering happened
    // Alice (25) should be visible. Bob (30) should be gone.
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("should filter STRING column with multiple values (Select All scenario)", async () => {
    // This uses the default Table behavior (no explicit filterFn property on column)
    const columnsWithFilter: ColumnDef<TestData>[] = columns.map((col) => ({
      ...col,
      enableColumnFilter: true,
      // filterFn is UNDEFINED, so it uses default (auto/includesString)
    }));

    render(
      <Table
        columns={columnsWithFilter}
        data={data}
        enableColumnFilters={true}
      />,
    );

    // Filter "Name" (String)
    const nameHeader = screen.getByText("Name").closest("th");
    const filterBtn = nameHeader?.querySelector("button");
    fireEvent.click(filterBtn!);

    // Select "Alice"
    const optionAlice = await screen.findByRole("button", { name: /Alice/i });
    fireEvent.click(optionAlice);

    // Select "Bob"
    const optionBob = screen.getByRole("button", { name: /Bob/i });
    fireEvent.click(optionBob);

    // Close filter to clear options from screen (click backdrop or button)
    fireEvent.click(document.body); // Click outside

    // Expect Alice and Bob in table body
    const tbody = document.querySelector("tbody");
    expect(within(tbody!).getByText("Alice")).toBeInTheDocument();
    expect(within(tbody!).getByText("Bob")).toBeInTheDocument();
    expect(within(tbody!).queryByText("Charlie")).not.toBeInTheDocument();
  });
  it("should toggle numeric filter off when clicked again", async () => {
    render(<Table columns={columns} data={data} enableColumnFilters={true} />);

    // Open Age filter
    const ageHeader = screen.getByText("Age").closest("th");
    const filterBtn = ageHeader?.querySelector("button");
    fireEvent.click(filterBtn!);

    // Click "25" to select
    const option25 = await screen.findByRole("button", { name: /25/i });
    fireEvent.click(option25);

    // Verify filtered to Alice
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    // Click "25" again to deselect
    fireEvent.click(option25);

    // Verify filter cleared (Bob back)
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("should show no results message when empty", () => {
    render(<Table columns={columns} data={[]} />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("should change page size", () => {
    // Need more data to test page size change effectively with default 10
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      name: `Person ${i}`,
      age: 20 + i,
    }));

    render(<Table columns={columns} data={largeData} pageSize={10} />);

    // Initially shows 10 rows
    expect(screen.getAllByRole("row").length).toBe(11); // 1 header + 10 body

    // Change to 20
    const pageSizeSelect = screen.getByTestId("mock-select");
    fireEvent.change(pageSizeSelect, { target: { value: "20" } });

    // Should show 20 rows
    expect(screen.getAllByRole("row").length).toBe(21); // 1 header + 20 body
  });

  it("should render toolbar content", () => {
    render(
      <Table
        columns={columns}
        data={data}
        toolbarContent={<button>Custom Action</button>}
      />,
    );
    expect(screen.getByText("Custom Action")).toBeInTheDocument();
  });

  it("should open filter builder when advanced filtering enabled", () => {
    render(
      <Table columns={columns} data={data} enableAdvancedFiltering={true} />,
    );

    // Find the filter builder toggle button (it has aria-label "Filter builder")
    const toggleBtn = screen.getByLabelText("Filter builder");
    fireEvent.click(toggleBtn);

    // Check if mock sheet is rendered
    expect(screen.getByTestId("filter-sheet")).toBeInTheDocument();
  });

  it("should apply advanced filter and filter data correctly", async () => {
    // Test the evaluateFilter function that powers advanced filtering
    const { evaluateFilter } = await import("./utils/filterAst");

    const filterNode = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "name",
          operator: "eq" as const,
          value: "Bob",
        },
      ],
    };

    // Test that evaluateFilter correctly filters data
    const row1 = { name: "Alice", age: 30 };
    const row2 = { name: "Bob", age: 25 };
    const row3 = { name: "Charlie", age: 35 };

    expect(evaluateFilter(filterNode, row1)).toBe(false);
    expect(evaluateFilter(filterNode, row2)).toBe(true);
    expect(evaluateFilter(filterNode, row3)).toBe(false);

    // Test with contains operator
    const containsFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "name",
          operator: "contains" as const,
          value: "ob",
        },
      ],
    };

    expect(evaluateFilter(containsFilter, row1)).toBe(false);
    expect(evaluateFilter(containsFilter, row2)).toBe(true);

    // Test with AND logic (multiple conditions)
    const andFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "name",
          operator: "eq" as const,
          value: "Bob",
        },
        {
          type: "condition" as const,
          field: "age",
          operator: "eq" as const,
          value: 25,
          logic: "and" as const,
        },
      ],
    };

    expect(evaluateFilter(andFilter, row2)).toBe(true);
    expect(evaluateFilter(andFilter, { name: "Bob", age: 30 })).toBe(false);
  });

  it("should support numeric comparison operators", async () => {
    const { evaluateFilter } = await import("./utils/filterAst");

    const gtFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "age",
          operator: "gt" as const,
          value: 30,
        },
      ],
    };

    expect(evaluateFilter(gtFilter, { name: "Alice", age: 25 })).toBe(false);
    expect(evaluateFilter(gtFilter, { name: "Charlie", age: 35 })).toBe(true);

    const lteFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "age",
          operator: "lte" as const,
          value: 30,
        },
      ],
    };

    expect(evaluateFilter(lteFilter, { name: "Alice", age: 25 })).toBe(true);
    expect(evaluateFilter(lteFilter, { name: "Bob", age: 30 })).toBe(true);
    expect(evaluateFilter(lteFilter, { name: "Charlie", age: 35 })).toBe(false);
  });

  it("should support OR logic in filters", async () => {
    const { evaluateFilter } = await import("./utils/filterAst");

    const orFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "name",
          operator: "eq" as const,
          value: "Alice",
        },
        {
          type: "condition" as const,
          field: "name",
          operator: "eq" as const,
          value: "Bob",
          logic: "or" as const,
        },
      ],
    };

    expect(evaluateFilter(orFilter, { name: "Alice", age: 25 })).toBe(true);
    expect(evaluateFilter(orFilter, { name: "Bob", age: 30 })).toBe(true);
    expect(evaluateFilter(orFilter, { name: "Charlie", age: 35 })).toBe(false);
  });

  it("should support nested filter groups", async () => {
    const { evaluateFilter } = await import("./utils/filterAst");

    // Complex filter: (name = Alice AND age > 20) OR (name = Charlie)
    const nestedFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "group" as const,
          conditions: [
            {
              type: "condition" as const,
              field: "name",
              operator: "eq" as const,
              value: "Alice",
            },
            {
              type: "condition" as const,
              field: "age",
              operator: "gt" as const,
              value: 20,
              logic: "and" as const,
            },
          ],
        },
        {
          type: "condition" as const,
          field: "name",
          operator: "eq" as const,
          value: "Charlie",
          logic: "or" as const,
        },
      ],
    };

    expect(evaluateFilter(nestedFilter, { name: "Alice", age: 25 })).toBe(true);
    expect(evaluateFilter(nestedFilter, { name: "Charlie", age: 35 })).toBe(
      true,
    );
    expect(evaluateFilter(nestedFilter, { name: "Bob", age: 30 })).toBe(false);
    expect(evaluateFilter(nestedFilter, { name: "Alice", age: 15 })).toBe(
      false,
    );
  });

  it("should support startsWith and endsWith operators", async () => {
    const { evaluateFilter } = await import("./utils/filterAst");

    const startsWithFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "name",
          operator: "startsWith" as const,
          value: "Al",
        },
      ],
    };

    expect(evaluateFilter(startsWithFilter, { name: "Alice" })).toBe(true);
    expect(evaluateFilter(startsWithFilter, { name: "Bob" })).toBe(false);

    const endsWithFilter = {
      type: "group" as const,
      conditions: [
        {
          type: "condition" as const,
          field: "name",
          operator: "endsWith" as const,
          value: "ie",
        },
      ],
    };

    expect(evaluateFilter(endsWithFilter, { name: "Charlie" })).toBe(true);
    expect(evaluateFilter(endsWithFilter, { name: "Alice" })).toBe(false);
  });
});
