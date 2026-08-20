import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_UPLOAD_SIZE,
  isAllowedUploadType,
  isSafeStoredName,
  validateUploadFile,
} from "@/lib/profile/upload";

describe("validateUploadFile type and size validation", () => {
  it("accepts a PDF under the size limit", () => {
    const result = validateUploadFile({
      name: "transcript.pdf",
      type: "application/pdf",
      size: MAX_UPLOAD_SIZE,
    });
    assert.deepEqual(result, { ok: true });
  });

  it("accepts images (PNG, JPEG, WebP)", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      assert.deepEqual(
        validateUploadFile({ name: "photo", type, size: 1024 }),
        { ok: true }
      );
    }
  });

  it("rejects files over the 10 MB limit", () => {
    const result = validateUploadFile({
      name: "big.pdf",
      type: "application/pdf",
      size: MAX_UPLOAD_SIZE + 1,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /MB/);
    }
  });

  it("rejects unsupported file types", () => {
    for (const type of [
      "application/x-msdownload",
      "text/plain",
      "application/zip",
      "application/msword",
      "",
    ]) {
      if (!isAllowedUploadType(type)) {
        assert.equal(
          validateUploadFile({ name: "file.bin", type, size: 1024 }).ok,
          false
        );
      }
    }
  });

  it("rejects empty or overly long file names", () => {
    assert.equal(
      validateUploadFile({ name: " ", type: "application/pdf", size: 1024 }).ok,
      false
    );
    assert.equal(
      validateUploadFile({
        name: "a".repeat(256),
        type: "application/pdf",
        size: 1024,
      }).ok,
      false
    );
  });
});

describe("stored file name safety", () => {
  it("accepts generated UUID names", () => {
    assert.equal(
      isSafeStoredName("123e4567-e89b-12d3-a456-426614174000.pdf"),
      true
    );
  });

  it("rejects path traversal and unexpected names", () => {
    assert.equal(isSafeStoredName("../profile/route.ts"), false);
    assert.equal(isSafeStoredName("../../etc/passwd"), false);
    assert.equal(isSafeStoredName("hello.pdf"), false);
    assert.equal(isSafeStoredName(""), false);
  });
});