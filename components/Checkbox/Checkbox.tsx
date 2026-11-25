"use client";
import clsx from "clsx";
import { Check, Minus } from "lucide-react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { Label } from "../Label";
import styles from "./Checkbox.module.scss";

export interface CheckboxIndicatorContext {
  props: {
    className?: string;
    "aria-hidden": true;
    [attribute: `data-${string}`]: string | boolean | undefined;
  };
  size: number;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
}

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  classNames?: ThemeClassNames<"Checkbox">;
  label?: string;
  error?: boolean;
  indeterminate?: boolean;
  renderIndicator?: (context: CheckboxIndicatorContext) => React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      classNames,
      className,
      label,
      error,
      disabled,
      checked,
      defaultChecked,
      indeterminate,
      renderIndicator,
      onChange,
      id: propsId,
      ...props
    },
    ref,
  ) => {
    const doomPart = useThemeParts("Checkbox", classNames, {
      disabled: disabled,
    });

    const generatedId = useId();
    const id = propsId || generatedId;
    const internalRef = useRef<HTMLInputElement>(null);

    const [nativeChecked, setNativeChecked] = useState(!!defaultChecked);
    const indicatorChecked = checked ?? nativeChecked;
    const mixed = !!indeterminate && !indicatorChecked;
    const observesNative =
      checked === undefined && (!!renderIndicator || !!indeterminate);
    useEffect(() => {
      const input = internalRef.current;
      if (!input || !observesNative) {
        return;
      }
      const refresh = () => setNativeChecked(input.checked);
      refresh();
      const form = input.form;
      // Native reset restores checkedness after the reset event completes.
      let resetTimer: ReturnType<typeof setTimeout>;
      const onReset = () => {
        clearTimeout(resetTimer);
        resetTimer = setTimeout(refresh, 0);
      };
      form?.addEventListener("reset", onReset);
      return () => {
        clearTimeout(resetTimer);
        form?.removeEventListener("reset", onReset);
      };
    }, [observesNative, defaultChecked, props.form]);
    const indicatorProps = {
      ...doomPart("icon", { className: styles.icon }),
      "aria-hidden": true as const,
    };

    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
      },
      [ref],
    );

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = mixed;
      }
    }, [mixed]);

    return (
      <Label
        {...doomPart("root", {
          className: clsx(
            styles.checkboxWrapper,
            disabled && styles.disabled,
            className,
          ),
        })}
        htmlFor={id}
      >
        <input
          ref={mergedRef}
          aria-invalid={error || undefined}
          checked={checked}
          {...doomPart("checkboxInput", { className: styles.checkboxInput })}
          defaultChecked={defaultChecked}
          disabled={disabled}
          id={id}
          type="checkbox"
          onChange={(event) => {
            if (observesNative) {
              setNativeChecked(event.currentTarget.checked);
            }
            onChange?.(event);
          }}
          {...props}
        />

        <span
          aria-hidden="true"
          {...doomPart("checkboxDisplay", {
            className: clsx(styles.checkboxDisplay),
          })}
        >
          {renderIndicator ? (
            renderIndicator({
              props: indicatorProps,
              size: 24,
              checked: indicatorChecked,
              indeterminate: mixed,
              disabled: !!disabled,
            })
          ) : mixed ? (
            <ThemedIcon
              icon={Minus}
              iconName="minus"
              {...indicatorProps}
              data-testid="minus-icon"
            />
          ) : (
            <ThemedIcon icon={Check} iconName="check" {...indicatorProps} />
          )}
        </span>

        {label && (
          <span
            {...doomPart("labelOverride", { className: styles.labelOverride })}
          >
            {label}
          </span>
        )}
      </Label>
    );
  },
);

Checkbox.displayName = "Checkbox";
