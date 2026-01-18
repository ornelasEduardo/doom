import React from "react";

import { Nav } from "./subcomponents/Nav";
import { Section } from "./subcomponents/Section";
import { SidebarSectionProps } from "./types";

export const extractSections = (
  nodes: React.ReactNode,
  sectionInfo: Array<{ id: string; icon: React.ReactNode; label: string }>,
) => {
  React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    if (child.type === React.Fragment) {
      extractSections(
        (child as React.ReactElement<any>).props.children,
        sectionInfo,
      );
      return;
    }

    if (child.type === Nav) {
      React.Children.forEach(
        (child as React.ReactElement<any>).props.children,
        (navChild) => {
          if (
            React.isValidElement<SidebarSectionProps>(navChild) &&
            navChild.type === Section
          ) {
            sectionInfo.push({
              id: navChild.props.id,
              icon: navChild.props.icon,
              label: navChild.props.label,
            });
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
        <React.Fragment key={(child as any).key}>
          {filterNodesForRail(
            (child as React.ReactElement<any>).props.children,
            activeSection,
          )}
        </React.Fragment>
      );
    }

    if (child.type === Nav) {
      const filteredNavChildren = React.Children.toArray(
        (child as React.ReactElement<any>).props.children,
      ).filter((navChild) => {
        if (
          React.isValidElement<SidebarSectionProps>(navChild) &&
          navChild.type === Section
        ) {
          return navChild.props.id === activeSection;
        }
        return true;
      });

      const activeSectionChild = filteredNavChildren.find(
        (navChild) =>
          React.isValidElement<SidebarSectionProps>(navChild) &&
          navChild.type === Section &&
          (navChild as any).props.id === activeSection,
      );

      if (
        activeSectionChild &&
        React.isValidElement<SidebarSectionProps>(activeSectionChild)
      ) {
        return (
          <Nav
            {...(child as React.ReactElement<any>).props}
            className={(child as React.ReactElement<any>).props.className}
          >
            {activeSectionChild.props.children}
          </Nav>
        );
      }
      return null;
    }

    return child;
  });
};

export const hasActiveChild = (
  nodes: React.ReactNode,
  activeItem: string,
): boolean => {
  let found = false;
  React.Children.forEach(nodes, (child) => {
    if (found) {
      return;
    }
    if (!React.isValidElement(child)) {
      return;
    }

    if (child.type === React.Fragment) {
      if (
        hasActiveChild(
          (child as React.ReactElement<any>).props.children,
          activeItem,
        )
      ) {
        found = true;
      }
      return;
    }

    // Check if matching href
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((child.props as any).href === activeItem) {
      found = true;
      return;
    }

    // Recurse if children exist (e.g. wrapper components)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((child.props as any).children) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (hasActiveChild((child.props as any).children, activeItem)) {
        found = true;
      }
    }
  });
  return found;
};
