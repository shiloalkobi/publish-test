// src/app/api/projects/[projectId]/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * נרמול של Fragment.files לצורה: Record<path, content>
 * תומך במספר וריאציות:
 *  - אובייקט map: { "src/app/page.tsx": "<code>" }
 *  - מערך של אובייקטים: [{ path, content }] / [{ filePath, code }] / [{ name, content }]
 *  - עטיפה: { files: ... } או מבנים דומים מסנדבוקסים
 */
function normalizeFiles(input: any): Record<string, string> {
  const out: Record<string, string> = {};

  function absorb(k: string | undefined, v: any) {
    if (!k) return;
    // הפוך content לכל היותר למחרוזת
    let content: string;
    if (v == null) content = "";
    else if (typeof v === "string") content = v;
    else if (typeof v === "object") {
      // נסיונות לחלץ טקסט מתוך אובייקטים מוכרים
      // { text }, { code }, { value }, { content }, { data }, { base64 }
      if (typeof v.text === "string") content = v.text;
      else if (typeof v.code === "string") content = v.code;
      else if (typeof v.value === "string") content = v.value;
      else if (typeof v.content === "string") content = v.content;
      else if (typeof v.data === "string") content = v.data;
      else if (typeof v.base64 === "string") {
        try {
          content = Buffer.from(v.base64, "base64").toString("utf-8");
        } catch {
          content = v.base64;
        }
      } else {
        content = JSON.stringify(v, null, 2);
      }
    } else {
      content = String(v);
    }
    out[k] = content;
  }

  function visit(node: any) {
    if (!node) return;

    // אם זו כבר מפה "path -> content"
    if (
      typeof node === "object" &&
      !Array.isArray(node) &&
      Object.values(node).every(
        (v) => typeof v === "string" || typeof v === "object"
      )
    ) {
      const keys = Object.keys(node);
      // אם זו עטיפה { files: ... } נסה לרדת פנימה
      if (
        keys.length === 1 &&
        (keys[0] === "files" || keys[0] === "entry" || keys[0] === "root")
      ) {
        return visit(node[keys[0]]);
      }

      // אם נראה כמו map של path->content (מחרוזת/אובייקט)
      let looksLikeMap = false;
      for (const k of keys) {
        if (
          k.includes("/") ||
          k.includes(".") ||
          k.startsWith("src") ||
          k.startsWith("app")
        ) {
          looksLikeMap = true;
          break;
        }
      }
      if (looksLikeMap) {
        for (const k of keys) absorb(k, node[k]);
        return;
      }
    }

    // אם זה מערך של אובייקטים [{ path, content }, ...]
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
          const content =
            item.content ??
            item.code ??
            item.value ??
            item.text ??
            item.data ??
            item.base64;

          if (path) absorb(String(path), content);
          // אם יש Nested: item.files / item.children וכו'
          if (item.files) visit(item.files);
          if (item.children) visit(item.children);
        }
      }
      return;
    }

    // כל דבר אחר – נסה fallback
    if (typeof node === "object" && node.files) {
      return visit(node.files);
    }
  }

  visit(input);
  return out;
}

/**
 * GET /api/projects/:projectId/files
 * מחזיר:
 * {
 *   ok: true,
 *   files: { "path": "content", ... },
 *   count: number
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // נטען את כל ההודעות של הפרויקט כולל fragment (אם יש)
    const messages = await prisma.message.findMany({
      where: { projectId },
      select: {
        fragment: { select: { files: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const combined: Record<string, string> = {};
    for (const m of messages) {
      const json = (m.fragment?.files as any) ?? null;
      const norm = normalizeFiles(json);
      for (const [k, v] of Object.entries(norm)) combined[k] = v;
    }

    // הגנות קלות: אם אין שום קובץ – הוסף README דיפולטי
    if (Object.keys(combined).length === 0) {
      combined["README.md"] =
        "# Empty project\n\nNo files were found in Fragment.files.";
    }

    return NextResponse.json({
      ok: true,
      files: combined,
      count: Object.keys(combined).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "failed to build files" },
      { status: 500 }
    );
  }
}
