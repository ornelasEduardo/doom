"use client";

import React, {
  useRef,
  useState,
  DragEvent,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import styles from "./FileUpload.module.scss";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Stack, Flex, Switcher } from "../Layout/Layout";
import { Badge } from "../Badge/Badge";
import { Slat } from "../Slat/Slat";
import {
  Upload,
  File as FileIcon,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileText,
  FileSpreadsheet,
  Asterisk,
  X,
} from "lucide-react";
import { Skeleton } from "../Skeleton/Skeleton";
import { Image } from "../Image/Image";
import clsx from "clsx";

const enum Status {
  Disabled = "disabled",
  Error = "error",
  Void = "void",
  HasFiles = "hasFiles",
  Idle = "idle",
}

export interface FileUploadProps {
  /** Label for the file upload */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Accepted file types (e.g., "image/*", ".pdf,.doc") */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Initial files to show */
  defaultFiles?: File[];
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Required field */
  required?: boolean;
  /** Show image previews for supported file types */
  showPreview?: boolean;
  /** Callback when files are selected */
  onChange?: (files: File[]) => void;
  /** Custom class name */
  className?: string;
  /** Force active/void state for debugging */
  forceActive?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  helperText,
  accept,
  maxSize,
  multiple = false,
  defaultFiles = [],
  disabled = false,
  error = false,
  errorMessage,
  required = false,
  showPreview = false,
  onChange,
  className = "",
  forceActive = false,
}) => {
  const [files, setFiles] = useState<File[]>(defaultFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const previewsRef = useRef<Record<string, string>>({});

  // Keep ref in sync for unmount cleanup
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, []);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const size = 20;

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || ""))
      return <FileImage size={size} />;
    if (["mp4", "mov", "avi", "mkv", "webm", "flv"].includes(ext || ""))
      return <FileVideo size={size} />;
    if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext || ""))
      return <FileAudio size={size} />;
    if (
      [
        "js",
        "ts",
        "jsx",
        "tsx",
        "html",
        "css",
        "json",
        "py",
        "java",
        "cpp",
        "c",
        "go",
      ].includes(ext || "")
    )
      return <FileCode size={size} />;
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || ""))
      return <FileArchive size={size} />;
    if (["pdf"].includes(ext || "")) return <FileText size={size} />;
    if (["xls", "xlsx", "csv", "ods"].includes(ext || ""))
      return <FileSpreadsheet size={size} />;

    return <FileIcon size={size} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const generatePreview = useCallback(
    (file: File) => {
      if (showPreview && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviews((prev) => ({
          ...prev,
          [file.name]: url,
        }));
      }
    },
    [showPreview]
  );

  const validateFiles = (fileList: FileList | null): File[] => {
    if (!fileList) return [];
    const validFiles: File[] = [];
    setUploadError("");

    Array.from(fileList).forEach((file) => {
      if (maxSize && file.size > maxSize) {
        setUploadError(
          `File "${file.name}" exceeds maximum size of ${formatFileSize(
            maxSize
          )}`
        );
        return;
      }
      validFiles.push(file);
      generatePreview(file);
    });

    return validFiles;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(event.target.files);
    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onChange?.(newFiles);
    }
  };

  const handleDragHandlers = {
    onDragEnter: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      // Check if we're moving to a child element
      if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
      }
      setIsDragging(false);
    },
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        const newFiles = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(newFiles);
        onChange?.(newFiles);
      }
    },
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove) {
      const key = fileToRemove.name;
      if (previews[key]) {
        URL.revokeObjectURL(previews[key]);
        const newPreviews = { ...previews };
        delete newPreviews[key];
        setPreviews(newPreviews);
      }
    }
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(newFiles);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClick = () => {
    if (!disabled) {
      setIsActive(true);
      inputRef.current?.click();
      const handleFocus = () => {
        setIsActive(false);
        window.removeEventListener("focus", handleFocus);
      };
      window.addEventListener("focus", handleFocus);
    }
  };

  const displayError = error && errorMessage ? errorMessage : uploadError;
  const hasFiles = files.length > 0;
  const isVoid = (isDragging || isActive || forceActive) && !hasFiles;

  const status = useMemo(() => {
    if (disabled) return Status.Disabled;
    if (displayError) return Status.Error;
    if (isVoid) return Status.Void;
    if (hasFiles) return Status.HasFiles;
    return Status.Idle;
  }, [disabled, displayError, isVoid, hasFiles]);

  return (
    <div
      className={clsx(styles.window, className, {
        [styles.void]: isVoid,
        [styles.disabled]: disabled,
      })}
      {...handleDragHandlers}
    >
      <Switcher
        threshold="xxs"
        className={clsx(styles.header, {
          [styles.errorHeader]: status === Status.Error,
          [styles.disabledHeader]: disabled,
        })}
        justify="space-between"
        align="center"
        gap={2}
      >
        <div className={styles.headerContent}>
          <Text className={styles.headerTitle} id="upload-title">
            {label || "Upload Files"}
            {required && (
              <span className={styles.requiredMark}>
                <Asterisk size={14} aria-label="required" />
              </span>
            )}
          </Text>
        </div>
        <Badge
          variant={
            status === Status.Error
              ? "error"
              : status === Status.HasFiles
              ? "success"
              : isVoid
              ? "primary"
              : "secondary"
          }
          role="status"
          aria-live="polite"
        >
          {status === Status.Error
            ? "Error"
            : status === Status.HasFiles
            ? `${files.length} selected`
            : isVoid
            ? "Waiting..."
            : disabled
            ? "Disabled"
            : "Ready"}
        </Badge>
      </Switcher>

      <div
        className={clsx(styles.body, {
          [styles.hasFiles]: hasFiles,
          [styles.dragging]: isDragging || forceActive,
          [styles.disabled]: disabled,
          [styles.error]: !!displayError,
        })}
      >
        <div className={styles.starField} aria-hidden="true" />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className={styles.hiddenInput}
          aria-label="File upload input"
          aria-required={required}
          aria-invalid={!!displayError}
          aria-describedby={clsx({
            "upload-helper": !!helperText,
            "upload-error": !!displayError,
          })}
        />

        {!hasFiles ? (
          <div
            className={styles.emptyState}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
            role="button"
            tabIndex={disabled ? -1 : 0}
          >
            <Stack gap={4} align="center">
              <div className={styles.voidIconWrapper} aria-hidden="true">
                <Upload className={styles.icon} size={48} strokeWidth={2} />
              </div>
              <Stack gap={1} align="center">
                <Text weight="bold" className={styles.voidText}>
                  {isDragging || isActive || forceActive
                    ? "Drop files now"
                    : "Drag and drop files"}
                </Text>
                <Text variant="small" className={styles.secondary}>
                  or click to browse
                </Text>
              </Stack>
              {helperText && (
                <Text
                  variant="small"
                  className={styles.helperText}
                  id="upload-helper"
                >
                  {helperText}
                </Text>
              )}
              {displayError && (
                <Text
                  variant="small"
                  className={styles.errorText}
                  id="upload-error"
                >
                  {displayError}
                </Text>
              )}
            </Stack>
          </div>
        ) : (
          <Flex
            direction="column"
            justify="space-between"
            gap={4}
            className={styles.fileList}
          >
            <Stack gap={2}>
              {files.map((file, index) => {
                const previewUrl = previews[file.name];
                return (
                  <Slat
                    key={`${file.name}-${index}`}
                    label={file.name}
                    secondaryLabel={formatFileSize(file.size)}
                    prependContent={
                      previewUrl ? (
                        <PreviewImage src={previewUrl} alt={file.name} />
                      ) : (
                        getFileIcon(file.name)
                      )
                    }
                    appendContent={
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className={styles.removeButton}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={16} aria-hidden="true" />
                      </Button>
                    }
                  />
                );
              })}
            </Stack>

            {multiple && (
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClick();
                }}
              >
                UPLOAD MORE FILES
              </Button>
            )}
          </Flex>
        )}
      </div>
    </div>
  );
};

const PreviewImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  return (
    <div className={styles.previewWrapper}>
      <Image
        src={src}
        alt={
          alt
            .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, "")
            .replace(/[-_]/g, " ") || "File preview"
        }
        className={styles.previewImg}
        fit="cover"
        rounded={false}
      />
    </div>
  );
};
