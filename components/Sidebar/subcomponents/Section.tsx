import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";

import { Stack } from "../../Layout/Layout";
import { useSidebarContext } from "../context";
import { useAutoExpand } from "../hooks";
import styles from "../Sidebar.module.scss";
import { SidebarSectionProps } from "../types";

export function Section({
  children,
  id,
  icon,
  label,
  expanded,
  className,
}: SidebarSectionProps) {
  const {
    withRail,
    activeSection,
    expandedSections,
    toggleSection,
    onSectionChange,
  } = useSidebarContext();

  useAutoExpand(id, children);

  const isActive = activeSection === id;
  const isExpanded = expanded ?? expandedSections.includes(id);
  const reactId = React.useId();
  const contentId = `sidebar-section-${reactId}`;

  return (
    <div className={clsx(styles.section, className)}>
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className={clsx(styles.sectionTrigger, isActive && styles.active)}
        type="button"
        onClick={() => {
          toggleSection(id);
          if (withRail) {
            onSectionChange(id);
          }
        }}
      >
        <span className={styles.sectionIcon}>{icon}</span>
        <span className={styles.sectionLabel}>{label}</span>
        <ChevronRight className={styles.sectionChevron} size={16} />
      </button>
      <div
        aria-hidden={!isExpanded}
        className={clsx(styles.sectionContent, isExpanded && styles.expanded)}
        id={contentId}
      >
        <Stack gap={0}>{children}</Stack>
      </div>
    </div>
  );
}
