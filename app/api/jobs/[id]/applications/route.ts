import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import {
  AdminApplicantsNotFoundError,
  getAdminApplicants,
} from "@/lib/applications/admin-applicants-queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    return NextResponse.json(await getAdminApplicants(id));
  } catch (error) {
    if (error instanceof AdminApplicantsNotFoundError) {
      return NextResponse.json(
        { error: "Job posting not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Unable to load applicants" },
      { status: 500 }
    );
  }
}
