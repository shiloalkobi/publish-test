import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const installation_id = searchParams.get("installation_id");
  const setup_action = searchParams.get("setup_action");

  if (!installation_id) {
    return NextResponse.json(
      { success: false, message: "Missing installation_id" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  // עדיפות ל-projectId ששמרנו ב-cookie ב-/api/github/install
  const projectIdFromCookie = cookieStore.get("publish_project_id")?.value;
  // אופציונלי: לאפשר גם לקבל projectId ישירות בפרמטרים
  const projectIdFromQuery = searchParams.get("projectId") || undefined;
  const projectId = projectIdFromCookie || projectIdFromQuery;

  if (projectId) {
    await prisma.project.update({
      where: { id: projectId },
      data: { githubInstallationId: String(installation_id) },
    });
  }

  return NextResponse.json({
    success: true,
    message: "GitHub App installed successfully",
    installation_id,
    setup_action,
    projectId: projectId ?? null,
  });
}
