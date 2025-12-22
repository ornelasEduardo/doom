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
import { Stack, Flex } from "../Layout/Layout";
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
    >
      <div
        className={clsx(styles.header, {
          [styles.errorHeader]: status === Status.Error,
          [styles.disabledHeader]: disabled,
        })}
      >
        <Text className={styles.headerTitle}>
          <Flex align="flex-start">
            {status === Status.Error ? displayError : label || "Upload Files"}
            {required && !displayError && (
              <Asterisk size={16} aria-label="required" />
            )}
          </Flex>
        </Text>
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
        >
          {status === Status.HasFiles
            ? `${files.length} selected`
            : isVoid
            ? "Awaiting upload..."
            : disabled
            ? "Disabled"
            : "Ready"}
        </Badge>
      </div>

      <div
        className={clsx(styles.body, {
          [styles.hasFiles]: hasFiles,
          [styles.dragging]: isDragging || forceActive,
          [styles.disabled]: disabled,
          [styles.error]: !!displayError,
        })}
        onClick={handleClick}
        {...handleDragHandlers}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className={styles.hiddenInput}
          aria-label="File upload input"
        />

        {!hasFiles ? (
          <Stack
            gap="var(--spacing-md)"
            align="center"
            className={styles.emptyState}
          >
            <div className={styles.voidIconWrapper}>
              <Upload className={styles.icon} size={48} strokeWidth={2} />
            </div>
            <Stack gap="var(--spacing-xs)" align="center">
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
              <Text variant="small" className={styles.helperText}>
                {helperText}
              </Text>
            )}
          </Stack>
        ) : (
          <Flex
            direction="column"
            justify="space-between"
            gap="var(--spacing-md)"
            className={styles.fileList}
          >
            <Stack gap="var(--spacing-sm)">
              {files.map((file, index) => {
                const previewUrl = previews[file.name];
                return (
                  <Slat
                    key={`${file.name}-${index}`}
                    label={file.name}
                    secondaryLabel={formatFileSize(file.size)}
                    prependContent={
                      previewUrl ? (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            overflow: "hidden",
                            border: "1px solid var(--border-strong)",
                          }}
                        >
                          <img
                            src={previewUrl}
                            alt={file.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ) : (
                        getFileIcon(file.name)
                      )
                    }
                    appendContent={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className={styles.removeButton}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={16} />
                      </button>
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
