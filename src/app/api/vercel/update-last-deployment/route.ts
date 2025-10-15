// src/app/api/vercel/update-last-deployment/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * בונה את הדומיין הקבוע של פרויקט ב-Vercel מתוך שם ה-app.
 * לדוגמה: app="publish-test" => https://publish-test.vercel.app
 */
function buildCanonicalUrl(app: string) {
  const host = `${app}.vercel.app`;
  return `https://${host}`;
}

/**
 * Body options:
 * - projectId?: string  ← אם ניתן, נשלוף ממנו githubRepo כדי לגזור את שם ה-app
 * - app?: string        ← שם ה-app ב-Vercel (מומלץ אם ידוע)
 * - repo?: string       ← "owner/repo" (נשתמש בשם אחרי ה-/ כשם ה-app)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      app?: string;
      repo?: string;
    };

    // 1) נקבע appName לפי סדר עדיפויות: app מפורש → repo → DB (projectId → githubRepo)
    let appName = body.app?.trim();

    if (!appName && body.repo) {
      const parts = body.repo.split("/");
      appName = parts[1]?.trim();
    }

    if (!appName && body.projectId) {
      const p = await prisma.project.findUnique({
        where: { id: body.projectId },
        select: { githubRepo: true },
      });
      const repoFull = p?.githubRepo ?? undefined; // "owner/name"
      if (repoFull) {
        const parts = repoFull.split("/");
        appName = parts[1]?.trim();
      }
    }

    if (!appName) {
      return NextResponse.json(
        {
          error:
            "Could not infer Vercel app name. Pass `app` in body or ensure `githubRepo` exists for the project.",
        },
        { status: 400 }
      );
    }

    // 2) נבנה את ה-Production URL הקבוע (לא preview)
    const finalUrl = buildCanonicalUrl(appName);

    // אופציונלי: בדיקת HEAD אם כבר יש דפלוימנט פרודקשן חי (לא חובה)
    // אם לא קיים עדיין דפלוימנט פרודקשן, ה-URL יחזיר 404 עד שתמזג ל-main.
    try {
      await fetch(finalUrl, { method: "HEAD", cache: "no-store" });
    } catch {
      // מתעלמים משגיאות רשת; עדיין נשמור את ה-URL הקבוע.
    }

    // 3) נשמור ל-DB אם הגיע projectId
    if (body.projectId) {
      await prisma.project.update({
        where: { id: body.projectId },
        data: { lastDeploymentUrl: finalUrl },
      });
    }

    return NextResponse.json({
      ok: true,
      app: appName,
      url: finalUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
