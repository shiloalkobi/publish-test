// src/app/api/github/publish/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { App } from "@octokit/app";
import crypto from "crypto";

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers: response
 * ──────────────────────────────────────────────────────────────────────────── */
function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────────── */
type FilesMap = Record<string, string>;

/* ────────────────────────────────────────────────────────────────────────────
 * Content cleaning / normalization
 * ──────────────────────────────────────────────────────────────────────────── */
function cleanContent(s: unknown): string {
  let txt =
    typeof s === "string"
      ? s
      : s == null
      ? ""
      : typeof s === "object"
      ? JSON.stringify(s, null, 2)
      : String(s);
  // remove NULs
  txt = txt.replace(/\u0000/g, "");
  // strip BOM
  if (txt.length > 0 && txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
  return txt;
}

/** robust normalization from various shapes into { path: content } */
function normalizeFiles(input: any, prefix = ""): FilesMap {
  const out: FilesMap = {};
  if (!input) return out;

  function put(path: any, v: any) {
    if (!path) return;
    let content = "";
    if (typeof v === "string") content = v;
    else if (v && typeof v === "object") {
      if (typeof v.content === "string") content = v.content;
      else if (typeof v.code === "string") content = v.code;
      else if (typeof v.text === "string") content = v.text;
      else if (typeof v.value === "string") content = v.value;
      else if (typeof v.data === "string") content = v.data;
      else if (typeof (v as any).base64 === "string") {
        try {
          content = Buffer.from((v as any).base64, "base64").toString("utf-8");
        } catch {
          content = (v as any).base64;
        }
      } else {
        content = JSON.stringify(v, null, 2);
      }
    } else content = String(v);
    out[String(path)] = cleanContent(content);
  }

  function visit(node: any, currPrefix = "") {
    if (!node) return;

    // Wrappers: { files }, { root }, { entry }
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
          const v =
            item.content ??
            item.code ??
            item.value ??
            item.text ??
            item.data ??
            item.base64;
          if (p) put(currPrefix ? `${currPrefix}/${p}` : p, v);
          if (item.files) visit(item.files, currPrefix);
          if (item.children) visit(item.children, currPrefix);
        }
      }
      return;
    }

    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const next = currPrefix ? `${currPrefix}/${k}` : k;
        if (v && typeof v === "object" && !("content" in (v as any))) {
          visit(v, next);
        } else {
          put(next, v);
        }
      }
      return;
    }

    put(currPrefix || "UNNAMED.txt", node);
  }

  visit(input, prefix);
  return out;
}

/** flatten already-near-flat objects (legacy) */
function flattenFiles(input: any, prefix = ""): FilesMap {
  // reuse normalizeFiles to be robust
  return normalizeFiles(input, prefix);
}

/* ────────────────────────────────────────────────────────────────────────────
 * App root detection / normalization
 * ──────────────────────────────────────────────────────────────────────────── */
function detectAppRoot(files: FilesMap): "app" | "src/app" {
  const hasApp = Object.keys(files).some(
    (p) => p === "app/page.tsx" || p.startsWith("app/")
  );
  const hasSrcApp = Object.keys(files).some(
    (p) => p === "src/app/page.tsx" || p.startsWith("src/app/")
  );
  if (hasApp && !hasSrcApp) return "app";
  if (hasSrcApp && !hasApp) return "src/app";
  return "src/app"; // safe default
}

