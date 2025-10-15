// src/app/api/github/publish/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { App } from "@octokit/app";
import { prisma } from "@/lib/db";

/** JSON helper */
function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

/** --------- עזרים לקבצים / סקפולד ובטיחות --------- */

/** מפחית JSON של קבצים לצורה שטוחה path -> content */
type FilesMap = Record<string, string>;
function flattenFiles(input: any, prefix = ""): FilesMap {
  const out: FilesMap = {};
  if (!input) return out;

  // אם זה כבר מיפוי שטוח של path->string
  if (typeof input === "object" && !Array.isArray(input)) {
    let looksFlat = true;
    for (const v of Object.values(input)) {
      if (v && typeof v === "object") {
        looksFlat = false;
        break;
      }
    }
    if (looksFlat) return input as FilesMap;
  }

  // טיפול באובייקט מקונן או באייטמים עם { content }
  for (const [k, v] of Object.entries(input)) {
    const path = prefix ? `${prefix}/${k}` : k;
    if (v && typeof v === "object" && !("content" in (v as any))) {
      Object.assign(out, flattenFiles(v, path));
    } else {
      out[path] = typeof v === "string" ? v : (v as any)?.content ?? "";
    }
  }
  return out;
}

/** *** שינוי חשוב: ניקוי package.json כדי למנוע נפילת build על Prisma ולמנוע כפיית React 19 */
function sanitizePackageJson(src: string): string {
  try {
    const pkg = JSON.parse(src);

    // 1) מסיר סקריפט postinstall שרץ prisma generate
    if (
      pkg.scripts?.postinstall &&
      /prisma\s+generate/.test(pkg.scripts.postinstall)
    ) {
      delete pkg.scripts.postinstall;
    }

    // 2) מסיר תלות ב-prisma וב-@prisma/client אם יש (לא חובה בקוד שרץ ב-Vercel ללא schema)
    for (const depField of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
    ]) {
      if (pkg[depField]) {
        if ("prisma" in pkg[depField]) delete pkg[depField]["prisma"];
        if ("@prisma/client" in pkg[depField])
          delete pkg[depField]["@prisma/client"];
      }
    }

    // 3) אל נכפה React 19. נשאיר את מה שיש. אם אין בכלל, נשלים ב-scfaffoldIfNeeded.
    return JSON.stringify(pkg, null, 2);
  } catch {
    // במקרה של JSON לא תקין — לא נוגעים
    return src;
  }
}

/** *** שינוי: סקפולד מינימלי שלא כופה React 19 ולא מכניס Prisma */
function scaffoldIfNeeded(files: FilesMap): FilesMap {
  const out: FilesMap = { ...files };

  // package.json — אם אין בכלל, נבנה מינימלי ותואם React 18
  if (!out["package.json"]) {
    out["package.json"] = JSON.stringify(
      {
        name: "published-app",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: {
          next: "latest",
          react: "^18.3.1",
          "react-dom": "^18.3.1",
        },
      },
      null,
      2
    );
  }

  // tsconfig.json — אם חסר, נשלים מינימלי נפוץ
  if (!out["tsconfig.json"]) {
    out["tsconfig.json"] = JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          jsx: "preserve",
          baseUrl: ".",
          paths: { "@/*": ["src/*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"],
      },
      null,
      2
    );
  }

  // next.config.* — אם חסר, next.config.ts מינימלי
  if (
    !out["next.config.mjs"] &&
    !out["next.config.ts"] &&
    !out["next.config.js"]
  ) {
    out["next.config.ts"] =
      'import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n';
  }

  // layout.tsx בסיסי אם חסר
  if (!out["src/app/layout.tsx"] && !out["app/layout.tsx"]) {
    out[
      "src/app/layout.tsx"
    ] = `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}`;
  }

  // page.tsx בסיסי אם חסר
  if (!out["src/app/page.tsx"] && !out["app/page.tsx"]) {
    out[
      "src/app/page.tsx"
    ] = `export default function Page(){return <h1>Hello from Publish</h1>}`;
  }

  // *** שינוי: אל תכלול קבצי Prisma בשום מצב בפרסום
  for (const k of Object.keys(out)) {
    if (k.startsWith("prisma/") || k.endsWith(".prisma")) {
      delete out[k];
    }
  }

  // *** שינוי: אם יש package.json, ננקה אותו (הסרת postinstall + תלות ב-Prisma, לא לכפות React 19)
  if (out["package.json"]) {
    out["package.json"] = sanitizePackageJson(out["package.json"]);
  }

  return out;
}

/** אם הרפו ריק – יוצר README וענף base */
async function ensureBranchExists(
  octo: any,
  owner: string,
  repo: string,
  baseBranch = "main"
) {
  try {
    await octo.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    return; // קיים
  } catch (e: any) {
    if (e?.status !== 404) throw e;
  }

  // קומיט ראשון
  const { data: blob } = await octo.request(
    "POST /repos/{owner}/{repo}/git/blobs",
    { owner, repo, content: "# Initial commit\n", encoding: "utf-8" }
  );

  const { data: tree } = await octo.request(
    "POST /repos/{owner}/{repo}/git/trees",
    {
      owner,
      repo,
      tree: [
        { path: "README.md", mode: "100644", type: "blob", sha: blob.sha },
      ],
    }
  );

  const { data: commit } = await octo.request(
    "POST /repos/{owner}/{repo}/git/commits",
    { owner, repo, message: "chore: initial commit", tree: tree.sha }
  );

  await octo.request("POST /repos/{owner}/{repo}/git/refs", {
    owner,
    repo,
    ref: `refs/heads/${baseBranch}`,
    sha: commit.sha,
  });
}

