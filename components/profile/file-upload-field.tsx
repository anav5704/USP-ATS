"use client";

import { useRef, useState } from "react";
import { Button, toast } from "@heroui/react";
import { DownloadIcon, EyeIcon, FileTextIcon, LoaderCircleIcon, UploadIcon, XIcon } from "lucide-react";
import type { FileRef } from "@/lib/profile/profile-schema";
import { FormField } from "@/components/ui/form-field";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { useUploadProfileFiles } from "@/components/profile/use-upload";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

export function FileUploadField({
  label,
  id,
  value,
  onChange,
  error,
}: {
  label: string;
  id?: string;
  value: FileRef | null;
  onChange: (value: FileRef | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadAsync } = useUploadProfileFiles();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePreview = async (stored: string, type: string) => {
    setIsPreviewing(true);
    try {
      const res = await fetch(`/api/profile/uploads/${stored}`);
      if (!res.ok) {
        toast.danger("Unable to preview file. Please try again.");
        return;
      }
      const buffer = await res.arrayBuffer();
      const mime =
        type || res.headers.get("Content-Type") || "application/pdf";
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast.danger("Your browser blocked the preview tab.");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.danger("Unable to preview file. Please try again.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownload = async (stored: string, name: string) => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/profile/uploads/${stored}`);
      if (!res.ok) {
        toast.danger("Unable to download file. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.danger("Unable to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const [ref] = await uploadAsync([file]);
      if (ref) onChange(ref);
    } catch {
      // error toast is shown by useUploadProfileFiles
    }
  };

  return (
    <FormField label={label} id={id} error={error}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => void handleSelect(event)}
      />
      <Button.Root
        type="button"
        variant="outline"
        isDisabled={isUploading}
        onPress={() => inputRef.current?.click()}
        className="w-full rounded-field border-border bg-surface text-foreground"
      >
        {isUploading ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <UploadIcon className="size-4" />
        )}
        {value ? "Replace file" : "Choose file"}
      </Button.Root>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-field p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-muted">
            <FileTextIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {value.name}
            </p>
            <p className="text-xs text-muted">
              {formatFileSize(value.size)} (PDF or image)
            </p>
          </div>
          <IconTooltip label="Preview file">
            <button
              type="button"
              aria-label={`Preview ${value.name}`}
              disabled={isPreviewing}
              onClick={() => void handlePreview(value.stored, value.type)}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground disabled:cursor-default"
            >
              {isPreviewing ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </IconTooltip>
          <IconTooltip label="Download file">
            <button
              type="button"
              aria-label={`Download ${value.name}`}
              disabled={isDownloading}
              onClick={() => void handleDownload(value.stored, value.name)}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground disabled:cursor-default"
            >
              {isDownloading ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
            </button>
          </IconTooltip>
          <IconTooltip label="Remove file">
            <button
              type="button"
              aria-label={`Remove ${value.name}`}
              onClick={() => onChange(null)}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-danger"
            >
              <XIcon className="size-4" />
            </button>
          </IconTooltip>
        </div>
      ) : null}
    </FormField>
  );
}