function normalizeAppRoot(
  files: FilesMap,
  targetRoot: "app" | "src/app"
): FilesMap {
  const out: FilesMap = {};
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

/* ────────────────────────────────────────────────────────────────────────────
 * Minimal UI files (shadcn-like) to prevent build errors if user imports them
 * ──────────────────────────────────────────────────────────────────────────── */
const MIN_BUTTON = `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2",
  {
    variants: {
      variant: {
        default: "bg-blue-700 text-white hover:bg-blue-800",
        outline: "border border-current bg-transparent",
        ghost: "bg-transparent",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={clsx(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export default Button;
`;

const MIN_CARD = `import * as React from "react";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["rounded-lg border bg-white", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["p-4 border-b", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={["font-semibold text-lg", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["p-4", className].filter(Boolean).join(" ")} {...props} />;
}
export default Card;
`;

const MIN_INPUT = `import * as React from "react";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={["h-10 w-full rounded-md border px-3 py-2 text-sm", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
});
Input.displayName = "Input";
export default Input;
`;

/* ────────────────────────────────────────────────────────────────────────────
 * Minimal layout & page
 * ──────────────────────────────────────────────────────────────────────────── */
function basicLayoutTSX() {
  return `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{margin:0}}>{children}</body>
    </html>
  );
}
`;
}

function basicPageTSX() {
  return `export default function Page() {
  return <main style={{padding:24}}><h1>Hello</h1></main>;
}
`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * package.json helpers
 * ──────────────────────────────────────────────────────────────────────────── */
const REQUIRED_DEPS: Record<string, string> = {
  "@radix-ui/react-slot": "^1.0.4",
  "class-variance-authority": "^0.7.1",
  "lucide-react": "^0.539.0",
  clsx: "^2.1.1",
};

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

function mergeRequiredDeps(pkgJson: string): string {
  let pkg: any;
  try {
    pkg = JSON.parse(pkgJson);
  } catch {
    return pkgJson;
  }
  pkg.dependencies = { ...(pkg.dependencies || {}), ...REQUIRED_DEPS };
  // make sure next/react present with broadly compatible versions
  pkg.dependencies.next = pkg.dependencies.next || "latest";
  pkg.dependencies.react = pkg.dependencies.react || "^18.3.1";
  pkg.dependencies["react-dom"] = pkg.dependencies["react-dom"] || "^18.3.1";
  return JSON.stringify(pkg, null, 2);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Scaffold: ensure minimal files, UI components and config
 * ──────────────────────────────────────────────────────────────────────────── */
function scaffoldIfNeeded(files: FilesMap): FilesMap {
  let out: FilesMap = { ...files };

  // Decide app root and normalize
  const targetRoot = detectAppRoot(out);
  out = normalizeAppRoot(out, targetRoot);

  // next.config
  if (
    !out["next.config.mjs"] &&
    !out["next.config.ts"] &&
    !out["next.config.js"]
  ) {
    out["next.config.ts"] =
      'import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n';
  }

  // tsconfig
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

  // package.json
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
          ...REQUIRED_DEPS,
        },
      },
      null,
      2
    );
  } else {
    out["package.json"] = mergeRequiredDeps(
      sanitizePackageJson(out["package.json"])
    );
  }

  // app layout/page
  const pagePath = `${targetRoot}/page.tsx`;
  const layoutPath = `${targetRoot}/layout.tsx`;
  if (!out[pagePath] && !out["app/page.tsx"] && !out["src/app/page.tsx"]) {
    out[pagePath] = basicPageTSX();
  }
  if (
    !out[layoutPath] &&
    !out["app/layout.tsx"] &&
    !out["src/app/layout.tsx"]
  ) {
    out[layoutPath] = basicLayoutTSX();
  }

  // Add minimal UI components (always – harmless and avoids build breaks)
  if (!out["src/components/ui/button.tsx"])
    out["src/components/ui/button.tsx"] = MIN_BUTTON;
  if (!out["src/components/ui/card.tsx"])
    out["src/components/ui/card.tsx"] = MIN_CARD;
  if (!out["src/components/ui/input.tsx"])
    out["src/components/ui/input.tsx"] = MIN_INPUT;

  // Remove prisma files
  for (const key of Object.keys(out)) {
    if (key.startsWith("prisma/") || key.endsWith(".prisma")) delete out[key];
  }

  // Clean contents
  out = Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, cleanContent(v)])
  );

  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
 * GitHub helpers
 * ──────────────────────────────────────────────────────────────────────────── */
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
    return;
  } catch (e: any) {
    if (e?.status !== 404) throw e;
  }

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

