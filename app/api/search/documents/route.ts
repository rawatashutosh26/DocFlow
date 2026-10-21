import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { documentAccessInclude, resolveDocumentAccess, resolveFolderAccess } from "@/lib/access";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return NextResponse.json({ results: [], projectResults: [] });
    }

    // Company-wide: intentionally NOT scoped to ownerId/sharedAccess — this
    // is a directory search across every user's documents. It only ever
    // returns metadata (title, description, owner, project); the actual
    // file/editor content requires access, granted separately. The one
    // exception: files inside a LOCKED project are excluded entirely for
    // anyone without access to that project — locking a project also locks
    // its files out of company-wide search, not just out of direct opening.
    const documents = await prisma.document.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 60,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: true,
        ...documentAccessInclude,
        accessRequests: {
          where: { requesterId: userId, status: "PENDING" },
        },
      },
    });

    const results = documents
      .filter((doc: any) => !(doc.folder?.isLocked && !resolveDocumentAccess(userId, doc).hasAccess))
      .slice(0, 30)
      .map((doc: any) => {
        const access = resolveDocumentAccess(userId, doc);

        return {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          ownerName: doc.owner.name || doc.owner.email,
          projectName: doc.folder?.name || null,
          hasAccess: access.hasAccess,
          hasPendingRequest: doc.accessRequests.length > 0,
          accessLevel: access.accessLevel,
        };
      });

    // Also search Projects (folders) by name/description — same
    // metadata-only rule applies: description is visible, contents aren't,
    // until access is granted.
    const folders = await prisma.folder.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: true,
        team: { include: { members: { where: { userId } } } },
        grantedAccess: { where: { userId } },
        teamAccess: { include: { team: { include: { members: { where: { userId } } } } } },
        accessRequests: { where: { requesterId: userId, status: "PENDING" } },
        _count: { select: { documents: true } },
      },
    });

    const projectResults = folders.map((folder: any) => {
      const access = resolveFolderAccess(userId, folder);

      return {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        ownerName: folder.owner.name || folder.owner.email,
        teamName: folder.team?.name || null,
        documentCount: folder._count.documents,
        isLocked: folder.isLocked,
        hasAccess: access.hasAccess,
        hasPendingRequest: folder.accessRequests.length > 0,
        accessLevel: access.accessLevel,
        accessSource: access.source,
      };
    });

    return NextResponse.json({ results, projectResults });
  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
