import React from "react";

import { Nav } from "./subcomponents/Nav";
import { SidebarItemProps, SidebarSectionProps } from "./types";

const isNavComponent = (child: React.ReactElement): boolean => {
  const type = child.type;
  if (typeof type === "function") {
    return (type as React.FC).displayName === "Nav" || type.name === "Nav";
  }
  return false;
};

const isSectionComponent = (child: React.ReactElement): boolean => {
  const type = child.type;
  if (typeof type === "function") {
    return (
      (type as React.FC).displayName === "Section" || type.name === "Section"
    );
  }
  return false;
};

const isItemComponent = (child: React.ReactElement): boolean => {
  const type = child.type;
  if (typeof type === "function") {
    return (type as React.FC).displayName === "Item" || type.name === "Item";
  }
  return false;
};

// Recursively extract items from a section's children
const extractItemsFromSection = (
  nodes: React.ReactNode,
  sectionId: string,
  itemToSection: Map<string, string>,
) => {
  React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    if (isItemComponent(child)) {
      const href = (child.props as SidebarItemProps).href;
      if (href) {
        itemToSection.set(href, sectionId);
      }
    }

    // Recurse into Groups and other containers
    const childProps = child.props as { children?: React.ReactNode };
    if (childProps.children) {
      extractItemsFromSection(childProps.children, sectionId, itemToSection);
    }
  });
};

export const extractSections = (
  nodes: React.ReactNode,
  sectionInfo: Array<{ id: string; icon: React.ReactNode; label: string }>,
  itemToSection: Map<string, string>,
) => {
  React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    if (child.type === React.Fragment) {
      extractSections(
        (child as React.ReactElement<{ children?: React.ReactNode }>).props
          .children,
        sectionInfo,
        itemToSection,
      );
      return;
    }

    if (isNavComponent(child)) {
      React.Children.forEach(
        (child as React.ReactElement<{ children?: React.ReactNode }>).props
          .children,
        (navChild) => {
          if (
            React.isValidElement<SidebarSectionProps>(navChild) &&
            isSectionComponent(navChild)
          ) {
            const sectionId = navChild.props.id;
            sectionInfo.push({
              id: sectionId,
              icon: navChild.props.icon,
              label: navChild.props.label,
            });
            // Extract items from this section
            extractItemsFromSection(
              navChild.props.children,
              sectionId,
              itemToSection,
            );
          }
        },
      );
    }
  });
};

export const filterNodesForRail = (
  nodes: React.ReactNode,
  activeSection: string | null,
): React.ReactNode => {
  return React.Children.map(nodes, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    if (child.type === React.Fragment) {
      return (
        <React.Fragment key={child.key ?? undefined}>
          {filterNodesForRail(
            (child as React.ReactElement<{ children?: React.ReactNode }>).props
              .children,
            activeSection,
          )}
        </React.Fragment>
      );
    }

    if (isNavComponent(child)) {
      const navElement = child as React.ReactElement<{
        children?: React.ReactNode;
        className?: string;
      }>;
      const filteredNavChildren = React.Children.toArray(
        navElement.props.children,
      ).filter((navChild) => {
        if (
          React.isValidElement<SidebarSectionProps>(navChild) &&
          isSectionComponent(navChild)
        ) {
          return navChild.props.id === activeSection;
        }
        return true;
      });

      const activeSectionChild = filteredNavChildren.find(
        (navChild) =>
          React.isValidElement<SidebarSectionProps>(navChild) &&
          isSectionComponent(navChild) &&
          navChild.props.id === activeSection,
      );

      if (
        activeSectionChild &&
        React.isValidElement<SidebarSectionProps>(activeSectionChild)
      ) {
        // Just render the children - Items will look up their section from the registry
        return (
          <Nav {...navElement.props} className={navElement.props.className}>
            {activeSectionChild.props.children}
          </Nav>
        );
      }
      return null;
    }

    return child;
  });
};

interface ChildWithProps {
  href?: string;
  children?: React.ReactNode;
}

export const hasActiveChild = (
  nodes: React.ReactNode,
  activeItem: string,
): boolean => {
  let found = false;
  React.Children.forEach(nodes, (child) => {
    if (found || !React.isValidElement(child)) {
      return;
    }

    const props = child.props as ChildWithProps;

    if (child.type === React.Fragment) {
      if (hasActiveChild(props.children, activeItem)) {
        found = true;
      }
      return;
    }

    if (props.href === activeItem) {
      found = true;
      return;
    }

    if (props.children) {
      if (hasActiveChild(props.children, activeItem)) {
        found = true;
      }
    }
  });
  return found;
};
