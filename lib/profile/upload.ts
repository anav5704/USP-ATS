export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 20;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const UPLOAD_EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const STORED_FILE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/;

export type UploadFileInfo = {
  name: string;
  type: string;
  size: number;
};

export type UploadValidation =
  | { ok: true }
  | { ok: false; error: string };

export function isSafeStoredName(name: string) {
  return STORED_FILE_PATTERN.test(name);
}

export function isAllowedUploadType(type: string) {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(type);
}

export function fileExtensionFor(mimeType: string) {
  return UPLOAD_EXTENSIONS[mimeType] ?? null;
}

const FORMATTED_MAX = "10 MB";

export function validateUploadFile(info: UploadFileInfo): UploadValidation {
  if (!info.name.trim()) {
    return { ok: false, error: "File name is required" };
  }
  if (info.name.length > 255) {
    return { ok: false, error: "File name is too long" };
  }
  if (!isAllowedUploadType(info.type)) {
    return {
      ok: false,
      error: "Only PDF or image files (PNG, JPEG, WebP) are allowed",
    };
  }
  if (info.size > MAX_UPLOAD_SIZE) {
    return {
      ok: false,
      error: `File must be ${FORMATTED_MAX} or smaller`,
    };
  }
  return { ok: true };
}