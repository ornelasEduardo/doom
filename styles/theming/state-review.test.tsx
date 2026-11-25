import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Alert } from "../../components/Alert/Alert";
import { Checkbox } from "../../components/Checkbox/Checkbox";
import { Field } from "../../components/Form/Form";
import { Input } from "../../components/Input/Input";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../components/RadioGroup/RadioGroup";
import { Rating } from "../../components/Rating/Rating";
import { Select } from "../../components/Select/Select";
import { Slider } from "../../components/Slider/Slider";
import { Textarea } from "../../components/Textarea/Textarea";
import { defineTheme } from "./defineTheme";
import { ThemeScope } from "./ThemeScope";

afterEach(cleanup);
const theme = defineTheme({ name: "State audit" });
it("honors the provider's status and rating icons", () => {
  const Icon = () => <svg data-testid="custom-icon" />;
  render(
    <ThemeScope icons={{ info: Icon, star: Icon }} theme={theme}>
      <Alert title="News" />
      <Rating readOnly count={1} />
    </ThemeScope>,
  );
  expect(screen.getAllByTestId("custom-icon")).toHaveLength(2);
});
it("keeps the native checked control's error prop available to invalid recipes", () => {
  render(
    <ThemeScope theme={theme}>
      <Checkbox error label="Subscribe" />
    </ThemeScope>,
  );
  expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe(
    "true",
  );
});

it("isolates class names on a nested RadioGroup root, including a root with no explicit classNames", () => {
  render(
    <ThemeScope theme={theme}>
      <RadioGroup classNames={{ root: "parent-only" }}>
        <RadioGroup>
          <RadioGroupItem value="x">Child</RadioGroupItem>
        </RadioGroup>
      </RadioGroup>
    </ThemeScope>,
  );
  const [outer, inner] = screen.getAllByRole("radiogroup");
  expect(outer.classList.contains("parent-only")).toBe(true);
  expect(inner.classList.contains("parent-only")).toBe(false);
});

it("attaches field-family and instance label classes to the corresponding native label", () => {
  const options = { classNames: { label: "family-label" } };
  const theme = defineTheme({
    name: "Fields",
    components: {
      Input: options,
      Textarea: options,
      Select: options,
      Slider: options,
      Form: options,
    },
  });
  const props = { classNames: { label: "local-label" } };
  render(
    <ThemeScope theme={theme}>
      <Input label="Input field" {...props} />
      <Textarea label="Textarea field" {...props} />
      <Select label="Select field" options={[]} {...props} />
      <Slider label="Slider field" {...props} />
      <Field label="Form field" {...props}>
        <input />
      </Field>
    </ThemeScope>,
  );
  for (const text of [
    "Input field",
    "Textarea field",
    "Select field",
    "Slider field",
    "Form field",
  ]) {
    const node = screen.getByText(text);
    expect(node.tagName).toBe("LABEL");
    expect(node.classList.contains("family-label")).toBe(true);
    expect(node.classList.contains("local-label")).toBe(true);
  }
});
