import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ASSETS_ROOT = path.join(process.cwd(), "local_storage", "assets");

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;
    // Guard against path traversal — only ever read from ASSETS_ROOT.
    const safeName = path.basename(filename);
    const absolutePath = path.join(ASSETS_ROOT, safeName);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(absolutePath);
    } catch {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeType = MIME_BY_EXT[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Asset serve error:", error);
    return NextResponse.json({ error: "Failed to retrieve image" }, { status: 500 });
  }
}