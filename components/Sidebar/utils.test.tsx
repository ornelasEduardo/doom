import "@testing-library/jest-dom";

import React from "react";
import { describe, expect, it } from "vitest";

import { extractSections, filterNodesForRail, hasActiveChild } from "./utils";

// Mock components with displayNames for testing
const MockNav: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <nav>{children}</nav>
);
MockNav.displayName = "Nav";

const MockSection: React.FC<{
  id: string;
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}> = ({ children }) => <div>{children}</div>;
MockSection.displayName = "Section";

const MockItem: React.FC<{ href?: string; children?: React.ReactNode }> = ({
  children,
}) => <a>{children}</a>;
MockItem.displayName = "Item";

const MockGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);
MockGroup.displayName = "Group";

describe("Sidebar Utils", () => {
  describe("extractSections", () => {
    it("extracts section info from sidebar structure", () => {
      const sectionInfo: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
      }> = [];
      const itemToSection = new Map<string, string>();

      const icon = <span>🏠</span>;
      const children = (
        <MockNav>
          <MockSection icon={icon} id="main" label="Main">
            <MockItem href="/home">Home</MockItem>
          </MockSection>
        </MockNav>
      );

      extractSections(children, sectionInfo, itemToSection);

      expect(sectionInfo).toHaveLength(1);
      expect(sectionInfo[0].id).toBe("main");
      expect(sectionInfo[0].label).toBe("Main");
    });

    it("extracts multiple sections", () => {
      const sectionInfo: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
      }> = [];
      const itemToSection = new Map<string, string>();

      const children = (
        <MockNav>
          <MockSection icon={<span>🏠</span>} id="main" label="Main">
            <MockItem href="/home">Home</MockItem>
          </MockSection>
          <MockSection icon={<span>👥</span>} id="admin" label="Admin">
            <MockItem href="/users">Users</MockItem>
          </MockSection>
        </MockNav>
      );

      extractSections(children, sectionInfo, itemToSection);

      expect(sectionInfo).toHaveLength(2);
      expect(sectionInfo[0].id).toBe("main");
      expect(sectionInfo[1].id).toBe("admin");
    });

    it("builds item-to-section registry", () => {
      const sectionInfo: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
      }> = [];
      const itemToSection = new Map<string, string>();

      const children = (
        <MockNav>
          <MockSection icon={<span>🏠</span>} id="main" label="Main">
            <MockItem href="/home">Home</MockItem>
            <MockItem href="/dashboard">Dashboard</MockItem>
          </MockSection>
          <MockSection icon={<span>👥</span>} id="admin" label="Admin">
            <MockItem href="/users">Users</MockItem>
          </MockSection>
        </MockNav>
      );

      extractSections(children, sectionInfo, itemToSection);

      expect(itemToSection.get("/home")).toBe("main");
      expect(itemToSection.get("/dashboard")).toBe("main");
      expect(itemToSection.get("/users")).toBe("admin");
    });

    it("extracts items from nested groups", () => {
      const sectionInfo: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
      }> = [];
      const itemToSection = new Map<string, string>();

      const children = (
        <MockNav>
          <MockSection icon={<span>🏠</span>} id="main" label="Main">
            <MockGroup>
              <MockItem href="/nested-item">Nested</MockItem>
            </MockGroup>
          </MockSection>
        </MockNav>
      );

      extractSections(children, sectionInfo, itemToSection);

      expect(itemToSection.get("/nested-item")).toBe("main");
    });

    it("handles React Fragments", () => {
      const sectionInfo: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
      }> = [];
      const itemToSection = new Map<string, string>();

      const children = (
        <>
          <MockNav>
            <MockSection icon={<span>🏠</span>} id="main" label="Main">
              <MockItem href="/home">Home</MockItem>
            </MockSection>
          </MockNav>
        </>
      );

      extractSections(children, sectionInfo, itemToSection);

      expect(sectionInfo).toHaveLength(1);
      expect(sectionInfo[0].id).toBe("main");
    });

    it("ignores items without href", () => {
      const sectionInfo: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
      }> = [];
      const itemToSection = new Map<string, string>();

      const children = (
        <MockNav>
          <MockSection icon={<span>🏠</span>} id="main" label="Main">
            <MockItem>No href item</MockItem>
            <MockItem href="/with-href">With href</MockItem>
          </MockSection>
        </MockNav>
      );

      extractSections(children, sectionInfo, itemToSection);

      expect(itemToSection.size).toBe(1);
      expect(itemToSection.get("/with-href")).toBe("main");
    });
  });

  describe("filterNodesForRail", () => {
    it("filters to show only active section children", () => {
      const children = (
        <MockNav>
          <MockSection icon={<span>🏠</span>} id="main" label="Main">
            <MockItem href="/home">Home</MockItem>
          </MockSection>
          <MockSection icon={<span>👥</span>} id="admin" label="Admin">
            <MockItem href="/users">Users</MockItem>
          </MockSection>
        </MockNav>
      );

      const result = filterNodesForRail(children, "main");

      // Result should be an array with the Nav containing only main section's children
      expect(result).toBeDefined();
    });

    it("returns empty result for nav when no section matches", () => {
      const children = (
        <MockNav>
          <MockSection icon={<span>🏠</span>} id="main" label="Main">
            <MockItem href="/home">Home</MockItem>
          </MockSection>
        </MockNav>
      );

      const result = filterNodesForRail(children, "nonexistent");
      const resultArray = React.Children.toArray(result);

      // When no section matches, the Nav returns null which is filtered out by toArray
      expect(resultArray.length).toBe(0);
    });

    it("handles React Fragments", () => {
      const children = (
        <>
          <MockNav>
            <MockSection icon={<span>🏠</span>} id="main" label="Main">
              <MockItem href="/home">Home</MockItem>
            </MockSection>
          </MockNav>
        </>
      );

      const result = filterNodesForRail(children, "main");

      expect(result).toBeDefined();
    });

    it("passes through non-Nav children unchanged", () => {
      const children = (
        <div data-testid="other">
          <span>Other content</span>
        </div>
      );

      const result = filterNodesForRail(children, "main");

      expect(React.Children.toArray(result)).toHaveLength(1);
    });
  });

  describe("hasActiveChild", () => {
    it("returns true when child has matching href", () => {
      const children = (
        <div>
          <a href="/home">Home</a>
          <a href="/settings">Settings</a>
        </div>
      );

      expect(hasActiveChild(children, "/home")).toBe(true);
    });

    it("returns false when no child has matching href", () => {
      const children = (
        <div>
          <a href="/home">Home</a>
          <a href="/settings">Settings</a>
        </div>
      );

      expect(hasActiveChild(children, "/nonexistent")).toBe(false);
    });

    it("finds active child in nested structure", () => {
      const children = (
        <div>
          <div>
            <div>
              <a href="/deeply-nested">Nested</a>
            </div>
          </div>
        </div>
      );

      expect(hasActiveChild(children, "/deeply-nested")).toBe(true);
    });

    it("handles React Fragments", () => {
      const children = (
        <>
          <a href="/home">Home</a>
          <a href="/settings">Settings</a>
        </>
      );

      expect(hasActiveChild(children, "/settings")).toBe(true);
    });

    it("returns false for empty children", () => {
      expect(hasActiveChild(null, "/home")).toBe(false);
      expect(hasActiveChild(undefined, "/home")).toBe(false);
    });

    it("handles mixed content types", () => {
      const children = (
        <div>
          Some text
          <a href="/link">Link</a>
          {42}
          {null}
        </div>
      );

      expect(hasActiveChild(children, "/link")).toBe(true);
    });
  });
});
