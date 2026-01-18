import clsx from "clsx";
import React from "react";

import { SidebarHeaderProps } from "../../types";
import styles from "./Header.module.scss";

export function Header({ children, className }: SidebarHeaderProps) {
  return <div className={clsx(styles.header, className)}>{children}</div>;
}
