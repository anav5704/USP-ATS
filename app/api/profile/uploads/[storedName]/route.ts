import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiMember } from "@/lib/jobs/require-api";
import { isSafeStoredName } from "@/lib/profile/upload";
import { deleteStoredFile } from "@/lib/uploads/storage";
import { R2_BUCKET, r2 } from "@/lib/uploads/r2";

async function ownedStoredNames(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      degrees: { select: { stored: true } },
      certificates: { select: { stored: true } },
    },
  });
  const names = new Set<string>();
  for (const degree of profile?.degrees ?? []) {
    names.add(degree.stored);
  }
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

  const key = `profiles/${guard.session.user.id}/${storedName}`;
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );
    if (!res.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const stream = res.Body.transformToWebStream();
    return new NextResponse(stream, {
      headers: {
        "Content-Type": res.ContentType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${storedName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
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