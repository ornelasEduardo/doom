import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";

import { Stack } from "../../Layout/Layout";
import { useSidebarContext } from "../context";
import { useAutoExpand } from "../hooks";
import styles from "../Sidebar.module.scss";
import { SidebarGroupProps } from "../types";

export function Group({
  children,
  id,
  label,
  icon,
  expanded,
  className,
}: SidebarGroupProps) {
  const { expandedSections, toggleSection } = useSidebarContext();

  useAutoExpand(id, children);

  const isExpanded = expanded ?? expandedSections.includes(id);
  const reactId = React.useId();
  const contentId = `sidebar-group-${reactId}`;

  return (
    <div className={clsx(styles.section, className)}>
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className={styles.sectionTrigger}
        type="button"
        onClick={() => toggleSection(id)}
      >
        {icon && <span className={styles.sectionIcon}>{icon}</span>}
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
