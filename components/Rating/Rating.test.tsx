import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Heart } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Rating } from "./Rating";

describe("Rating", () => {
  it("renders a radiogroup with the correct number of radio buttons", () => {
    render(<Rating aria-label="Rating" defaultValue={0} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("renders custom count of icons", () => {
    render(<Rating aria-label="Rating" count={10} defaultValue={0} />);
    expect(screen.getAllByRole("radio")).toHaveLength(10);
  });

  it("renders readOnly mode with role=img", () => {
    render(<Rating readOnly aria-label="3 out of 5" value={3} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Rating aria-label="Rating" className="custom" defaultValue={0} />,
    );
    expect(container.firstChild).toHaveClass("custom");
  });

  it("works in uncontrolled mode with defaultValue", async () => {
    const user = userEvent.setup();
    render(<Rating aria-label="Rating" defaultValue={2} />);
    const radios = screen.getAllByRole("radio");

    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[2]).toHaveAttribute("aria-checked", "false");

    await user.click(radios[3]);
    expect(radios[3]).toHaveAttribute("aria-checked", "true");
  });

  it("works in controlled mode with value", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Rating aria-label="Rating" value={2} onValueChange={onChange} />,
    );
    const radios = screen.getAllByRole("radio");

    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[2]).toHaveAttribute("aria-checked", "false");

    await userEvent.click(radios[3]);
    expect(onChange).toHaveBeenCalledWith(4);
    expect(radios[3]).toHaveAttribute("aria-checked", "false");

    rerender(<Rating aria-label="Rating" value={4} onValueChange={onChange} />);
    expect(radios[3]).toHaveAttribute("aria-checked", "true");
  });

  it("fires onValueChange with correct value on click", async () => {
    const onChange = vi.fn();
    render(
      <Rating aria-label="Rating" defaultValue={0} onValueChange={onChange} />,
    );
    const radios = screen.getAllByRole("radio");
    await userEvent.click(radios[2]);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not fire onValueChange when disabled", async () => {
    const onChange = vi.fn();
    render(
      <Rating
        disabled
        aria-label="Rating"
        defaultValue={2}
        onValueChange={onChange}
      />,
    );
    const radios = screen.getAllByRole("radio");
    await userEvent.click(radios[3]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("sets aria-disabled on each radio when disabled", () => {
    render(<Rating disabled aria-label="Rating" defaultValue={0} />);
    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeDisabled();
    }
  });

  it("supports half values with allowHalf", async () => {
    const onChange = vi.fn();
    render(
      <Rating
        allowHalf
        aria-label="Rating"
        defaultValue={0}
        onValueChange={onChange}
      />,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(10);
  });

  it("renders correct aria-checked for half values", () => {
    render(<Rating allowHalf aria-label="Rating" value={2.5} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[4]).toHaveAttribute("aria-checked", "true");
    expect(radios[5]).toHaveAttribute("aria-checked", "false");
  });

  it("supports ArrowRight to increase value", async () => {
    const onChange = vi.fn();
    render(
      <Rating aria-label="Rating" defaultValue={2} onValueChange={onChange} />,
    );
    const radios = screen.getAllByRole("radio");

    radios[1].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("supports ArrowLeft to decrease value", async () => {
    const onChange = vi.fn();
    render(
      <Rating aria-label="Rating" defaultValue={3} onValueChange={onChange} />,
    );
    const radios = screen.getAllByRole("radio");

    radios[2].focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("supports Home and End keys", async () => {
    const onChange = vi.fn();
    render(
      <Rating aria-label="Rating" defaultValue={3} onValueChange={onChange} />,
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
        allowHalf
        aria-label="Rating"
        defaultValue={2}
        onValueChange={onChange}
      />,
    );
    const radios = screen.getAllByRole("radio");
    radios[3].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("sets aria-label on the container", () => {
    render(<Rating aria-label="Product rating" defaultValue={0} />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "Product rating",
    );
  });

  it("sets aria-label on each radio", () => {
    render(<Rating aria-label="Rating" defaultValue={0} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-label", "Rate 1 out of 5");
    expect(radios[4]).toHaveAttribute("aria-label", "Rate 5 out of 5");
  });

  it("readOnly sets aria-label with value", () => {
    render(<Rating readOnly aria-label="3.5 out of 5" value={3.5} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "3.5 out of 5",
    );
  });

  it("readOnly auto-generates aria-label when none provided", () => {
    render(<Rating readOnly value={4} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "4 out of 5");
  });

  it("accepts a custom icon component", () => {
    render(<Rating aria-label="Rating" defaultValue={1} icon={Heart} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("applies size class", () => {
    const { container } = render(
      <Rating aria-label="Rating" defaultValue={0} size="sm" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/sm/);
  });

  it("applies lg size class", () => {
    const { container } = render(
      <Rating aria-label="Rating" defaultValue={0} size="lg" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/lg/);
  });

  it("does not crash when hovering a radio", () => {
    render(<Rating aria-label="Rating" defaultValue={1} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.mouseEnter(radios[3]);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
  });
});