/* ────────────────────────────────────────────────────────────────────────────
 * Idempotency helpers
 * ──────────────────────────────────────────────────────────────────────────── */
function hashFiles(files: FilesMap): string {
  const h = crypto.createHash("sha256");
  for (const key of Object.keys(files).sort()) {
    h.update(key);
    h.update("\0");
    h.update(files[key] ?? "");
    h.update("\0");
  }
  return h.digest("hex");
}

const inFlight = new Set<string>(); // idempotency lock per (repo + branch or project)

/* ────────────────────────────────────────────────────────────────────────────
 * API: POST /api/github/publish
 * ──────────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  // global simple guard against spam
  if (inFlight.size > 20) {
    return json({ error: "Too many concurrent publishes" }, 429);
  }

  let flightKey = "";
  try {
    const body = (await req.json()) as {
      projectId?: string;
      installation_id?: number;
      repo?: string; // "owner/name"
      files?: FilesMap;
      source?: "client" | "server";
      autoMerge?: boolean;
      directToMain?: boolean;
      vercelDeployHookUrl?: string;
      branch?: string;
      idempotencyKey?: string; // optional client-provided
    };

    let {
      projectId,
      installation_id,
      repo,
      files,
      source,
      autoMerge,
      directToMain,
      vercelDeployHookUrl,
      branch,
      idempotencyKey,
    } = body || {};

    // ENV
    const APP_ID = process.env.GITHUB_APP_ID;
    const PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!APP_ID || !PRIVATE_KEY) {
      return json(
        { error: "Missing env: GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY" },
        500
      );
    }

    // complete installation_id/repo from DB
    if (projectId && (!installation_id || !repo)) {
      const p = await prisma.project.findUnique({
        where: { id: projectId },
        select: { githubInstallationId: true, githubRepo: true },
      });
      if (!p) return json({ error: "Project not found" }, 404);
      if (!installation_id && p.githubInstallationId)
        installation_id = Number(p.githubInstallationId);
      if (!repo && p.githubRepo) repo = p.githubRepo || undefined;
    }

    if (!installation_id || !repo) {
      return json({ error: "installation_id and repo are required" }, 400);
    }

    // Load files from DB if not provided (and not client)
    if (
      (!files || Object.keys(files).length === 0) &&
      projectId &&
      source !== "client"
    ) {
      const frag = await prisma.fragment.findFirst({
        where: { message: { projectId } },
        orderBy: { createdAt: "desc" },
        select: { files: true },
      });
      if (!frag?.files) {
        return json({ error: "No files found in DB for this project" }, 400);
      }
      files = flattenFiles(frag.files);
    }

    if (!files || Object.keys(files).length === 0) {
      return json(
        {
          error:
            "No files to publish. Provide files or ensure projectId has files in DB.",
        },
        400
      );
    }

    // Scaffold & sanitize
    files = scaffoldIfNeeded(files);
    if (files["package.json"]) {
      files["package.json"] = mergeRequiredDeps(
        sanitizePackageJson(files["package.json"])
      );
    }

    // Compute content hash for idempotency
    const contentHash = hashFiles(files);
    flightKey =
      idempotencyKey || `${repo}::${branch || "publish"}::${contentHash}`;
    if (inFlight.has(flightKey)) {
      return json(
        { error: "Publish already in progress for same content" },
        429
      );
    }
    inFlight.add(flightKey);

    // Connect GitHub App
    const app = new App({ appId: Number(APP_ID), privateKey: PRIVATE_KEY });
    const octo = (await app.getInstallationOctokit(installation_id)) as any;
    const [owner, repoName] = (repo || "").split("/");
    if (!owner || !repoName) {
      return json({ error: "repo must be in the form 'owner/name'" }, 400);
    }

    // Ensure base exists
    const { data: repoInfo } = await octo.request("GET /repos/{owner}/{repo}", {
      owner,
      repo: repoName,
    });
    const baseBranch: string = repoInfo.default_branch || "main";
    await ensureBranchExists(octo, owner, repoName, baseBranch);

    // Determine branch
    let branchName =
      branch && branch.trim() ? branch.trim() : `publish/${Date.now()}`;

    // Base ref
    const { data: baseRef } = await octo.request(
      "GET /repos/{owner}/{repo}/git/ref/{ref}",
      { owner, repo: repoName, ref: `heads/${baseBranch}` }
    );
    const baseSha: string = baseRef.object.sha;

    // Ensure working branch
    if (directToMain) {
      branchName = baseBranch;
    } else {
      try {
        await octo.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
          owner,
          repo: repoName,
          ref: `heads/${branchName}`,
        });
      } catch (e: any) {
        if (e?.status === 404) {
          await octo.request("POST /repos/{owner}/{repo}/git/refs", {
            owner,
            repo: repoName,
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
          });
        } else {
          throw e;
        }
      }
    }

    // Upsert files: track if any change was made
    let changedCount = 0;
    const written: string[] = [];

    for (const [p, content] of Object.entries(files)) {
      // Check existing
      let existingSha: string | undefined;
      let existingContent: string | undefined;
      try {
        const { data } = await octo.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          { owner, repo: repoName, path: p, ref: branchName }
        );
        if (!Array.isArray(data) && "sha" in data) {
          existingSha = (data as any).sha as string;
          // Compare contents only if same branch - need decode
          if ((data as any).content && (data as any).encoding === "base64") {
            existingContent = Buffer.from(
              (data as any).content,
              "base64"
            ).toString("utf-8");
          }
        }
      } catch (e: any) {
        if (e?.status !== 404) throw e;
      }

      const isSame = existingContent === content;
      if (isSame) continue; // skip identical file

      await octo.request("PUT /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo: repoName,
        path: p,
        message: existingSha ? `chore: update ${p}` : `chore: add ${p}`,
        content: Buffer.from(content, "utf-8").toString("base64"),
        branch: branchName,
        sha: existingSha,
      });
      changedCount++;
      written.push(p);
    }

    // Nothing changed? Avoid PR / deploy spam
    if (changedCount === 0) {
      // still persist repo reference for the project
      if (projectId) {
        await prisma.project.update({
          where: { id: projectId },
          data: { githubRepo: `${owner}/${repoName}` },
        });
      }
      return json({
        ok: true,
        no_changes: true,
        branch: branchName,
        message: "No file changes detected. Skipping PR/deploy.",
      });
    }

    // direct push to main
    if (directToMain) {
      if (projectId) {
        await prisma.project.update({
          where: { id: projectId },
          data: { lastPrUrl: null, githubRepo: `${owner}/${repoName}` },
        });
      }
      if (vercelDeployHookUrl) {
        try {
          await fetch(vercelDeployHookUrl, { method: "POST" });
        } catch {}
      }
      return json({
        ok: true,
        directToMain: true,
        branch: branchName,
        changed: changedCount,
        written,
      });
    }

    // Create PR
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

    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          lastPrUrl: pr.html_url,
          githubRepo: `${owner}/${repoName}`,
        },
      });
    }

    let merged = false;
    if (autoMerge) {
      try {
        await octo.request(
          "PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
          {
            owner,
            repo: repoName,
            pull_number: pr.number,
            merge_method: "squash",
          }
        );
        merged = true;
      } catch {
        merged = false;
      }
    }

    if (vercelDeployHookUrl) {
      try {
        await fetch(vercelDeployHookUrl, { method: "POST" });
      } catch {}
    }

    return json({
      ok: true,
      pr_url: pr.html_url,
      pr_number: pr.number,
      branch: branchName,
      merged,
      changed: changedCount,
      written,
    });
  } catch (err: any) {
    console.error("publish error:", err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Unknown error in publish";
    return json({ error: msg }, 500);
  } finally {
    if (flightKey) inFlight.delete(flightKey);
  }
}
