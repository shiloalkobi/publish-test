export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { projectId, repo } = (await req.json()) as {
    projectId?: string;
    repo?: string;
  };

  if (!projectId || !repo) {
    return NextResponse.json(
      { error: "projectId and repo are required" },
      { status: 400 }
    );
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { githubRepo: repo },
  });

  return NextResponse.json({ ok: true });
}
