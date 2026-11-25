import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { ThemedIcon } from "../../../../styles/theming/ThemedIcon";
import { Stack } from "../../../Layout/Layout";
import { useSidebarContext } from "../../context";
import { useAutoExpand } from "../../hooks";
import { SidebarGroupProps } from "../../types";
import styles from "./Group.module.scss";

export function Group({
  classNames,
  children,
  id,
  label,
  icon,
  expanded,
  className,
}: SidebarGroupProps) {
  const doomPart = useThemeParts("Sidebar", classNames, {});

  const { expandedSections, toggleSection } = useSidebarContext();

  useAutoExpand(id, children);

  const isExpanded = expanded ?? expandedSections.includes(id);
  const state = { "data-expanded": isExpanded || undefined };
  const reactId = React.useId();
  const contentId = `sidebar-group-${reactId}`;

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
          className: styles.sectionTrigger,
        })}
        type="button"
        onClick={() => toggleSection(id)}
      >
        {icon && (
          <span
            {...doomPart("sectionIcon", {
              ...state,
              className: styles.sectionIcon,
            })}
          >
            {icon}
          </span>
        )}
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
