// src/app/api/projects/files/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectFilesReal } from "@/lib/get-project-files";

/**
 * מסיר תווי NUL שמכשילים שמירה ל-Postgres/Prisma
 */
function safeText(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/\u0000/g, "");
}

/**
 * מנרמל מבנים שונים ל-map של path -> content (string)
 * תומך גם בבניית map מתוך מערך [{path,content}] או עטיפות { files: ... }
 */
function normalizeFiles(input: any): Record<string, string> {
  const out: Record<string, string> = {};

  function put(path: any, v: any) {
    if (!path) return;
    let content = "";
    if (typeof v === "string") content = v;
    else if (v && typeof v === "object") {
      content =
        v.content ??
        v.code ??
        v.text ??
        v.value ??
        (typeof v.base64 === "string"
          ? (() => {
              try {
                return Buffer.from(v.base64, "base64").toString("utf-8");
              } catch {
                return v.base64;
              }
            })()
          : JSON.stringify(v, null, 2));
    } else content = String(v);
    out[String(path)] = safeText(content);
  }

  function visit(node: any) {
    if (!node) return;
    // עטיפה { files: ... }
    if (typeof node === "object" && !Array.isArray(node) && node.files) {
      return visit(node.files);
    }
    // מערך [{ path, content }, ...]
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item && typeof item === "object") {
          const p =
            item.path ||
            item.filePath ||
            item.filepath ||
            item.name ||
            item.filename ||
            item.key;
          const c =
            item.content ??
            item.code ??
            item.value ??
            item.text ??
            item.data ??
            item.base64;
          if (p) put(p, c);
          if (item.files) visit(item.files);
          if (item.children) visit(item.children);
        }
      }
      return;
    }
    // map של path->content
    if (typeof node === "object" && !Array.isArray(node)) {
      for (const [k, v] of Object.entries(node)) {
        put(k, v);
      }
      return;
    }
  }

  visit(input);
  return out;
}

const BASE_WHITELIST = new Set<string>([
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/globals.css",
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
  "tsconfig.json",
  "package.json",
]);

const BASE_PREFIX_WHITELIST = [
  "src/components/ui/",
  "src/components/code-view/",
];

/**
 * ניקוי package.json: הסרת prisma/postinstall כדי למנוע נפילות ב־Vercel
 */
function sanitizePackageJson(src: string): string {
  try {
    const pkg = JSON.parse(src);

    if (
      pkg.scripts?.postinstall &&
      /prisma\s+generate/i.test(pkg.scripts.postinstall)
    ) {
      delete pkg.scripts.postinstall;
    }

    for (const field of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
    ]) {
      if (pkg[field]) {
        if (pkg[field]["prisma"]) delete pkg[field]["prisma"];
        if (pkg[field]["@prisma/client"]) delete pkg[field]["@prisma/client"];
      }
    }

    return JSON.stringify(pkg, null, 2);
  } catch {
    return src;
  }
}

/**
 * אם חסרים מינימום קבצים – נשלים בסיסיים כדי למנוע "page.tsx doesn't have a root layout".
 */
function scaffoldIfNeeded(files: Record<string, string>) {
  const f = { ...files };

  const hasLayout = f["src/app/layout.tsx"] || f["app/layout.tsx"];
  if (!hasLayout) {
    f["src/app/layout.tsx"] =
      `export default function RootLayout({ children }: { children: React.ReactNode }) {\n` +
      `  return <html lang="en"><body>{children}</body></html>;\n` +
      `}\n`;
  }

  const hasPage = f["src/app/page.tsx"] || f["app/page.tsx"];
  if (!hasPage) {
    f["src/app/page.tsx"] =
      `export default function Page(){\n` +
      `  return <main style={{padding:24}}><h1>Landing</h1></main>\n` +
      `}\n`;
  }

  if (f["package.json"]) {
    f["package.json"] = sanitizePackageJson(f["package.json"]);
  }

  return f;
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") ?? "";
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // 1) קבצי בסיס מהדיסק – אבל ניקח רק את מה שב־whitelist
    const diskFilesAll = await getProjectFilesReal();
    const baseFiles: Record<string, string> = {};
  for (const [p, c] of Object.entries(diskFilesAll)) {
    if (
      BASE_WHITELIST.has(p) ||
      BASE_PREFIX_WHITELIST.some((prefix) => p.startsWith(prefix))
    ) {
      baseFiles[p] = safeText(c);
    }
  }

    // 2) אחרון התוצרים מה-DB
    const lastFragment = await prisma.fragment.findFirst({
      where: { message: { projectId } },
      orderBy: { createdAt: "desc" },
      select: { files: true },
    });

    if (!lastFragment?.files) {
      // אם אין תוצר בכלל – נחזיר רק את הבסיס (מושלם לריצה)
      const onlyBase = scaffoldIfNeeded(baseFiles);
      return NextResponse.json(
        {
          ok: true,
          source: "base-only",
          files: onlyBase,
          count: Object.keys(onlyBase).length,
        },
        { status: 200 }
      );
    }

    const generated = normalizeFiles(lastFragment.files); // path->content
    // 3) מיזוג: בסיס → תוצר (התוצר גובר)
    let merged: Record<string, string> = { ...baseFiles, ...generated };

    // 4) סקפולד ומסירי NUL + ניקוי pkg
    merged = Object.fromEntries(
      Object.entries(scaffoldIfNeeded(merged)).map(([k, v]) => [k, safeText(v)])
    );

    return NextResponse.json(
      {
        ok: true,
        source: "merged",
        files: merged,
        count: Object.keys(merged).length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "failed to collect files" },
      { status: 500 }
    );
  }
}
