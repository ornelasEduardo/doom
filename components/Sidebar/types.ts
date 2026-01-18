import React from "react";

export interface SidebarContextValue {
  withRail: boolean;
  activeSection: string | null;
  activeItem: string | null;
  itemToSection: Map<string, string>;
  expandedSections: string[];
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onNavigate: (href: string, e?: React.MouseEvent) => void;
  onSectionChange: (id: string) => void;
  toggleSection: (id: string) => void;
  expandSection: (id: string) => void;
}

export interface SidebarProps {
  children: React.ReactNode;
  withRail?: boolean;
  activeSection?: string;
  activeItem?: string;
  collapsed?: boolean;
  onNavigate?: (href: string, e?: React.MouseEvent) => void;
  onSectionChange?: (id: string) => void;
  brandIcon?: React.ReactNode;
  className?: string;
}

export interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface SidebarNavProps {
  children: React.ReactNode;
  className?: string;
}

export interface SidebarSectionProps {
  children: React.ReactNode;
  id: string;
  icon: React.ReactNode;
  label: string;
  expanded?: boolean;
  className?: string;
}

export interface SidebarItemProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e?: React.MouseEvent) => void;
  icon?: React.ReactNode;
  appendContent?: React.ReactNode;
  className?: string;
}

export interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export interface MobileOverlayProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export interface RailProps {
  sections: Array<{ id: string; icon: React.ReactNode; label: string }>;
  activeSection: string | null;
  onSectionClick: (id: string) => void;
  onSectionMouseEnter?: (id: string) => void;
  onSectionMouseLeave?: () => void;
  brandIcon?: React.ReactNode;
}

export interface SidebarMobileTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

export interface SidebarGroupProps {
  children: React.ReactNode;
  id: string;
  label: string;
  icon?: React.ReactNode;
  expanded?: boolean;
  className?: string;
}
