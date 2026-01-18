"use client";

import clsx from "clsx";
import React, { useCallback, useState } from "react";

import { Stack } from "../Layout/Layout";
import { SidebarContext } from "./context";
import styles from "./Sidebar.module.scss";
import { Footer } from "./subcomponents/Footer";
import { Group } from "./subcomponents/Group";
import { Header } from "./subcomponents/Header";
import { Item } from "./subcomponents/Item";
import { MobileOverlay } from "./subcomponents/MobileOverlay";
import { MobileTrigger } from "./subcomponents/MobileTrigger";
import { Nav } from "./subcomponents/Nav";
import { Rail } from "./subcomponents/Rail";
import { Section } from "./subcomponents/Section";
import { SidebarContextValue, SidebarProps } from "./types";
import { extractSections, filterNodesForRail } from "./utils";

function SidebarRoot({
  children,
  withRail = false,
  activeSection: activeSecProp,
  activeItem,
  collapsed = false,
  onNavigate,
  onSectionChange: onSecChangeProp,
  brandIcon,
  className,
}: SidebarProps) {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [internalActiveSection, setInternalActiveSection] = useState<
    string | null
  >(activeSecProp ?? null);

  const activeSection = activeSecProp ?? internalActiveSection;
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isHovered, setHovered] = useState(false);

  const effectiveSection = hoveredSection ?? activeSection;
  const isPeeking = collapsed && (hoveredSection !== null || isHovered);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  }, []);

  const expandSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev : [...prev, sectionId],
    );
  }, []);

  const handleNavigate = useCallback(
    (href: string, e?: React.MouseEvent) => {
      onNavigate?.(href, e);
      setMobileOpen(false);
      setHoveredSection(null);
    },
    [onNavigate],
  );

  const handleSectionChange = useCallback(
    (id: string) => {
      setInternalActiveSection(id);
      onSecChangeProp?.(id);
    },
    [onSecChangeProp],
  );

  const sectionInfo: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
  }> = [];
  const itemToSection = new Map<string, string>();

  extractSections(children, sectionInfo, itemToSection);

  const contextValue: SidebarContextValue = {
    withRail,
    activeSection,
    activeItem: activeItem ?? null,
    itemToSection,
    expandedSections,
    isMobileOpen,
    setMobileOpen,
    onNavigate: handleNavigate,
    onSectionChange: handleSectionChange,
    toggleSection,
    expandSection,
  };

  const sidebarContent = (
    <Stack
      className={clsx(
        styles.root,
        collapsed && !isPeeking && styles.collapsed,
        className,
      )}
      gap={0}
      width="100%"
    >
      {withRail ? filterNodesForRail(children, effectiveSection) : children}
    </Stack>
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={clsx(
          styles.container,
          withRail && styles.withRail,
          collapsed && styles.collapsed,
          isPeeking && styles.peeking,
        )}
        data-testid="sidebar-desktop"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setHoveredSection(null);
        }}
      >
        <div
          className={clsx(
            styles.visuals,
            withRail && styles.withRail,
            collapsed && styles.collapsed,
            isPeeking && styles.peeking,
          )}
        >
          {withRail && (
            <Rail
              activeSection={activeSection}
              brandIcon={brandIcon}
              sections={sectionInfo}
              onSectionClick={handleSectionChange}
              onSectionMouseEnter={setHoveredSection}
            />
          )}
          <div
            className={clsx(
              styles.panel,
              collapsed && styles.collapsed,
              isPeeking && styles.peeking,
            )}
            data-testid="sidebar-panel"
          >
            {sidebarContent}
          </div>
        </div>
      </div>

      <MobileOverlay isOpen={isMobileOpen} onClose={() => setMobileOpen(false)}>
        <SidebarContext.Provider value={{ ...contextValue, withRail: false }}>
          <Stack className={styles.root} gap={0} width="sidebar">
            {children}
          </Stack>
        </SidebarContext.Provider>
      </MobileOverlay>
    </SidebarContext.Provider>
  );
}

export const Sidebar = Object.assign(SidebarRoot, {
  Header,
  Nav,
  Section,
  Group,
  Item,
  Footer,
  MobileTrigger,
});

export { Header as SidebarHeader };
export { Nav as SidebarNav };
export { Section as SidebarSection };
export { Group as SidebarGroup };
export { Item as SidebarItem };
export { Footer as SidebarFooter };
export { MobileTrigger as SidebarMobileTrigger };

export { useSidebarContext } from "./context";
export type { SidebarProps } from "./types";
