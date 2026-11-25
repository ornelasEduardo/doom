import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { ThemedIcon } from "../../../../styles/theming/ThemedIcon";
import { Stack } from "../../../Layout/Layout";
import { useSidebarContext } from "../../context";
import { useAutoExpand } from "../../hooks";
import { SidebarSectionProps } from "../../types";
import styles from "./Section.module.scss";

export function Section({
  classNames,
  children,
  id,
  icon,
  label,
  expanded,
  className,
}: SidebarSectionProps) {
  const doomPart = useThemeParts("Sidebar", classNames, {});

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
  const state = {
    "data-expanded": isExpanded || undefined,
    "data-selected": isActive || undefined,
  };
  const reactId = React.useId();
  const contentId = `sidebar-section-${reactId}`;

  return (
    <div
      {...doomPart("section", {
        ...state,
        className: clsx(styles.section, className),
      })}
    >
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        {...doomPart("sectionTrigger", {
          ...state,
          className: clsx(styles.sectionTrigger, isActive && styles.active),
        })}
        type="button"
        onClick={() => {
          toggleSection(id);
          if (withRail) {
            onSectionChange(id);
          }
        }}
      >
        <span
          {...doomPart("sectionIcon", {
            ...state,
            className: styles.sectionIcon,
          })}
        >
          {icon}
        </span>
        <span
          {...doomPart("sectionLabel", {
            ...state,
            className: styles.sectionLabel,
          })}
        >
          {label}
        </span>
        <ThemedIcon
          icon={ChevronRight}
          iconName="chevronRight"
          {...doomPart("sectionChevron", {
            ...state,
            className: styles.sectionChevron,
          })}
          size={16}
        />
      </button>
      <div
        aria-hidden={!isExpanded}
        {...doomPart("sectionContent", {
          ...state,
          className: clsx(styles.sectionContent, isExpanded && styles.expanded),
        })}
        id={contentId}
      >
        <Stack gap={0}>{children}</Stack>
      </div>
    </div>
  );
}

Section.displayName = "Section";
