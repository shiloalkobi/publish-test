// src/app/api/projects/files/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getProjectFilesReal } from "@/lib/get-project-files";

export async function GET(req: NextRequest) {
  // במקרה זה, אנחנו פשוט לוקחים את כל קבצי הפרויקט הקיים מהדיסק
  const files = await getProjectFilesReal();
  return NextResponse.json({ files });
}
