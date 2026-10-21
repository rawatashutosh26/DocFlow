import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Assets (images inserted into the rich-text editor) are stored separately
// from full Documents — they don't need their own DB row, versioning, or
// sharing rules. They just need to be servable back by URL.
const ASSETS_ROOT = path.join(process.cwd(), "local_storage", "assets");

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only image files (png, jpg, gif, webp, svg) can be embedded" },
        { status: 400 }
      );
    }

    // 5MB cap keeps documents (and the DB TEXT column storing their HTML,
    // which references these images by URL, not by embedding them inline)
    // reasonably sized.
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    await mkdir(ASSETS_ROOT, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeExt = path.extname(file.name).slice(0, 10);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
    await writeFile(path.join(ASSETS_ROOT, fileName), buffer);

    return NextResponse.json({
      success: true,
      url: `/api/assets/${fileName}`,
    });
  } catch (error) {
    console.error("Asset Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}