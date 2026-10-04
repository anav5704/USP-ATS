import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiMember } from "@/lib/jobs/require-api";
import { isSafeStoredName } from "@/lib/profile/upload";
import { deleteStoredFile } from "@/lib/uploads/storage";
import { R2_BUCKET, r2 } from "@/lib/uploads/r2";

const FALLBACK_MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function fallbackMimeFor(storedName: string) {
  const dot = storedName.lastIndexOf(".");
  const extension = dot >= 0 ? storedName.slice(dot).toLowerCase() : "";
  return FALLBACK_MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

async function findFileOwner(storedName: string) {
  const degree = await prisma.degree.findFirst({
    where: { stored: storedName },
    select: { fileName: true, type: true, profile: { select: { userId: true } } },
  });
  if (degree) {
    return {
      userId: degree.profile.userId,
      name: degree.fileName,
      type: degree.type,
    };
  }
  const certificate = await prisma.certificate.findFirst({
    where: { stored: storedName },
    select: { name: true, type: true, profile: { select: { userId: true } } },
  });
  if (certificate) {
    return {
      userId: certificate.profile.userId,
      name: certificate.name,
      type: certificate.type,
    };
  }
  return null;
}

async function ownedStoredFile(userId: string, storedName: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      degrees: {
        where: { stored: storedName },
        select: { stored: true, fileName: true, type: true },
      },
      certificates: {
        where: { stored: storedName },
        select: { stored: true, name: true, type: true },
      },
    },
  });
  const degree = profile?.degrees[0];
  if (degree) {
    return { name: degree.fileName, type: degree.type };
  }
  const certificate = profile?.certificates[0];
  if (certificate) {
    return { name: certificate.name, type: certificate.type };
  }
  return null;
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

  const owned = await ownedStoredFile(guard.session.user.id, storedName);

  const serveKey = async (userId: string, name: string, type: string | null) => {
    try {
      const res = await r2.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: `profiles/${userId}/${storedName}`,
        })
      );
      if (!res.Body) return null;
      const stream = res.Body.transformToWebStream();
      const contentType =
        type || res.ContentType || fallbackMimeFor(storedName);
      return new NextResponse(stream, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch {
      return null;
    }
  };

  // Own files, including fresh uploads not yet saved to the profile.
  const own = await serveKey(
    guard.session.user.id,
    owned?.name || storedName,
    owned?.type ?? null
  );
  if (own) return own;

  // Admin fallback: locate the owning profile for already-saved files.
  if (guard.session.user.role === "admin") {
    const owner = await findFileOwner(storedName);
    if (owner) {
      const file = await serveKey(owner.userId, owner.name, owner.type);
      if (file) return file;
    }
  }

  return NextResponse.json({ error: "File not found" }, { status: 404 });
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

  const referenced = await ownedStoredFile(guard.session.user.id, storedName);
  if (referenced !== null) {
    return NextResponse.json(
      { error: "This file is part of your saved profile" },
      { status: 409 }
    );
  }

  await deleteStoredFile(guard.session.user.id, storedName);
  return new NextResponse(null, { status: 204 });
}