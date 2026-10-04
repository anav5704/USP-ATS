import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { isSafeStoredName } from "@/lib/profile/upload";
import { R2_BUCKET, r2 } from "@/lib/uploads/r2";

type RouteParams = {
  params: Promise<{
    id: string;
    applicationId: string;
    storedName: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: jobId, applicationId, storedName } = await params;
  if (!isSafeStoredName(storedName)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, jobId },
    select: {
      studentId: true,
      student: {
        select: {
          profile: {
            select: {
              degrees: {
                where: { stored: storedName },
                select: { fileName: true, type: true },
              },
              certificates: {
                where: { stored: storedName },
                select: { name: true, type: true },
              },
            },
          },
        },
      },
    },
  });

  const degree = application?.student.profile?.degrees[0];
  const certificate = application?.student.profile?.certificates[0];
  const file = degree
    ? { name: degree.fileName, type: degree.type }
    : certificate
      ? { name: certificate.name, type: certificate.type }
      : null;

  if (!application || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const response = await r2.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: `profiles/${application.studentId}/${storedName}`,
      })
    );
    if (!response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(response.Body.transformToWebStream(), {
      headers: {
        "Content-Type": file.type || response.ContentType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(
          file.name
        )}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
