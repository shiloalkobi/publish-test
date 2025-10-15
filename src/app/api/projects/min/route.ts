export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "missing projectId" }, { status: 400 });
  }

  const p = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      githubInstallationId: true,
      githubRepo: true,
      lastDeploymentUrl: true,
    },
  });
  if (!p)
    return NextResponse.json({ error: "project not found" }, { status: 404 });

  return NextResponse.json({
    installationId: p.githubInstallationId ?? null,
    repo: p.githubRepo ?? null,
    lastDeploymentUrl: p.lastDeploymentUrl ?? null,
  });
}
