import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Combobox, ComboboxOption } from "./Combobox";

// Mock virtualizer to simplify tests
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 36,
        size: 36,
      })),
    getTotalSize: () => count * 36,
    scrollToIndex: vi.fn(),
  }),
}));

const defaultOptions: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
];

// Helper to get the main trigger button (first button element)
const getTrigger = () => screen.getAllByRole("button")[0];

describe("Combobox", () => {
  // ==========================================================================
  // Rendering
  // ==========================================================================

  it("should render with placeholder", () => {
    render(
      <Combobox
        options={defaultOptions}
        placeholder="Choose fruit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Choose fruit")).toBeInTheDocument();
  });

  it("should display selected value label", () => {
    render(
      <Combobox options={defaultOptions} value="banana" onChange={() => {}} />,
    );
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("should display count when multiple selected", () => {
    render(
      <Combobox
        multiple
        options={defaultOptions}
        value={["apple", "banana"]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  // ==========================================================================
  // Open/Close
  // ==========================================================================

  it("should open dropdown on trigger click", async () => {
    render(<Combobox options={defaultOptions} onChange={() => {}} />);

    fireEvent.click(getTrigger());

    await waitFor(() => {
      expect(screen.getByText("Apple")).toBeInTheDocument();
    });
  });

  it("should not open when disabled", () => {
    render(<Combobox disabled options={defaultOptions} onChange={() => {}} />);

    fireEvent.click(getTrigger());

    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  // ==========================================================================
  // Single Selection
  // ==========================================================================

  it("should call onChange with value on single select", async () => {
    const handleChange = vi.fn();
    render(<Combobox options={defaultOptions} onChange={handleChange} />);

    fireEvent.click(getTrigger());

    await waitFor(() => {
      fireEvent.click(screen.getByText("Banana"));
    });

    expect(handleChange).toHaveBeenCalledWith("banana");
  });

  // ==========================================================================
  // Multiple Selection
  // ==========================================================================

  it("should toggle selection in multi mode", async () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        multiple
        options={defaultOptions}
        value={["apple"]}
        onChange={handleChange}
      />,
    );

    fireEvent.click(getTrigger());

    await waitFor(() => {
      fireEvent.click(screen.getByText("Banana"));
    });

    expect(handleChange).toHaveBeenCalledWith(["apple", "banana"]);
  });

  it("should deselect in multi mode", async () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        multiple
        options={defaultOptions}
        value={["apple", "banana"]}
        onChange={handleChange}
      />,
    );

    fireEvent.click(getTrigger());

    await waitFor(() => {
      fireEvent.click(screen.getByText("Apple"));
    });

    expect(handleChange).toHaveBeenCalledWith(["banana"]);
  });

  // ==========================================================================
  // Select All
  // ==========================================================================

  it('should select all when "All" clicked', async () => {
    const handleChange = vi.fn();
    render(
      <Combobox multiple options={defaultOptions} onChange={handleChange} />,
    );

    fireEvent.click(getTrigger());

    await waitFor(() => {
      fireEvent.click(screen.getByText("All"));
    });

    expect(handleChange).toHaveBeenCalledWith([
      "apple",
      "banana",
      "cherry",
      "date",
    ]);
  });

  it('should deselect all when "All" clicked and all selected', async () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        multiple
        options={defaultOptions}
        value={["apple", "banana", "cherry", "date"]}
        onChange={handleChange}
      />,
    );

    fireEvent.click(getTrigger());

    await waitFor(() => {
      fireEvent.click(screen.getByText("All"));
    });

    expect(handleChange).toHaveBeenCalledWith(undefined);
  });

  // ==========================================================================
  // Search / Filtering
  // ==========================================================================

  it("should filter options based on search query", async () => {
    render(<Combobox options={defaultOptions} onChange={() => {}} />);

    fireEvent.click(getTrigger());

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search...");
      fireEvent.change(searchInput, { target: { value: "ban" } });
    });

    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("should show no results message", async () => {
    render(<Combobox options={defaultOptions} onChange={() => {}} />);

    fireEvent.click(getTrigger());

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search...");
      fireEvent.change(searchInput, { target: { value: "xyz" } });
    });

    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  // ==========================================================================
  // Clear
  // ==========================================================================

  it("should clear value when X clicked", async () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        options={defaultOptions}
        value="apple"
        onChange={handleChange}
      />,
    );

    // The clear button is the second element with role="button"
    const buttons = screen.getAllByRole("button");
    const clearButton = buttons[1]; // Second button is the clear button

    fireEvent.click(clearButton);
    expect(handleChange).toHaveBeenCalledWith(undefined);
  });

  // ==========================================================================
  // Keyboard Navigation / Interactivity
  // ==========================================================================

  it("should focus search input when opened", async () => {
    render(<Combobox options={defaultOptions} onChange={() => {}} />);

    fireEvent.click(getTrigger());

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search...");
      expect(searchInput).toHaveFocus();
    });
  });

  it("should navigate from search to 'All' then options using ArrowDown", async () => {
    render(<Combobox multiple options={defaultOptions} onChange={() => {}} />);

    fireEvent.click(getTrigger());

    const searchInput = await screen.findByPlaceholderText("Search...");
    searchInput.focus(); // Ensure it's focused before sending key events

    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    const allButton = screen.getByText("All").closest("button");
    await waitFor(() => {
      expect(allButton).toHaveFocus();
    });

    fireEvent.keyDown(allButton!, { key: "ArrowDown" });
    // Since we mock the virtualizer, index 0 is always rendered
    const firstOption = screen.getByText("Apple").closest("button");
    await waitFor(() => {
      expect(firstOption).toHaveFocus();
    });
  });

  it("should navigate back to search using ArrowUp", async () => {
    render(<Combobox multiple options={defaultOptions} onChange={() => {}} />);

    fireEvent.click(getTrigger());

    await waitFor(() => {
      const allButton = screen.getByText("All").closest("button");
      fireEvent.keyDown(allButton!, { key: "ArrowUp" });
    });

    const searchInput = screen.getByPlaceholderText("Search...");
    expect(searchInput).toHaveFocus();
  });

  it("should select all filtered options on Enter in search field (multiple mode)", async () => {
    const handleChange = vi.fn();
    render(
      <Combobox multiple options={defaultOptions} onChange={handleChange} />,
    );

    fireEvent.click(getTrigger());

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search...");
      fireEvent.change(searchInput, { target: { value: "a" } }); // Apple, Banana, Date (all have 'a')
    });

    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith(["apple", "banana", "date"]);
  });

  it("should toggle selection using Space key on options", async () => {
    const handleChange = vi.fn();
    render(
      <Combobox
        multiple
        options={defaultOptions}
        value={["apple"]}
        onChange={handleChange}
      />,
    );

    fireEvent.click(getTrigger());

    await waitFor(() => {
      const bananaOption = screen.getByText("Banana").closest("button");
      fireEvent.keyDown(bananaOption!, { key: " " });
    });

    expect(handleChange).toHaveBeenCalledWith(["apple", "banana"]);
  });

  it("should focus search input immediately in inline mode", async () => {
    render(<Combobox inline options={defaultOptions} onChange={() => {}} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search...");
      expect(searchInput).toHaveFocus();
    });
  });
});
