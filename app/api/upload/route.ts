import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    // 1. Validate the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Extract the secure DB ID we injected during login
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerId = (session.user as any).id;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const description = (formData.get('description') as string | null)?.trim() || null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 2. Prepare file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Define path and write file. We only ever store the FILENAME in the
    // database (never an absolute host path) so storage stays portable and
    // consistent with the new-version upload route.
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(process.cwd(), 'local_storage', fileName);
    await writeFile(filePath, buffer);

    // 4. Save to PostgreSQL Database, strictly bound to the authenticated user
    const document = await prisma.document.create({
      data: {
        title: file.name,
        description,
        filePath: fileName,
        size: file.size,
        mimeType: file.type,
        ownerId: ownerId,
        status: 'DRAFT',
      },
    });

    await logAudit({
      action: "DOCUMENT_UPLOADED",
      userId: ownerId,
      documentId: document.id,
      details: `Uploaded a new file: ${document.title}`,
    });

    return NextResponse.json({ message: 'File uploaded successfully', document });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Database save failed" }, { status: 500 });
  }
}