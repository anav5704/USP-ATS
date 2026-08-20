import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireApiMember } from "@/lib/jobs/require-api";
import {
  MAX_UPLOAD_COUNT,
  fileExtensionFor,
  validateUploadFile,
} from "@/lib/profile/upload";
import { saveUploadFile } from "@/lib/uploads/storage";

export async function POST(request: NextRequest) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const files = form
    .getAll("files")
    .filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_UPLOAD_COUNT) {
    return NextResponse.json(
      { error: `You can upload up to ${MAX_UPLOAD_COUNT} files at a time` },
      { status: 400 }
    );
  }

  const uploaded = [];
  for (const file of files) {
    const type = file.type || "application/pdf";
    const validation = validateUploadFile({
      name: file.name,
      type,
      size: file.size,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const extension = fileExtensionFor(type);
    if (!extension) {
      return NextResponse.json(
        { error: "Only PDF or image files (PNG, JPEG, WebP) are allowed" },
        { status: 400 }
      );
    }
    const stored = `${randomUUID()}${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveUploadFile({
      userId: guard.session.user.id,
      storedName: stored,
      buffer,
    });
    uploaded.push({ name: file.name, stored, type, size: file.size });
  }

  return NextResponse.json({ files: uploaded });
}