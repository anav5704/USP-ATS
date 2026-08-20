import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiMember } from "@/lib/jobs/require-api";
import { isSafeStoredName } from "@/lib/profile/upload";
import { deleteStoredFile, readStoredFile } from "@/lib/uploads/storage";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

async function ownedStoredNames(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      transcript: { select: { stored: true } },
      certificates: { select: { stored: true } },
    },
  });
  const names = new Set<string>();
  if (profile?.transcript) names.add(profile.transcript.stored);
  for (const certificate of profile?.certificates ?? []) {
    names.add(certificate.stored);
  }
  return names;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ storedName: string }> }
) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  const { storedName } = await context.params;
  if (!isSafeStoredName(storedName)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const referenced = await ownedStoredNames(guard.session.user.id);
  const isOwner = referenced.has(storedName);
  const isAdmin = guard.session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await readStoredFile(guard.session.user.id, storedName);
  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const extension = storedName.split(".").pop() ?? "";
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${storedName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ storedName: string }> }
) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  const { storedName } = await context.params;
  if (!isSafeStoredName(storedName)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const referenced = await ownedStoredNames(guard.session.user.id);
  if (referenced.has(storedName)) {
    return NextResponse.json(
      { error: "This file is part of your saved profile" },
      { status: 409 }
    );
  }

  await deleteStoredFile(guard.session.user.id, storedName);
  return new NextResponse(null, { status: 204 });
}