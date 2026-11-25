import clsx from "clsx";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { RailProps } from "../../types";
import styles from "./Rail.module.scss";

export function Rail({
  sections,
  activeSection,
  onSectionClick,
  onSectionMouseEnter,
  onSectionMouseLeave,
  brandIcon,
}: RailProps) {
  const doomPart = useThemeParts("Sidebar", undefined, {});

  return (
    <div {...doomPart("rail", { className: styles.rail })}>
      {brandIcon && (
        <div {...doomPart("railBrand", { className: styles.railBrand })}>
          {brandIcon}
        </div>
      )}
      <div {...doomPart("railNav", { className: styles.railNav })}>
        {sections.map((section) => (
          <button
            key={section.id}
            aria-label={section.label}
            {...doomPart("railItem", {
              className: clsx(
                styles.railItem,
                activeSection === section.id && styles.active,
              ),
            })}
            type="button"
            onClick={() => onSectionClick(section.id)}
            onMouseEnter={() => onSectionMouseEnter?.(section.id)}
            onMouseLeave={() => onSectionMouseLeave?.()}
          >
            {section.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
