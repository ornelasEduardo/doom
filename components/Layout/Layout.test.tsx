import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Flex, Grid, Stack, Container } from "./Layout";
import { describe, it, expect } from "vitest";
import React from "react";

describe("Layout Components", () => {
  describe("Flex", () => {
    it("renders children correctly", () => {
      render(
        <Flex>
          <div>Flex Child</div>
        </Flex>
      );
      expect(screen.getByText("Flex Child")).toBeInTheDocument();
    });

    it("renders as a custom element (polymorphism)", () => {
      render(
        <Flex as="section" data-testid="flex-section">
          Content
        </Flex>
      );
      const element = screen.getByTestId("flex-section");
      expect(element.tagName).toBe("SECTION");
    });

    it("applies style props correctly", () => {
      render(
        <Flex
          direction="column"
          justify="center"
          align="center"
          gap={5}
          data-testid="flex-styled"
        >
          Styled Flex
        </Flex>
      );
      const element = screen.getByTestId("flex-styled");
      expect(element).toHaveStyle({
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "1.25rem",
      });
    });
  });

  describe("Grid", () => {
    it("renders children correctly", () => {
      render(
        <Grid>
          <div>Grid Child</div>
        </Grid>
      );
      expect(screen.getByText("Grid Child")).toBeInTheDocument();
    });

    it("applies grid styles", () => {
      render(
        <Grid columns={3} gap={8} data-testid="grid-styled">
          Grid Item
        </Grid>
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
      expect(element).toHaveStyle({
        flexDirection: "column",
      });
    });

    it("allows overriding direction", () => {
      render(
        <Stack direction="row" data-testid="stack-row">
          Row Stack
        </Stack>
      );
      const element = screen.getByTestId("stack-row");
      expect(element).toHaveStyle({
        flexDirection: "row",
      });
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
        </Container>
      );
      const element = screen.getByTestId("container-article");
      expect(element.tagName).toBe("ARTICLE");
    });
  });
});
