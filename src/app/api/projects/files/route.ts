export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getProjectFilesReal } from "@/lib/get-project-files";

export async function GET(req: NextRequest) {
  try {
    // שומרים התאמה לארגומנט projectId אם ה-UI שולח, אבל לא חייבים אותו בשביל איסוף מהדיסק
    const files = await getProjectFilesReal();
    return NextResponse.json({ files }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "failed collecting files" },
      { status: 500 }
    );
  }
}