/** --------- ה-Handler הראשי --------- */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      installation_id?: number;
      repo?: string; // "owner/name"
      files?: Record<string, string>; // אופציונלי: אם FE כבר שולח קבצים
    };

    let { projectId, installation_id, repo, files } = body || {};

    // 0) ולידציית ENV
    const APP_ID = process.env.GITHUB_APP_ID;
    const PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!APP_ID || !PRIVATE_KEY) {
      return json(
        { error: "Missing env: GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY" },
        500
      );
    }

    // 1) אם הגיע רק projectId – נשלים installation/repo מתוך ה־DB
    if (projectId && (!installation_id || !repo)) {
      const p = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          githubInstallationId: true,
          githubRepo: true,
        },
      });

      if (!p) return json({ error: "Project not found" }, 404);
      if (!installation_id && p.githubInstallationId)
        installation_id = Number(p.githubInstallationId);
      if (!repo && p.githubRepo) repo = p.githubRepo;
    }

    // 2) חייבים כאן installation_id + repo
    if (!installation_id || !repo) {
      return json(
        {
          error:
            "installation_id and repo are required (either in body or fetched via projectId).",
        },
        400
      );
    }

    // 3) אם לא הגיעו files מה-FE – נטען את קבצי הפרויקט מה־DB (Fragment האחרון)
    if ((!files || Object.keys(files).length === 0) && projectId) {
      const lastFragment = await prisma.fragment.findFirst({
        where: { message: { projectId } },
        orderBy: { createdAt: "desc" },
        select: { files: true },
      });

      if (!lastFragment?.files) {
        return json(
          {
            error:
              "No files found for this project in DB (Fragment.files is empty).",
          },
          400
        );
      }

      files = flattenFiles(lastFragment.files);
    }

    // 4) הגנה: חייבים קבצים
    if (!files || Object.keys(files).length === 0) {
      return json(
        {
          error:
            "No files to publish. Provide `files` or ensure projectId has files in DB.",
        },
        400
      );
    }

    // *** שינוי: ניקוי/השלמה לפני שליחה ל-GitHub
    files = scaffoldIfNeeded(files); // משלים חסרים ומוחק Prisma
    if (files["package.json"]) {
      // דואג להסרת postinstall ותלות Prisma
      files["package.json"] = sanitizePackageJson(files["package.json"]);
    }

    // 5) GitHub App – Octokit של ההתקנה
    const app = new App({ appId: Number(APP_ID), privateKey: PRIVATE_KEY });
    const octo = (await app.getInstallationOctokit(installation_id)) as any;

    const [owner, repoName] = (repo || "").split("/");
    if (!owner || !repoName) {
      return json({ error: "repo must be in the form 'owner/name'" }, 400);
    }

    // 6) פרטי ריפו (לקבלת default_branch), תמיכה בריפו ריק
    const { data: repoInfo } = await octo.request("GET /repos/{owner}/{repo}", {
      owner,
      repo: repoName,
    });
    const baseBranch: string = repoInfo.default_branch || "main";
    await ensureBranchExists(octo, owner, repoName, baseBranch);

    // 7) SHA של base ויצירת ענף publish
    const { data: baseRef } = await octo.request(
      "GET /repos/{owner}/{repo}/git/ref/{ref}",
      { owner, repo: repoName, ref: `heads/${baseBranch}` }
    );
    const baseSha: string = baseRef.object.sha;

    // טיפ: אם לא רוצים "מלא דפלויים", אפשר למחזר ענף קבוע, למשל "publish/app"
    // כאן אנחנו יוצרים ענף חדש כל פעם:
    const branchName = `publish/${Date.now()}`;
    await octo.request("POST /repos/{owner}/{repo}/git/refs", {
      owner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // 8) כתיבת קבצים
    for (const [path, content] of Object.entries(files)) {
      let sha: string | undefined = undefined;
      try {
        const { data } = await octo.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          { owner, repo: repoName, path, ref: branchName }
        );
        if (!Array.isArray(data) && "sha" in data) {
          sha = (data as any).sha as string;
        }
      } catch (e: any) {
        if (e?.status !== 404) throw e;
      }

      await octo.request("PUT /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo: repoName,
        path,
        message: sha ? `chore: update ${path}` : `chore: add ${path}`,
        content: Buffer.from(content, "utf-8").toString("base64"),
        branch: branchName,
        sha,
      });
    }

    // 9) פתיחת PR
    const { data: pr } = await octo.request(
      "POST /repos/{owner}/{repo}/pulls",
      {
        owner,
        repo: repoName,
        title: "Publish from app",
        head: branchName,
        base: baseBranch,
        body:
          "This PR was opened automatically by the Publish endpoint.\n" +
          `Owner: ${owner}\nRepo: ${repoName}`,
      }
    );

    // 10) עדכון מטא־דאטה בפרויקט
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: { lastPrUrl: pr.html_url, githubRepo: `${owner}/${repoName}` },
      });
    }

    return json({
      ok: true,
      pr_url: pr.html_url,
      pr_number: pr.number,
      branch: branchName,
    });
  } catch (err: any) {
    console.error("publish error:", err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Unknown error in publish";
    return json({ error: msg }, 500);
  }
}
