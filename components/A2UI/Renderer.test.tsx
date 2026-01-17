import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Renderer } from "./Renderer";
import type { A2UIComponentEntry } from "./types";

describe("Renderer", () => {
  describe("basic rendering", () => {
    it("renders a simple text component", () => {
      const components: A2UIComponentEntry[] = [
        {
          id: "greeting",
          component: {
            label: {
              "data-testid": "test-text",
              text: { literalString: "Hello, World!" },
            },
          },
        },
      ];

      render(<Renderer rootId="greeting" surface={components} />);

      const text = screen.getByTestId("test-text");
      expect(text).toBeInTheDocument();
      expect(text).toHaveTextContent("Hello, World!");
    });

    it("renders a button with literal text", () => {
      const components: A2UIComponentEntry[] = [
        {
          id: "btn",
          component: {
            button: {
              "data-testid": "test-button",
            },
          },
        },
      ];

      render(<Renderer rootId="btn" surface={components} />);

      const button = screen.getByTestId("test-button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("adjacency list resolution", () => {
    it("resolves nested components via explicitList", () => {
      const components: A2UIComponentEntry[] = [
        {
          id: "root",
          component: {
            card: {
              "data-testid": "test-card",
              children: { explicitList: ["child1", "child2"] },
            },
          },
        },
        {
          id: "child1",
          component: {
            label: {
              "data-testid": "text-1",
              text: { literalString: "First" },
            },
          },
        },
        {
          id: "child2",
          component: {
            label: {
              "data-testid": "text-2",
              text: { literalString: "Second" },
            },
          },
        },
      ];

      render(<Renderer rootId="root" surface={components} />);

      expect(screen.getByTestId("test-card")).toBeInTheDocument();
      expect(screen.getByTestId("text-1")).toHaveTextContent("First");
      expect(screen.getByTestId("text-2")).toHaveTextContent("Second");
    });

    it("resolves single child reference", () => {
      const components: A2UIComponentEntry[] = [
        {
          id: "wrapper",
          component: {
            card: {
              "data-testid": "wrapper-card",
              child: "inner",
            },
          },
        },
        {
          id: "inner",
          component: {
            label: {
              "data-testid": "inner-text",
              text: { literalString: "Nested content" },
            },
          },
        },
      ];

      render(<Renderer rootId="wrapper" surface={components} />);

      expect(screen.getByTestId("wrapper-card")).toBeInTheDocument();
      expect(screen.getByTestId("inner-text")).toHaveTextContent(
        "Nested content",
      );
    });
  });

  describe("data binding", () => {
    it("resolves path references from data model", () => {
      const components: A2UIComponentEntry[] = [
        {
          id: "greeting",
          component: {
            label: {
              "data-testid": "bound-text",
              text: { path: "/user/name" },
            },
          },
        },
      ];

      const dataModel = {
        user: {
          name: "Alice",
        },
      };

      render(
        <Renderer
          dataModel={dataModel}
          rootId="greeting"
          surface={components}
        />,
      );

      expect(screen.getByTestId("bound-text")).toHaveTextContent("Alice");
    });

    it("handles nested path references", () => {
      const components: A2UIComponentEntry[] = [
        {
          id: "info",
          component: {
            label: {
              "data-testid": "nested-text",
              text: { path: "/company/address/city" },
            },
          },
        },
      ];

      const dataModel = {
        company: {
          address: {
            city: "San Francisco",
          },
        },
      };

      render(
        <Renderer dataModel={dataModel} rootId="info" surface={components} />,
      );

      expect(screen.getByTestId("nested-text")).toHaveTextContent(
        "San Francisco",
      );
    });
  });

  describe("surface update payload", () => {
    it("accepts full surfaceUpdate payload", () => {
      const surface = {
        surfaceId: "main",
        components: [
          {
            id: "root",
            component: {
              label: {
                "data-testid": "payload-text",
                text: { literalString: "From payload" },
              },
            },
          },
        ],
      };

      render(<Renderer rootId="root" surface={surface} />);

      expect(screen.getByTestId("payload-text")).toHaveTextContent(
        "From payload",
      );
    });

    it("uses first component as root when rootId not provided", () => {
      const surface = {
        surfaceId: "main",
        components: [
          {
            id: "auto-root",
            component: {
              label: {
                "data-testid": "auto-text",
                text: { literalString: "Auto root" },
              },
            },
          },
        ],
      };

      render(<Renderer surface={surface} />);

      expect(screen.getByTestId("auto-text")).toHaveTextContent("Auto root");
    });
  });

  describe("error handling", () => {
    it("handles unknown components gracefully", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const components: A2UIComponentEntry[] = [
        {
          id: "unknown",
          component: {
            "unknown-component": {},
          },
        },
      ];

      const { container } = render(
        <Renderer rootId="unknown" surface={components} />,
      );

      expect(container).toBeEmptyDOMElement();
      expect(consoleSpy).toHaveBeenCalledWith(
        'A2UI: Unknown component type "unknown-component"',
      );

      consoleSpy.mockRestore();
    });

    it("returns null for empty components array", () => {
      const { container } = render(<Renderer surface={[]} />);

      expect(container).toBeEmptyDOMElement();
    });

    it("handles missing component reference gracefully", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const components: A2UIComponentEntry[] = [
        {
          id: "root",
          component: {
            card: {
              child: "missing-id",
            },
          },
        },
      ];

      render(<Renderer rootId="root" surface={components} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'A2UI: Component not found: "missing-id"',
      );

      consoleSpy.mockRestore();
    });
  });
});
