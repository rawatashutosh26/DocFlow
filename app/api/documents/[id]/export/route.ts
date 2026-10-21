import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { readFile } from "fs/promises";
import path from "path";
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

type ExportFormat = "docx" | "pdf" | "md" | "txt" | "html";

const CONTENT_TYPES: Record<ExportFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  md: "text/markdown",
  txt: "text/plain",
  html: "text/html",
};

const ASSETS_ROOT = path.join(process.cwd(), "local_storage", "assets");

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// Images inserted via the editor are referenced by URL (/api/assets/<file>),
// which requires an authenticated request to fetch. Puppeteer and
// html-to-docx render outside the browser session, so they can't fetch
// those URLs — instead we read the files straight off disk here and inline
// them as base64 data URIs before conversion.
async function inlineDocumentImages(html: string): Promise<string> {
  const matches = [...html.matchAll(/src="\/api\/assets\/([^"]+)"/g)];
  let result = html;

  for (const match of matches) {
    const [fullMatch, filename] = match;
    const safeName = path.basename(filename);
    const ext = path.extname(safeName).toLowerCase();
    const mimeType = MIME_BY_EXT[ext] || "application/octet-stream";

    try {
      const fileBuffer = await readFile(path.join(ASSETS_ROOT, safeName));
      const dataUri = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      result = result.replace(fullMatch, `src="${dataUri}"`);
    } catch {
      // If the asset is missing, leave the broken reference — better than
      // crashing the whole export over one missing image.
    }
  }

  return result;
}

function wrapHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #111; }
      h1, h2, h3 { font-family: Arial, Helvetica, sans-serif; }
      img { max-width: 100%; }
      blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #555; }
      pre { background: #f5f5f5; padding: 0.75em; border-radius: 4px; overflow-x: auto; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeFilename(title: string) {
  return title.replace(/[^a-z0-9\-_ ]/gi, "_").trim() || "document";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { id: documentId } = await params;

    const url = new URL(req.url);
    const format = url.searchParams.get("format") as ExportFormat | null;

    if (!format || !(format in CONTENT_TYPES)) {
      return NextResponse.json(
        { error: "format must be one of: docx, pdf, md, txt, html" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: documentAccessInclude,
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.type !== "NATIVE") {
      return NextResponse.json(
        { error: "Only native documents can be exported. Use /api/files/[id] for uploaded files." },
        { status: 400 }
      );
    }

    const access = resolveDocumentAccess(userId, document);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    // Exporting is a form of download — same rule as file downloads.
    if (!access.canDownload) {
      return NextResponse.json(
        { error: "You do not have permission to export this document" },
        { status: 403 }
      );
    }

    const bodyHtml = document.content || "<p></p>";
    const fullHtml = wrapHtml(document.title, bodyHtml);
    const filename = sanitizeFilename(document.title);

    let fileData: Buffer | string;

    switch (format) {
      case "html": {
        fileData = fullHtml;
        break;
      }

      case "txt": {
        const { convert } = await import("html-to-text");
        fileData = convert(bodyHtml, { wordwrap: 100 });
        break;
      }

      case "md": {
        const TurndownService = (await import("turndown")).default;
        const turndownService = new TurndownService({
          headingStyle: "atx",
          codeBlockStyle: "fenced",
        });
        fileData = turndownService.turndown(bodyHtml);
        break;
      }

      case "docx": {
        const htmlToDocx = (await import("html-to-docx")).default;
        const inlinedHtml = wrapHtml(document.title, await inlineDocumentImages(bodyHtml));
        const buffer = await htmlToDocx(inlinedHtml, undefined, {
          table: { row: { cantSplit: true } },
          footer: false,
          pageNumber: false,
        });
        fileData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
        break;
      }

      case "pdf": {
        // Requires the `puppeteer` package (bundles a headless Chromium).
        // This is a heavier dependency than the rest of the app — see
        // package.json comments / README for the install note.
        const puppeteer = (await import("puppeteer")).default;
        const inlinedHtml = wrapHtml(document.title, await inlineDocumentImages(bodyHtml));
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        try {
          const page = await browser.newPage();
          await page.setContent(inlinedHtml, { waitUntil: "load" });
          const pdfBuffer = await page.pdf({
            format: "A4",
            margin: { top: "1in", bottom: "1in", left: "1in", right: "1in" },
            printBackground: true,
          });
          fileData = Buffer.from(pdfBuffer);
        } finally {
          await browser.close();
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    }

    await logAudit({
      action: "DOCUMENT_DOWNLOADED",
      userId,
      documentId,
      details: `Exported "${document.title}" as .${format}`,
    });

    const body = typeof fileData === "string" ? new TextEncoder().encode(fileData) : new Uint8Array(fileData);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="${filename}.${format}"`,
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to export document" }, { status: 500 });
  }
}