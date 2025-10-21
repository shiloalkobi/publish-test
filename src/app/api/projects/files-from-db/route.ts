// src/app/api/projects/files-from-db/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectFilesReal } from "@/lib/get-project-files";

/** ────────────────────────────────────────────────────────────────────────────
 * Utilities
 * ────────────────────────────────────────────────────────────────────────────
 */

/** מסיר תווי null ועוד תווים בעייתיים שעלולים לשבור עיבוד/שמירה בהמשך */
function cleanContent(s: unknown): string {
  let txt =
    typeof s === "string"
      ? s
      : s == null
      ? ""
      : typeof s === "object"
      ? JSON.stringify(s, null, 2)
      : String(s);

  // הסרת null chars שעלולים לגרום ל־unsupported Unicode escape sequence
  txt = txt.replace(/\u0000/g, "");

  // הסרת BOM אם קיים
  if (txt.charCodeAt(0) === 0xfeff) {
    txt = txt.slice(1);
  }

  return txt;
}

/**
 * נרמול מכל מיני פורמטים לצורה אחידה: Record<path, string>
 * תומך ב:
 *  - map ישיר: { "src/app/page.tsx": "...", ... }
 *  - מערכים של {path|filePath|name|filename|key, content|code|value|text|data|base64}
 *  - עטיפות כגון { files: ... } או { root: ... } או { entry: ... }
 *  - מבנה nested (תיקיות) – ייפתח לשמות נתיב מלאים
 */
function normalizeFiles(input: any, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input) return out;

  function absorb(path: string | undefined, value: any) {
    if (!path) return;
    let content: string | undefined;

    if (typeof value === "string") {
      content = value;
    } else if (typeof value === "object" && value !== null) {
      if (typeof (value as any).content === "string")
        content = (value as any).content;
      else if (typeof (value as any).code === "string")
        content = (value as any).code;
      else if (typeof (value as any).text === "string")
        content = (value as any).text;
      else if (typeof (value as any).value === "string")
        content = (value as any).value;
      else if (typeof (value as any).data === "string")
        content = (value as any).data;
      else if (typeof (value as any).base64 === "string") {
        try {
          content = Buffer.from((value as any).base64, "base64").toString(
            "utf-8"
          );
        } catch {
          content = (value as any).base64;
        }
      } else {
        // במקרה של אובייקט לא מוכר – נשמר כ־JSON
        content = JSON.stringify(value, null, 2);
      }
    } else if (value == null) {
      content = "";
    } else {
      content = String(value);
    }

    out[path] = cleanContent(content);
  }

  function visit(node: any, currPrefix = "") {
    if (!node) return;

    // עטיפות נפוצות: { files: ... } / { root: ... } / { entry: ... }
    if (
      typeof node === "object" &&
      !Array.isArray(node) &&
      (("files" in node && node.files) ||
        ("root" in node && node.root) ||
        ("entry" in node && node.entry))
    ) {
      if (node.files) return visit(node.files, currPrefix);
      if (node.root) return visit(node.root, currPrefix);
      if (node.entry) return visit(node.entry, currPrefix);
    }

    // מערך של אובייקטים
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item && typeof item === "object") {
          const path =
            item.path ||
            item.filePath ||
            item.filepath ||
            item.name ||
            item.filename ||
            item.key;

          const value =
            item.content ??
            item.code ??
            item.value ??
            item.text ??
            item.data ??
            item.base64;

          if (path)
            absorb(currPrefix ? `${currPrefix}/${path}` : String(path), value);

          // תמיכה בנסטינג פנימי
          if (item.files) visit(item.files, currPrefix);
          if (item.children) visit(item.children, currPrefix);
        }
      }
      return;
    }

    // Map או אובייקט nested
    if (typeof node === "object") {
      const entries = Object.entries(node);
      for (const [k, v] of entries) {
        const next = currPrefix ? `${currPrefix}/${k}` : k;

        // אם v הוא תיקיה (אובייקט ללא content) – נצלול
        if (v && typeof v === "object" && !("content" in (v as any))) {
          visit(v, next);
        } else {
          absorb(next, v);
        }
      }
      return;
    }

    // נפילה לא מוכרת – ננסה לשמר כטקסט
    absorb(currPrefix || "UNNAMED.txt", node);
  }

  visit(input, prefix);
  return out;
}

