import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Container, Flex, Grid, Stack } from "./Layout";

describe("Layout Components", () => {
  describe("Flex", () => {
    it("renders children correctly", () => {
      render(
        <Flex>
          <div>Flex Child</div>
        </Flex>,
      );
      expect(screen.getByText("Flex Child")).toBeInTheDocument();
    });

    it("renders as a custom element (polymorphism)", () => {
      render(
        <Flex as="section" data-testid="flex-section">
          Content
        </Flex>,
      );
      const element = screen.getByTestId("flex-section");
      expect(element.tagName).toBe("SECTION");
    });

    it("applies style props correctly", () => {
      render(
        <Flex
          align="center"
          data-testid="flex-styled"
          direction="column"
          gap={5}
          justify="center"
        >
          Styled Flex
        </Flex>,
      );
      const element = screen.getByTestId("flex-styled");
      expect(element).toHaveClass(/direction-column/);
      expect(element).toHaveClass(/justify-center/);
      expect(element).toHaveClass(/align-center/);
      expect(element).toHaveStyle({
        gap: "1.25rem",
      });
    });
  });

  describe("Grid", () => {
    it("renders children correctly", () => {
      render(
        <Grid>
          <div>Grid Child</div>
        </Grid>,
      );
      expect(screen.getByText("Grid Child")).toBeInTheDocument();
    });

    it("applies grid styles", () => {
      render(
        <Grid columns={3} data-testid="grid-styled" gap={8}>
          Grid Item
        </Grid>,
      );
      const element = screen.getByTestId("grid-styled");
      expect(element).toHaveStyle({
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "2rem",
      });
    });
  });

  describe("Stack", () => {
    it("renders as a vertical flex by default", () => {
      render(<Stack data-testid="stack-default">Stack Content</Stack>);
      const element = screen.getByTestId("stack-default");
      expect(element).toHaveClass(/direction-column/);
    });

    it("allows overriding direction", () => {
      render(
        <Stack data-testid="stack-row" direction="row">
          Row Stack
        </Stack>,
      );
      const element = screen.getByTestId("stack-row");
      expect(element).toHaveClass(/direction-row/);
    });
  });

  describe("Container", () => {
    it("renders children", () => {
      render(<Container>Container Content</Container>);
      expect(screen.getByText("Container Content")).toBeInTheDocument();
    });

    it("renders using div by default", () => {
      render(<Container data-testid="container-div">Container Div</Container>);
      const element = screen.getByTestId("container-div");
      expect(element.tagName).toBe("DIV");
    });

    it("supports polymorphism", () => {
      render(
        <Container as="article" data-testid="container-article">
          Article Container
        </Container>,
      );
      const element = screen.getByTestId("container-article");
      expect(element.tagName).toBe("ARTICLE");
    });
  });
});
