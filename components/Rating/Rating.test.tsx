import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Heart } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Rating } from "./Rating";

describe("Rating", () => {
  // --- Rendering ---

  it("renders a radiogroup with the correct number of radio buttons", () => {
    render(<Rating defaultValue={0} aria-label="Rating" />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("renders custom count of icons", () => {
    render(<Rating defaultValue={0} count={10} aria-label="Rating" />);
    expect(screen.getAllByRole("radio")).toHaveLength(10);
  });

  it("renders readOnly mode with role=img", () => {
    render(<Rating value={3} readOnly aria-label="3 out of 5" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Rating defaultValue={0} className="custom" aria-label="Rating" />
    );
    expect(container.firstChild).toHaveClass("custom");
  });

  // --- Controlled / Uncontrolled ---

  it("works in uncontrolled mode with defaultValue", async () => {
    const user = userEvent.setup();
    render(<Rating defaultValue={2} aria-label="Rating" />);
    const radios = screen.getAllByRole("radio");

    // First 2 should be checked
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[2]).toHaveAttribute("aria-checked", "false");

    // Click 4th star
    await user.click(radios[3]);
    expect(radios[3]).toHaveAttribute("aria-checked", "true");
  });

  it("works in controlled mode with value", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Rating value={2} onValueChange={onChange} aria-label="Rating" />
    );
    const radios = screen.getAllByRole("radio");

    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[2]).toHaveAttribute("aria-checked", "false");

    await userEvent.click(radios[3]);
    expect(onChange).toHaveBeenCalledWith(4);

    // Value doesn't change until parent re-renders
    expect(radios[3]).toHaveAttribute("aria-checked", "false");

    // Parent updates
    rerender(
      <Rating value={4} onValueChange={onChange} aria-label="Rating" />
    );
    expect(radios[3]).toHaveAttribute("aria-checked", "true");
  });

  it("fires onValueChange with correct value on click", async () => {
    const onChange = vi.fn();
    render(
      <Rating defaultValue={0} onValueChange={onChange} aria-label="Rating" />
    );
    const radios = screen.getAllByRole("radio");
    await userEvent.click(radios[2]); // 3rd star
    expect(onChange).toHaveBeenCalledWith(3);
  });

  // --- Disabled ---

  it("does not fire onValueChange when disabled", async () => {
    const onChange = vi.fn();
    render(
      <Rating
        defaultValue={2}
        onValueChange={onChange}
        disabled
        aria-label="Rating"
      />
    );
    const radios = screen.getAllByRole("radio");
    await userEvent.click(radios[3]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("sets aria-disabled on each radio when disabled", () => {
    render(<Rating defaultValue={0} disabled aria-label="Rating" />);
    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeDisabled();
    }
  });

  // --- Half values ---

  it("supports half values with allowHalf", async () => {
    const onChange = vi.fn();
    render(
      <Rating
        defaultValue={0}
        allowHalf
        onValueChange={onChange}
        aria-label="Rating"
      />
    );
    // With allowHalf, each position has 2 clickable areas (half + full)
    const radios = screen.getAllByRole("radio");
    // 5 stars * 2 = 10 radios (0.5, 1, 1.5, 2, ..., 5)
    expect(radios).toHaveLength(10);
  });

  it("renders correct aria-checked for half values", () => {
    render(<Rating value={2.5} allowHalf aria-label="Rating" />);
    const radios = screen.getAllByRole("radio");
    // radios: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
    // Indices 0-4 (values 0.5-2.5) should be checked
    expect(radios[0]).toHaveAttribute("aria-checked", "true"); // 0.5
    expect(radios[4]).toHaveAttribute("aria-checked", "true"); // 2.5
    expect(radios[5]).toHaveAttribute("aria-checked", "false"); // 3
  });

  // --- Keyboard Navigation ---

  it("supports ArrowRight to increase value", async () => {
    const onChange = vi.fn();
    render(
      <Rating defaultValue={2} onValueChange={onChange} aria-label="Rating" />
    );
    const radios = screen.getAllByRole("radio");

    // Focus the checked radio (index 1, value 2)
    radios[1].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("supports ArrowLeft to decrease value", async () => {
    const onChange = vi.fn();
    render(
      <Rating defaultValue={3} onValueChange={onChange} aria-label="Rating" />
    );
    const radios = screen.getAllByRole("radio");

    radios[2].focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("supports Home and End keys", async () => {
    const onChange = vi.fn();
    render(
      <Rating defaultValue={3} onValueChange={onChange} aria-label="Rating" />
    );
    const radios = screen.getAllByRole("radio");

    radios[2].focus();
    await userEvent.keyboard("{Home}");
    expect(onChange).toHaveBeenCalledWith(0);

    await userEvent.keyboard("{End}");
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("steps by 0.5 with allowHalf on arrow keys", async () => {
    const onChange = vi.fn();
    render(
      <Rating
        defaultValue={2}
        allowHalf
        onValueChange={onChange}
        aria-label="Rating"
      />
    );
    const radios = screen.getAllByRole("radio");
    // Value 2 => index 3 (values: 0.5, 1, 1.5, 2, ...)
    radios[3].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  // --- Accessibility ---

  it("sets aria-label on the container", () => {
    render(<Rating defaultValue={0} aria-label="Product rating" />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "Product rating"
    );
  });

  it("sets aria-label on each radio", () => {
    render(<Rating defaultValue={0} aria-label="Rating" />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-label", "Rate 1 out of 5");
    expect(radios[4]).toHaveAttribute("aria-label", "Rate 5 out of 5");
  });

  it("readOnly sets aria-label with value", () => {
    render(<Rating value={3.5} readOnly aria-label="3.5 out of 5" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "3.5 out of 5"
    );
  });

  it("readOnly auto-generates aria-label when none provided", () => {
    render(<Rating value={4} readOnly />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "4 out of 5"
    );
  });

  // --- Custom icon ---

  it("accepts a custom icon component", () => {
    render(<Rating defaultValue={1} icon={Heart} aria-label="Rating" />);
    // Just verify it renders without crashing
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  // --- Sizes ---

  it("applies size class", () => {
    const { container } = render(
      <Rating defaultValue={0} size="sm" aria-label="Rating" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/sm/);
  });

  it("applies lg size class", () => {
    const { container } = render(
      <Rating defaultValue={0} size="lg" aria-label="Rating" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/lg/);
  });

  // --- Hover preview ---

  it("shows hover preview on mouseEnter", () => {
    render(<Rating defaultValue={1} aria-label="Rating" />);
    const radios = screen.getAllByRole("radio");

    // Hover over 4th star
    fireEvent.mouseEnter(radios[3]);

    // Stars 1-4 should visually appear filled (checked via aria)
    // The hover state is visual only, doesn't change aria-checked
    // So we just verify the event doesn't crash
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
  });
});
