import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { ChevronDown, Search, X } from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { ControlSize } from "../../styles/types";
import { Card } from "../Card/Card";
import { Checkbox } from "../Checkbox/Checkbox";
import { Popover } from "../Popover/Popover";
import { Text } from "../Text/Text";
import styles from "./Combobox.module.scss";
import { useComboboxFilter } from "./useComboboxFilter";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  classNames?: ThemeClassNames<"Combobox">;
  options: ComboboxOption[];
  value?: string | string[];
  onChange: (value: string | string[] | undefined) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  size?: ControlSize;
  disabled?: boolean;
  className?: string;
  inline?: boolean;
}

export function Combobox({
  classNames,
  options,
  value,
  onChange,
  placeholder = "Select...",
  multiple = false,
  searchable = true,
  size = "md",
  disabled = false,
  className,
  inline = false,
}: ComboboxProps) {
  const doomPart = useThemeParts("Combobox", classNames, {
    size: size,
    disabled: disabled,
  });

  const instanceId = useId();
  const selectAllId = `${instanceId}-select-all`;

  const [isOpen, setIsOpen] = useState(false);
  const { searchQuery, setSearchQuery, filteredOptions } =
    useComboboxFilter(options);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inline && searchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inline, searchable]);

  const selectedValues = useMemo(() => {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const getOptionKey = React.useCallback(
    (index: number) => filteredOptions[index].value,
    [filteredOptions],
  );
  const rowVirtualizer = useVirtualizer({
    getItemKey: getOptionKey,
    count: filteredOptions.length,
    getScrollElement: () => optionsListRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && multiple && filteredOptions.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const filteredValues = filteredOptions.map((o) => o.value);
      const newValues = Array.from(
        new Set([...selectedValues, ...filteredValues]),
      );
      onChange(newValues.length === 0 ? undefined : newValues);
      setSearchQuery("");
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const allButton = document.getElementById(selectAllId);
      if (allButton) {
        allButton.focus();
        return;
      }

      const firstIndex = rowVirtualizer.getVirtualItems()[0]?.index ?? 0;
      rowVirtualizer.scrollToIndex(firstIndex);
      setTimeout(() => {
        const firstOption = optionsListRef.current?.querySelector(
          `[data-index="${firstIndex}"]`,
        );
        if (firstOption instanceof HTMLElement) {
          firstOption.focus();
        }
      }, 0);
    }
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    e.stopPropagation();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index === -1) {
        const firstIndex = 0;
        if (filteredOptions.length > 0) {
          rowVirtualizer.scrollToIndex(firstIndex);
          setTimeout(() => {
            const firstOption = optionsListRef.current?.querySelector(
              `[data-index="${firstIndex}"]`,
            );
            if (firstOption instanceof HTMLElement) {
              firstOption.focus();
            }
          }, 0);
        }
        return;
      }

      const nextIndex = index + 1;
      if (nextIndex < filteredOptions.length) {
        rowVirtualizer.scrollToIndex(nextIndex);
        setTimeout(() => {
          const nextOption = optionsListRef.current?.querySelector(
            `[data-index="${nextIndex}"]`,
          );
          if (nextOption instanceof HTMLElement) {
            nextOption.focus();
          }
        }, 0);
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) {
        if (multiple && options.length > 0) {
          document.getElementById(selectAllId)?.focus();
        } else if (searchable) {
          inputRef.current?.focus();
        }
        return;
      }

      if (index === -1) {
        if (searchable) {
          inputRef.current?.focus();
        }
        return;
      }

      if (index > 0) {
        const prevIndex = index - 1;
        rowVirtualizer.scrollToIndex(prevIndex);
        setTimeout(() => {
          const prevOption = optionsListRef.current?.querySelector(
            `[data-index="${prevIndex}"]`,
          );
          if (prevOption instanceof HTMLElement) {
            prevOption.focus();
          }
        }, 0);
      }
    }

    if (e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  const isSelected = (optionValue: string) => {
    return selectedValues.includes(optionValue);
  };

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      if (isSelected(optionValue)) {
        const newValues = selectedValues.filter((v) => v !== optionValue);
        onChange(newValues.length === 0 ? undefined : newValues);
      } else {
        onChange([...selectedValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange(undefined);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearchQuery("");
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const displayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      const opt = options.find((o) => o.value === selectedValues[0]);
      return opt?.label ?? selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options, placeholder]);

  const hasValue = selectedValues.length > 0;
  const allSelected = multiple && selectedValues.length === options.length;

  const dropdownContent = (
    <Card.Root
      {...doomPart(inline ? "root" : "dropdown", {
        className: clsx(styles.dropdown, inline && styles.inlineDropdown),
      })}
      onClick={(e) => e.stopPropagation()}
    >
      {searchable && (
        <div
          {...doomPart("searchWrapper", { className: styles.searchWrapper })}
        >
          <ThemedIcon
            icon={Search}
            iconName="search"
            {...doomPart("searchIcon", { className: styles.searchIcon })}
            size={20}
          />
          <input
            ref={inputRef}
            {...doomPart("searchInput", { className: styles.searchInput })}
            placeholder="Search..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      )}

      {multiple && options.length > 0 && (
        <div {...doomPart("stickyOption", { className: styles.stickyOption })}>
          <button
            {...doomPart("option", {
              className: clsx(styles.option, allSelected && styles.selected),
            })}
            aria-pressed={allSelected}
            data-selected={allSelected || undefined}
            id={selectAllId}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAll();
            }}
            onKeyDown={(e) => handleOptionKeyDown(e, -1)}
          >
            <div style={{ pointerEvents: "none" }}>
              <Checkbox readOnly checked={allSelected} />
            </div>
            <Text
              as="span"
              {...doomPart("optionLabel", { className: styles.optionLabel })}
            >
              All
            </Text>
          </button>
        </div>
      )}

      <div
        ref={optionsListRef}
        {...doomPart("optionsList", { className: styles.optionsList })}
      >
        {filteredOptions.length === 0 ? (
          <div {...doomPart("noResults", { className: styles.noResults })}>
            <Text
              {...doomPart("noResultsText", {
                className: styles.noResultsText,
              })}
            >
              No results
            </Text>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const option = filteredOptions[virtualRow.index];
              return (
                <button
                  key={option.value}
                  ref={rowVirtualizer.measureElement}
                  {...doomPart("option", {
                    className: clsx(
                      styles.option,
                      isSelected(option.value) && styles.selected,
                    ),
                  })}
                  aria-pressed={isSelected(option.value)}
                  data-index={virtualRow.index}
                  data-selected={isSelected(option.value) || undefined}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  onKeyDown={(e) => handleOptionKeyDown(e, virtualRow.index)}
                >
                  {multiple && (
                    <div style={{ pointerEvents: "none" }}>
                      <Checkbox readOnly checked={isSelected(option.value)} />
                    </div>
                  )}
                  <Text
                    as="span"
                    {...doomPart("optionLabel", {
                      className: styles.optionLabel,
                    })}
                  >
                    {option.label}
                  </Text>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card.Root>
  );

  if (inline) {
    return dropdownContent;
  }

  return (
    <Popover
      content={dropdownContent}
      isOpen={isOpen}
      placement="bottom-start"
      trigger={
        <button
          aria-expanded={isOpen}
          {...doomPart("root", {
            className: clsx(
              styles.trigger,
              styles[size],
              hasValue && styles.hasValue,
              disabled && styles.disabled,
              className,
            ),
          })}
          disabled={disabled}
          type="button"
          onClick={handleOpen}
        >
          <Text
            as="span"
            {...doomPart("triggerText", { className: styles.triggerText })}
          >
            {displayText}
          </Text>
          <span
            {...doomPart("triggerIcons", { className: styles.triggerIcons })}
          >
            {hasValue && !disabled && (
              <span
                {...doomPart("clearButton", { className: styles.clearButton })}
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <ThemedIcon icon={X} iconName="close" size={12} />
              </span>
            )}
            <ThemedIcon
              icon={ChevronDown}
              iconName="chevronDown"
              {...doomPart("chevron", { className: styles.chevron })}
              size={20}
            />
          </span>
        </button>
      }
      onClose={() => {
        setIsOpen(false);
        setSearchQuery("");
      }}
    />
  );
}
