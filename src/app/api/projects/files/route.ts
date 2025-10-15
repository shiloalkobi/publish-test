// src/app/api/projects/files/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getProjectFilesReal } from "@/lib/get-project-files";

export async function GET(req: NextRequest) {
  // מחזיר את כל קבצי הפרויקט (אפשר להתעלם מ‑projectId ב‑Option B)
  const files = await getProjectFilesReal();
  return NextResponse.json({ files });
}
