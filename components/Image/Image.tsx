"use client";
import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./Image.module.scss";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  classNames?: ThemeClassNames<"Image">;
  fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  fallbackSrc?: string;
  aspectRatio?: string | number;
  rounded?: boolean;
}

const toCssValue = (val: string | number | undefined) => {
  if (val === undefined || val === null) {
    return undefined;
  }
  if (typeof val === "number") {
    return `${val}px`;
  }
  return val;
};

// HTML intrinsic dimensions are pixels; CSS lengths such as rem must never be
// parsed as pixel attributes or compared with a dimension in a different unit.
const getDimension = (val: string | number | undefined) => {
  if (typeof val === "number") {
    return Number.isFinite(val) && val >= 0
      ? { value: val, unit: "px" }
      : undefined;
  }
  const match = val
    ?.trim()
    .match(/^(\d+(?:\.\d+)?)(px|rem|em|vw|vh|dvw|dvh)?$/);
  return match
    ? { value: Number(match[1]), unit: match[2] || "px" }
    : undefined;
};

const getIntrinsicSize = (val: string | number | undefined) => {
  const dimension = getDimension(val);
  return dimension?.unit === "px" ? dimension.value : undefined;
};

const ImageStatus = {
  Loading: "loading",
  Loaded: "loaded",
  Error: "error",
} as const;

type ImageStatusType = (typeof ImageStatus)[keyof typeof ImageStatus];

export function Image({
  classNames,
  src,
  alt,
  className,
  fit,
  style,
  onLoad,
  onError,
  fallbackSrc,
  aspectRatio,
  rounded = true,
  width,
  height,
  ...props
}: ImageProps) {
  const doomPart = useThemeParts("Image", classNames, {});

  const [status, setStatus] = useState<ImageStatusType>(ImageStatus.Loading);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const [storedSrc, setStoredSrc] = useState(src);

  // Render-time state update to avoid flash of broken image
  if (src !== storedSrc) {
    setStoredSrc(src);
    setStatus(ImageStatus.Loading);
    setShowSkeleton(true);
  }

  const computedAspectRatio = useMemo(() => {
    if (aspectRatio) {
      return aspectRatio;
    }
    const w = getDimension(width);
    const h = getDimension(height);
    return w && h && w.value > 0 && h.value > 0 && w.unit === h.unit
      ? `${w.value} / ${h.value}`
      : undefined;
  }, [aspectRatio, width, height]);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setStatus(ImageStatus.Loaded);
    }
  }, []);

  // When loaded, keep skeleton for a moment to allow cross-fade
  useEffect(() => {
    if (status === ImageStatus.Loaded) {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 500); // 500ms delay to allow image to fade in completely
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleLoad = useCallback(
    async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      onLoad?.(e);
      const img = e.currentTarget;
      try {
        if (img.decode) {
          await img.decode();
        }
      } catch (_error) {
        // ignore decode errors (e.g. invalid image data)
      } finally {
        setStatus(ImageStatus.Loaded);
      }
    },
    [onLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (fallbackSrc && status !== ImageStatus.Error) {
        // Prevents infinite loop if fallback also fails
        if (e.currentTarget.src !== fallbackSrc) {
          e.currentTarget.src = fallbackSrc;
          return;
        }
      }
      setStatus(ImageStatus.Error);
      setShowSkeleton(false); // Remove skeleton immediately on error
      onError?.(e);
    },
    [fallbackSrc, status, onError],
  );

  return (
    <div
      {...doomPart("root", {
        className: clsx(styles.wrapper, rounded && styles.rounded, className),
      })}
      style={{
        aspectRatio: computedAspectRatio,
        width: toCssValue(width),
        height: toCssValue(height),
        ...style,
      }}
    >
      {/* Skeleton Layer */}
      <div
        aria-hidden="true"
        {...doomPart("skeletonLayer", {
          className: clsx(
            styles.skeletonLayer,
            status === ImageStatus.Loaded && styles.fadeOut,
          ),
        })}
      >
        {showSkeleton && (
          <Skeleton
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </div>

      {/* Image Layer */}
      {src && (
        <img
          ref={imgRef}
          alt={alt}
          {...doomPart("image", {
            className: clsx(
              styles.image,
              fit && styles[`fit-${fit}`],
              status === ImageStatus.Loaded ? styles.visible : styles.hidden,
            ),
          })}
          height={getIntrinsicSize(height)}
          src={src}
          width={getIntrinsicSize(width)}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
        />
      )}
    </div>
  );
}
