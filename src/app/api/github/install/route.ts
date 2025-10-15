export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET(req: Request) {
  const slug = process.env.GITHUB_APP_SLUG;

  if (!slug) {
    return NextResponse.json(
      { error: "Missing GITHUB_APP_SLUG in .env" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") || "";

  // נשמור איזה project אנחנו מחברים ל-GitHub
  if (projectId) {
    const cookieStore = await cookies(); // ← אצלך cookies() מחזיר Promise
    cookieStore.set("publish_project_id", projectId, {
      httpOnly: true,
      secure: true,
      path: "/",
    });
  }

  const installUrl = `https://github.com/apps/${slug}/installations/new`;
  return NextResponse.redirect(installUrl);
}