/** זיהוי שורש האפליקציה ("app" או "src/app") מתוך הקבצים */
function detectAppRoot(files: Record<string, string>): "app" | "src/app" {
  const hasApp = Object.keys(files).some(
    (p) => p === "app/page.tsx" || p.startsWith("app/")
  );
  const hasSrcApp = Object.keys(files).some(
    (p) => p === "src/app/page.tsx" || p.startsWith("src/app/")
  );
  if (hasApp && !hasSrcApp) return "app";
  if (hasSrcApp && !hasApp) return "src/app";
  return "src/app"; // ברירת מחדל בטוחה
}

/** העברה/איחוד כך שכל הקבצים יהיו תחת אותו שורש יעד */
function normalizeAppRoot(
  files: Record<string, string>,
  targetRoot: "app" | "src/app"
) {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith("app/") && targetRoot === "src/app") {
      out[`src/${path}`] = content;
    } else if (path.startsWith("src/app/") && targetRoot === "app") {
      out[path.replace(/^src\//, "")] = content;
    } else {
      out[path] = content;
    }
  }
  return out;
}

/** כשמבקשים scaffold=1 נחזיר גם מינימום קבצים כדי "שיעלה באוויר" מבלי למשוך מדיסק */
function withMinimalScaffold(
  files: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = { ...files };

  // next.config.* מינימלי
  if (
    !out["next.config.mjs"] &&
    !out["next.config.ts"] &&
    !out["next.config.js"]
  ) {
    out["next.config.ts"] =
      'import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n';
  }

  // tsconfig.json מינימלי
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

  // package.json מינימלי (בלי Prisma)
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

  // page/layout בסיסיים אם חסרים
  const targetRoot = detectAppRoot(out);
  const pagePath = `${targetRoot}/page.tsx`;
  const layoutPath = `${targetRoot}/layout.tsx`;

  if (!out[pagePath] && !out["app/page.tsx"] && !out["src/app/page.tsx"]) {
    out[
      pagePath
    ] = `export default function Page(){return <main style={{padding:24}}><h1>Hello</h1></main>}`;
  }
  if (
    !out[layoutPath] &&
    !out["app/layout.tsx"] &&
    !out["src/app/layout.tsx"]
  ) {
    out[
      layoutPath
    ] = `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}`;
  }

  // הסרת קבצי Prisma אם במקרה הופיעו בתוך ה־DB
  for (const k of Object.keys(out)) {
    if (k.startsWith("prisma/") || k.endsWith(".prisma")) delete out[k];
  }

  return out;
}

/** ────────────────────────────────────────────────────────────────────────────
 * GET /api/projects/files-from-db?projectId=...&scaffold=0|1
 * ברירת מחדל: scaffold=0 ⇒ מחזיר *אך ורק* קבצי DB (מנורמלים ומנוקים) בלי השלמות.
 * אם scaffold=1 ⇒ נוסיף מינימום קבצים כדי שהפרויקט יהיה runnable בוורסל — עדיין בלי למשוך מדיסק.
 * ────────────────────────────────────────────────────────────────────────────
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId") ?? "";
    const includeBase = url.searchParams.get("includeBase") === "1";
    const scaffold = url.searchParams.get("scaffold") === "1";

    if (!projectId) {
      return NextResponse.json({ error: "missing projectId" }, { status: 400 });
    }

    const frag = await prisma.fragment.findFirst({
      where: { message: { projectId } },
      orderBy: { createdAt: "desc" },
      select: { files: true },
    });

    if (!frag?.files) {
      return NextResponse.json(
        { error: "no generated files found for this project" },
        { status: 404 }
      );
    }

    // 1) נרמול קבצי ה-DB בלבד
    let files = normalizeFiles(frag.files);

    if (includeBase) {
      const base = await getProjectFilesReal();
      for (const [path, content] of Object.entries(base)) {
        files[path] = cleanContent(content);
      }
    }

    // 2) יישור לשורש אחיד (app/src/app) כדי למנוע ערבוב
    const root = detectAppRoot(files);
    files = normalizeAppRoot(files, root);

    // 3) אם ביקשו השלמות — נוסיף מינימום קבצים כדי שיעבוד בדפלוי, עדיין בלי למשוך מדיסק
    if (scaffold) {
      files = withMinimalScaffold(files);
    }

    return NextResponse.json(
      { ok: true, files, count: Object.keys(files).length },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "failed" },
      { status: 500 }
    );
  }
}
