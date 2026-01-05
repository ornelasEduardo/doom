import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { FilterField } from "./FilterBuilder";
import {
  type FilterConditionData,
  FilterConditionRow,
} from "./FilterConditionRow";

// Mock Select component
vi.mock("../../Select/Select", () => ({
  Select: ({
    value,
    onChange,
    options,
    "data-testid": testId,
    className,
  }: {
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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

describe("FilterConditionRow", () => {
  const mockFields: FilterField[] = [
    { key: "name", label: "Name", type: "text" },
    {
      key: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "admin", label: "Admin" },
        { value: "user", label: "User" },
      ],
    },
  ];

  const defaultCondition: FilterConditionData = {
    id: "1",
    field: "name",
    operator: "eq",
    value: "Alice",
  };

  it("should render correctly", () => {
    render(
      <FilterConditionRow
        condition={defaultCondition}
        fields={mockFields}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );

    const selects = screen.getAllByTestId("mock-select");
    expect(selects[0]).toHaveValue("name");
    expect(selects[1]).toHaveValue("eq");
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
  });

  it("should call onChange when field changes", () => {
    const handleChange = vi.fn();
    render(
      <FilterConditionRow
        condition={defaultCondition}
        fields={mockFields}
        onChange={handleChange}
        onRemove={() => {}}
      />,
    );

    const selects = screen.getAllByTestId("mock-select");
    const fieldSelect = selects[0];
    fireEvent.change(fieldSelect, { target: { value: "role" } });

    expect(handleChange).toHaveBeenCalledWith({
      ...defaultCondition,
      field: "role",
      operator: "eq",
      value: "",
    });
  });

  it("should call onChange when operator changes", () => {
    const handleChange = vi.fn();
    render(
      <FilterConditionRow
        condition={defaultCondition}
        fields={mockFields}
        onChange={handleChange}
        onRemove={() => {}}
      />,
    );

    const selects = screen.getAllByTestId("mock-select");
    const operatorSelect = selects[1];
    fireEvent.change(operatorSelect, { target: { value: "contains" } });

    expect(handleChange).toHaveBeenCalledWith({
      ...defaultCondition,
      operator: "contains",
    });
  });

  it("should call onChange when value changes", () => {
    const handleChange = vi.fn();
    render(
      <FilterConditionRow
        condition={defaultCondition}
        fields={mockFields}
        onChange={handleChange}
        onRemove={() => {}}
      />,
    );

    const valueInput = screen.getByDisplayValue("Alice");
    fireEvent.change(valueInput, { target: { value: "Bob" } });

    expect(handleChange).toHaveBeenCalledWith({
      ...defaultCondition,
      value: "Bob",
    });
  });

  it("should render select for value when field type is select", () => {
    const condition: FilterConditionData = {
      id: "1",
      field: "role",
      operator: "eq",
      value: "admin",
    };
    render(
      <FilterConditionRow
        condition={condition}
        fields={mockFields}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );

    const selects = screen.getAllByTestId("mock-select");
    expect(selects[2]).toHaveValue("admin");
  });

  it("should call onRemove when delete button clicked", () => {
    const handleRemove = vi.fn();
    render(
      <FilterConditionRow
        condition={defaultCondition}
        fields={mockFields}
        onChange={() => {}}
        onRemove={handleRemove}
      />,
    );

    const removeBtn = screen.getByLabelText("Remove condition");
    fireEvent.click(removeBtn);

    expect(handleRemove).toHaveBeenCalled();
  });

  it("should render text input for value when field type is text", () => {
    render(
      <FilterConditionRow
        condition={defaultCondition}
        fields={mockFields}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );

    const input = screen.getByDisplayValue("Alice");
    expect(input.tagName).toBe("INPUT");
  });

  it("should show all select dropdowns for select type field", () => {
    const condition: FilterConditionData = {
      id: "1",
      field: "role",
      operator: "eq",
      value: "admin",
    };
    render(
      <FilterConditionRow
        condition={condition}
        fields={mockFields}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );

    const selects = screen.getAllByTestId("mock-select");
    expect(selects).toHaveLength(3);
  });

  it("should use custom operators when provided", () => {
    const fieldsWithOperators: FilterField[] = [
      {
        key: "amount",
        label: "Amount",
        type: "number",
        operators: ["eq", "gt", "lt", "gte", "lte"],
      },
    ];
    const condition: FilterConditionData = {
      id: "1",
      field: "amount",
      operator: "gt",
      value: "100",
    };
    render(
      <FilterConditionRow
        condition={condition}
        fields={fieldsWithOperators}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );

    const selects = screen.getAllByTestId("mock-select");
    const operatorSelect = selects[1];
    expect(operatorSelect).toHaveValue("gt");
    expect(operatorSelect.querySelectorAll("option")).toHaveLength(5);
  });

  it("should call onChange with new operator when selecting numeric operator", () => {
    const handleChange = vi.fn();
    const fieldsWithOperators: FilterField[] = [
      {
        key: "amount",
        label: "Amount",
        type: "number",
        operators: ["eq", "gt", "lt"],
      },
    ];
    const condition: FilterConditionData = {
      id: "1",
      field: "amount",
      operator: "eq",
      value: "50",
    };
    render(
      <FilterConditionRow
        condition={condition}
        fields={fieldsWithOperators}
        onChange={handleChange}
        onRemove={() => {}}
      />,
    );

    const selects = screen.getAllByTestId("mock-select");
    const operatorSelect = selects[1];
    fireEvent.change(operatorSelect, { target: { value: "gt" } });

    expect(handleChange).toHaveBeenCalledWith({
      ...condition,
      operator: "gt",
    });
  });
});
