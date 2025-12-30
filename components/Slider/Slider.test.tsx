import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./Slider";

describe("Slider Component", () => {
  it("links label to input via id", () => {
    render(<Slider label="Volume" />);
    const input = screen.getByLabelText("Volume");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "range");
  });

  it("renders with single value and displays it", () => {
    render(<Slider showValue label="Test" value={50} onChange={() => {}} />);
    expect(screen.getByText("50")).toBeInTheDocument();
    const input = screen.getByLabelText("Test");
    expect(input).toHaveValue("50");
  });

  it("calls onChange when single slider changed", () => {
    const handleChange = vi.fn();
    render(<Slider defaultValue={0} label="Test" onChange={handleChange} />);

    const input = screen.getByLabelText("Test");
    fireEvent.change(input, { target: { value: "75" } });

    expect(handleChange).toHaveBeenCalledWith(75);
  });

  describe("Range Mode", () => {
    it("renders two inputs when value is an array", () => {
      render(
        <Slider showValue label="Range" value={[20, 80]} onChange={() => {}} />,
      );

      expect(screen.getByText("20 - 80")).toBeInTheDocument();

      const minInput = screen.getByLabelText("Minimum value");
      const maxInput = screen.getByLabelText("Maximum value");

      expect(minInput).toBeInTheDocument();
      expect(maxInput).toBeInTheDocument();

      expect(minInput).toHaveValue("20");
      expect(maxInput).toHaveValue("80");
    });

    it("calls onChange with updated array when min thumb changes", () => {
      const handleChange = vi.fn();
      render(<Slider label="Range" value={[20, 80]} onChange={handleChange} />);

      const minInput = screen.getByLabelText("Minimum value");

      fireEvent.change(minInput, { target: { value: "30" } });

      expect(handleChange).toHaveBeenCalledWith([30, 80]);
    });

    it("calls onChange with updated array when max thumb changes", () => {
      const handleChange = vi.fn();
      render(<Slider label="Range" value={[20, 80]} onChange={handleChange} />);

      const maxInput = screen.getByLabelText("Maximum value");

      fireEvent.change(maxInput, { target: { value: "90" } });

      expect(handleChange).toHaveBeenCalledWith([20, 90]);
    });

    it("enforces constraints: min cannot exceed max", () => {
      const handleChange = vi.fn();
      render(<Slider label="Range" value={[40, 60]} onChange={handleChange} />);

      const minInput = screen.getByLabelText("Minimum value");

      fireEvent.change(minInput, { target: { value: "70" } });

      expect(handleChange).toHaveBeenCalledWith([60, 60]);
    });

    it("enforces constraints: max cannot go below min", () => {
      const handleChange = vi.fn();
      render(<Slider label="Range" value={[40, 60]} onChange={handleChange} />);

      const maxInput = screen.getByLabelText("Maximum value");

      fireEvent.change(maxInput, { target: { value: "20" } });

      expect(handleChange).toHaveBeenCalledWith([40, 40]);
    });
  });
});
