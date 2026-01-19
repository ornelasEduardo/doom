import clsx from "clsx";
import React from "react";

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
  return (
    <div className={styles.rail}>
      {brandIcon && <div className={styles.railBrand}>{brandIcon}</div>}
      <div className={styles.railNav}>
        {sections.map((section) => (
          <button
            key={section.id}
            aria-label={section.label}
            className={clsx(
              styles.railItem,
              activeSection === section.id && styles.active,
            )}
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
