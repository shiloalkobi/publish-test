// src/app/api/projects/[projectId]/meta/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const p = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        githubInstallationId: true,
        githubRepo: true,
      },
    });
    if (!p) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({
      githubInstallationId: p.githubInstallationId ?? null,
      githubRepo: p.githubRepo ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
