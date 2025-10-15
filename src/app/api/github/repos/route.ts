export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const installationIdStr = url.searchParams.get("installation_id");
    if (!installationIdStr) {
      return NextResponse.json(
        { error: "missing installation_id" },
        { status: 400 }
      );
    }
    const installationId = Number(installationIdStr);

    if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Missing GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY in env" },
        { status: 500 }
      );
    }

    // שים לב: מעבירים את Octokit מהחבילה @octokit/rest
    const app = new App({
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
      Octokit, // ← זה מה שמוסיף את .rest
    });

    const installationOctokit = await app.getInstallationOctokit(
      installationId
    );

    const { data } =
      await installationOctokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });

    const repos = data.repositories.map((r) => ({
      full_name: r.full_name,
      default_branch: r.default_branch,
      private: r.private,
    }));

    return NextResponse.json({ repos });
  } catch (err: any) {
    console.error("repos handler error:", err);
    return NextResponse.json(
      { error: err?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
