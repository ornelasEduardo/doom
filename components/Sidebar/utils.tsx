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
        (child as React.ReactElement<{ children?: React.ReactNode }>).props
          .children,
        sectionInfo,
      );
      return;
    }

    if (child.type === Nav) {
      React.Children.forEach(
        (child as React.ReactElement<{ children?: React.ReactNode }>).props
          .children,
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
        <React.Fragment key={child.key ?? undefined}>
          {filterNodesForRail(
            (child as React.ReactElement<{ children?: React.ReactNode }>).props
              .children,
            activeSection,
          )}
        </React.Fragment>
      );
    }

    if (child.type === Nav) {
      const navElement = child as React.ReactElement<{
        children?: React.ReactNode;
        className?: string;
      }>;
      const filteredNavChildren = React.Children.toArray(
        navElement.props.children,
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
          navChild.props.id === activeSection,
      );

      if (
        activeSectionChild &&
        React.isValidElement<SidebarSectionProps>(activeSectionChild)
      ) {
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
